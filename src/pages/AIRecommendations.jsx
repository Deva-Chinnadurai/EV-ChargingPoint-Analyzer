import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  Build as BuildIcon,
  ElectricBolt as PowerIcon,
} from '@mui/icons-material';
import { useData } from '../context/DataContext';
import { getAIRecommendations } from '../services/geminiService';

const AIRecommendations = () => {
  const { stops, context } = useData();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeyStatus, setApiKeyStatus] = useState('checking');

  useEffect(() => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    setApiKeyStatus(!apiKey || apiKey === 'your_actual_gemini_api_key_here' ? 'missing' : 'configured');
  }, []);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const aiRecs = await getAIRecommendations(stops, context);
      setRecommendations(aiRecs);
    } catch (err) {
      setError('Failed to load AI recommendations. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [stops, context]);

  useEffect(() => {
    if (stops?.length > 0 && apiKeyStatus === 'configured') {
      loadRecommendations();
    }
  }, [stops, apiKeyStatus, loadRecommendations]);

  if (!stops) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="textSecondary">
          No data available. Please upload files to begin analysis.
        </Typography>
      </Box>
    );
  }

  // Calculate metrics for summary
  const problemCount = stops.filter(s => s.stopCategory === '❌ Problematic').length;
  const systemCount = stops.filter(s => s.stopCategory === '⚠️ System').length;
  const normalCount = stops.filter(s => s.stopCategory === '✅ Normal').length;
  
  const REVENUE_PER_SESSION = 300;
  const LOSS_PER_PROBLEM = 300;
  const LOSS_PER_SYSTEM = 100;
  
  const currentLoss = (problemCount * LOSS_PER_PROBLEM) + (systemCount * LOSS_PER_SYSTEM);
  const currentRevenue = normalCount * REVENUE_PER_SESSION;
  const potentialRevenue = stops.length * REVENUE_PER_SESSION;
  const potentialSavings = currentLoss * 0.7;

  const formatRupees = (value) => `₹${Math.round(value).toLocaleString()}`;

  const getPriorityIcon = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return <ErrorIcon sx={{ color: '#e74c3c' }} />;
      case 'high': return <WarningIcon sx={{ color: '#f39c12' }} />;
      case 'medium': return <InfoIcon sx={{ color: '#3498db' }} />;
      case 'low': return <CheckCircleIcon sx={{ color: '#27ae60' }} />;
      default: return <InfoIcon sx={{ color: '#95a5a6' }} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return '#e74c3c';
      case 'high': return '#f39c12';
      case 'medium': return '#3498db';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getTimelineIcon = (timeline) => {
    if (timeline?.toLowerCase().includes('immediate')) return <ScheduleIcon sx={{ color: '#e74c3c' }} />;
    if (timeline?.toLowerCase().includes('short')) return <ScheduleIcon sx={{ color: '#f39c12' }} />;
    return <ScheduleIcon sx={{ color: '#3498db' }} />;
  };

  if (apiKeyStatus === 'missing') {
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          🤖 AI-Powered Recommendations
        </Typography>
        
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fff3e0' }}>
          <ErrorIcon sx={{ fontSize: 80, color: '#f39c12', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ color: '#e67e22', fontWeight: 'bold' }}>
            ⚙️ Setup Required
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#666' }}>
            AI Recommendations Disabled
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ maxWidth: 600, mx: 'auto', mb: 3, color: '#666' }}>
            To get intelligent, actionable recommendations for your EV charging station, please add your Gemini API key.
          </Typography>
          
          <Box sx={{ bgcolor: 'white', p: 4, borderRadius: 2, textAlign: 'left', maxWidth: 600, mx: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ color: '#2a5298', fontWeight: 'bold' }}>
              📋 Setup Instructions:
            </Typography>
            <ol style={{ marginTop: 16, paddingLeft: 20, lineHeight: 2 }}>
              <li>Go to <strong>https://makersuite.google.com/app/apikey</strong></li>
              <li>Sign in with your Google account</li>
              <li>Click <strong>"Create API Key"</strong></li>
              <li>Copy the generated key</li>
              <li>Create file <strong>.env</strong> in project root</li>
              <li>Add: <code style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: 4 }}>
                REACT_APP_GEMINI_API_KEY=your_key_here
              </code></li>
              <li>Restart the server: <strong>npm start</strong></li>
            </ol>
          </Box>

          {/* Show basic stats even without API key */}
          <Grid container spacing={2} sx={{ mt: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Issues Detected</Typography>
                <Typography variant="h4" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  {problemCount + systemCount}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Monthly Loss</Typography>
                <Typography variant="h4" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  {formatRupees(currentLoss)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Potential Savings</Typography>
                <Typography variant="h4" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                  {formatRupees(potentialSavings)}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">Success Rate</Typography>
                <Typography variant="h4" sx={{ color: '#3498db', fontWeight: 'bold' }}>
                  {((normalCount/stops.length)*100).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          🤖 AI-Powered Recommendations
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadRecommendations}
          disabled={loading}
          sx={{
            bgcolor: '#2a5298',
            '&:hover': { bgcolor: '#1e3c72' },
          }}
        >
          Refresh Analysis
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon sx={{ color: '#e74c3c', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  {problemCount + systemCount}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Total Issues Detected
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {problemCount} problematic, {systemCount} system events
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon sx={{ color: '#e74c3c', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#e74c3c', fontWeight: 'bold' }}>
                  {formatRupees(currentLoss)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Estimated Monthly Loss
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon sx={{ color: '#27ae60', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#27ae60', fontWeight: 'bold' }}>
                  {formatRupees(potentialSavings)}
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Potential Monthly Savings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#f8f9fa' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PowerIcon sx={{ color: '#3498db', mr: 1 }} />
                <Typography variant="h6" sx={{ color: '#3498db', fontWeight: 'bold' }}>
                  {((potentialRevenue - currentRevenue) / (currentRevenue || 1) * 100).toFixed(0)}%
                </Typography>
              </Box>
              <Typography variant="body2" color="textSecondary">
                Revenue Growth Potential
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {loading && (
        <Box sx={{ width: '100%', mb: 4 }}>
          <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#666' }}>
            Analyzing your data with AI... This may take a few seconds.
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Recommendations */}
      {!loading && !error && recommendations.length > 0 && (
        <Stack spacing={3}>
          {recommendations.map((rec, index) => (
            <Card
              key={index}
              sx={{
                borderLeft: `8px solid ${getPriorityColor(rec.priority)}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: getPriorityColor(rec.priority) }}>
                    {getPriorityIcon(rec.priority)}
                  </Avatar>
                }
                title={
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2a5298' }}>
                    {rec.title}
                  </Typography>
                }
                subheader={
                  <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={rec.priority}
                      sx={{
                        bgcolor: getPriorityColor(rec.priority),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                    <Chip
                      size="small"
                      icon={getTimelineIcon(rec.timeline)}
                      label={rec.timeline || 'Not specified'}
                      variant="outlined"
                    />
                    {rec.savings && rec.savings !== 'N/A' && (
                      <Chip
                        size="small"
                        icon={<MoneyIcon />}
                        label={`Savings: ${rec.savings}`}
                        sx={{ bgcolor: '#27ae60', color: 'white', fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                }
              />
              <CardContent>
                <Typography variant="body1" paragraph sx={{ color: '#666', lineHeight: 1.8 }}>
                  {rec.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" sx={{ color: '#27ae60', fontWeight: 'bold', mb: 1 }}>
                  ✅ Action Items:
                </Typography>
                <Typography variant="body2" sx={{ color: '#666', whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                  {rec.action}
                </Typography>
                
                {rec.impact && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#2a5298', fontWeight: 'bold', mb: 1 }}>
                      📊 Expected Impact:
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>
                      {rec.impact}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {!loading && !error && recommendations.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No specific recommendations available. Your system appears to be running well!
        </Alert>
      )}
    </Box>
  );
};

export default AIRecommendations;