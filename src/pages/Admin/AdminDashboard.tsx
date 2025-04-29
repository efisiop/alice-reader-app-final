// src/pages/Admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import BookIcon from '@mui/icons-material/Book';
import StorageIcon from '@mui/icons-material/Storage';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { useAnalyticsService, useMonitoringService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
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

const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { service: analyticsService } = useAnalyticsService();
  const { service: monitoringService, loading: monitoringLoading } = useMonitoringService();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);

  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'AdminDashboard'
  });

  // Load system status
  useEffect(() => {
    if (!monitoringService || !user) return;

    const loadSystemStatus = async () => {
      setLoading(true);
      setError(null);

      try {
        const startTime = performance.now();
        const data = await monitoringService.getSystemStatus();

        // In a real app, we would use the actual data from the service
        // For now, we'll use mock data
        setSystemStatus({
          services: [
            { name: 'Authentication Service', status: 'healthy', uptime: '99.9%', lastIssue: null },
            { name: 'Book Service', status: 'healthy', uptime: '99.7%', lastIssue: '2023-06-10T15:30:00Z' },
            { name: 'Dictionary Service', status: 'degraded', uptime: '98.5%', lastIssue: '2023-06-15T08:45:00Z' },
            { name: 'AI Service', status: 'healthy', uptime: '99.8%', lastIssue: '2023-06-12T11:20:00Z' },
            { name: 'Feedback Service', status: 'healthy', uptime: '99.9%', lastIssue: null },
            { name: 'Trigger Service', status: 'healthy', uptime: '99.9%', lastIssue: null },
            { name: 'Statistics Service', status: 'healthy', uptime: '99.9%', lastIssue: null },
            { name: 'Consultant Service', status: 'healthy', uptime: '99.8%', lastIssue: '2023-06-11T09:15:00Z' }
          ],
          database: {
            status: 'healthy',
            connectionPool: '12/20',
            avgQueryTime: '45ms',
            storage: {
              used: '2.3GB',
              total: '20GB',
              percentage: 11.5
            }
          },
          users: {
            total: 125,
            active: 78,
            consultants: 5,
            admins: 2
          },
          activity: {
            registrations: [5, 8, 12, 7, 10, 15, 9],
            logins: [25, 30, 28, 35, 40, 38, 42],
            aiQueries: [120, 145, 135, 160, 180, 175, 190],
            helpRequests: [8, 12, 10, 15, 18, 14, 16]
          },
          alerts: [
            {
              id: 'a1',
              type: 'warning',
              message: 'Dictionary Service experiencing increased latency',
              timestamp: '2023-06-15T08:45:00Z'
            },
            {
              id: 'a2',
              type: 'info',
              message: 'System update scheduled for June 20, 2023',
              timestamp: '2023-06-14T10:00:00Z'
            }
          ],
          ...data // Overwrite with any real data we might have
        });

        // Track page view
        if (analyticsService) {
          analyticsService.trackPageView('admin_dashboard', {
            userId: user.id
          });
        }
      } catch (error) {
        console.error('Error loading system status:', error);
        setError('Failed to load system status. Please try again.');

        // Track error
        if (analyticsService) {
          analyticsService.trackEvent('admin_dashboard_error', {
            error: String(error)
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadSystemStatus();
  }, [monitoringService, user, analyticsService]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);

    // Track tab change
    if (analyticsService) {
      analyticsService.trackEvent('admin_tab_change', {
        tabIndex: newValue
      });
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading || monitoringLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Check if user is admin
  if (!profile?.is_admin) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          You don't have admin access.
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/reader"
          sx={{ mt: 2 }}
        >
          Go to Reader Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          System monitoring and management
        </Typography>
      </Box>

      {/* Alerts */}
      {systemStatus.alerts.length > 0 && (
        <Box sx={{ mb: 4 }}>
          {systemStatus.alerts.map((alert: any) => (
            <Alert
              key={alert.id}
              severity={alert.type as 'error' | 'warning' | 'info' | 'success'}
              sx={{ mb: 2 }}
            >
              <Typography variant="body1">
                {alert.message}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(alert.timestamp)}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Users Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              height: '100%',
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <Typography variant="h6">Users</Typography>
            </Box>
            <CardContent>
              <Typography variant="h3" align="center" gutterBottom>
                {systemStatus.users.total}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Active:
                  </Typography>
                  <Typography variant="body1">
                    {systemStatus.users.active}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Consultants:
                  </Typography>
                  <Typography variant="body1">
                    {systemStatus.users.consultants}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Paper>
        </Grid>

        {/* Services Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              height: '100%',
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <Typography variant="h6">Services</Typography>
            </Box>
            <CardContent>
              <Typography variant="h3" align="center" gutterBottom>
                {systemStatus.services.length}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Healthy:
                  </Typography>
                  <Typography variant="body1">
                    {systemStatus.services.filter((s: any) => s.status === 'healthy').length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Issues:
                  </Typography>
                  <Typography variant="body1">
                    {systemStatus.services.filter((s: any) => s.status !== 'healthy').length}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Paper>
        </Grid>

        {/* Database Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              height: '100%',
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'success.main', color: 'white', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <Typography variant="h6">Database</Typography>
            </Box>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h6" align="center">
                  {systemStatus.database.status === 'healthy' ? 'Healthy' : 'Issues'}
                </Typography>
                {systemStatus.database.status === 'healthy' ? (
                  <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ ml: 1 }} />
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Storage:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={systemStatus.database.storage.percentage}
                    sx={{ height: 8, borderRadius: 5 }}
                  />
                </Box>
                <Box sx={{ minWidth: 35 }}>
                  <Typography variant="body2" color="text.secondary">
                    {systemStatus.database.storage.percentage}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2">
                {systemStatus.database.storage.used} / {systemStatus.database.storage.total}
              </Typography>
            </CardContent>
          </Paper>
        </Grid>

        {/* Activity Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              height: '100%',
              borderRadius: 2
            }}
          >
            <Box sx={{ p: 2, bgcolor: 'info.main', color: 'white', borderTopLeftRadius: 8, borderTopRightRadius: 8 }}>
              <Typography variant="h6">Today's Activity</Typography>
            </Box>
            <CardContent>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Logins:
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.activity.logins[systemStatus.activity.logins.length - 1]}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Registrations:
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.activity.registrations[systemStatus.activity.registrations.length - 1]}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    AI Queries:
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.activity.aiQueries[systemStatus.activity.aiQueries.length - 1]}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Help Requests:
                  </Typography>
                  <Typography variant="h6">
                    {systemStatus.activity.helpRequests[systemStatus.activity.helpRequests.length - 1]}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Status */}
      <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<SettingsIcon />} label="Services" />
          <Tab icon={<StorageIcon />} label="Database" />
          <Tab icon={<PeopleIcon />} label="Users" />
          <Tab icon={<BookIcon />} label="Content" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Service Status
          </Typography>
          <List>
            {systemStatus.services.map((service: any, index: number) => (
              <ListItem
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 1
                }}
              >
                <ListItemIcon>
                  {service.status === 'healthy' ? (
                    <CheckCircleIcon color="success" />
                  ) : service.status === 'degraded' ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={service.name}
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        Uptime: {service.uptime} • Last Issue: {formatDate(service.lastIssue)}
                      </Typography>
                    </>
                  }
                />
                <Chip
                  label={service.status}
                  color={
                    service.status === 'healthy'
                      ? 'success'
                      : service.status === 'degraded'
                        ? 'warning'
                        : 'error'
                  }
                />
              </ListItem>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Database Status
          </Typography>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {systemStatus.database.status === 'healthy' ? 'Healthy' : 'Issues'}
                  </Typography>
                  {systemStatus.database.status === 'healthy' ? (
                    <CheckCircleIcon color="success" sx={{ ml: 1 }} />
                  ) : (
                    <ErrorIcon color="error" sx={{ ml: 1 }} />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Connection Pool:
                </Typography>
                <Typography variant="h6">
                  {systemStatus.database.connectionPool}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Query Time:
                </Typography>
                <Typography variant="h6">
                  {systemStatus.database.avgQueryTime}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="h6" gutterBottom>
            Storage Usage
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {systemStatus.database.storage.used} used of {systemStatus.database.storage.total} total
            </Typography>
            <LinearProgress
              variant="determinate"
              value={systemStatus.database.storage.percentage}
              sx={{ height: 10, borderRadius: 5, mb: 2 }}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    User Data
                  </Typography>
                  <Typography variant="h6">
                    0.5GB
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, bgcolor: 'secondary.light' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Book Content
                  </Typography>
                  <Typography variant="h6">
                    1.2GB
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Analytics
                  </Typography>
                  <Typography variant="h6">
                    0.6GB
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            User Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  User Breakdown
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    [Pie Chart Visualization]
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Readers:
                    </Typography>
                    <Typography variant="h6">
                      {systemStatus.users.total - systemStatus.users.consultants - systemStatus.users.admins}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Consultants:
                    </Typography>
                    <Typography variant="h6">
                      {systemStatus.users.consultants}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Admins:
                    </Typography>
                    <Typography variant="h6">
                      {systemStatus.users.admins}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Active Users:
                    </Typography>
                    <Typography variant="h6">
                      {systemStatus.users.active}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Registration Trend
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    [Line Chart Visualization]
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Today:
                    </Typography>
                    <Typography variant="h6">
                      {systemStatus.activity.registrations[systemStatus.activity.registrations.length - 1]}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      This Week:
                    </Typography>
                    <Typography variant="h6">
                      {systemStatus.activity.registrations.reduce((a: number, b: number) => a + b, 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      fullWidth
                      component={RouterLink}
                      to="/admin/users"
                    >
                      View User Management
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Content Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Books
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <BookIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Alice in Wonderland"
                      secondary="Active • 125 readers"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      component={RouterLink}
                      to="/admin/books/alice-in-wonderland"
                    >
                      Manage
                    </Button>
                  </ListItem>
                </List>
                <Button
                  variant="contained"
                  fullWidth
                  component={RouterLink}
                  to="/admin/books/add"
                  sx={{ mt: 2 }}
                >
                  Add New Book
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Content Statistics
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Books:
                    </Typography>
                    <Typography variant="h6">
                      1
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Total Pages:
                    </Typography>
                    <Typography variant="h6">
                      100
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Dictionary Entries:
                    </Typography>
                    <Typography variant="h6">
                      2,500
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      AI Prompts:
                    </Typography>
                    <Typography variant="h6">
                      150
                    </Typography>
                  </Grid>
                </Grid>
                <Button
                  variant="outlined"
                  fullWidth
                  component={RouterLink}
                  to="/admin/content"
                >
                  View Content Dashboard
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={RouterLink}
              to="/admin/users"
              sx={{ py: 1.5 }}
            >
              User Management
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={RouterLink}
              to="/admin/services"
              sx={{ py: 1.5 }}
            >
              Service Status
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={RouterLink}
              to="/admin/logs"
              sx={{ py: 1.5 }}
            >
              System Logs
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              component={RouterLink}
              to="/admin/settings"
              sx={{ py: 1.5 }}
            >
              System Settings
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              component={RouterLink}
              to="/proxy-settings"
              sx={{ py: 1.5 }}
            >
              Proxy Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;
