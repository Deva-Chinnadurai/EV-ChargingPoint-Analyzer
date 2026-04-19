import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useData } from '../context/DataContext';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

export default function IdleTimeAnalytics() {
  const { stops } = useData();

  const data = useMemo(() => {
    if (!stops) return [];
    
    return stops.map((s, index) => ({
      index, // Just for x-axis spread
      transactionId: s.transactionId,
      energyKwh: parseFloat(s.energyKwh) || 0,
      charger: s.charger || 'Unknown',
    })).filter(d => d.energyKwh > 0 && d.transactionId); // Filter out zero energy or nulls
  }, [stops]);

  if (!stops) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">Upload data to view Session Efficiency.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>⏳ Session Efficiency Analytics</Typography>
      <Typography variant="subtitle1" color="textSecondary" mb={3}>
        Scatter plot identifying low-yield charging sessions that could indicate blocked chargers.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" mb={2}>Energy Distribution per Transaction</Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Dots clustered at the very bottom represent users who plug in but draw almost no energy.
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" dataKey="index" name="Session Sequence" tick={false} />
                <YAxis type="number" dataKey="energyKwh" name="Energy (kWh)" unit=" kWh" />
                <ZAxis range={[60, 100]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value, name) => [value, name]}
                />
                <Scatter name="Sessions" data={data} fill="#e84393" fillOpacity={0.6} />
              </ScatterChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
