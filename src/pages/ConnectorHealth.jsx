import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ConnectorHealth() {
  const { stops } = useData();

  const data = useMemo(() => {
    if (!stops) return [];
    const chargers = {};
    stops.forEach(s => {
      const c = s.charger || 'Unknown';
      if (!chargers[c]) {
        chargers[c] = { charger: c, success: 0, error: 0, total: 0 };
      }
      chargers[c].total++;
      if (s.stopCategory === '✅ Normal') {
        chargers[c].success++;
      } else {
        chargers[c].error++;
      }
    });
    return Object.values(chargers)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [stops]);

  if (!stops) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">Upload data to view Connector Health.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>🔌 Connector Health & Reliability</Typography>
      <Typography variant="subtitle1" color="textSecondary" mb={3}>
        Monitor which chargers are experiencing the most abnormal stops.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 3, height: 500 }}>
            <Typography variant="h6" mb={2}>Successful vs Failed Sessions per Charger</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="charger" angle={-45} textAnchor="end" height={80} interval={0} tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="success" name="✅ Normal" stackId="a" fill="#00b894" radius={[0, 0, 4, 4]} />
                <Bar dataKey="error" name="⚠️ Abnormal" stackId="a" fill="#ff7675" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
