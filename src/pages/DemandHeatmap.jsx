import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DemandHeatmap() {
  const { stops } = useData();

  const data = useMemo(() => {
    if (!stops) return [];
    const hours = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, count: 0 }));
    
    stops.forEach(s => {
      try {
        const date = new Date(s.timeFormatted);
        if (!isNaN(date)) {
          hours[date.getHours()].count++;
        }
      } catch(e) {}
    });
    
    return hours;
  }, [stops]);

  if (!stops) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">Upload data to view Demand Heatmap.</Typography>
      </Box>
    );
  }

  // Find max for color scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>🌡️ Peak Demand Heatmap</Typography>
      <Typography variant="subtitle1" color="textSecondary" mb={3}>
        Distribution of charging stops across the 24-hour day to identify peak usage.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>Activity by Hour of Day</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                <XAxis dataKey="hour" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                />
                <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => {
                    // Heatmap color logic: hot red for peak, cool blue for low
                    const intensity = entry.count / maxCount;
                    const r = Math.floor(255 * intensity);
                    const b = Math.floor(255 * (1 - intensity));
                    return <Cell key={`cell-${index}`} fill={`rgb(${r}, 50, ${b})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
