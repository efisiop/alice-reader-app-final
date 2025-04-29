import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { getSupabaseClient } from '../../services/supabaseClient';
import { appLog } from '../../components/LogViewer';

const SupabaseTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'success' | 'error'>('unknown');
  const [testResults, setTestResults] = useState<Array<{name: string, status: 'success' | 'error', message: string}>>([]);
  const [proxyEnabled, setProxyEnabled] = useState<boolean>(false);
  const [proxyHost, setProxyHost] = useState<string>('');

  // Load proxy settings on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('proxy_settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setProxyEnabled(parsedSettings.enabled || false);
        setProxyHost(parsedSettings.host || 'Not configured');
      } else {
        setProxyHost('Not configured');
      }
    } catch (error) {
      console.error('Error loading proxy settings:', error);
      setProxyHost('Error loading settings');
    }
  }, []);

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);
    setConnectionStatus('unknown');

    const results: Array<{name: string, status: 'success' | 'error', message: string}> = [];

    try {
      appLog('SupabaseTest', 'Starting Supabase connection tests', 'info');

      // Test 1: Get Supabase client
      try {
        const supabase = await getSupabaseClient();
        results.push({
          name: 'Initialize Supabase Client',
          status: 'success',
          message: 'Supabase client initialized successfully'
        });

        // Test 2: Ping Supabase
        try {
          const startTime = performance.now();
          const { data, error } = await supabase.from('books').select('count').limit(1);
          const endTime = performance.now();

          if (error) throw error;

          results.push({
            name: 'Ping Supabase',
            status: 'success',
            message: `Connected to Supabase in ${Math.round(endTime - startTime)}ms`
          });

          // Test 3: Fetch books
          try {
            const { data: books, error: booksError } = await supabase
              .from('books')
              .select('id, title, author')
              .limit(5);

            if (booksError) throw booksError;

            results.push({
              name: 'Fetch Books',
              status: 'success',
              message: `Successfully fetched ${books?.length || 0} books`
            });

            // Test 4: Check auth
            try {
              const { data: session, error: authError } = await supabase.auth.getSession();

              if (authError) throw authError;

              results.push({
                name: 'Check Auth',
                status: 'success',
                message: session?.session ? 'User is authenticated' : 'No active session'
              });

              setConnectionStatus('success');
            } catch (authError: any) {
              results.push({
                name: 'Check Auth',
                status: 'error',
                message: `Auth error: ${authError.message}`
              });
              setConnectionStatus('error');
            }

          } catch (booksError: any) {
            results.push({
              name: 'Fetch Books',
              status: 'error',
              message: `Error fetching books: ${booksError.message}`
            });
            setConnectionStatus('error');
          }

        } catch (pingError: any) {
          results.push({
            name: 'Ping Supabase',
            status: 'error',
            message: `Error connecting to Supabase: ${pingError.message}`
          });
          setConnectionStatus('error');
        }

      } catch (clientError: any) {
        results.push({
          name: 'Initialize Supabase Client',
          status: 'error',
          message: `Error initializing Supabase client: ${clientError.message}`
        });
        setConnectionStatus('error');
      }

    } catch (error: any) {
      setError(`An unexpected error occurred: ${error.message}`);
      setConnectionStatus('error');
    } finally {
      setTestResults(results);
      setLoading(false);
      appLog('SupabaseTest', 'Supabase connection tests completed', 'info');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Supabase Connection Test
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuration
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body1">
            <strong>Backend Mode:</strong> {' '}
            <span style={{ color: '#2196f3', fontWeight: 'bold' }}>
              REAL Supabase
            </span>
          </Typography>

          <Typography variant="body1">
            <strong>Proxy Status:</strong> {' '}
            <span style={{
              color: proxyEnabled ? '#4caf50' : '#f44336',
              fontWeight: 'bold'
            }}>
              {proxyEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </Typography>

          {proxyEnabled && (
            <Typography variant="body1">
              <strong>Proxy Host:</strong> {proxyHost}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={runTests}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Testing...' : 'Run Connection Test'}
        </Button>
      </Paper>

      {connectionStatus !== 'unknown' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>

          {connectionStatus === 'success' ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully connected to Supabase!
            </Alert>
          ) : (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to connect to Supabase. Check the test results below for details.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <List>
            {testResults.map((result, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          color: result.status === 'success' ? '#4caf50' : '#f44336',
                          marginRight: '8px',
                          fontWeight: 'bold'
                        }}>
                          {result.status === 'success' ? '✓' : '✗'}
                        </span>
                        <span style={{ fontWeight: 'bold' }}>{result.name}</span>
                      </Box>
                    }
                    secondary={result.message}
                  />
                </ListItem>
                {index < testResults.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default SupabaseTestPage;
