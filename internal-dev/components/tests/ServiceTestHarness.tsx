// src/components/test/ServiceTestHarness.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  CircularProgress, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { 
  initializeServices, 
  getServiceStatus, 
  getRegisteredServices, 
  getInitializedServices 
} from '../../../src/services/initServices';
import { registry, SERVICE_NAMES } from '../../../src/services/serviceRegistry';
import { SERVICE_DEPENDENCIES } from '../../../src/services/dependencies';
import { getInitializationOrder } from '../../../src/services/initOrder';
import { appLog } from '../../../src/components/LogViewer';

/**
 * Service Test Harness Component
 * 
 * This component provides a UI for testing the service registry implementation.
 * It allows initializing services, viewing registered and initialized services,
 * and testing service methods.
 */
const ServiceTestHarness: React.FC = () => {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredServices, setRegisteredServices] = useState<string[]>([]);
  const [initializedServices, setInitializedServices] = useState<string[]>([]);
  const [initOrder, setInitOrder] = useState<string[]>([]);
  const [serviceResults, setServiceResults] = useState<Record<string, any>>({});
  const [serviceLoading, setServiceLoading] = useState<Record<string, boolean>>({});
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});
  
  // Load initial data
  useEffect(() => {
    updateServiceLists();
    setInitOrder(getInitializationOrder());
  }, []);
  
  // Update service lists
  const updateServiceLists = () => {
    setRegisteredServices(getRegisteredServices());
    setInitializedServices(getInitializedServices());
  };
  
  // Initialize all services
  const handleInitializeServices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      appLog('ServiceTestHarness', 'Initializing all services', 'info');
      await initializeServices({ forceReload: true });
      updateServiceLists();
      appLog('ServiceTestHarness', 'Services initialized successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      appLog('ServiceTestHarness', `Error initializing services: ${errorMessage}`, 'error');
      setError(`Error initializing services: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Test a specific service
  const testService = async (serviceName: string) => {
    setServiceLoading(prev => ({ ...prev, [serviceName]: true }));
    setServiceErrors(prev => ({ ...prev, [serviceName]: '' }));
    
    try {
      appLog('ServiceTestHarness', `Testing service: ${serviceName}`, 'info');
      const service = registry.get(serviceName);
      
      // Get first method of the service
      const methodName = Object.keys(service).find(key => typeof service[key] === 'function');
      
      if (!methodName) {
        throw new Error('No methods found on service');
      }
      
      // Call method with mock parameters
      const result = await service[methodName]('test-id');
      
      setServiceResults(prev => ({
        ...prev,
        [serviceName]: {
          methodTested: methodName,
          result
        }
      }));
      
      appLog('ServiceTestHarness', `Service test successful: ${serviceName}.${methodName}`, 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      appLog('ServiceTestHarness', `Error testing service ${serviceName}: ${errorMessage}`, 'error');
      setServiceErrors(prev => ({
        ...prev,
        [serviceName]: errorMessage
      }));
    } finally {
      setServiceLoading(prev => ({ ...prev, [serviceName]: false }));
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Service Registry Test Harness
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Service Initialization</Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            onClick={handleInitializeServices}
            disabled={loading}
          >
            {loading ? 'Initializing...' : 'Initialize All Services'}
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Registered Services ({registeredServices.length})
            </Typography>
            <List dense>
              {registeredServices.map(service => (
                <ListItem key={service}>
                  <ListItemText primary={service} />
                  {initializedServices.includes(service) && (
                    <Chip 
                      size="small" 
                      color="success" 
                      icon={<CheckCircleIcon />} 
                      label="Initialized" 
                    />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
          
          <Paper variant="outlined" sx={{ p: 2, flex: 1, minWidth: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Initialization Order
            </Typography>
            <List dense>
              {initOrder.map((service, index) => (
                <ListItem key={service}>
                  <ListItemText 
                    primary={`${index + 1}. ${service}`} 
                    secondary={`Dependencies: ${SERVICE_DEPENDENCIES[service]?.join(', ') || 'none'}`} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Paper>
      
      <Typography variant="h5" gutterBottom>
        Service Tests
      </Typography>
      
      {registeredServices.length === 0 ? (
        <Alert severity="info">No services registered yet. Initialize services first.</Alert>
      ) : (
        <Box sx={{ mt: 2 }}>
          {registeredServices.map(serviceName => (
            <Accordion key={serviceName} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {serviceName}
                  {initializedServices.includes(serviceName) ? (
                    <Chip 
                      size="small" 
                      color="success" 
                      icon={<CheckCircleIcon />} 
                      label="Initialized" 
                      sx={{ ml: 1 }}
                    />
                  ) : (
                    <Chip 
                      size="small" 
                      color="warning" 
                      icon={<ErrorIcon />} 
                      label="Not Initialized" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Dependencies: {SERVICE_DEPENDENCIES[serviceName]?.join(', ') || 'none'}
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => testService(serviceName)}
                    disabled={serviceLoading[serviceName] || !initializedServices.includes(serviceName)}
                    startIcon={serviceLoading[serviceName] ? <CircularProgress size={16} /> : null}
                  >
                    {serviceLoading[serviceName] ? 'Testing...' : 'Test Service'}
                  </Button>
                </Box>
                
                {serviceErrors[serviceName] && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {serviceErrors[serviceName]}
                  </Alert>
                )}
                
                {serviceResults[serviceName] && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">
                      Method Tested: {serviceResults[serviceName].methodTested}
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 1, 
                        mt: 1, 
                        maxHeight: 300, 
                        overflow: 'auto',
                        bgcolor: 'grey.100'
                      }}
                    >
                      <pre style={{ margin: 0 }}>
                        {JSON.stringify(serviceResults[serviceName].result, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ServiceTestHarness;
