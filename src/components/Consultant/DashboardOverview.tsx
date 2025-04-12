// src/components/Consultant/DashboardOverview.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
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
  ListItemAvatar,
  Button,
  Alert
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import HelpIcon from '@mui/icons-material/Help';
import FeedbackIcon from '@mui/icons-material/Feedback';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import { useConsultant } from '../../contexts/ConsultantContext';
import { getConsultantStats } from '../../services/consultantService';
import { formatRelativeTime } from '../../utils/formatDate';
import { appLog } from '../../components/LogViewer';

interface ConsultantStats {
  totalReaders: number;
  activeReaders: number;
  pendingRequests: number;
  resolvedRequests: number;
  totalFeedback: number;
  recentFeedback: number;
  readerEngagement: {
    high: number;
    medium: number;
    low: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'help_request' | 'feedback' | 'trigger';
    userId: string;
    userName: string;
    timestamp: string;
    description: string;
  }>;
}

const DashboardOverview: React.FC = () => {
  const { assignments, pendingRequests, refreshAssignments, refreshRequests, refreshFeedback } = useConsultant();
  const [stats, setStats] = useState<ConsultantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [assignments, pendingRequests]);

  const loadStats = async () => {
    try {
      setLoading(true);
      appLog('DashboardOverview', 'Loading consultant stats', 'info');
      
      // Get stats from the service
      const consultantStats = await getConsultantStats();
      
      if (consultantStats) {
        setStats(consultantStats);
        appLog('DashboardOverview', 'Consultant stats loaded', 'success');
      } else {
        // If the service fails, create stats from context data
        const fallbackStats: ConsultantStats = {
          totalReaders: assignments.length,
          activeReaders: assignments.filter(a => a.last_active_at && new Date(a.last_active_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
          pendingRequests: pendingRequests.length,
          resolvedRequests: 0,
          totalFeedback: 0,
          recentFeedback: 0,
          readerEngagement: {
            high: Math.floor(assignments.length * 0.3),
            medium: Math.floor(assignments.length * 0.4),
            low: Math.floor(assignments.length * 0.3)
          },
          recentActivity: []
        };
        
        setStats(fallbackStats);
        appLog('DashboardOverview', 'Using fallback stats', 'warning');
      }
    } catch (err) {
      appLog('DashboardOverview', 'Error loading consultant stats', 'error', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshAssignments(),
        refreshRequests(),
        refreshFeedback()
      ]);
      await loadStats();
      appLog('DashboardOverview', 'Dashboard refreshed', 'success');
    } catch (err) {
      appLog('DashboardOverview', 'Error refreshing dashboard', 'error', err);
      setError('Failed to refresh dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Loading dashboard overview...
        </Typography>
      </Box>
    );
  }

  if (error && !stats) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
        <Button size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Reader Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Readers"
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats?.totalReaders || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Total Assigned Readers
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip
                  label={`${stats?.activeReaders || 0} Active`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${(stats?.totalReaders || 0) - (stats?.activeReaders || 0)} Inactive`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Help Request Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Help Requests"
              avatar={
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <HelpIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats?.pendingRequests || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Pending Requests
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip
                  label={`${stats?.resolvedRequests || 0} Resolved`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${stats?.pendingRequests || 0} Pending`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Feedback Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Feedback"
              avatar={
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <FeedbackIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Typography variant="h3" align="center">
                {stats?.totalFeedback || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
                Total Feedback Items
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Chip
                  label={`${stats?.recentFeedback || 0} New`}
                  color="info"
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Engagement Stats */}
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardHeader
              title="Reader Engagement"
              avatar={
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              }
            />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  High Engagement
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats?.readerEngagement.high || 0) / (stats?.totalReaders || 1) * 100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {stats?.readerEngagement.high || 0} readers
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Medium Engagement
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats?.readerEngagement.medium || 0) / (stats?.totalReaders || 1) * 100}
                  color="info"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {stats?.readerEngagement.medium || 0} readers
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" gutterBottom>
                  Low Engagement
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(stats?.readerEngagement.low || 0) / (stats?.totalReaders || 1) * 100}
                  color="warning"
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {stats?.readerEngagement.low || 0} readers
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recent Activity" />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <List>
                  {stats.recentActivity.map((activity) => (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {activity.userName}
                              </Typography>
                              {" — "}
                              {formatRelativeTime(activity.timestamp)}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity to display
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardOverview;
