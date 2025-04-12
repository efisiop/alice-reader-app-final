// src/components/admin/ServiceStatusCheck.tsx
import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Box,
  Divider,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { registry } from '../../services/registry';
import { initializeAllServices } from '../../services/initServices';
import { SERVICE_DEPENDENCIES } from '../../services/dependencies';
import { appLog } from '../../components/LogViewer';

// Add console logs for debugging
console.log('ServiceStatusCheck component loaded');
console.log('Registry:', registry);
console.log('SERVICE_DEPENDENCIES:', SERVICE_DEPENDENCIES);

interface ServiceStatus {
  name: string;
  status: 'registered' | 'unregistered' | 'error';
  error?: string;
  dependencies: string[];
}

export function ServiceStatusCheck() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkServices = async (forceRefresh = false) => {
    console.log('Checking services, forceRefresh:', forceRefresh);
    setLoading(true);
    setError(null);

    if (forceRefresh) {
      setRefreshing(true);
      try {
        appLog('ServiceStatusCheck', 'Reinitializing all services', 'info');
        await initializeAllServices({ forceReload: true });
        appLog('ServiceStatusCheck', 'Services reinitialized successfully', 'success');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        appLog('ServiceStatusCheck', `Failed to reinitialize services: ${errorMessage}`, 'error');
        setError(`Failed to reinitialize services: ${errorMessage}`);
      } finally {
        setRefreshing(false);
      }
    }

    // Get all expected services from dependencies
    const expectedServices = Object.keys(SERVICE_DEPENDENCIES);
    console.log('Expected services:', expectedServices);

    // Check registration status
    const statuses: ServiceStatus[] = expectedServices.map(name => {
      try {
        console.log(`Checking service: ${name}, registered:`, registry.has(name));
        if (registry.has(name)) {
          return {
            name,
            status: 'registered',
            dependencies: SERVICE_DEPENDENCIES[name] || []
          };
        } else {
          console.log(`Service ${name} is not registered, dependencies:`, SERVICE_DEPENDENCIES[name]);
          return {
            name,
            status: 'unregistered',
            dependencies: SERVICE_DEPENDENCIES[name] || []
          };
        }
      } catch (error) {
        return {
          name,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          dependencies: SERVICE_DEPENDENCIES[name] || []
        };
      }
    });

    setServices(statuses);
    setLoading(false);
  };

  useEffect(() => {
    console.log('ServiceStatusCheck component mounted');
    checkServices();
  }, []);

  // Log when services change
  useEffect(() => {
    console.log('Services state updated:', services);
  }, [services]);

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' => {
    switch (status) {
      case 'registered': return 'success';
      case 'unregistered': return 'warning';
      case 'error': return 'error';
      default: return 'warning';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered': return <CheckCircleIcon color="success" />;
      case 'unregistered': return <WarningIcon color="warning" />;
      case 'error': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const registeredCount = services.filter(s => s.status === 'registered').length;
  const totalCount = services.length;

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Service Status Check
        </Typography>

        <Button
          variant="outlined"
          onClick={() => checkServices(true)}
          disabled={loading || refreshing}
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
        >
          {refreshing ? 'Reinitializing...' : 'Refresh Services'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Total Services</Typography>
                <Typography variant="h3">{totalCount}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Registered</Typography>
                <Typography variant="h3" color="success.main">{registeredCount}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6">Unregistered</Typography>
                <Typography variant="h3" color="warning.main">{totalCount - registeredCount}</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="subtitle1" gutterBottom>
        {loading ? 'Checking services...' : `${registeredCount} of ${totalCount} services registered`}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <List>
          {services.map((service) => (
            <ListItem
              key={service.name}
              divider
              secondaryAction={
                <Chip
                  label={service.status}
                  color={getStatusColor(service.status)}
                  size="small"
                  icon={getStatusIcon(service.status)}
                />
              }
            >
              <ListItemText
                primary={service.name}
                secondary={
                  <>
                    {service.error && (
                      <Typography variant="body2" color="error">
                        Error: {service.error}
                      </Typography>
                    )}
                    {service.dependencies.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Dependencies: {service.dependencies.join(', ')}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          Note: Services are initialized in dependency order. If a service is unregistered, check that its dependencies are registered first.
        </Typography>
      </Box>
    </Paper>
  );
}

export default ServiceStatusCheck;
