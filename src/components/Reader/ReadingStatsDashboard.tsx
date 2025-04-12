// src/components/Reader/ReadingStatsDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { getDetailedReadingStats, DetailedReadingStats } from '../../services/statisticsService';
import { appLog } from '../LogViewer';
import { BookId, UserId } from '../../types/idTypes';
import { formatDistanceToNow } from 'date-fns';

interface ReadingStatsDashboardProps {
  userId: string | UserId;
  bookId: string | BookId;
  bookTitle?: string;
  totalPages?: number;
  onRefresh?: () => void;
}

/**
 * A dashboard component for displaying reading statistics
 */
const ReadingStatsDashboard: React.FC<ReadingStatsDashboardProps> = ({
  userId,
  bookId,
  bookTitle = 'Alice in Wonderland',
  totalPages = 100,
  onRefresh
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState<DetailedReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Colors for charts
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    success: theme.palette.success.main,
    warning: theme.palette.warning.main,
    info: theme.palette.info.main,
    error: theme.palette.error.main
  };
  
  // Day names for patterns chart
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Load reading statistics
  useEffect(() => {
    loadStats();
  }, [userId, bookId]);
  
  // Load reading statistics
  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      appLog('ReadingStatsDashboard', 'Loading reading statistics', 'info', { userId, bookId });
      
      const detailedStats = await getDetailedReadingStats(userId, bookId);
      
      if (detailedStats) {
        appLog('ReadingStatsDashboard', 'Reading statistics loaded successfully', 'success');
        setStats(detailedStats);
      } else {
        appLog('ReadingStatsDashboard', 'No reading statistics found', 'info');
        setError('No reading statistics found. Start reading to see your statistics!');
      }
    } catch (error) {
      appLog('ReadingStatsDashboard', 'Error loading reading statistics', 'error', error);
      setError('Failed to load reading statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadStats();
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // Format minutes as hours and minutes
  const formatMinutes = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format short date (for charts)
  const formatShortDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Get estimated completion date
  const getEstimatedCompletionDate = (): string => {
    if (!stats || !stats.pace) return 'Unknown';
    
    const date = new Date(stats.pace.estimatedCompletionDate);
    
    // If the date is in the past, return "Completed"
    if (date < new Date()) {
      return 'Completed';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  // Render loading state
  if (loading && !stats) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading reading statistics...
        </Typography>
      </Box>
    );
  }
  
  // Render error state
  if (error && !stats) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {error}
        <Button size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
          Refresh
        </Button>
      </Alert>
    );
  }
  
  // Render empty state
  if (!stats) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No reading statistics available. Start reading to see your statistics!
        <Button size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
          Refresh
        </Button>
      </Alert>
    );
  }
  
  // Prepare data for charts
  const trendsData = stats.trends.map(trend => ({
    date: formatShortDate(trend.date),
    minutes: trend.totalTime,
    pages: trend.totalPages
  }));
  
  const patternsData = stats.patterns.map(pattern => ({
    day: dayNames[pattern.dayOfWeek],
    minutes: pattern.averageTime
  }));
  
  const progressData = [
    { name: 'Read', value: stats.pages_read },
    { name: 'Remaining', value: totalPages - stats.pages_read }
  ];
  
  return (
    <Box sx={{ mt: 2 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Reading Statistics: {bookTitle}
        </Typography>
        
        <Button
          variant="outlined"
          size="small"
          onClick={handleRefresh}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Refresh
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Progress Overview */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Progress"
              avatar={
                <Avatar sx={{ bgcolor: colors.primary }}>
                  <MenuBookIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats.percentage_complete || 0}%
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Complete
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={stats.percentage_complete || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip
                  label={`${stats.pages_read || 0} pages read`}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${totalPages - (stats.pages_read || 0)} pages left`}
                  color="secondary"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reading Time */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Reading Time"
              avatar={
                <Avatar sx={{ bgcolor: colors.secondary }}>
                  <AccessTimeIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="h3" align="center">
                {formatMinutes(Math.round(stats.total_reading_time / 60))}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Total Reading Time
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Avg. Session:
                  </Typography>
                  <Typography variant="body1">
                    {formatMinutes(stats.averageSessionDuration || 0)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Sessions:
                  </Typography>
                  <Typography variant="body1">
                    {stats.totalSessions || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reading Pace */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Reading Pace"
              avatar={
                <Avatar sx={{ bgcolor: colors.success }}>
                  <SpeedIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats.pace?.pagesPerHour.toFixed(1) || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Pages Per Hour
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Time Per Page:
                  </Typography>
                  <Typography variant="body1">
                    {stats.pace?.minutesPerPage.toFixed(1) || 0} min
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Completion:
                  </Typography>
                  <Typography variant="body1">
                    {getEstimatedCompletionDate()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reading Streak */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Reading Streak"
              avatar={
                <Avatar sx={{ bgcolor: colors.warning }}>
                  <LocalFireDepartmentIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats.streakDays || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Day{stats.streakDays !== 1 ? 's' : ''} in a Row
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Longest Streak:
                  </Typography>
                  <Typography variant="body1">
                    {stats.longestStreak || 0} day{stats.longestStreak !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Session:
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(stats.last_session_date)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reading Trends Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Reading Trends (Last 7 Days)" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" orientation="left" stroke={colors.primary} />
                  <YAxis yAxisId="right" orientation="right" stroke={colors.secondary} />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="minutes"
                    name="Minutes Read"
                    stroke={colors.primary}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="pages"
                    name="Pages Read"
                    stroke={colors.secondary}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reading Patterns Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Reading Patterns by Day" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={patternsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="minutes"
                    name="Avg. Minutes Read"
                    fill={colors.info}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Progress Pie Chart */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardHeader title="Progress Breakdown" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={progressData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell key="read" fill={colors.success} />
                    <Cell key="remaining" fill={colors.error} />
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Sessions */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardHeader title="Recent Reading Sessions" />
            <Divider />
            <CardContent sx={{ height: 300, overflow: 'auto' }}>
              {stats.sessions.length > 0 ? (
                <List>
                  {stats.sessions.slice(0, 7).map((session, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <CalendarTodayIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={formatDate(session.date)}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="text.primary">
                                {formatMinutes(session.duration)}
                              </Typography>
                              {" — "}
                              <Typography component="span" variant="body2">
                                {session.pagesRead} pages read
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                      {index < stats.sessions.slice(0, 7).length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body2" color="text.secondary">
                    No reading sessions recorded yet.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Reading Achievements */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardHeader title="Reading Achievements" />
            <Divider />
            <CardContent sx={{ height: 300, overflow: 'auto' }}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: stats.pages_read >= 1 ? colors.success : 'action.disabled' }}>
                      <MenuBookIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="First Page"
                    secondary="Read your first page"
                  />
                  {stats.pages_read >= 1 && (
                    <Chip
                      label="Achieved"
                      color="success"
                      size="small"
                    />
                  )}
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: stats.pages_read >= 10 ? colors.success : 'action.disabled' }}>
                      <MenuBookIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Bookworm"
                    secondary="Read 10 pages"
                  />
                  {stats.pages_read >= 10 && (
                    <Chip
                      label="Achieved"
                      color="success"
                      size="small"
                    />
                  )}
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: stats.streakDays >= 3 ? colors.success : 'action.disabled' }}>
                      <LocalFireDepartmentIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Consistent Reader"
                    secondary="Read 3 days in a row"
                  />
                  {stats.streakDays >= 3 && (
                    <Chip
                      label="Achieved"
                      color="success"
                      size="small"
                    />
                  )}
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: stats.total_reading_time / 60 >= 60 ? colors.success : 'action.disabled' }}>
                      <AccessTimeIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Dedicated Reader"
                    secondary="Read for 1 hour total"
                  />
                  {stats.total_reading_time / 60 >= 60 && (
                    <Chip
                      label="Achieved"
                      color="success"
                      size="small"
                    />
                  )}
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: stats.percentage_complete >= 50 ? colors.success : 'action.disabled' }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Halfway There"
                    secondary="Reach 50% completion"
                  />
                  {stats.percentage_complete >= 50 && (
                    <Chip
                      label="Achieved"
                      color="success"
                      size="small"
                    />
                  )}
                </ListItem>
                <Divider variant="inset" component="li" />
                
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: stats.percentage_complete >= 100 ? colors.success : 'action.disabled' }}>
                      <EmojiEventsIcon />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Finisher"
                    secondary="Complete the book"
                  />
                  {stats.percentage_complete >= 100 && (
                    <Chip
                      label="Achieved"
                      color="success"
                      size="small"
                    />
                  )}
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReadingStatsDashboard;
