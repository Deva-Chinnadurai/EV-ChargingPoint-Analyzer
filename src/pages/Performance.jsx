import React, { useMemo, useRef } from 'react';
import { Grid, Typography, Paper, Box } from '@mui/material';
import { useData } from '../context/DataContext';
import DailyChart from '../components/Charts/DailyChart';
import WeeklyChart from '../components/Charts/WeeklyChart';
import HourlyChart from '../components/Charts/HourlyChart';
import ChargerChart from '../components/Charts/ChargerChart';
import PieChart from '../components/Charts/PieChart';
import PDFExportButton from '../components/PDFExportButton';
import ReportHeader from '../components/ReportHeader';
import { usePdfExport } from '../hooks/usePdfExport';

const Performance = () => {
  const { stops } = useData();
  const reportRef = useRef(null);
  const { exportToPdf } = usePdfExport();

  const stats = useMemo(() => {
    if (!stops || stops.length === 0) return null;

    // Daily counts
    const dailyMap = new Map();
    stops.forEach(stop => {
      if (stop.date) {
        dailyMap.set(stop.date, (dailyMap.get(stop.date) || 0) + 1);
      }
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7);

    // Weekly counts
    const weeklyMap = new Map();
    stops.forEach(stop => {
      if (stop.date) {
        const date = new Date(stop.date);
        const week = `Week ${Math.ceil(date.getDate() / 7)} ${date.toLocaleString('default', { month: 'short' })}`;
        weeklyMap.set(week, (weeklyMap.get(week) || 0) + 1);
      }
    });

    const weeklyData = Array.from(weeklyMap.entries())
      .map(([week, count]) => ({ week, count }))
      .slice(-8);

    // Hourly counts
    const hourlyMap = new Map();
    for (let i = 0; i < 24; i++) hourlyMap.set(i, 0);
    
    stops.forEach(stop => {
      if (stop.hour !== null && stop.hour !== undefined) {
        hourlyMap.set(stop.hour, (hourlyMap.get(stop.hour) || 0) + 1);
      }
    });

    const hourlyData = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    // Charger performance
    const chargerMap = new Map();
    stops.forEach(stop => {
      const charger = stop.charger;
      if (!chargerMap.has(charger)) {
        chargerMap.set(charger, { total: 0, normal: 0, energy: 0 });
      }
      const stat = chargerMap.get(charger);
      stat.total++;
      if (stop.stopCategory === '✅ Normal') stat.normal++;
      stat.energy += stop.energyKwh || 0;
    });

    const chargerData = Array.from(chargerMap.entries())
      .map(([charger, stat]) => ({
        charger,
        totalStops: stat.total,
        successRate: (stat.normal / stat.total) * 100,
        totalEnergy: stat.energy,
      }))
      .sort((a, b) => b.totalStops - a.totalStops)
      .slice(0, 10);

    // Find peak hour
    const peakHour = Array.from(hourlyMap.entries())
      .reduce((max, entry) => entry[1] > max[1] ? entry : max, [0, 0]);

    // Overall health
    const normal = stops.filter(s => s.stopCategory === '✅ Normal').length;
    const system = stops.filter(s => s.stopCategory === '⚠️ System').length;
    const problem = stops.filter(s => s.stopCategory === '❌ Problematic').length;

    return {
      dailyData,
      weeklyData,
      hourlyData,
      chargerData,
      totalDays: dailyMap.size,
      peakHour: peakHour[0],
      peakCount: peakHour[1],
      totalEnergy: stops.reduce((sum, s) => sum + (s.energyKwh || 0), 0),
      healthData: [
        { name: 'Normal Stops', value: normal, color: '#27ae60' },
        { name: 'System Events', value: system, color: '#f39c12' },
        { name: 'Problematic', value: problem, color: '#e74c3c' },
      ],
    };
  }, [stops]);

  const handleExportPdf = async () => {
    await exportToPdf(reportRef, `performance-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!stats) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="textSecondary">
          No data available. Please upload files to begin analysis.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">📈 Performance Analytics</Typography>
        <PDFExportButton onExport={handleExportPdf} />
      </Box>

      <div ref={reportRef}>
        <ReportHeader title="Performance Analytics Report" />

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Total Days</Typography>
              <Typography variant="h5" sx={{ color: '#2a5298', fontWeight: 'bold' }}>
                {stats.totalDays}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Peak Hour</Typography>
              <Typography variant="h5" sx={{ color: '#f39c12', fontWeight: 'bold' }}>
                {String(stats.peakHour).padStart(2, '0')}:00
              </Typography>
              <Typography variant="caption">{stats.peakCount} stops</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Total Energy</Typography>
              <Typography variant="h5" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                {stats.totalEnergy.toFixed(0)} kWh
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Avg per Session</Typography>
              <Typography variant="h5" sx={{ color: '#3498db', fontWeight: 'bold' }}>
                {(stats.totalEnergy / stops.length).toFixed(1)} kWh
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Daily Stop Volume (Last 7 Days)</Typography>
              <DailyChart data={stats.dailyData} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Weekly Stop Volume</Typography>
              <WeeklyChart data={stats.weeklyData} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Stops by Time of Day</Typography>
              <HourlyChart data={stats.hourlyData} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Charger Performance</Typography>
              <ChargerChart data={stats.chargerData} />
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Overall Stop Health</Typography>
              <PieChart data={stats.healthData} />
            </Paper>
          </Grid>
        </Grid>
      </div>
    </Box>
  );
};

export default Performance;