import React, { useMemo, useRef } from 'react';
import { Grid, Typography, Box } from '@mui/material';
import { useData } from '../context/DataContext';
import KPICards from '../components/KPICards';
import PieChart from '../components/Charts/PieChart';
import BarChart from '../components/Charts/BarChart';
import PDFExportButton from '../components/PDFExportButton';
import ReportHeader from '../components/ReportHeader';
import { usePdfExport } from '../hooks/usePdfExport';

const Overview = () => {
  const { stops } = useData();
  const reportRef = useRef(null);
  const { exportToPdf } = usePdfExport();

  const stats = useMemo(() => {
    if (!stops || stops.length === 0) return null;

    const total = stops.length;
    
    // FIX: Calculate unique files count
    const uniqueFiles = new Set(stops.map(s => s.sourceFile)).size;
    
    const normal = stops.filter(s => s.stopCategory === '✅ Normal').length;
    const system = stops.filter(s => s.stopCategory === '⚠️ System').length;
    const problem = stops.filter(s => s.stopCategory === '❌ Problematic').length;
    const evRequested = stops.filter(s => s.reason === 'EV Request Stop').length;

    // Calculate unique chargers
    const uniqueChargers = new Set(stops.map(s => s.charger)).size;

    // Calculate revenue (₹300 per successful session)
    const totalRevenue = normal * 300;
    const lostRevenue = (problem * 300) + (system * 100);

    // Charger stats
    const chargerMap = new Map();
    stops.forEach(stop => {
      const charger = stop.charger;
      if (!chargerMap.has(charger)) {
        chargerMap.set(charger, { total: 0, normal: 0 });
      }
      const stat = chargerMap.get(charger);
      stat.total++;
      if (stop.stopCategory === '✅ Normal') stat.normal++;
    });

    let bestCharger = 'N/A';
    let bestRate = 0;
    let worstCharger = 'N/A';
    let worstRate = 100;

    chargerMap.forEach((stat, charger) => {
      const rate = (stat.normal / stat.total) * 100;
      if (rate > bestRate) {
        bestRate = rate;
        bestCharger = charger;
      }
      if (rate < worstRate) {
        worstRate = rate;
        worstCharger = charger;
      }
    });

    return {
      total,
      fileCount: uniqueFiles,  // ← FIXED: This now shows correct file count
      normal,
      system,
      problem,
      evRequested,
      successRate: (normal / total) * 100,
      bestCharger,
      bestRate,
      worstCharger,
      worstRate,
      totalRevenue,
      lostRevenue,
      uniqueChargers,
      chargerStats: Array.from(chargerMap.entries()).map(([charger, stat]) => ({
        charger,
        ...stat,
        rate: (stat.normal / stat.total) * 100,
      })),
    };
  }, [stops]);

  const handleExportPdf = async () => {
    await exportToPdf(reportRef, `ev-report-${new Date().toISOString().split('T')[0]}.pdf`);
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

  const categoryData = [
    { name: 'Normal Stops', value: stats.normal, color: '#27ae60' },
    { name: 'System Events', value: stats.system, color: '#f39c12' },
    { name: 'Problematic', value: stats.problem, color: '#e74c3c' },
  ];

  const reasonData = stops
    .reduce((acc, stop) => {
      const reason = stop.reason;
      const existing = acc.find(r => r.name === reason);
      if (existing) {
        existing.value++;
      } else {
        acc.push({ name: reason, value: 1 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">📊 Overview Dashboard</Typography>
        <PDFExportButton onExport={handleExportPdf} />
      </Box>

      {/* Report Content - This will be captured for PDF */}
      <div ref={reportRef}>
        <ReportHeader 
          title="EV Charging Station Analysis Report"
          stats={{
            totalStops: stats.total,
            fileCount: stats.fileCount,  // ← Pass fileCount to header
            normal: stats.normal,
            system: stats.system,
            problematic: stats.problem,
            totalRevenue: stats.totalRevenue,
            uniqueChargers: stats.uniqueChargers,
            successRate: stats.successRate,
          }}
        />

        <KPICards stats={stats} />

        {/* Best/Worst Charger Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: '#27ae60' }}>🏆 Best Charger</Typography>
              <Typography variant="h4">{stats.bestCharger}</Typography>
              <Typography>Success Rate: {stats.bestRate.toFixed(1)}%</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: '#e74c3c' }}>⚠️ Needs Attention</Typography>
              <Typography variant="h4">{stats.worstCharger}</Typography>
              <Typography>Success Rate: {stats.worstRate.toFixed(1)}%</Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Stop Categories</Typography>
              <PieChart data={categoryData} />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Top Stop Reasons</Typography>
              <BarChart data={reasonData} />
            </Box>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center', color: '#999' }}>
          <Typography variant="caption">
            Report generated automatically by EV Charging Stop Pattern Analyzer
          </Typography>
        </Box>
      </div>
    </Box>
  );
};

export default Overview;