import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';

const ReportHeader = ({ title, stats }) => {
  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ color: '#2a5298', fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Generated: {formatDate()}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {stats && (
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="body2" color="textSecondary">Total Stops</Typography>
            <Typography variant="h6">{stats.totalStops}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Files Analyzed</Typography>
            <Typography variant="h6">{stats.fileCount || 1}</Typography> {/* ← Show file count */}
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Normal Stops</Typography>
            <Typography variant="h6" sx={{ color: '#27ae60' }}>{stats.normal}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">System Events</Typography>
            <Typography variant="h6" sx={{ color: '#f39c12' }}>{stats.system}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Problematic</Typography>
            <Typography variant="h6" sx={{ color: '#e74c3c' }}>{stats.problematic}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">Total Revenue</Typography>
            <Typography variant="h6" sx={{ color: '#27ae60' }}>₹{stats.totalRevenue?.toLocaleString()}</Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default ReportHeader;