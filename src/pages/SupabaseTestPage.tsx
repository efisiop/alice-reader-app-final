import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress, Divider, Grid } from '@mui/material';
import { supabase, testConnection } from '../services/supabaseClient';
import { testSupabaseAPI } from '../utils/directSupabaseTest';

const SupabaseTestPage: React.FC = () => {
  const [clientTestResult, setClientTestResult] = useState<{
    success?: boolean;
    data?: any;
    error?: any;
  }>({});
  const [directTestResult, setDirectTestResult] = useState<{
    success?: boolean;
    data?: any;
    error?: any;
  }>({});
  const [clientLoading, setClientLoading] = useState(false);
  const [directLoading, setDirectLoading] = useState(false);

  const runClientTest = async () => {
    setClientLoading(true);
    setClientTestResult({});

    try {
      // Test URL and key validity
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('Supabase Key (first 5 chars):',
        import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 5));

      // Test connection using Supabase client
      const result = await testConnection();
      setClientTestResult(result);
    } catch (error) {
      console.error('Client test execution error:', error);
      setClientTestResult({ success: false, error });
    } finally {
      setClientLoading(false);
    }
  };

  const runDirectTest = async () => {
    setDirectLoading(true);
    setDirectTestResult({});

    try {
      // Test direct API connection
      const result = await testSupabaseAPI();
      setDirectTestResult(result);
    } catch (error) {
      console.error('Direct API test execution error:', error);
      setDirectTestResult({ success: false, error });
    } finally {
      setDirectLoading(false);
    }
  };

  const runAllTests = async () => {
    await runClientTest();
    await runDirectTest();
  };

  useEffect(() => {
    // Automatically run all tests on mount
    runAllTests();
  }, []);

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Supabase Connection Tests
        </Typography>

        <Button
          variant="contained"
          onClick={runAllTests}
          disabled={clientLoading || directLoading}
          sx={{ mb: 3 }}
        >
          {(clientLoading || directLoading) ? 'Testing...' : 'Run All Tests'}
        </Button>

        <Grid container spacing={3}>
          {/* Supabase Client Test */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Supabase Client Test
            </Typography>

            <Button
              variant="outlined"
              onClick={runClientTest}
              disabled={clientLoading}
              sx={{ mb: 2 }}
            >
              {clientLoading ? 'Testing...' : 'Run Client Test'}
            </Button>

            {clientTestResult.success === true && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Client connection successful!
              </Alert>
            )}

            {clientTestResult.success === false && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Client connection failed!
              </Alert>
            )}

            <Typography variant="subtitle1" gutterBottom>
              Test Details:
            </Typography>

            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: '300px'
              }}
            >
              {JSON.stringify(clientTestResult, null, 2)}
            </Box>
          </Grid>

          {/* Direct API Test */}
          <Grid item xs={12} md={6}>
            <Typography variant="h5" gutterBottom>
              Direct API Test
            </Typography>

            <Button
              variant="outlined"
              onClick={runDirectTest}
              disabled={directLoading}
              sx={{ mb: 2 }}
            >
              {directLoading ? 'Testing...' : 'Run Direct Test'}
            </Button>

            {directTestResult.success === true && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Direct API connection successful!
              </Alert>
            )}

            {directTestResult.success === false && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Direct API connection failed!
              </Alert>
            )}

            <Typography variant="subtitle1" gutterBottom>
              Test Details:
            </Typography>

            <Box
              component="pre"
              sx={{
                p: 2,
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: '300px'
              }}
            >
              {JSON.stringify(directTestResult, null, 2)}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Troubleshooting Tips for 503 Errors:
        </Typography>

        <Box component="ul" sx={{ pl: 2 }}>
          <li>Check the Supabase status page: <a href="https://status.supabase.com/" target="_blank" rel="noopener noreferrer">status.supabase.com</a></li>
          <li>Verify your project is active in the <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer">Supabase dashboard</a></li>
          <li>Check if you've exceeded free tier limits</li>
          <li>Try again later as 503 errors are often temporary</li>
        </Box>
      </Paper>
    </Box>
  );
};

export default SupabaseTestPage;
