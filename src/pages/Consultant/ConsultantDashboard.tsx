// src/pages/Consultant/ConsultantDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Badge,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import HelpIcon from '@mui/icons-material/Help';
import FeedbackIcon from '@mui/icons-material/Feedback';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import { useConsultantService, useAnalyticsService } from '../../hooks/useService';
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
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

const ConsultantDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { service: consultantService, loading: consultantLoading } = useConsultantService();
  const { service: analyticsService } = useAnalyticsService();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'ConsultantDashboard'
  });
  
  // Load dashboard data
  useEffect(() => {
    if (!consultantService || !user) return;
    
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const startTime = performance.now();
        const data = await consultantService.getDashboardData(user.id);
        
        // In a real app, we would use the actual data from the service
        // For now, we'll use mock data
        setDashboardData({
          assignedReaders: [
            { id: 'r1', name: 'Leo Johnson', progress: 35, lastActive: '2 hours ago', status: 'active' },
            { id: 'r2', name: 'Sarah Williams', progress: 68, lastActive: '1 day ago', status: 'inactive' },
            { id: 'r3', name: 'Michael Brown', progress: 12, lastActive: '3 hours ago', status: 'active' }
          ],
          helpRequests: [
            { id: 'h1', reader: 'Leo Johnson', question: 'I don\'t understand why the Queen wants to cut off heads?', status: 'pending', time: '30 minutes ago' },
            { id: 'h2', reader: 'Michael Brown', question: 'What does "curiouser and curiouser" mean?', status: 'pending', time: '2 hours ago' }
          ],
          feedback: [
            { id: 'f1', reader: 'Sarah Williams', type: 'Aha! Moment', content: 'I finally understand the symbolism of the rabbit hole!', rating: 5, time: '1 day ago' },
            { id: 'f2', reader: 'Leo Johnson', type: 'Positive Experience', content: 'The AI assistant helped me understand the Mad Hatter\'s character.', rating: 4, time: '3 days ago' }
          ],
          stats: {
            totalReaders: 3,
            activeReaders: 2,
            pendingHelpRequests: 2,
            resolvedHelpRequests: 5,
            feedbackCount: 8,
            promptsSent: 12
          },
          ...data // Overwrite with any real data we might have
        });
        
        // Track page view
        if (analyticsService) {
          analyticsService.trackPageView('consultant_dashboard', {
            userId: user.id
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        
        // Track error
        if (analyticsService) {
          analyticsService.trackEvent('consultant_dashboard_error', {
            error: String(error)
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
  }, [consultantService, user, analyticsService]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Track tab change
    if (analyticsService) {
      analyticsService.trackEvent('consultant_tab_change', {
        tabIndex: newValue
      });
    }
  };
  
  if (loading || consultantLoading) {
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
  
  if (!profile?.is_consultant) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          You don't have consultant access.
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Consultant Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and assist your assigned readers
          </Typography>
        </Box>
        
        <Box>
          <IconButton color="primary" sx={{ mr: 2 }}>
            <Badge badgeContent={dashboardData.helpRequests.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/consultant/help-requests"
            startIcon={<HelpIcon />}
          >
            Help Requests
          </Button>
        </Box>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Assigned Readers',
            value: dashboardData.stats.totalReaders,
            secondary: `${dashboardData.stats.activeReaders} active`,
            icon: <PeopleIcon sx={{ fontSize: 40 }} />,
            color: 'primary.main',
            link: '/consultant/readers'
          },
          {
            title: 'Help Requests',
            value: dashboardData.stats.pendingHelpRequests,
            secondary: `${dashboardData.stats.resolvedHelpRequests} resolved`,
            icon: <HelpIcon sx={{ fontSize: 40 }} />,
            color: 'error.main',
            link: '/consultant/help-requests'
          },
          {
            title: 'Reader Feedback',
            value: dashboardData.stats.feedbackCount,
            secondary: 'Last 7 days',
            icon: <FeedbackIcon sx={{ fontSize: 40 }} />,
            color: 'success.main',
            link: '/consultant/feedback'
          },
          {
            title: 'Prompts Sent',
            value: dashboardData.stats.promptsSent,
            secondary: 'Last 7 days',
            icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
            color: 'info.main',
            link: '/consultant/prompts'
          }
        ].map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              elevation={2} 
              sx={{ 
                p: 3, 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: card.color, mr: 2 }}>
                  {card.icon}
                </Avatar>
                <Typography variant="h6">
                  {card.title}
                </Typography>
              </Box>
              
              <Typography variant="h3" sx={{ mb: 1 }}>
                {card.value}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {card.secondary}
              </Typography>
              
              <Box sx={{ mt: 'auto' }}>
                <Button 
                  component={RouterLink} 
                  to={card.link}
                  size="small"
                >
                  View Details
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Dashboard Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Assigned Readers" />
          <Tab label="Help Requests" />
          <Tab label="Recent Feedback" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <List>
            {dashboardData.assignedReaders.map((reader: any) => (
              <ListItem 
                key={reader.id}
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  boxShadow: 1
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {reader.name}
                      <Chip 
                        label={reader.status === 'active' ? 'Active' : 'Inactive'} 
                        color={reader.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2">
                        Progress: {reader.progress}% • Last active: {reader.lastActive}
                      </Typography>
                    </>
                  }
                />
                <Button 
                  variant="outlined" 
                  size="small"
                  component={RouterLink}
                  to={`/consultant/readers/${reader.id}`}
                >
                  View Profile
                </Button>
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/consultant/readers"
            >
              View All Readers
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <List>
            {dashboardData.helpRequests.map((request: any) => (
              <ListItem 
                key={request.id}
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  boxShadow: 1
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {request.reader}
                      </Typography>
                      <Chip 
                        label={request.status} 
                        color={request.status === 'pending' ? 'error' : 'success'}
                        size="small"
                        sx={{ ml: 2 }}
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                        {request.time}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      "{request.question}"
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/consultant/help-requests"
              color="error"
            >
              Respond to Help Requests
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <List>
            {dashboardData.feedback.map((feedback: any) => (
              <ListItem 
                key={feedback.id}
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 2,
                  boxShadow: 1
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {feedback.reader}
                      </Typography>
                      <Chip 
                        label={feedback.type} 
                        color="primary"
                        size="small"
                        sx={{ ml: 2 }}
                      />
                      <Box sx={{ ml: 2 }}>
                        {Array(feedback.rating).fill(0).map((_, i) => (
                          <span key={i} role="img" aria-label="star">⭐</span>
                        ))}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                        {feedback.time}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      "{feedback.content}"
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/consultant/feedback"
              color="primary"
            >
              View All Feedback
            </Button>
          </Box>
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
              to="/consultant/send-prompt"
              sx={{ py: 1.5 }}
            >
              Send Subtle Prompt
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth
              component={RouterLink}
              to="/consultant/reading-insights"
              sx={{ py: 1.5 }}
            >
              Generate Insights
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth
              component={RouterLink}
              to="/consultant/assign-readers"
              sx={{ py: 1.5 }}
            >
              Assign Readers
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              fullWidth
              component={RouterLink}
              to="/consultant/reports"
              sx={{ py: 1.5 }}
            >
              Generate Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ConsultantDashboard;
