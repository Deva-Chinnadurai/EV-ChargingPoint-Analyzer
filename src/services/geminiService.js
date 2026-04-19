import axios from 'axios';

const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export const getAIRecommendations = async (stops, context) => {
  // Check if API key is configured
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_actual_gemini_api_key_here') {
    return getEnhancedFallbackRecommendations(stops);
  }

  try {
    // Calculate comprehensive metrics
    const metrics = calculateDetailedMetrics(stops);
    
    const prompt = createAIPrompt(metrics, stops);
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = response.data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
    
    return getEnhancedFallbackRecommendations(stops, metrics);

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return getEnhancedFallbackRecommendations(stops);
  }
};

// Calculate detailed metrics from your data
const calculateDetailedMetrics = (stops) => {
  const total = stops.length;
  
  // Category counts
  const problematic = stops.filter(s => s.stopCategory === '❌ Problematic');
  const system = stops.filter(s => s.stopCategory === '⚠️ System');
  const normal = stops.filter(s => s.stopCategory === '✅ Normal');
  
  // Problematic stops by reason
  const problemByReason = problematic.reduce((acc, stop) => {
    const reason = stop.reason || 'Unknown';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});
  
  // Problematic stops by charger
  const problemByCharger = problematic.reduce((acc, stop) => {
    const charger = stop.charger;
    acc[charger] = (acc[charger] || 0) + 1;
    return acc;
  }, {});
  
  // Time-based patterns
  const problemByHour = problematic.reduce((acc, stop) => {
    const hour = stop.hour || 0;
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  
  // Find peak problem hours
  const peakProblemHours = Object.entries(problemByHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  
  // Find worst chargers
  const worstChargers = Object.entries(problemByCharger)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([charger, count]) => ({ charger, count }));
  
  // Calculate financials
  const revenuePerSession = 300;
  const lossPerProblem = 300;
  const lossPerSystem = 100;
  
  const problemCount = problematic.length;
  const systemCount = system.length;
  const normalCount = normal.length;
  
  const currentLoss = (problemCount * lossPerProblem) + (systemCount * lossPerSystem);
  const currentRevenue = normalCount * revenuePerSession;
  const potentialRevenue = total * revenuePerSession;
  
  return {
    total,
    problemCount,
    systemCount,
    normalCount,
    currentLoss,
    currentRevenue,
    potentialRevenue,
    problemByReason,
    problemByCharger,
    peakProblemHours,
    worstChargers,
    successRate: (normalCount / total * 100).toFixed(1),
    problemRate: (problemCount / total * 100).toFixed(1),
    systemRate: (systemCount / total * 100).toFixed(1),
  };
};

// Create AI prompt with detailed context
const createAIPrompt = (metrics, stops) => {
  const problemReasonsList = Object.entries(metrics.problemByReason)
    .map(([reason, count]) => `- ${reason}: ${count} occurrences (${((count/metrics.problemCount)*100).toFixed(1)}%)`)
    .join('\n');
  
  const worstChargersList = metrics.worstChargers
    .map(c => `- Charger ${c.charger}: ${c.count} problems`)
    .join('\n');
  
  const peakHoursList = metrics.peakProblemHours
    .map(p => `- ${p.hour.toString().padStart(2, '0')}:00: ${p.count} problems`)
    .join('\n');

  return `
You are an EV charging infrastructure expert analyzing data for the Indian market. Based on the following data, provide 5 specific, actionable recommendations to reduce problematic stops and increase revenue.

CONTEXT:
- Total charging sessions analyzed: ${metrics.total}
- Success rate: ${metrics.successRate}% (${metrics.normalCount} normal stops)
- Problematic stops: ${metrics.problemCount} (${metrics.problemRate}%)
- System events: ${metrics.systemCount} (${metrics.systemRate}%)

FINANCIAL IMPACT (in ₹):
- Current monthly revenue: ₹${metrics.currentRevenue.toLocaleString()}
- Current monthly loss: ₹${metrics.currentLoss.toLocaleString()}
- Potential monthly revenue: ₹${metrics.potentialRevenue.toLocaleString()}
- Improvement potential: +${((metrics.potentialRevenue - metrics.currentRevenue) / metrics.currentRevenue * 100).toFixed(0)}%

PROBLEM BREAKDOWN BY REASON:
${problemReasonsList || '- No specific reasons recorded'}

WORST PERFORMING CHARGERS:
${worstChargersList || '- No specific charger patterns'}

PEAK PROBLEM HOURS:
${peakHoursList || '- No specific time patterns'}

Based on this data, provide 5 SPECIFIC, ACTIONABLE recommendations. For each recommendation include:
1. A clear, catchy title with relevant emoji
2. A detailed description of the issue (what's happening, why it's a problem)
3. Specific action items (step-by-step what to do)
4. Expected impact (how many problems it will fix, ₹ savings)
5. Priority level (Critical/High/Medium/Low)
6. Timeline for implementation (Immediate/Short-term/Long-term)

Format as JSON array with objects containing: title, description, action, impact, priority, timeline, savings
`;
};

// Enhanced fallback recommendations based on actual data
const getEnhancedFallbackRecommendations = (stops, metrics = null) => {
  // Calculate metrics if not provided
  const calculatedMetrics = metrics || calculateDetailedMetrics(stops);
  
  const {
    problemCount,
    systemCount,
    currentLoss,
    worstChargers,
    peakProblemHours,
    problemByReason
  } = calculatedMetrics;

  const recommendations = [];

  // 1. Charger-specific recommendation
  if (worstChargers.length > 0) {
    const worstCharger = worstChargers[0];
    recommendations.push({
      title: `🔧 Immediate Maintenance Required for Charger ${worstCharger.charger}`,
      description: `Charger ${worstCharger.charger} has ${worstCharger.count} problematic stops, accounting for ${((worstCharger.count / problemCount) * 100).toFixed(1)}% of all issues. This is significantly higher than other chargers and requires immediate attention.`,
      action: `1. Schedule on-site inspection of Charger ${worstCharger.charger} within 48 hours
2. Check for physical damage, loose connections, or overheating
3. Verify firmware version and update if necessary
4. Test communication module and network connectivity
5. Run diagnostic tests on all charging components`,
      impact: `Fixing this charger could resolve ${worstCharger.count} problems and save ₹${(worstCharger.count * 300).toLocaleString()} monthly`,
      priority: 'Critical',
      timeline: 'Immediate (24-48 hours)',
      savings: `₹${(worstCharger.count * 300 * 0.7).toLocaleString()}`
    });
  }

  // 2. Time-based recommendation
  if (peakProblemHours.length > 0) {
    const peakHour = peakProblemHours[0];
    const hourStr = peakHour.hour.toString().padStart(2, '0');
    const period = peakHour.hour < 12 ? 'morning' : peakHour.hour < 17 ? 'afternoon' : 'evening';
    
    recommendations.push({
      title: `⏰ Peak Problem Period: ${hourStr}:00 (${period})`,
      description: `${peakHour.count} problems occur during the ${period} peak hour. This pattern suggests potential grid instability or high usage stress during this time.`,
      action: `1. Monitor grid voltage and current during ${period} hours
2. Check if multiple chargers are overloaded simultaneously
3. Consider implementing load balancing during peak hours
4. Review maintenance logs for this time period
5. Install power quality monitoring equipment`,
      impact: `Addressing peak hour issues could reduce problems by ${((peakHour.count / problemCount) * 100).toFixed(1)}%`,
      priority: 'High',
      timeline: 'Short-term (1-2 weeks)',
      savings: `₹${(peakHour.count * 300 * 0.5).toLocaleString()}`
    });
  }

  // 3. Most common problem reason
  const topProblems = Object.entries(problemByReason)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 1);
  
  if (topProblems.length > 0) {
    const [reason, count] = topProblems[0];
    
    let specificAction = '';
    if (reason.includes('Not Specified') || reason.includes('Missing')) {
      specificAction = '1. Update charger firmware to latest version\n2. Check OCPP configuration settings\n3. Verify that all chargers are reporting reasons correctly\n4. Test communication with CMS';
    } else if (reason.includes('Error') || reason.includes('Fault')) {
      specificAction = '1. Categorize specific error codes\n2. Check manufacturer documentation for each error\n3. Schedule targeted maintenance for affected chargers\n4. Update error handling in monitoring system';
    } else if (reason.includes('Timeout')) {
      specificAction = '1. Check network connectivity during problem periods\n2. Verify CMS response times\n3. Consider upgrading network infrastructure\n4. Implement retry mechanisms';
    } else {
      specificAction = '1. Investigate root cause of this specific issue\n2. Review logs for patterns\n3. Consult with charger manufacturer\n4. Implement monitoring alert for this issue';
    }

    recommendations.push({
      title: `📊 Address Most Common Issue: "${reason}"`,
      description: `"${reason}" accounts for ${count} problematic stops (${((count / problemCount) * 100).toFixed(1)}% of all issues). This is your biggest opportunity for improvement.`,
      action: specificAction,
      impact: `Resolving this issue could fix ${count} problems and improve overall success rate by ${((count / (problemCount + systemCount)) * 100).toFixed(1)}%`,
      priority: 'High',
      timeline: 'Short-term (2-3 weeks)',
      savings: `₹${(count * 300 * 0.8).toLocaleString()}`
    });
  }

  // 4. System events recommendation
  if (systemCount > 5) {
    recommendations.push({
      title: `⚡ Reduce System Events (${systemCount} occurrences)`,
      description: `${systemCount} system events (power loss, emergency stops) indicate infrastructure stability issues. These events affect user experience and cause partial revenue loss.`,
      action: `1. Review power quality at locations with frequent power loss
2. Install UPS or backup power systems at critical locations
3. Train staff on proper emergency procedures
4. Implement predictive maintenance for power systems
5. Monitor grid stability during peak hours`,
      impact: `Reducing system events by 80% could save ₹${(systemCount * 100 * 0.8).toLocaleString()} monthly`,
      priority: 'Medium',
      timeline: 'Medium-term (1-2 months)',
      savings: `₹${(systemCount * 100 * 0.8).toLocaleString()}`
    });
  }

  // 5. General improvement recommendation
  recommendations.push({
    title: `📈 Comprehensive Improvement Program`,
    description: `Based on analysis of ${problemCount} problematic stops and ${systemCount} system events, a systematic approach to charger maintenance and monitoring is recommended.`,
    action: `1. Implement daily automated health checks for all chargers
2. Set up real-time alerts for common error patterns
3. Create maintenance schedule based on problem frequency
4. Train support team on common issue resolution
5. Establish regular firmware update cycle (quarterly)
6. Create customer feedback loop for issue reporting`,
    impact: `Could improve overall success rate by 15-20% and increase monthly revenue by ₹${(calculatedMetrics.potentialRevenue - calculatedMetrics.currentRevenue).toLocaleString()}`,
    priority: 'Medium',
    timeline: 'Long-term (3-6 months)',
    savings: `₹${(calculatedMetrics.currentLoss * 0.5).toLocaleString()}`
  });

  return recommendations.slice(0, 5); // Return top 5 recommendations
};