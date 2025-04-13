// src/pages/ServiceRegistryTestPage.tsx
import React from 'react';
import { Container, Typography, Box, Paper, Divider } from '@mui/material';
import ServiceRegistryTest from '../../../internal-dev/components/tests/ServiceRegistryTest';
import { appLog } from '../../../src/components/LogViewer';

/**
 * Test page for the Service Registry implementation
 */
const ServiceRegistryTestPage: React.FC = () => {
  // Log page view
  React.useEffect(() => {
    appLog('ServiceRegistryTestPage', 'Service Registry Test Page loaded', 'info');
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Service Registry Implementation Test
        </Typography>
        <Typography variant="body1" paragraph>
          This page tests the new Service Registry pattern implementation. It verifies that services
          can be registered, initialized, and accessed through the registry and through React hooks.
        </Typography>
        <Typography variant="body1" paragraph>
          The new Service Registry pattern provides the following benefits:
        </Typography>
        <ul>
          <li>
            <Typography variant="body1">
              <strong>Lazy Loading:</strong> Services are only initialized when needed
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Circular Dependency Resolution:</strong> Services can depend on each other without circular dependencies
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Type Safety:</strong> Full TypeScript support for service interfaces
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Error Handling:</strong> Consistent error handling for service initialization and operations
            </Typography>
          </li>
          <li>
            <Typography variant="body1">
              <strong>Testing:</strong> Easy mocking of services for testing
            </Typography>
          </li>
        </ul>
      </Paper>

      <Divider sx={{ my: 4 }} />

      <ServiceRegistryTest />

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Alice Reader App - Service Registry Implementation Test
        </Typography>
      </Box>
    </Container>
  );
};

export default ServiceRegistryTestPage;
