import * as XLSX from 'xlsx';

// Extract status info from payload
const extractStatusInfo = (payload) => {
  const info = {};
  if (!payload) return info;

  try {
    if (typeof payload === 'string') {
      const data = JSON.parse(payload);
      
      if (data.info) {
        info.statusInfo = data.info;
        info.isEvRequest = String(data.info).includes('EV Request');
        info.isLocalStop = String(data.info).includes('Local Stop');
        info.isRemoteStop = String(data.info).includes('Remote Stop');
      }
      
      if (data.status) info.status = data.status;
      if (data.errorCode) info.errorCode = data.errorCode;
    }
  } catch (e) {
    // Ignore parsing errors
  }

  return info;
};

// Analyze "Other" reasons using context
const analyzeOtherReason = (contextMessages) => {
  const statusMsgs = contextMessages.filter(
    msg => msg.command === 'StatusNotificationRequest' && msg.position === 'before'
  );

  statusMsgs.sort((a, b) => a.distance - b.distance);
  const recentMsgs = statusMsgs.slice(0, 3);

  if (recentMsgs.length === 0) {
    return {
      category: '❌ Problematic',
      reason: 'Other (No context)',
      details: 'No StatusNotification messages found before stop'
    };
  }

  for (const msg of recentMsgs) {
    const statusInfo = extractStatusInfo(msg.payload);

    if (statusInfo.isEvRequest) {
      return {
        category: '✅ Normal',
        reason: 'EV Request Stop',
        details: 'User requested stop through EV/App'
      };
    }
    if (statusInfo.isLocalStop) {
      return {
        category: '✅ Normal',
        reason: 'Local Stop',
        details: 'User pressed stop button on charger'
      };
    }
    if (statusInfo.isRemoteStop) {
      return {
        category: '✅ Normal',
        reason: 'Remote Stop',
        details: 'CMS/Backend initiated stop'
      };
    }
    
    if (statusInfo.status === 'Available' && msg.position === 'after') {
      return {
        category: '❌ Problematic',
        reason: 'EV Disconnected',
        details: 'Vehicle disconnected unexpectedly'
      };
    }
    
    if (statusInfo.errorCode && statusInfo.errorCode !== 'NoError') {
      return {
        category: '❌ Problematic',
        reason: `Error: ${statusInfo.errorCode}`,
        details: `Charger reported error: ${statusInfo.errorCode}`
      };
    }
    
    if (statusInfo.status === 'Finishing') {
      return {
        category: '⚠️ System',
        reason: 'Finishing State',
        details: 'Session entered finishing state'
      };
    }
    if (statusInfo.status === 'SuspendedEV') {
      return {
        category: '⚠️ System',
        reason: 'Suspended by EV',
        details: 'Vehicle suspended charging'
      };
    }
    if (statusInfo.status === 'SuspendedEVSE') {
      return {
        category: '⚠️ System',
        reason: 'Suspended by Charger',
        details: 'Charger suspended session'
      };
    }
  }

  return {
    category: '⚠️ System',
    reason: 'Unknown State',
    details: 'Could not determine specific reason'
  };
};

// Classify stop reason
const classifyStopReason = (stopPayload, contextMessages) => {
  let stopReason = 'Not Specified';
  
  try {
    if (stopPayload) {
      const data = JSON.parse(stopPayload);
      stopReason = data.reason || 'Not Specified';
    }
  } catch (e) {
    stopReason = 'Parse Error';
  }

  const hasEvRequest = contextMessages.some(ctx => {
    if (ctx.command === 'StatusNotificationRequest') {
      const info = extractStatusInfo(ctx.payload);
      return info.isEvRequest;
    }
    return false;
  });

  if (hasEvRequest) {
    return {
      category: '✅ Normal',
      reason: 'EV Request Stop',
      details: 'User requested stop through EV/App'
    };
  }

  if (stopReason === 'EVDisconnected') {
    return {
      category: '❌ Problematic',
      reason: 'EV Disconnected',
      details: 'Vehicle disconnected unexpectedly'
    };
  }

  if (['Reboot'].includes(stopReason)) {
    return {
      category: '✅ Normal',
      reason: stopReason,
      details: 'System maintenance/reboot'
    };
  }

  if (['Local', 'Remote'].includes(stopReason)) {
    return {
      category: '✅ Normal',
      reason: stopReason,
      details: stopReason === 'Local' ? 'User pressed stop button' : 'Backend initiated stop'
    };
  }

  if (stopReason === 'SoftReset'||'HardReset') {
    return {
      category: '⚠️ System',
      reason: 'RemoteStopTransactionRequest',
      details: 'Charger lost power during session'
    };
  }

  if (stopReason === 'EmergencyStop') {
    return {
      category: '⚠️ System',
      reason: 'Emergency Stop',
      details: 'Emergency button was pressed'
    };
  }

  if (stopReason === 'Other') {
    return analyzeOtherReason(contextMessages);
  }

  if (['Parse Error', 'Empty Payload', 'Not Specified'].includes(stopReason)) {
    return {
      category: '❌ Problematic',
      reason: stopReason,
      details: 'Missing or corrupted data'
    };
  }

  return {
    category: '⚠️ System',
    reason: `Unknown: ${stopReason}`,
    details: 'Unrecognized stop reason'
  };
};

