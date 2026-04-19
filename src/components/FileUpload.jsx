import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { processExcelFile } from '../services/fileProcessor';

const FileUpload = ({ onUpload, setIsLoading }) => {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [contextSize, setContextSize] = useState(5);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    setProcessing(true);
    setIsLoading(true);
    setUploadStatus('Processing files...');

    const allStops = [];
    const allContext = [];
    const fileSummary = [];

    for (const file of acceptedFiles) {
      try {
        const result = await processExcelFile(file, contextSize);
        if (result) {
          allStops.push(...result.stops);
          allContext.push(...result.context);
          fileSummary.push({
            name: file.name,
            stops: result.stops.length,
            context: result.context.length,
            status: '✅ Success',
          });
        }
      } catch (error) {
        console.error('Error processing file:', error);
        fileSummary.push({
          name: file.name,
          stops: 0,
          context: 0,
          status: '❌ Error',
        });
      }
    }

    setFiles(fileSummary);
    setUploadStatus(`✅ Processed ${allStops.length} stops across ${fileSummary.length} files`);
    
    onUpload({
      stops: allStops,
      context: allContext,
    });

    setProcessing(false);
    setIsLoading(false);
  }, [contextSize, onUpload, setIsLoading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: true,
  });

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6">
          {isDragActive
            ? 'Drop the files here...'
            : '📁 Drag and Drop or Select Excel Files'}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          (You can select multiple files)
        </Typography>
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Context Window Size</InputLabel>
          <Select
            value={contextSize}
            label="Context Window Size"
            onChange={(e) => setContextSize(e.target.value)}
          >
            <MenuItem value={3}>3 rows before/after</MenuItem>
            <MenuItem value={5}>5 rows before/after</MenuItem>
            <MenuItem value={10}>10 rows before/after</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="body2" color="textSecondary">
          🔍 Helps analyze what happened right before/after each stop
        </Typography>
      </Box>

      {processing && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            {uploadStatus}
          </Typography>
        </Box>
      )}

      {uploadStatus && !processing && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {uploadStatus}
        </Alert>
      )}

      {files.length > 0 && (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Typography variant="h6" sx={{ p: 2 }}>
            📁 Uploaded Files Summary
          </Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell align="center">Stop Transactions</TableCell>
                <TableCell align="center">Context Messages</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file, index) => (
                <TableRow key={index}>
                  <TableCell>{file.name}</TableCell>
                  <TableCell align="center">{file.stops}</TableCell>
                  <TableCell align="center">{file.context}</TableCell>
                  <TableCell align="center" sx={{ color: file.status.includes('✅') ? 'success.main' : 'error.main' }}>
                    {file.status}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default FileUpload;