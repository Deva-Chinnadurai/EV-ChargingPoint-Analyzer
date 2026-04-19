import React, { useMemo, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Grid,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useData } from '../context/DataContext';
import PDFExportButton from '../components/PDFExportButton';
import ReportHeader from '../components/ReportHeader';
import { usePdfExport } from '../hooks/usePdfExport';

const StopReasons = () => {
  const { stops } = useData();
  const reportRef = useRef(null);
  const { exportToPdf } = usePdfExport();
  const [reasonFilter, setReasonFilter] = useState([]);
  const [chargerFilter, setChargerFilter] = useState([]);

  const stats = useMemo(() => {
    if (!stops) return null;

    const total = stops.length;
    const normal = stops.filter(s => s.stopCategory === '✅ Normal').length;
    const system = stops.filter(s => s.stopCategory === '⚠️ System').length;
    const problem = stops.filter(s => s.stopCategory === '❌ Problematic').length;

    // Calculate revenue impact
    const revenuePerSession = 300;
    const lossPerProblem = 300;
    const lossPerSystem = 100;

    const totalRevenue = normal * revenuePerSession;
    const totalLoss = (problem * lossPerProblem) + (system * lossPerSystem);

    return { 
      total, 
      normal, 
      system, 
      problem,
      totalRevenue,
      totalLoss,
      successRate: (normal / total * 100).toFixed(1)
    };
  }, [stops]);

  const filteredStops = useMemo(() => {
    if (!stops) return [];

    return stops.filter(stop => {
      if (reasonFilter.length > 0 && !reasonFilter.includes(stop.reason)) {
        return false;
      }
      if (chargerFilter.length > 0 && !chargerFilter.includes(stop.charger)) {
        return false;
      }
      return true;
    });
  }, [stops, reasonFilter, chargerFilter]);

  const reasonOptions = useMemo(() => {
    if (!stops) return [];
    const reasons = [...new Set(stops.map(s => s.reason))];
    return reasons.map(r => ({ value: r, label: r }));
  }, [stops]);

  const chargerOptions = useMemo(() => {
    if (!stops) return [];
    const chargers = [...new Set(stops.map(s => s.charger))];
    return chargers.map(c => ({ value: c, label: c }));
  }, [stops]);

  const handleExportPdf = async () => {
    await exportToPdf(reportRef, `stop-reasons-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const columns = [
    { 
      field: 'timeFormatted', 
      headerName: 'Time', 
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value}</span>
        </Tooltip>
      ),
    },
    { field: 'charger', headerName: 'Charger', width: 120 },
    { 
      field: 'transactionId', 
      headerName: 'Transaction ID', 
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value ? params.value.toString().substring(0, 8) : 'N/A'}...</span>
        </Tooltip>
      ),
    },
    { 
      field: 'stopCategory', 
      headerName: 'Category', 
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: params.value === '✅ Normal' ? '#27ae6020' :
                     params.value === '⚠️ System' ? '#f39c1220' :
                     '#e74c3c20',
            color: params.value === '✅ Normal' ? '#27ae60' :
                   params.value === '⚠️ System' ? '#f39c12' :
                   '#e74c3c',
            fontWeight: 'bold',
            width: '100%',
          }}
        />
      ),
    },
    { field: 'reason', headerName: 'Specific Issue', width: 200 },
    { 
      field: 'details', 
      headerName: 'Description', 
      width: 300,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value?.substring(0, 50)}...</span>
        </Tooltip>
      ),
    },
    { 
      field: 'energyKwh', 
      headerName: 'Energy (kWh)', 
      width: 120, 
      type: 'number',
      renderCell: (params) => (
        <span>{params.value ? params.value.toFixed(2) : '0.00'}</span>
      ),
    },
    { 
      field: 'idTag', 
      headerName: 'ID Tag', 
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <span>{params.value ? params.value.substring(0, 8) : 'N/A'}...</span>
        </Tooltip>
      ),
    },
  ];

  if (!stops) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="textSecondary">
          No data available. Please upload files to begin analysis.
        </Typography>
      </Box>
    );
  }

  const formatCurrency = (value) => `₹${Math.round(value).toLocaleString()}`;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">🛑 Stop Reasons Analysis</Typography>
        <PDFExportButton onExport={handleExportPdf} />
      </Box>

      {/* Report Content */}
      <div ref={reportRef}>
        <ReportHeader 
          title="Stop Reasons Analysis Report"
          stats={{
            totalStops: stats.total,
            normal: stats.normal,
            system: stats.system,
            problematic: stats.problem,
            totalRevenue: stats.totalRevenue,
          }}
        />

        {/* Summary Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
              <Typography variant="body2" color="textSecondary">Total Stops</Typography>
              <Typography variant="h5" sx={{ color: '#2a5298', fontWeight: 'bold' }}>
                {stats.total}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
              <Typography variant="body2" color="textSecondary">Normal Stops</Typography>
              <Typography variant="h5" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                {stats.normal}
              </Typography>
              <Typography variant="caption">{stats.successRate}%</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
              <Typography variant="body2" color="textSecondary">System Events</Typography>
              <Typography variant="h5" sx={{ color: '#f39c12', fontWeight: 'bold' }}>
                {stats.system}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
              <Typography variant="body2" color="textSecondary">Problematic</Typography>
              <Typography variant="h5" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                {stats.problem}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#f8f9fa' }}>
              <Typography variant="body2" color="textSecondary">Revenue Impact</Typography>
              <Typography variant="h5" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="caption">Loss: {formatCurrency(stats.totalLoss)}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filters - These won't appear in PDF (optional) */}
        <Box className="no-print">
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Reason</InputLabel>
                <Select
                  multiple
                  value={reasonFilter}
                  onChange={(e) => setReasonFilter(e.target.value)}
                  label="Filter by Reason"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {reasonOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Charger</InputLabel>
                <Select
                  multiple
                  value={chargerFilter}
                  onChange={(e) => setChargerFilter(e.target.value)}
                  label="Filter by Charger"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {chargerOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Data Table */}
        <Paper sx={{ height: 600, width: '100%', mb: 3 }}>
          <DataGrid
            rows={filteredStops.map((stop, index) => ({ id: index, ...stop }))}
            columns={columns}
            pageSize={15}
            rowsPerPageOptions={[15, 25, 50]}
            disableSelectionOnClick
            sx={{
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: '#2a5298',
                color: 'white',
                fontWeight: 'bold',
              },
            }}
            getRowClassName={(params) => {
              if (params.row.stopCategory === '✅ Normal') return 'row-normal';
              if (params.row.stopCategory === '⚠️ System') return 'row-system';
              if (params.row.stopCategory === '❌ Problematic') return 'row-problematic';
              return '';
            }}
          />
        </Paper>

        {/* Summary Section for PDF */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#f8f9fa' }}>
              <Typography variant="h6" gutterBottom>📊 Key Insights</Typography>
              <ul>
                <li>Success Rate: {stats.successRate}% ({stats.normal} normal stops)</li>
                <li>Problematic Rate: {((stats.problem / stats.total) * 100).toFixed(1)}% ({stats.problem} stops need attention)</li>
                <li>System Events: {((stats.system / stats.total) * 100).toFixed(1)}% ({stats.system} events to monitor)</li>
                <li>Financial Impact: {formatCurrency(stats.totalRevenue)} revenue generated, {formatCurrency(stats.totalLoss)} lost due to issues</li>
              </ul>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center', color: '#999' }}>
          <Typography variant="caption">
            Report generated automatically by EV Charging Stop Pattern Analyzer
          </Typography>
        </Box>
      </div>

      <style>
        {`
          .row-normal { background-color: #27ae6020; }
          .row-system { background-color: #f39c1220; }
          .row-problematic { background-color: #e74c3c20; }
          @media print {
            .no-print { display: none !important; }
            .MuiPaper-root { box-shadow: none !important; border: 1px solid #ddd !important; }
          }
        `}
      </style>
    </Box>
  );
};

export default StopReasons;