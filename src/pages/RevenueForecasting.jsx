import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { useData } from '../context/DataContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RevenueForecasting() {
  const { stops } = useData();

  const data = useMemo(() => {
    if (!stops) return [];
    
    const dailyMap = {};
    stops.forEach(s => {
      try {
        const dateObj = new Date(s.timeFormatted);
        if (!isNaN(dateObj)) {
          const dateStr = dateObj.toISOString().split('T')[0];
          if (!dailyMap[dateStr]) dailyMap[dateStr] = { date: dateStr, revenue: 0 };
          
          // Assuming ₹15 per kWh as standard revenue rate
          dailyMap[dateStr].revenue += (parseFloat(s.energyKwh) || 0) * 15;
        }
      } catch(e) {}
    });

    const sortedData = Object.values(dailyMap).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Add a simple 3-day moving average as "Forecast" trend
    return sortedData.map((d, i, arr) => {
      let sum = d.revenue;
      let count = 1;
      if (i > 0) { sum += arr[i-1].revenue; count++; }
      if (i > 1) { sum += arr[i-2].revenue; count++; }
      return {
        ...d,
        revenue: Math.round(d.revenue),
        trendline: Math.round(sum / count)
      };
    });
  }, [stops]);

  if (!stops || data.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography color="textSecondary">Upload data with valid timestamps to view Revenue Analytics.</Typography>
      </Box>
    );
  }

  const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>🔮 Revenue & Energy Forecasting</Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Historical revenue trends and moving averages (Assumed ₹15/kWh).
          </Typography>
        </Box>
        <Typography variant="h4" sx={{ color: '#00b894', fontWeight: 'bold' }}>
          ₹{totalRevenue.toLocaleString()} <Typography component="span" variant="subtitle1" color="textSecondary">Total Generated</Typography>
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className="glass-card" sx={{ p: 3, height: 450 }}>
            <Typography variant="h6" mb={2}>Daily Revenue Trend</Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0984e3" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0984e3" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false}/>
                <XAxis dataKey="date" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value}`, undefined]}
                />
                <Area type="monotone" dataKey="revenue" name="Actual Revenue" stroke="#0984e3" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="trendline" name="Trend (3-Day MA)" stroke="#fdcb6e" strokeWidth={3} fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