// Extract date components
const extractDateComponents = (timeStr) => {
  if (!timeStr) return { date: null, hour: null };

  try {
    const str = String(timeStr);
    const datePart = str.split(',')[0].trim();
    const timePart = str.split(',')[1].trim().split(' ')[0].trim();

    const [day, month, year] = datePart.split('/').map(Number);
    
    const hourMatch = timePart.match(/(\d+):/);
    let hour = hourMatch ? parseInt(hourMatch[1]) : 0;

    if (str.toLowerCase().includes('pm') && hour !== 12) hour += 12;
    if (str.toLowerCase().includes('am') && hour === 12) hour = 0;

    return {
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      hour,
    };
  } catch (e) {
    return { date: null, hour: null };
  }
};

// MAIN EXPORTED FUNCTION
export const processExcelFile = async (file, contextSize) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const columns = Object.keys(jsonData[0] || {});
        const commandCol = columns.find(c => c.toLowerCase().includes('command') || c.toLowerCase().includes('cmd'));
        const payloadCol = columns.find(c => c.toLowerCase().includes('payload') || c.toLowerCase().includes('data'));
        const chargerCol = columns.find(c => c.toLowerCase().includes('cp_id') || c.toLowerCase().includes('charger') || c.toLowerCase().includes('id'));
        const timeCol = columns.find(c => c.toLowerCase().includes('real_time') || c.toLowerCase().includes('time') || c.toLowerCase().includes('timestamp'));

        if (!commandCol || !payloadCol) {
          reject('Missing required columns');
          return;
        }

        const stops = [];
        const context = [];

        jsonData.forEach((row, stopIdx) => {
          const command = String(row[commandCol] || '');
          
          if (command.includes('StopTransaction') && command.includes('Request')) {
            
            const startIdx = Math.max(0, stopIdx - contextSize);
            const endIdx = Math.min(jsonData.length, stopIdx + contextSize + 1);
            
            const contextMessages = [];
            for (let i = startIdx; i < endIdx; i++) {
              if (i === stopIdx) continue;
              const ctxRow = jsonData[i];
              contextMessages.push({
                command: String(ctxRow[commandCol] || ''),
                payload: ctxRow[payloadCol],
                position: i < stopIdx ? 'before' : 'after',
                distance: i < stopIdx ? stopIdx - i : i - stopIdx,
              });
            }

            const stopPayload = row[payloadCol];
            
            let transactionId = null;
            let meterStop = null;
            let idTag = null;

            try {
              if (stopPayload) {
                const data = JSON.parse(stopPayload);
                transactionId = data.transactionId;
                meterStop = data.meterStop;
                idTag = data.idTag;
              }
            } catch (e) {}

            const classification = classifyStopReason(stopPayload, contextMessages);
            const { date, hour } = extractDateComponents(row[timeCol]);

            stops.push({
              transactionId,
              meterStop,
              reason: classification.reason,
              stopCategory: classification.category,
              details: classification.details,
              charger: chargerCol ? String(row[chargerCol] || 'Unknown') : 'Unknown',
              time: row[timeCol],
              timeFormatted: row[timeCol] || 'Unknown',
              sourceFile: file.name,
              energyKwh: meterStop ? Math.round((meterStop / 1000) * 100) / 100 : 0,
              date,
              hour,
              idTag,
            });
          }
        });

        resolve({
          stops,
          context,
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};