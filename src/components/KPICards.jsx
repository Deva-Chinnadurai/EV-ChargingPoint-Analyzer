import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

const KPICards = ({ stats }) => {
  const cards = [
    {
      icon: '🔄',
      label: 'Total Stops',
      value: stats.total,
      color: '#2a5298',
    },
    {
      icon: '📁',
      label: 'Files Analyzed',
      value: stats.fileCount,  // ← This now gets the correct value from stats
      color: '#2a5298',
    },
    {
      icon: '🔌',
      label: 'Unique Chargers',
      value: stats.uniqueChargers || 0,
      color: '#2a5298',
    },
    {
      icon: '📊',
      label: 'Success Rate',
      value: `${stats.successRate.toFixed(1)}%`,
      color: stats.successRate > 80 ? '#27ae60' : '#f39c12',
    },
  ];

  const statusCards = [
    {
      icon: '✅',
      label: 'Normal Stops',
      value: stats.normal,
      color: '#27ae60',
      bgColor: '#27ae60',
    },
    {
      icon: '⚠️',
      label: 'System Events',
      value: stats.system,
      color: '#f39c12',
      bgColor: '#f39c12',
    },
    {
      icon: '❌',
      label: 'Problematic',
      value: stats.problem,
      color: '#e74c3c',
      bgColor: '#e74c3c',
    },
    {
      icon: '🚗',
      label: 'EV Requested',
      value: stats.evRequested || 0,
      color: '#3498db',
      bgColor: '#3498db',
    },
  ];

  return (
    <Box>
      {/* Main KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {cards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3,
                },
              }}
            >
              <Typography variant="h3" sx={{ mb: 1 }}>
                {card.icon}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {card.label}
              </Typography>
              <Typography variant="h4" sx={{ color: card.color, fontWeight: 'bold' }}>
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Status Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statusCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3,
                },
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: card.bgColor,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                  mx: 'auto',
                  mb: 1,
                }}
              >
                {card.icon}
              </Box>
              <Typography variant="h5" sx={{ color: card.color, fontWeight: 'bold' }}>
                {card.value}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default KPICards;