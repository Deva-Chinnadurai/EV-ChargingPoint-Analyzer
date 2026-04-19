import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useData } from '../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function UserBehavior() {
  const { stops } = useData();

  const data = useMemo(() => {
    if (!stops) return [];
    const users = {};
    stops.forEach(s => {
      const tag = s.idTag || 'Unknown/No Tag';
      if (!users[tag]) {
        users[tag] = { idTag: tag, energyKwh: 0, sessions: 0 };
      }
      users[tag].sessions++;
      users[tag].energyKwh += (parseFloat(s.energyKwh) || 0);
    });
    
    return Object.values(users)
      .sort((a, b) => b.energyKwh - a.energyKwh)
      .slice(0, 10)
      .map(u => ({...u, energyKwh: parseFloat(u.energyKwh.toFixed(2))}));
  }, [stops]);

  if (!stops) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">Upload data to view User Behavior.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>👥 User & Fleet Behavior</Typography>
      <Typography variant="subtitle1" color="textSecondary" mb={3}>
        Top 10 consumers based on RFID tags.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper className="glass-card" sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" mb={2}>Energy Consumed (kWh) by Top Users</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false}/>
                <XAxis type="number" />
                <YAxis dataKey="idTag" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  cursor={{fill: 'rgba(0,0,0,0.05)'}}
                />
                <Bar dataKey="energyKwh" name="Energy (kWh)" fill="#0984e3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper className="glass-card" sx={{ p: 3, height: 400, overflowY: 'auto' }}>
            <Typography variant="h6" mb={2}>Top User Leaderboard</Typography>
            {data.map((user, i) => (
              <Box key={user.idTag} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid rgba(0,0,0,0.05)', bgcolor: i === 0 ? 'rgba(9, 132, 227, 0.05)' : 'transparent', borderRadius: i === 0 ? 2 : 0 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: i === 0 ? 'bold' : 'normal' }}>
                    {i+1}. {user.idTag}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">{user.sessions} sessions</Typography>
                </Box>
                <Typography variant="subtitle2" color="primary.main">{user.energyKwh} kWh</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
