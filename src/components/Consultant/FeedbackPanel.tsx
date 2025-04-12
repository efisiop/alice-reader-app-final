import React, { useState, useEffect } from 'react';
import ReaderProfileView from './ReaderProfileView';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { getAllFeedback } from '../../services/consultantService';
import { UserFeedback, FeedbackType } from '../../types/supabase';
import { formatRelativeTime } from '../../utils/formatDate';
import { appLog } from '../../components/LogViewer';

const FeedbackPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [feedback, setFeedback] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [selectedReaderId, setSelectedReaderId] = useState<string | null>(null);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);

    try {
      appLog('FeedbackPanel', 'Loading all feedback', 'info');
      const data = await getAllFeedback();

      appLog('FeedbackPanel', `Loaded ${data?.length || 0} feedback items`, 'success');
      setFeedback(data || []);
    } catch (err: any) {
      appLog('FeedbackPanel', 'Error in loadFeedback', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (readerId: string) => {
    appLog('FeedbackPanel', 'View reader profile', 'info', { readerId });
    setSelectedReaderId(readerId);
  };

  const handleCloseProfile = () => {
    setSelectedReaderId(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, feedbackId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedFeedbackId(feedbackId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedFeedbackId(null);
  };

  const getFeedbackIcon = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return <LightbulbIcon sx={{ color: 'success.main' }} />;
      case FeedbackType.CONFUSION:
        return <HelpOutlineIcon sx={{ color: 'warning.main' }} />;
      default:
        return <FeedbackIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getFeedbackTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return 'Aha Moment';
      case FeedbackType.CONFUSION:
        return 'Confusion';
      default:
        return 'General Feedback';
    }
  };

  const getFeedbackTypeColor = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return 'success';
      case FeedbackType.CONFUSION:
        return 'warning';
      default:
        return 'default';
    }
  };

  // If a reader profile is selected, show that instead
  if (selectedReaderId) {
    return (
      <ReaderProfileView
        userId={selectedReaderId}
        onClose={handleCloseProfile}
      />
    );
  }

  const renderFeedbackList = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        </Box>
      );
    }

    if (feedback.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No feedback available at this time.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {feedback.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Card variant="outlined">
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 }
                    }}
                    onClick={() => handleViewProfile(item.user_id)}
                  >
                    {item.user?.first_name?.charAt(0) || 'U'}
                  </Avatar>
                }
                action={
                  <IconButton
                    aria-label="settings"
                    onClick={(e) => handleMenuOpen(e, item.id)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                }
                title={
                  <Box
                    component="span"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => handleViewProfile(item.user_id)}
                  >
                    {item.user?.first_name || 'Anonymous'} {item.user?.last_name || ''}
                  </Box>
                }
                subheader={formatRelativeTime(item.created_at)}
              />
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {getFeedbackIcon(item.feedback_type as FeedbackType)}
                  <Chip
                    label={getFeedbackTypeLabel(item.feedback_type as FeedbackType)}
                    size="small"
                    color={getFeedbackTypeColor(item.feedback_type as FeedbackType) as any}
                    sx={{ ml: 1 }}
                  />
                  {item.section && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                      {item.section.chapter_title}
                    </Typography>
                  )}
                </Box>

                <Typography variant="body1" paragraph>
                  {item.content}
                </Typography>

                {item.section && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Section: {item.section.title}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box>
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Feedback" />
          <Tab label="Aha Moments" />
          <Tab label="Confusion Points" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {renderFeedbackList()}
        </Box>
      </Paper>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>
          Respond to Feedback
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Mark as Featured
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          Hide from Public
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default FeedbackPanel;
