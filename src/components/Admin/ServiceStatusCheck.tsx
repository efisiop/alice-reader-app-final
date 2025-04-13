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
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import { registry } from '@services/registry';
import { initializeAllServices } from '@services/initServices';
import { SERVICE_DEPENDENCIES } from '@services/dependencies';
import { appLog } from '@components/LogViewer';

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

    const expectedServices = Object.keys(SERVICE_DEPENDENCIES);
    const statuses: ServiceStatus[] = expectedServices.map(name => {
      try {
        if (registry.has(name)) {
          return {
            name,
            status: 'registered',
            dependencies: (SERVICE_DEPENDENCIES as Record<string, string[]>)[name] || []
          };
        } else {
          return {
            name,
            status: 'unregistered',
            dependencies: (SERVICE_DEPENDENCIES as Record<string, string[]>)[name] || []
          };
        }
      } catch (error) {
        return {
          name,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
          dependencies: (SERVICE_DEPENDENCIES as Record<string, string[]>)[name] || []
        };
      }
    });

    setServices(statuses);
    setLoading(false);
  };

  useEffect(() => {
    checkServices();
  }, []);

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
              secondaryAction={getStatusIcon(service.status)}
            >
              <ListItemText
                primary={service.name}
                secondary={
                  <>
                    <Chip
                      size="small"
                      label={service.status}
                      color={getStatusColor(service.status)}
                      sx={{ mr: 1 }}
                    />
                    {service.error && (
                      <Typography color="error" variant="caption" display="block">
                        Error: {service.error}
                      </Typography>
                    )}
                    {service.dependencies.length > 0 && (
                      <Typography variant="caption" display="block">
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
    </Paper>
  );
} 