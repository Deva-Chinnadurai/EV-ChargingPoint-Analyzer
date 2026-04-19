import React, { useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../context/DataContext';
import PDFExportButton from '../components/PDFExportButton';
import ReportHeader from '../components/ReportHeader';
import { usePdfExport } from '../hooks/usePdfExport';

const CostAnalysis = () => {
  const { stops } = useData();
  const reportRef = useRef(null);
  const { exportToPdf } = usePdfExport();

  const financials = useMemo(() => {
    if (!stops || stops.length === 0) return null;

    // Indian market rates
    const REVENUE_PER_SESSION = 300; // ₹300 average
    const LOSS_PER_PROBLEM = 300;    // Full loss for problematic
    const LOSS_PER_SYSTEM = 100;     // Partial loss for system events

    const problemCount = stops.filter(s => s.stopCategory === '❌ Problematic').length;
    const systemCount = stops.filter(s => s.stopCategory === '⚠️ System').length;
    const normalCount = stops.filter(s => s.stopCategory === '✅ Normal').length;

    const currentLoss = (problemCount * LOSS_PER_PROBLEM) + (systemCount * LOSS_PER_SYSTEM);
    const currentRevenue = normalCount * REVENUE_PER_SESSION;
    const potentialRevenue = stops.length * REVENUE_PER_SESSION;

    // Charger-wise loss
    const chargerLoss = {};
    stops.forEach(stop => {
      const charger = stop.charger;
      if (!chargerLoss[charger]) {
        chargerLoss[charger] = { problem: 0, system: 0, total: 0, revenue: 0 };
      }
      if (stop.stopCategory === '❌ Problematic') {
        chargerLoss[charger].problem++;
      } else if (stop.stopCategory === '⚠️ System') {
        chargerLoss[charger].system++;
      } else if (stop.stopCategory === '✅ Normal') {
        chargerLoss[charger].revenue += REVENUE_PER_SESSION;
      }
      chargerLoss[charger].total++;
    });

    const chargerLossData = Object.entries(chargerLoss)
      .map(([charger, data]) => ({
        charger,
        loss: (data.problem * LOSS_PER_PROBLEM) + (data.system * LOSS_PER_SYSTEM),
        revenue: data.revenue,
        problemCount: data.problem,
        systemCount: data.system,
        totalStops: data.total,
        lossPerStop: ((data.problem * LOSS_PER_PROBLEM) + (data.system * LOSS_PER_SYSTEM)) / (data.total || 1),
      }))
      .sort((a, b) => b.loss - a.loss);

    // Scenarios
    const scenarios = [
      {
        name: 'Fix 50% of Problematic Stops',
        savings: problemCount * 0.5 * LOSS_PER_PROBLEM,
        description: 'Target the worst-performing chargers first',
        stopsFixed: Math.round(problemCount * 0.5),
      },
      {
        name: 'Fix 80% of System Events',
        savings: systemCount * 0.8 * LOSS_PER_SYSTEM,
        description: 'Address recurring system issues',
        stopsFixed: Math.round(systemCount * 0.8),
      },
      {
        name: 'Comprehensive Fix (All Issues)',
        savings: currentLoss,
        description: 'Ideal scenario - fix all identified issues',
        stopsFixed: problemCount + systemCount,
      },
    ];

    // ROI Calculation
    const investmentRequired = 5000; // Estimated ₹5,000 for fixes
    const annualSavings = currentLoss * 12;
    const roi = ((annualSavings - investmentRequired) / investmentRequired) * 100;
    const paybackPeriod = (investmentRequired / (currentLoss || 1)).toFixed(1); // in months

    // Problem categories
    const problemCategories = stops
      .filter(s => s.stopCategory === '❌ Problematic')
      .reduce((acc, stop) => {
        const reason = stop.reason;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      }, {});

    const problemCategoryData = Object.entries(problemCategories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      problemCount,
      systemCount,
      normalCount,
      currentLoss,
      currentRevenue,
      potentialRevenue,
      improvementPotential: ((potentialRevenue - currentRevenue) / (currentRevenue || 1)) * 100,
      chargerLossData: chargerLossData.slice(0, 5),
      scenarios,
      annualSavings,
      roi,
      investmentRequired,
      paybackPeriod,
      problemCategoryData,
      revenueData: [
        { name: 'Revenue Earned', value: currentRevenue, color: '#27ae60' },
        { name: 'Lost Revenue', value: currentLoss, color: '#e74c3c' },
      ],
      lossPerStop: currentLoss / (problemCount + systemCount || 1),
    };
  }, [stops]);

  const handleExportPdf = async () => {
    await exportToPdf(reportRef, `cost-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!financials) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="textSecondary">
          No data available. Please upload files to begin analysis.
        </Typography>
      </Box>
    );
  }

  const formatCurrency = (value) => `₹${Math.round(value).toLocaleString()}`;
  const formatPercent = (value) => `${value.toFixed(1)}%`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">💰 Cost Savings Analysis</Typography>
        <PDFExportButton onExport={handleExportPdf} />
      </Box>

      {/* Report Content */}
      <div ref={reportRef}>
        <ReportHeader title="Cost Savings Analysis Report" />

        {/* Key Metrics */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Current Revenue</Typography>
              <Typography variant="h5" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                {formatCurrency(financials.currentRevenue)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                from {financials.normalCount} sessions
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Current Loss</Typography>
              <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                {formatCurrency(financials.currentLoss)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                from {financials.problemCount + financials.systemCount} sessions
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Potential Revenue</Typography>
              <Typography variant="h5" sx={{ color: '#3498db', fontWeight: 'bold' }}>
                {formatCurrency(financials.potentialRevenue)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                if all issues fixed
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Improvement Potential</Typography>
              <Typography variant="h5" sx={{ color: '#f39c12', fontWeight: 'bold' }}>
                +{financials.improvementPotential.toFixed(0)}%
              </Typography>
              <Typography variant="caption" color="textSecondary">
                revenue increase possible
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#2a5298' }}>
                Revenue vs Loss
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={financials.revenueData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {financials.revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#27ae60', borderRadius: 1 }} />
                  <Typography variant="body2">Revenue: {formatCurrency(financials.currentRevenue)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, bgcolor: '#e74c3c', borderRadius: 1 }} />
                  <Typography variant="body2">Loss: {formatCurrency(financials.currentLoss)}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#2a5298' }}>
                Savings Scenarios
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financials.scenarios} layout="vertical" margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `₹${value}`} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="savings" fill="#27ae60" />
                </BarChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {financials.scenarios.map((scenario, idx) => (
                  <Typography key={idx} variant="body2" sx={{ mb: 0.5 }}>
                    • {scenario.name}: Save {formatCurrency(scenario.savings)} (fix {scenario.stopsFixed} stops)
                  </Typography>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Top Loss Chargers */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2a5298' }}>
            Top 5 Chargers by Revenue Loss
          </Typography>
          <Grid container spacing={2}>
            {financials.chargerLossData.map((charger, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography sx={{ minWidth: 100, fontWeight: 'bold' }}>
                    {charger.charger}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(charger.loss / financials.chargerLossData[0].loss) * 100}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        bgcolor: '#f0f0f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: '#e74c3c',
                        },
                      }}
                    />
                  </Box>
                  <Typography sx={{ minWidth: 120, textAlign: 'right', fontWeight: 'bold' }}>
                    {formatCurrency(charger.loss)}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ minWidth: 150 }}>
                    ({charger.problemCount} problem, {charger.systemCount} system)
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    ₹{charger.lossPerStop.toFixed(0)}/stop loss
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Problem Categories */}
        {financials.problemCategoryData.length > 0 && (
          <Paper sx={{ p: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2a5298' }}>
              Top Problem Categories
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Problem Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Estimated Loss</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {financials.problemCategoryData.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{item.value}</TableCell>
                      <TableCell align="right">
                        {((item.value / financials.problemCount) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(item.value * 300)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* ROI Calculator */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2a5298' }}>
            📈 ROI Calculator
          </Typography>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Investment Required</Typography>
                <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  {formatCurrency(financials.investmentRequired)}
                </Typography>
                <Typography variant="caption">(Maintenance, firmware updates)</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Annual Savings</Typography>
                <Typography variant="h5" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                  {formatCurrency(financials.annualSavings)}
                </Typography>
                <Typography variant="caption">(Based on monthly loss)</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">ROI</Typography>
                <Typography variant="h4" sx={{ color: '#3498db', fontWeight: 'bold' }}>
                  {financials.roi.toFixed(0)}%
                </Typography>
                <Typography variant="caption">Return on investment</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Payback Period</Typography>
                <Typography variant="h5" sx={{ color: '#f39c12', fontWeight: 'bold' }}>
                  {financials.paybackPeriod} months
                </Typography>
                <Typography variant="caption">Time to recover investment</Typography>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="textSecondary">
              * Calculations based on estimated ₹300 revenue per successful session
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: financials.roi > 100 ? '#27ae60' : '#f39c12' }}>
              {financials.roi > 100 ? '✅ Excellent ROI - Invest now!' : '⚠️ Consider prioritizing fixes'}
            </Typography>
          </Box>
        </Paper>

        {/* Summary Section */}
        <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom>📊 Financial Summary</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                • Current monthly revenue: <strong>{formatCurrency(financials.currentRevenue)}</strong>
              </Typography>
              <Typography variant="body1">
                • Current monthly loss: <strong>{formatCurrency(financials.currentLoss)}</strong>
              </Typography>
              <Typography variant="body1">
                • Loss per affected session: <strong>{formatCurrency(financials.lossPerStop)}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                • Potential monthly revenue: <strong>{formatCurrency(financials.potentialRevenue)}</strong>
              </Typography>
              <Typography variant="body1">
                • Improvement potential: <strong>+{financials.improvementPotential.toFixed(0)}%</strong>
              </Typography>
              <Typography variant="body1">
                • Annual savings potential: <strong>{formatCurrency(financials.annualSavings)}</strong>
              </Typography>
            </Grid>
          </Grid>
        </Paper>

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

export default CostAnalysis;