// src/pages/Test/ServiceTestPage.tsx
import React, { useState } from 'react';
import { Container, Typography, Box, Paper, Divider, Tabs, Tab } from '@mui/material';
import ServiceTestHarness from '../../components/tests/ServiceTestHarness';
import SampleServiceComponent from '../../components/tests/SampleServiceComponent';
import { appLog } from '../../../src/components/LogViewer';

/**
 * Service Test Page
 *
 * This page provides a UI for testing the service registry implementation.
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`service-test-tabpanel-${index}`}
      aria-labelledby={`service-test-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ServiceTestPage: React.FC = () => {
  // State for tabs
  const [tabValue, setTabValue] = useState(0);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Log page load
  React.useEffect(() => {
    appLog('ServiceTestPage', 'Service test page loaded', 'info');
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Alice Reader Service Test
        </Typography>

        <Typography variant="body1" paragraph>
          This page allows you to test the service registry implementation and verify that
          all services are properly initialized and working. Use the tabs below to
          access different testing tools.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="service test tabs">
            <Tab label="Service Registry" id="service-test-tab-0" />
            <Tab label="Sample Service" id="service-test-tab-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Service Registry Test
            </Typography>

            <Typography variant="body2" paragraph>
              This tab allows you to test the service registry implementation.
            </Typography>

            <ol>
              <li>
                <Typography>
                  Click "Initialize All Services" to initialize the service registry.
                </Typography>
              </li>
              <li>
                <Typography>
                  Check the list of registered and initialized services.
                </Typography>
              </li>
              <li>
                <Typography>
                  Expand a service accordion to see its details and test its functionality.
                </Typography>
              </li>
              <li>
                <Typography>
                  Click "Test Service" to call a method on the service and see the result.
                </Typography>
              </li>
            </ol>
          </Box>

          <ServiceTestHarness />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sample Service Demo
            </Typography>

            <Typography variant="body2" paragraph>
              This tab demonstrates how to use a service with the new hooks system.
              The component below uses the <code>useSampleService</code> hook to access
              the sample service and perform operations.
            </Typography>
          </Box>

          <SampleServiceComponent />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ServiceTestPage;
