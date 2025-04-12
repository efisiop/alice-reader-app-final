import React, { useState } from 'react';
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
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert
} from '@mui/material';
import HelpIcon from '@mui/icons-material/Help';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useConsultant } from '../../contexts/ConsultantContext';
import { HelpRequest, HelpRequestStatus } from '../../types/supabase';
import { formatRelativeTime } from '../../utils/formatDate';
import { appLog } from '../../components/LogViewer';

const HelpRequestsPanel: React.FC = () => {
  const { pendingRequests, assignedRequests, acceptHelpRequest, resolveHelpRequest } = useConsultant();
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReaderId, setSelectedReaderId] = useState<string | null>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewProfile = (readerId: string) => {
    appLog('HelpRequestsPanel', 'View reader profile', 'info', { readerId });
    setSelectedReaderId(readerId);
  };

  const handleCloseProfile = () => {
    setSelectedReaderId(null);
  };

  const handleAcceptRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      appLog('HelpRequestsPanel', 'Accepting help request', 'info', { requestId });
      const success = await acceptHelpRequest(requestId);

      if (!success) {
        setError('Failed to accept the help request. Please try again.');
      }
    } catch (err: any) {
      appLog('HelpRequestsPanel', 'Error accepting help request', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResponseDialog = (request: HelpRequest) => {
    setSelectedRequest(request);
    setResponseText('');
    setResponseDialogOpen(true);
  };

  const handleCloseResponseDialog = () => {
    setResponseDialogOpen(false);
    setSelectedRequest(null);
    setResponseText('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest || !responseText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      appLog('HelpRequestsPanel', 'Resolving help request with response', 'info', {
        requestId: selectedRequest.id
      });

      const success = await resolveHelpRequest(selectedRequest.id);

      if (!success) {
        setError('Failed to resolve the help request. Please try again.');
      } else {
        handleCloseResponseDialog();
      }
    } catch (err: any) {
      appLog('HelpRequestsPanel', 'Error resolving help request', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
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

  const renderRequestList = (requests: HelpRequest[], isPending: boolean) => {
    if (requests.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {isPending
              ? 'No pending help requests at this time.'
              : 'You have no assigned help requests.'}
          </Typography>
        </Box>
      );
    }

    return (
      <List>
        {requests.map((request) => (
          <React.Fragment key={request.id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: isPending ? 'warning.main' : 'primary.main' }}>
                  {isPending ? <HelpIcon /> : <PersonIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box
                      component="span"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => handleViewProfile(request.user_id)}
                    >
                      <Typography variant="subtitle1" component="span">
                        {request.user?.first_name} {request.user?.last_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={formatRelativeTime(request.created_at)}
                      size="small"
                      color="default"
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" color="text.primary" paragraph>
                      {request.content}
                    </Typography>

                    {request.context && (
                      <Paper variant="outlined" sx={{ p: 1, mb: 1, bgcolor: 'background.default' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                          Selected Text:
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                          "{request.context}"
                        </Typography>
                      </Paper>
                    )}

                    {request.section && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Section: {request.section.chapter_title} - {request.section.title}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      {isPending ? (
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={loading}
                        >
                          Accept Request
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          onClick={() => handleOpenResponseDialog(request)}
                          disabled={loading}
                        >
                          Respond & Resolve
                        </Button>
                      )}
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
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
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>Pending Requests</Typography>
                {pendingRequests.length > 0 && (
                  <Chip
                    label={pendingRequests.length}
                    size="small"
                    color="error"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>My Assigned Requests</Typography>
                {assignedRequests.length > 0 && (
                  <Chip
                    label={assignedRequests.length}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            }
          />
        </Tabs>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mt: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress />}

        <Box sx={{ p: 0 }}>
          {tabValue === 0 && renderRequestList(pendingRequests, true)}
          {tabValue === 1 && renderRequestList(assignedRequests, false)}
        </Box>
      </Paper>

      <Dialog
        open={responseDialogOpen}
        onClose={handleCloseResponseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Respond to Help Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Request from {selectedRequest.user?.first_name} {selectedRequest.user?.last_name}:
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body1">
                    {selectedRequest.content}
                  </Typography>

                  {selectedRequest.context && (
                    <Box sx={{ mt: 2, borderLeft: '3px solid', borderColor: 'primary.main', pl: 2 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                        Selected Text:
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        "{selectedRequest.context}"
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>

              <TextField
                label="Your Response"
                multiline
                rows={6}
                fullWidth
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Provide a helpful and encouraging response..."
                sx={{ mb: 2 }}
              />

              <Alert severity="info" icon={<CheckCircleIcon />}>
                <Typography variant="body2">
                  Tips for effective responses:
                  <ul>
                    <li>Be encouraging and supportive</li>
                    <li>Ask guiding questions to help the reader discover insights</li>
                    <li>Provide context that might help with understanding</li>
                    <li>Suggest related passages or themes to explore</li>
                  </ul>
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResponseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitResponse}
            variant="contained"
            color="primary"
            disabled={loading || !responseText.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Send & Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HelpRequestsPanel;
