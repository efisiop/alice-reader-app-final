// src/pages/Beta/BetaTestDashboard.tsx
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import TestScenarios from '@components/Beta/TestScenarios';
import { ServiceStatusCheck } from '@components/Admin/ServiceStatusCheck';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BugReportIcon from '@mui/icons-material/BugReport';
import SpeedIcon from '@mui/icons-material/Speed';
import FeedbackIcon from '@mui/icons-material/Feedback';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import BuildIcon from '@mui/icons-material/Build';
import { registry } from '@services/registry';
import { MonitoringServiceInterface } from '@services/monitoringService';

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
      id={`beta-tabpanel-${index}`}
      aria-labelledby={`beta-tab-${index}`}
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
    id: `beta-tab-${index}`,
    'aria-controls': `beta-tabpanel-${index}`,
  };
}

export const BetaTestDashboard: React.FC = () => {
  const monitoringService = registry.get<MonitoringServiceInterface>('monitoringService');
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Log tab change
    if (monitoringService) {
      monitoringService.logEvent('beta_dashboard', 'tab_change', `tab_${newValue}`);
    }
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Beta Test Dashboard
        </Typography>
        <Typography variant="body1">
          Welcome to the Alice Reader Beta Test Dashboard. This dashboard provides tools and information to help you test the application and report issues.
        </Typography>
      </Paper>
      
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Overview" icon={<MenuBookIcon />} {...a11yProps(0)} />
          <Tab label="Test Scenarios" icon={<AssignmentIcon />} {...a11yProps(1)} />
          <Tab label="System Status" icon={<BuildIcon />} {...a11yProps(2)} />
          <Tab label="Test Accounts" icon={<PersonIcon />} {...a11yProps(3)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Beta Testing Progress
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Track your progress through the beta testing process.
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <AssignmentIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Test Scenarios" 
                        secondary="0/3 completed" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <BugReportIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Bug Reports" 
                        secondary="0 submitted" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <FeedbackIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Feedback" 
                        secondary="0 submitted" 
                      />
                    </ListItem>
                  </List>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => setTabValue(1)}>
                    Go to Test Scenarios
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Beta Testing Instructions
                  </Typography>
                  <Typography variant="body2" paragraph>
                    Follow these steps to complete your beta testing:
                  </Typography>
                  <ol>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>Complete Test Scenarios</strong> - Work through the predefined test scenarios to validate key functionality.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>Report Issues</strong> - Use the bug reporting tool to document any issues you encounter.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>Provide Feedback</strong> - Share your thoughts on usability, features, and overall experience.
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2" paragraph>
                        <strong>Check System Status</strong> - If you encounter issues, check the system status to see if any services are experiencing problems.
                      </Typography>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Beta Testing Schedule
                  </Typography>
                  <Typography variant="body2" paragraph>
                    The beta testing period is scheduled from June 1, 2023 to June 15, 2023.
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Key Dates:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Phase 1: Core Functionality" 
                        secondary="June 1-5, 2023" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Phase 2: Consultant Features" 
                        secondary="June 6-10, 2023" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Phase 3: Edge Cases & Performance" 
                        secondary="June 11-15, 2023" 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <TestScenarios />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <ServiceStatusCheck />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Test Accounts
            </Typography>
            <Typography variant="body1" paragraph>
              Use these test accounts to access different roles and features in the application.
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Reader Accounts
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Test Reader 1
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: leo@test.com
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Password: Test1234!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verification Code: BETA001
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Test Reader 2
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: sarah@test.com
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Password: Test1234!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Verification Code: BETA002
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
            
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Consultant Accounts
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Test Consultant
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: consultant1@test.com
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Password: Test1234!
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default BetaTestDashboard;
