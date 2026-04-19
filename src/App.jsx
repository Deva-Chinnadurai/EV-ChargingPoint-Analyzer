import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';  // ← THIS WAS MISSING

import Header from './components/Header';
import FileUpload from './components/FileUpload';
import Overview from './pages/Overview';
import StopReasons from './pages/StopReasons';
import Performance from './pages/Performance';
import AIRecommendations from './pages/AIRecommendations';
import CostAnalysis from './pages/CostAnalysis';
import RawData from './pages/RawData';
import ConnectorHealth from './pages/ConnectorHealth';
import IdleTimeAnalytics from './pages/IdleTimeAnalytics';
import UserBehavior from './pages/UserBehavior';
import ESGImpact from './pages/ESGImpact';
import { DataProvider } from './context/DataContext';
import './App.css';

// ... rest of your App.jsx code remains exactly the same
// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#0984e3',
      light: '#74b9ff',
      dark: '#0056b3',
    },
    secondary: {
      main: '#6c5ce7',
      light: '#a29bfe',
      dark: '#4834d4',
    },
    success: { main: '#00b894' },
    warning: { main: '#fdcb6e' },
    error: { main: '#d63031' },
    info: { main: '#00cec9' },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px', color: '#2d3436' },
    h5: { fontWeight: 600, letterSpacing: '-0.3px', color: '#2d3436' },
    h6: { fontWeight: 600, color: '#2d3436' },
    subtitle1: { color: '#636e72' },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.4)',
          background: 'rgba(255,255,255,0.9)',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 15px 35px -10px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          padding: '8px 24px',
          '&:hover': { boxShadow: '0 6px 15px rgba(0,0,0,0.1)' },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '15px',
          textTransform: 'none',
          minHeight: 56,
          color: '#636e72',
          '&.Mui-selected': { color: '#0984e3' },
        },
      },
    },
  },
});

function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [uploadedData, setUploadedData] = useState(null);
  const [contextData, setContextData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleDataUpload = (data) => {
    setUploadedData(data.stops);
    setContextData(data.context);
    setSnackbar({
      open: true,
      message: `✅ Successfully loaded ${data.stops.length} stop transactions`,
      severity: 'success'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const tabs = [
    { label: '📊 Overview 2', component: Overview, value: 0 },
    { label: '🔌 Connector Health', component: ConnectorHealth, value: 1 },
    { label: '⏳ Idle Time', component: IdleTimeAnalytics, value: 2 },
    { label: '👥 User Behavior', component: UserBehavior, value: 3 },
    { label: '🛑 Stop Reasons', component: StopReasons, value: 4 },
    { label: '📈 Performance', component: Performance, value: 5 },
    { label: '🤖 AI Recommendations', component: AIRecommendations, value: 6 },
    { label: '💰 Cost Analysis', component: CostAnalysis, value: 7 },
    { label: '🌍 ESG Impact', component: ESGImpact, value: 8 },
    { label: '📋 Raw Data', component: RawData, value: 9 },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DataProvider value={{ stops: uploadedData, context: contextData }}>
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
          <Header />
          
          <Box sx={{ maxWidth: 1600, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
            <FileUpload onUpload={handleDataUpload} setIsLoading={setIsLoading} />
            
            {uploadedData && uploadedData.length > 0 && (
              <Paper sx={{ mt: 3, overflow: 'hidden' }}>
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    bgcolor: 'white',
                    '& .MuiTab-root': {
                      minWidth: { xs: 100, sm: 120, md: 140 },
                      transition: 'all 0.2s',
                    },
                    '& .Mui-selected': {
                      color: 'primary.main',
                      fontWeight: 'bold',
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                      borderTopLeftRadius: 3,
                      borderTopRightRadius: 3,
                    },
                  }}
                >
                  {tabs.map((tab, index) => (
                    <Tab 
                      key={index} 
                      label={tab.label} 
                      id={`tab-${index}`}
                      aria-controls={`tabpanel-${index}`}
                    />
                  ))}
                </Tabs>

                <Box sx={{ p: 3 }}>
                  {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                      <div className="loading-spinner" />
                    </Box>
                  ) : (
                    <div
                      role="tabpanel"
                      id={`tabpanel-${currentTab}`}
                      aria-labelledby={`tab-${currentTab}`}
                    >
                      {React.createElement(tabs[currentTab].component)}
                    </div>
                  )}
                </Box>
              </Paper>
            )}

            {uploadedData && uploadedData.length === 0 && (
              <Paper sx={{ p: 4, mt: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  No stop transactions found in the uploaded files.
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  Please upload files containing StopTransaction requests.
                </Typography>
              </Paper>
            )}
          </Box>
        </Box>

        {/* Global Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            sx={{ 
              width: '100%',
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;