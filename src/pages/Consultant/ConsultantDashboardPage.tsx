import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography, Paper } from '@mui/material';
import { ReaderListView } from './ReaderListView';
import { appLog } from '../../components/LogViewer';

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
      id={`consultant-tabpanel-${index}`}
      aria-labelledby={`consultant-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `consultant-tab-${index}`,
    'aria-controls': `consultant-tabpanel-${index}`,
  };
}

export const ConsultantDashboardPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    appLog('ConsultantDashboard', `Switching to tab ${newValue}`, 'info');
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Consultant Dashboard
      </Typography>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="consultant dashboard tabs"
        >
          <Tab label="Reader List" {...a11yProps(0)} />
          <Tab label="Help Requests" {...a11yProps(1)} />
          <Tab label="Analytics" {...a11yProps(2)} />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <ReaderListView />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography>Help Requests (Coming Soon)</Typography>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography>Analytics (Coming Soon)</Typography>
      </TabPanel>
    </Box>
  );
}; 