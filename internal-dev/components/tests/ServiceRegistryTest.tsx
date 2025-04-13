// src/components/ServiceRegistryTest.tsx
import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { useBookService, useSampleService } from '../../../src/hooks/useService';
import { appLog } from '../../../src/components/LogViewer';
import { SERVICE_NAMES } from '../../../src/constants/app';
import { registry } from '../../../src/services/serviceRegistry';

/**
 * Component to test the Service Registry implementation
 */
const ServiceRegistryTest: React.FC = () => {
  // State
  const [registeredServices, setRegisteredServices] = useState<string[]>([]);
  const [initializers, setInitializers] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Use service hooks
  const { service: bookService, loading: bookLoading, error: bookError } = useBookService();
  const { service: sampleService, loading: sampleLoading, error: sampleError } = useSampleService();

  // Get registered services on mount
  useEffect(() => {
    const services = registry.listServices();
    setRegisteredServices(services);

    // Get initializers if available
    if (typeof registry.listInitializers === 'function') {
      setInitializers(registry.listInitializers());
    }
  }, []);

  // Run a test to verify service initialization
  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);

    try {
      appLog('ServiceRegistryTest', 'Running service registry test', 'info');

      // Test book service
      if (bookService) {
        const bookDetails = await bookService.getBookDetails('alice-in-wonderland');
        appLog('ServiceRegistryTest', `Book service test successful: ${bookDetails.title}`, 'success');
      }

      // Test sample service
      if (sampleService) {
        const sampleData = await sampleService.getSampleData('test');
        appLog('ServiceRegistryTest', `Sample service test successful: ${sampleData.name}`, 'success');
      }

      // Test getting a service directly from the registry
      const authService = await registry.getService(SERVICE_NAMES.AUTH_SERVICE);
      if (authService) {
        appLog('ServiceRegistryTest', 'Auth service retrieved successfully', 'success');
      }

      setTestResult('All service tests completed successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      appLog('ServiceRegistryTest', `Test failed: ${errorMessage}`, 'error');
      setError(`Test failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', my: 4 }}>
      <Typography variant="h4" gutterBottom>
        Service Registry Test
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Registered Services ({registeredServices.length})
        </Typography>
        {registeredServices.length > 0 ? (
          <ul>
            {registeredServices.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        ) : (
          <Typography color="text.secondary">No services registered yet</Typography>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Service Initializers ({initializers.length})
        </Typography>
        {initializers.length > 0 ? (
          <ul>
            {initializers.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        ) : (
          <Typography color="text.secondary">No initializers registered yet</Typography>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Service Hook Status
        </Typography>
        <Box sx={{ mb: 1 }}>
          <Typography variant="body1">
            Book Service: {bookLoading ? 'Loading...' : bookService ? 'Loaded' : 'Not loaded'}
            {bookError && ` (Error: ${bookError.message})`}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body1">
            Sample Service: {sampleLoading ? 'Loading...' : sampleService ? 'Loaded' : 'Not loaded'}
            {sampleError && ` (Error: ${sampleError.message})`}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={runTest}
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} color="inherit" />}
        >
          {loading ? 'Running Test...' : 'Run Service Test'}
        </Button>
      </Box>

      {testResult && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {testResult}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default ServiceRegistryTest;
