import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useData } from '../context/DataContext';

export default function ESGImpact() {
  const { stops } = useData();

  const metrics = useMemo(() => {
    if (!stops) return null;
    let totalEnergy = 0;
    stops.forEach(s => {
      totalEnergy += (parseFloat(s.energyKwh) || 0);
    });

    // Environmental constants (approximate)
    // 0.42 kg CO2 per kWh average grid
    // 1 tree absorbs ~21 kg CO2 per year
    // 33.7 kWh = 1 gallon of gasoline
    const co2SavedKg = totalEnergy * 0.42;
    const treesEquivalent = co2SavedKg / 21;
    const gasSavedGallons = totalEnergy / 33.7;

    return {
      totalEnergy: totalEnergy.toFixed(1),
      co2Saved: co2SavedKg.toFixed(1),
      trees: Math.floor(treesEquivalent),
      gasSaved: gasSavedGallons.toFixed(1)
    };
  }, [stops]);

  if (!stops) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">Upload data to view ESG Impact.</Typography>
      </Box>
    );
  }

  const cards = [
    { title: 'CO₂ Emissions Prevented', value: `${metrics.co2Saved} kg`, icon: '☁️', color: '#0984e3' },
    { title: 'Equivalent Trees Planted', value: metrics.trees, icon: '🌳', color: '#00b894' },
    { title: 'Gasoline Saved', value: `${metrics.gasSaved} Gal`, icon: '⛽', color: '#fdcb6e' },
    { title: 'Clean Energy Delivered', value: `${metrics.totalEnergy} kWh`, icon: '⚡', color: '#6c5ce7' },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>🌍 ESG & Environmental Impact</Typography>
      <Typography variant="subtitle1" color="textSecondary" mb={4}>
        Track the real-world impact of your EV charging network.
      </Typography>

      <Grid container spacing={4}>
        {cards.map((c, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Paper 
              className="glass-card" 
              sx={{ 
                p: 4, 
                textAlign: 'center', 
                borderTop: `4px solid ${c.color} !important`,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <Typography variant="h2" mb={1}>{c.icon}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: c.color, my: 1 }}>
                {c.value}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" sx={{ fontWeight: 600 }}>
                {c.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
