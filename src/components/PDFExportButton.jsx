import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

const PDFExportButton = ({ onExport, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [includeAllPages, setIncludeAllPages] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleExport = async () => {
    setLoading(true);
    handleClose();
    
    try {
      await onExport(includeAllPages);
      setSnackbar({
        open: true,
        message: 'PDF downloaded successfully!',
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to generate PDF. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={20} /> : <PdfIcon />}
        onClick={handleOpen}
        disabled={disabled || loading}
        sx={{
          bgcolor: '#e74c3c',
          '&:hover': { bgcolor: '#c0392b' },
          color: 'white',
          fontWeight: 'bold',
          px: 3,
        }}
      >
        {loading ? 'Generating...' : 'Download PDF Report'}
      </Button>

      {/* Export Options Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#2a5298', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">📄 Export PDF Report</Typography>
            <CloseIcon onClick={handleClose} sx={{ cursor: 'pointer' }} />
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Choose what to include in your report:
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeAllPages}
                  onChange={(e) => setIncludeAllPages(e.target.checked)}
                  color="primary"
                />
              }
              label="Include all dashboard sections (Overview, Charts, Tables)"
            />
          </Box>
          
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            The PDF will include:
          </Typography>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            <li>Key performance indicators (KPIs)</li>
            <li>All charts and graphs</li>
            <li>Stop reasons analysis table</li>
            <li>Cost analysis summary</li>
            <li>Timestamp and report generation date</li>
          </ul>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{ bgcolor: '#27ae60', '&:hover': { bgcolor: '#219a52' } }}
          >
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PDFExportButton;