// src/pages/Reader/ReaderStatistics.tsx
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
  Tabs,
  Tab,
  useTheme
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useBookService, useStatisticsService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for visualization - in a real app, this would come from the statistics service
const mockReadingData = {
  dailyReadingTime: [15, 25, 10, 30, 20, 35, 15],
  weeklyProgress: [5, 12, 8, 15, 10, 20, 18],
  pagesPerSession: [3, 5, 2, 7, 4, 8, 3],
  readingSpeed: [120, 130, 110, 140, 125, 135, 130], // words per minute
  daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  vocabularyGrowth: [5, 8, 12, 15, 18, 22, 25],
  aiInteractions: [2, 1, 3, 0, 2, 4, 1]
};

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
      id={`stats-tabpanel-${index}`}
      aria-labelledby={`stats-tab-${index}`}
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

const ReaderStatistics: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { service: bookService, loading: bookLoading } = useBookService();
  const { service: statisticsService, loading: statsLoading } = useStatisticsService();
  const { service: analyticsService } = useAnalyticsService();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'ReaderStatistics'
  });
  
  // Load statistics
  useEffect(() => {
    if (!statisticsService || !user) return;
    
    const loadStatistics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const startTime = performance.now();
        const stats = await statisticsService.getReadingStatistics(user.id, 'alice-in-wonderland');
        
        // In a real app, we would use the actual stats from the service
        // For now, we'll use mock data
        setStatistics({
          ...mockReadingData,
          totalReadingTime: 150, // minutes
          totalPagesRead: 68,
          totalChaptersCompleted: 3,
          averageReadingSpeed: 130, // words per minute
          vocabularyLookups: 25,
          aiAssistantUsage: 12,
          lastReadDate: new Date().toISOString(),
          ...stats // Overwrite with any real data we might have
        });
        
        // Track page view
        if (analyticsService) {
          analyticsService.trackPageView('reader_statistics', {
            userId: user.id,
            bookId: 'alice-in-wonderland'
          });
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
        setError('Failed to load reading statistics. Please try again.');
        
        // Track error
        if (analyticsService) {
          analyticsService.trackEvent('statistics_error', {
            error: String(error)
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadStatistics();
  }, [statisticsService, user, analyticsService]);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Track tab change
    if (analyticsService) {
      analyticsService.trackEvent('statistics_tab_change', {
        tabIndex: newValue
      });
    }
  };
  
  if (loading || bookLoading || statsLoading) {
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
          component={RouterLink} 
          to="/reader"
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reading Statistics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your reading progress and habits
        </Typography>
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Reading Time',
            value: `${statistics.totalReadingTime} mins`,
            icon: <TimerIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
            color: theme.palette.primary.light
          },
          {
            title: 'Pages Read',
            value: `${statistics.totalPagesRead} pages`,
            icon: <MenuBookIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />,
            color: theme.palette.secondary.light
          },
          {
            title: 'Reading Speed',
            value: `${statistics.averageReadingSpeed} wpm`,
            icon: <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.success.main }} />,
            color: theme.palette.success.light
          },
          {
            title: 'Last Read',
            value: new Date(statistics.lastReadDate).toLocaleDateString(),
            icon: <CalendarTodayIcon sx={{ fontSize: 40, color: theme.palette.info.main }} />,
            color: theme.palette.info.light
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
                alignItems: 'center',
                textAlign: 'center',
                bgcolor: card.color,
                borderRadius: 2
              }}
            >
              <Box sx={{ mb: 2 }}>
                {card.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {card.title}
              </Typography>
              <Typography variant="h4">
                {card.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Detailed Statistics */}
      <Paper sx={{ mb: 4, borderRadius: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Reading Activity" />
          <Tab label="Vocabulary" />
          <Tab label="AI Assistance" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Daily Reading Time
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  height: 300, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  [Bar Chart Visualization]
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Reading Progress
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  height: 300, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  [Line Chart Visualization]
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Reading Habits
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="primary">
                        {statistics.totalChaptersCompleted}
                      </Typography>
                      <Typography variant="body1">
                        Chapters Completed
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="primary">
                        {Math.round(statistics.totalPagesRead / 7)}
                      </Typography>
                      <Typography variant="body1">
                        Pages Per Day
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="primary">
                        {Math.round(statistics.totalReadingTime / statistics.totalPagesRead)}
                      </Typography>
                      <Typography variant="body1">
                        Minutes Per Page
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Vocabulary Growth
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  height: 300, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  [Line Chart Visualization]
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Most Looked Up Words
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  height: 300, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  [Word Cloud Visualization]
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Vocabulary Summary
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="secondary">
                        {statistics.vocabularyLookups}
                      </Typography>
                      <Typography variant="body1">
                        Words Looked Up
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="secondary">
                        {Math.round(statistics.vocabularyLookups * 0.8)}
                      </Typography>
                      <Typography variant="body1">
                        Unique Words
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="secondary">
                        {Math.round(statistics.vocabularyLookups / statistics.totalPagesRead * 10) / 10}
                      </Typography>
                      <Typography variant="body1">
                        Lookups Per Page
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                AI Assistant Usage
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  height: 300, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  [Bar Chart Visualization]
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Common AI Questions
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3, 
                  height: 300, 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  [Topic Visualization]
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                AI Assistance Summary
              </Typography>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 3
                }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="info.main">
                        {statistics.aiAssistantUsage}
                      </Typography>
                      <Typography variant="body1">
                        AI Interactions
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="info.main">
                        {Math.round(statistics.aiAssistantUsage * 0.7)}
                      </Typography>
                      <Typography variant="body1">
                        Questions Asked
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h3" color="info.main">
                        {Math.round(statistics.aiAssistantUsage * 0.3)}
                      </Typography>
                      <Typography variant="body1">
                        Help Requests
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button 
          variant="contained" 
          component={RouterLink} 
          to="/reader"
          startIcon={<HomeIcon />}
          sx={{ mr: 2 }}
        >
          Return to Dashboard
        </Button>
        <Button 
          variant="outlined" 
          component={RouterLink} 
          to="/reader/alice-in-wonderland/page/1"
          startIcon={<MenuBookIcon />}
        >
          Continue Reading
        </Button>
      </Box>
    </Box>
  );
};

export default ReaderStatistics;
