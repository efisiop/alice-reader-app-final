import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Divider,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BookIcon from '@mui/icons-material/Book';
import FeedbackIcon from '@mui/icons-material/Feedback';
import HelpIcon from '@mui/icons-material/Help';
import ChatIcon from '@mui/icons-material/Chat';
import HistoryIcon from '@mui/icons-material/History';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { useConsultant } from '../../contexts/ConsultantContext';
import { formatRelativeTime } from '../../utils/formatDate';
import { TriggerType } from '../../types/supabase';
import { appLog } from '../../components/LogViewer';

interface ReaderProfileViewProps {
  userId: string;
  onClose: () => void;
}

const ReaderProfileView: React.FC<ReaderProfileViewProps> = ({ userId, onClose }) => {
  const { getUserDetails, createTrigger } = useConsultant();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [triggerDialogOpen, setTriggerDialogOpen] = useState(false);
  const [selectedTriggerType, setSelectedTriggerType] = useState<TriggerType>(TriggerType.ENCOURAGE);
  const [triggerMessage, setTriggerMessage] = useState('');
  const [sendingTrigger, setSendingTrigger] = useState(false);

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      appLog('ReaderProfileView', 'Loading user details', 'info', { userId });
      const details = await getUserDetails(userId);

      if (!details) {
        setError('Failed to load user details');
      } else {
        setUserDetails(details);
      }
    } catch (err: any) {
      appLog('ReaderProfileView', 'Error loading user details', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenTriggerDialog = () => {
    setTriggerDialogOpen(true);
    setSelectedTriggerType(TriggerType.ENCOURAGE);
    setTriggerMessage('');
  };

  const handleCloseTriggerDialog = () => {
    setTriggerDialogOpen(false);
  };

  const handleSendTrigger = async () => {
    setSendingTrigger(true);

    try {
      appLog('ReaderProfileView', 'Sending trigger', 'info', {
        userId, triggerType: selectedTriggerType
      });

      const triggerId = await createTrigger(userId, selectedTriggerType, triggerMessage);

      if (!triggerId) {
        appLog('ReaderProfileView', 'Failed to create trigger', 'error');
      } else {
        appLog('ReaderProfileView', 'Trigger created successfully', 'success', { triggerId });
        handleCloseTriggerDialog();
      }
    } catch (err: any) {
      appLog('ReaderProfileView', 'Error creating trigger', 'error', err);
    } finally {
      setSendingTrigger(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading reader profile...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={onClose}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!userDetails) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No details found for this reader.
        </Alert>
        <Button variant="outlined" onClick={onClose}>
          Go Back
        </Button>
      </Box>
    );
  }

  const { progress, stats, interactions, feedback, helpRequests } = userDetails;
  const user = progress?.user || helpRequests[0]?.user || { first_name: 'Unknown', last_name: 'Reader' };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h5">
              {user.first_name} {user.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {user.email}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenTriggerDialog}
        >
          Send Prompt
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Overview" />
          <Tab label="Feedback" />
          <Tab label="Help Requests" />
          <Tab label="AI Interactions" />
        </Tabs>
        <Divider />

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Reading Progress" />
                  <CardContent>
                    {progress ? (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Current Section:
                          </Typography>
                          <Typography variant="body1">
                            {progress.section?.chapter?.title} - {progress.section?.title}
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Progress:
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={progress.progress_percentage || 0}
                            sx={{ height: 8, borderRadius: 1 }}
                          />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(progress.progress_percentage || 0)}% complete
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Last read: {formatRelativeTime(progress.updated_at)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            label={`Page ${progress.current_page || 1}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {progress.bookmarks && progress.bookmarks.length > 0 && (
                            <Chip
                              label={`${progress.bookmarks.length} Bookmarks`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        No reading progress recorded yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardHeader title="Reading Statistics" />
                  <CardContent>
                    {stats ? (
                      <>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Total Reading Time:
                          </Typography>
                          <Typography variant="body1">
                            {Math.round(stats.total_reading_time / 60)} minutes
                          </Typography>
                        </Box>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Pages Read:
                          </Typography>
                          <Typography variant="body1">
                            {stats.pages_read || 0} pages
                          </Typography>
                        </Box>

                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Last Session:
                          </Typography>
                          <Typography variant="body1">
                            {formatRelativeTime(stats.last_session_date)}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body1" color="text.secondary">
                        No reading statistics recorded yet.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardHeader title="Engagement Summary" />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {feedback.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Feedback Items
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {helpRequests.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Help Requests
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {interactions.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            AI Interactions
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2 }}>
                          <Typography variant="h4" color="primary">
                            {stats?.pages_read || 0}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Pages Read
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Reader Feedback ({feedback.length})
              </Typography>

              {feedback.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  This reader hasn't provided any feedback yet.
                </Typography>
              ) : (
                <List>
                  {feedback.map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          {item.feedback_type === 'AHA_MOMENT' ? (
                            <LightbulbIcon color="success" />
                          ) : item.feedback_type === 'CONFUSION' ? (
                            <HelpIcon color="warning" />
                          ) : (
                            <FeedbackIcon color="info" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                {item.feedback_type === 'AHA_MOMENT' ? 'Aha Moment' :
                                 item.feedback_type === 'CONFUSION' ? 'Confusion' : 'General Feedback'}
                              </Typography>
                              <Chip
                                label={formatRelativeTime(item.created_at)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body1" sx={{ mt: 1 }}>
                                {item.content}
                              </Typography>

                              {item.section && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Section: {item.section.chapter_title} - {item.section.title}
                                </Typography>
                              )}

                              <Box sx={{ display: 'flex', mt: 1 }}>
                                <Chip
                                  label={item.is_public ? 'Public' : 'Private'}
                                  size="small"
                                  color={item.is_public ? 'success' : 'default'}
                                  variant="outlined"
                                  sx={{ mr: 1 }}
                                />
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Help Requests ({helpRequests.length})
              </Typography>

              {helpRequests.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  This reader hasn't made any help requests yet.
                </Typography>
              ) : (
                <List>
                  {helpRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <HelpIcon color={
                            request.status === 'PENDING' ? 'warning' :
                            request.status === 'IN_PROGRESS' ? 'info' : 'success'
                          } />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                Help Request
                              </Typography>
                              <Box>
                                <Chip
                                  label={request.status}
                                  size="small"
                                  color={
                                    request.status === 'PENDING' ? 'warning' :
                                    request.status === 'IN_PROGRESS' ? 'info' : 'success'
                                  }
                                  sx={{ mr: 1 }}
                                />
                                <Chip
                                  label={formatRelativeTime(request.created_at)}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body1" sx={{ mt: 1 }}>
                                {request.content}
                              </Typography>

                              {request.context && (
                                <Paper variant="outlined" sx={{ p: 1, mt: 1, bgcolor: 'background.default' }}>
                                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                                    Selected Text:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                    "{request.context}"
                                  </Typography>
                                </Paper>
                              )}

                              {request.section && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Section: {request.section.chapter_title} - {request.section.title}
                                </Typography>
                              )}

                              {request.consultant && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Assigned to: {request.consultant.first_name} {request.consultant.last_name}
                                </Typography>
                              )}

                              {request.resolved_at && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  Resolved: {formatRelativeTime(request.resolved_at)}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                AI Interactions ({interactions.length})
              </Typography>

              {interactions.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  This reader hasn't interacted with the AI assistant yet.
                </Typography>
              ) : (
                <List>
                  {interactions.map((interaction) => (
                    <React.Fragment key={interaction.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <ChatIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1">
                                AI Interaction
                              </Typography>
                              <Chip
                                label={formatRelativeTime(interaction.created_at)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                User Query:
                              </Typography>
                              <Typography variant="body1" paragraph>
                                {interaction.user_query}
                              </Typography>

                              <Typography variant="body2" color="text.secondary">
                                AI Response:
                              </Typography>
                              <Typography variant="body1">
                                {interaction.ai_response}
                              </Typography>

                              {interaction.section_id && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                  From section: {interaction.section_id}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={onClose}>
          Close Profile
        </Button>
      </Box>

      {/* Trigger Dialog */}
      <Dialog
        open={triggerDialogOpen}
        onClose={handleCloseTriggerDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Prompt to Reader</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Send a prompt to encourage the reader or provide guidance.
          </Typography>

          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Prompt Type:
            </Typography>
            <Tabs
              value={selectedTriggerType}
              onChange={(e, value) => setSelectedTriggerType(value)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                label="Encourage"
                value={TriggerType.ENCOURAGE}
                icon={<LightbulbIcon />}
                iconPosition="start"
              />
              <Tab
                label="Check-in"
                value={TriggerType.CHECK_IN}
                icon={<ChatIcon />}
                iconPosition="start"
              />
              <Tab
                label="Quiz"
                value={TriggerType.QUIZ}
                icon={<HelpIcon />}
                iconPosition="start"
              />
              <Tab
                label="Engagement"
                value={TriggerType.ENGAGEMENT}
                icon={<HistoryIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TextField
            label="Message (optional)"
            multiline
            rows={4}
            fullWidth
            value={triggerMessage}
            onChange={(e) => setTriggerMessage(e.target.value)}
            placeholder="Add a custom message to accompany the prompt..."
            sx={{ mb: 2 }}
          />

          <Alert severity="info" icon={false}>
            <Typography variant="subtitle2" gutterBottom>
              About this prompt type:
            </Typography>
            {selectedTriggerType === TriggerType.ENCOURAGE && (
              <Typography variant="body2">
                Sends an encouraging message to motivate the reader to continue reading or engage more deeply with the text.
              </Typography>
            )}
            {selectedTriggerType === TriggerType.CHECK_IN && (
              <Typography variant="body2">
                Asks the reader how they're finding the book and if they need any assistance.
              </Typography>
            )}
            {selectedTriggerType === TriggerType.QUIZ && (
              <Typography variant="body2">
                Sends a quiz question about recent content to help reinforce understanding.
              </Typography>
            )}
            {selectedTriggerType === TriggerType.ENGAGEMENT && (
              <Typography variant="body2">
                Prompts the reader to engage more with the text through highlighting, notes, or feedback.
              </Typography>
            )}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTriggerDialog} disabled={sendingTrigger}>
            Cancel
          </Button>
          <Button
            onClick={handleSendTrigger}
            variant="contained"
            color="primary"
            disabled={sendingTrigger}
            startIcon={sendingTrigger ? <CircularProgress size={20} /> : null}
          >
            Send Prompt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReaderProfileView;
