import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getUserReadingDetails } from '../../services/consultantService';
import { appLog } from '../../components/LogViewer';

interface ReaderDetails {
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_verified: boolean;
    book_verified: boolean;
    created_at: string;
  };
  progress: {
    section: {
      title: string;
      chapter: {
        title: string;
        number: number;
      };
    };
    last_read_at: string;
  };
  stats: {
    total_reading_time: number;
    pages_read: number;
    sections_completed: number;
    last_active: string;
  };
  interactions: Array<{
    id: string;
    type: string;
    content: string;
    created_at: string;
  }>;
  feedback: Array<{
    id: string;
    content: string;
    feedback_type: string;
    created_at: string;
    section?: {
      title: string;
      chapter?: {
        title: string;
      };
    };
  }>;
  helpRequests: Array<{
    id: string;
    content: string;
    status: string;
    created_at: string;
    section?: {
      title: string;
      chapter?: {
        title: string;
      };
    };
  }>;
}

export const ReaderProfileView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readerDetails, setReaderDetails] = useState<ReaderDetails | null>(null);

  useEffect(() => {
    const fetchReaderDetails = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        appLog('ReaderProfileView', `Fetching details for user ${userId}`, 'info');
        const details = await getUserReadingDetails(userId);
        setReaderDetails(details);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch reader details';
        setError(message);
        appLog('ReaderProfileView', `Error fetching reader details: ${message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReaderDetails();
  }, [userId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !readerDetails) {
    return (
      <Box p={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/consultant-dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Reader List
        </Button>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Failed to load reader details'}
        </Alert>
      </Box>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Box p={3}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/consultant-dashboard')}
        sx={{ mb: 2 }}
      >
        Back to Reader List
      </Button>

      {/* Profile Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Reader Profile
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Name:</strong> {readerDetails.profile.first_name} {readerDetails.profile.last_name}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {readerDetails.profile.email}
              </Typography>
              <Typography variant="body1">
                <strong>Joined:</strong> {formatDate(readerDetails.profile.created_at)}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1">
                <strong>Account Verified:</strong> {readerDetails.profile.is_verified ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body1">
                <strong>Book Access Verified:</strong> {readerDetails.profile.book_verified ? 'Yes' : 'No'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reading Progress */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Reading Progress
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {readerDetails.progress ? (
                <>
                  <Typography variant="body1">
                    <strong>Current Chapter:</strong> {readerDetails.progress.section.chapter.title}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Current Section:</strong> {readerDetails.progress.section.title}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Last Read:</strong> {formatDate(readerDetails.progress.last_read_at)}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No reading progress recorded yet
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              {readerDetails.stats ? (
                <>
                  <Typography variant="body1">
                    <strong>Total Reading Time:</strong> {formatDuration(readerDetails.stats.total_reading_time)}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Pages Read:</strong> {readerDetails.stats.pages_read}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Sections Completed:</strong> {readerDetails.stats.sections_completed}
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No reading statistics available
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Recent Activity
          </Typography>
          
          {/* Help Requests */}
          <Typography variant="h6" gutterBottom>
            Help Requests
          </Typography>
          <List>
            {readerDetails.helpRequests.length > 0 ? (
              readerDetails.helpRequests.map(request => (
                <React.Fragment key={request.id}>
                  <ListItem>
                    <ListItemText
                      primary={request.content}
                      secondary={`${request.status} - ${formatDate(request.created_at)}${
                        request.section ? ` - ${request.section.chapter?.title}, ${request.section.title}` : ''
                      }`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No help requests" />
              </ListItem>
            )}
          </List>

          {/* Feedback */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Feedback
          </Typography>
          <List>
            {readerDetails.feedback.length > 0 ? (
              readerDetails.feedback.map(item => (
                <React.Fragment key={item.id}>
                  <ListItem>
                    <ListItemText
                      primary={item.content}
                      secondary={`${item.feedback_type} - ${formatDate(item.created_at)}${
                        item.section ? ` - ${item.section.chapter?.title}, ${item.section.title}` : ''
                      }`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No feedback provided" />
              </ListItem>
            )}
          </List>

          {/* Recent Interactions */}
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Recent Interactions
          </Typography>
          <List>
            {readerDetails.interactions.length > 0 ? (
              readerDetails.interactions.map(interaction => (
                <React.Fragment key={interaction.id}>
                  <ListItem>
                    <ListItemText
                      primary={interaction.content}
                      secondary={`${interaction.type} - ${formatDate(interaction.created_at)}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText primary="No recent interactions" />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}; 