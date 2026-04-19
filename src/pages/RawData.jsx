import React, { useMemo, useState } from 'react';
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
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';

const RawData = () => {
  const { stops } = useData();
  const [reasonFilter, setReasonFilter] = useState([]);
  const [chargerFilter, setChargerFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);

  const filteredStops = useMemo(() => {
    if (!stops) return [];

    return stops.filter(stop => {
      if (reasonFilter.length > 0 && !reasonFilter.includes(stop.reason)) {
        return false;
      }
      if (chargerFilter.length > 0 && !chargerFilter.includes(stop.charger)) {
        return false;
      }
      if (categoryFilter.length > 0) {
        const hasCategory = categoryFilter.some(cat => stop.stopCategory?.includes(cat));
        if (!hasCategory) return false;
      }
      return true;
    });
  }, [stops, reasonFilter, chargerFilter, categoryFilter]);

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

  const categoryOptions = [
    { value: '✅', label: 'Normal' },
    { value: '⚠️', label: 'System' },
    { value: '❌', label: 'Problematic' },
  ];

  const columns = [
    { field: 'timeFormatted', headerName: 'Time', width: 200 },
    { field: 'charger', headerName: 'Charger', width: 120 },
    { field: 'transactionId', headerName: 'Transaction ID', width: 150 },
    { field: 'reason', headerName: 'Reason', width: 200 },
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
          }}
        />
      ),
    },
    { field: 'energyKwh', headerName: 'Energy (kWh)', width: 120, type: 'number' },
    { field: 'idTag', headerName: 'ID Tag', width: 150 },
    { field: 'sourceFile', headerName: 'Source File', width: 200 },
  ];

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filteredStops);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stops');
    XLSX.writeFile(wb, `ev_stops_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!stops) {
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
        <Typography variant="h5">
          📋 Raw Stop Transaction Data
        </Typography>
        <Tooltip title="Export to Excel">
          <IconButton onClick={handleExport} color="primary">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="body2" color="textSecondary" gutterBottom>
        Total stops: {stops.length} from {new Set(stops.map(s => s.sourceFile)).size} files
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
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
        <Grid item xs={12} md={4}>
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
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Filter by Category</InputLabel>
            <Select
              multiple
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Filter by Category"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {categoryOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Paper sx={{ height: 600, width: '100%' }}>
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

      <style>
        {`
          .row-normal { background-color: #27ae6020; }
          .row-system { background-color: #f39c1220; }
          .row-problematic { background-color: #e74c3c20; }
        `}
      </style>
    </Box>
  );
};

export default RawData;