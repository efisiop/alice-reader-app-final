import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Paper, Typography, CircularProgress } from '@mui/material';
import { testConnection } from '../supabaseTest';

const TestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // Use the simplified test function
      const result = await testConnection();

      if (!result.success) {
        throw result.error;
      }

      setResult(JSON.stringify(result.data, null, 2));
    } catch (err: any) {
      console.error('Test failed:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test connection on mount
    runTest();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Supabase Connection Test
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            onClick={runTest}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Test Connection'}
          </Button>
        </Box>

        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Error:
            </Typography>
            <Typography variant="body1">
              {error}
            </Typography>
          </Paper>
        )}

        {result && (
          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <Typography variant="h6" gutterBottom>
              Success!
            </Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {result}
            </Typography>
          </Paper>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Debug Information
          </Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', bgcolor: 'grey.100', p: 2 }}>
            {`Supabase URL: https://blwypdcobizmpidmuhvq.supabase.co\nAPI Key: [REDACTED]`}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestPage;
