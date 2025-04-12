// src/components/Consultant/EnhancedHelpRequestsPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Button,
  IconButton,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HelpIcon from '@mui/icons-material/Help';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useConsultant } from '../../contexts/ConsultantContext';
import { HelpRequest, HelpRequestStatus, TriggerType } from '../../types/supabase';
import { formatRelativeTime } from '../../utils/formatDate';
import { appLog } from '../../components/LogViewer';

interface EnhancedHelpRequestsPanelProps {
  onViewReader?: (userId: string) => void;
}

const EnhancedHelpRequestsPanel: React.FC<EnhancedHelpRequestsPanelProps> = ({ onViewReader }) => {
  const theme = useTheme();
  const { 
    pendingRequests, 
    assignedRequests, 
    refreshRequests, 
    acceptHelpRequest, 
    resolveHelpRequest,
    createTrigger
  } = useConsultant();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle accept request
  const handleAcceptRequest = async (request: HelpRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      appLog('EnhancedHelpRequestsPanel', 'Accepting help request', 'info', { requestId: request.id });
      const success = await acceptHelpRequest(request.id);
      
      if (success) {
        appLog('EnhancedHelpRequestsPanel', 'Help request accepted', 'success');
        await refreshRequests();
      } else {
        appLog('EnhancedHelpRequestsPanel', 'Failed to accept help request', 'warning');
        setError('Failed to accept help request');
      }
    } catch (err) {
      appLog('EnhancedHelpRequestsPanel', 'Error accepting help request', 'error', err);
      setError('An error occurred while accepting the help request');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle resolve request
  const handleResolveRequest = async (request: HelpRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      appLog('EnhancedHelpRequestsPanel', 'Resolving help request', 'info', { requestId: request.id });
      const success = await resolveHelpRequest(request.id);
      
      if (success) {
        appLog('EnhancedHelpRequestsPanel', 'Help request resolved', 'success');
        await refreshRequests();
      } else {
        appLog('EnhancedHelpRequestsPanel', 'Failed to resolve help request', 'warning');
        setError('Failed to resolve help request');
      }
    } catch (err) {
      appLog('EnhancedHelpRequestsPanel', 'Error resolving help request', 'error', err);
      setError('An error occurred while resolving the help request');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle open response dialog
  const handleOpenResponseDialog = (request: HelpRequest) => {
    setSelectedRequest(request);
    setResponseMessage('');
    setResponseDialogOpen(true);
  };
  
  // Handle close response dialog
  const handleCloseResponseDialog = () => {
    setResponseDialogOpen(false);
    setSelectedRequest(null);
  };
  
  // Handle send response
  const handleSendResponse = async () => {
    if (!selectedRequest || !responseMessage.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('EnhancedHelpRequestsPanel', 'Sending response to help request', 'info', {
        requestId: selectedRequest.id,
        userId: selectedRequest.user_id
      });
      
      const triggerId = await createTrigger(
        selectedRequest.user_id,
        TriggerType.CONSULTANT_MESSAGE,
        responseMessage
      );
      
      if (triggerId) {
        appLog('EnhancedHelpRequestsPanel', 'Response sent successfully', 'success');
        
        // Resolve the request
        await resolveHelpRequest(selectedRequest.id);
        await refreshRequests();
        
        // Close the dialog
        handleCloseResponseDialog();
      } else {
        appLog('EnhancedHelpRequestsPanel', 'Failed to send response', 'warning');
        setError('Failed to send response');
      }
    } catch (err) {
      appLog('EnhancedHelpRequestsPanel', 'Error sending response', 'error', err);
      setError('An error occurred while sending the response');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle view reader
  const handleViewReader = (userId: string) => {
    if (onViewReader) {
      onViewReader(userId);
    }
  };
  
  // Get status chip
  const getStatusChip = (status: HelpRequestStatus) => {
    switch (status) {
      case HelpRequestStatus.PENDING:
        return <Chip label="Pending" color="warning" size="small" />;
      case HelpRequestStatus.ASSIGNED:
        return <Chip label="Assigned" color="info" size="small" />;
      case HelpRequestStatus.RESOLVED:
        return <Chip label="Resolved" color="success" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  // Render help request list
  const renderHelpRequestList = (requests: HelpRequest[]) => {
    if (requests.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No help requests to display
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
                <Avatar onClick={() => handleViewReader(request.user_id)} sx={{ cursor: 'pointer' }}>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {request.user_id.substring(0, 8)}...
                    </Typography>
                    {getStatusChip(request.status)}
                  </Box>
                }
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      {request.content}
                    </Typography>
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      {formatRelativeTime(request.created_at)}
                    </Typography>
                  </>
                }
              />
              
              <ListItemSecondaryAction>
                {request.status === HelpRequestStatus.PENDING && (
                  <Tooltip title="Accept Request">
                    <IconButton
                      edge="end"
                      color="primary"
                      onClick={() => handleAcceptRequest(request)}
                      disabled={loading}
                    >
                      <AssignmentIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                {request.status === HelpRequestStatus.ASSIGNED && (
                  <>
                    <Tooltip title="Send Response">
                      <IconButton
                        edge="end"
                        color="primary"
                        onClick={() => handleOpenResponseDialog(request)}
                        disabled={loading}
                        sx={{ mr: 1 }}
                      >
                        <SendIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Mark as Resolved">
                      <IconButton
                        edge="end"
                        color="success"
                        onClick={() => handleResolveRequest(request)}
                        disabled={loading}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
    );
  };
  
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Help Requests
        </Typography>
        
        <Button
          size="small"
          onClick={() => refreshRequests()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      <Divider />
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab 
          label={
            <Badge 
              badgeContent={pendingRequests.length} 
              color="error"
              max={99}
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              Pending
            </Badge>
          } 
        />
        <Tab 
          label={
            <Badge 
              badgeContent={assignedRequests.length} 
              color="info"
              max={99}
              sx={{ '& .MuiBadge-badge': { right: -15 } }}
            >
              Assigned
            </Badge>
          } 
        />
      </Tabs>
      
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {tabValue === 0 && renderHelpRequestList(pendingRequests)}
        {tabValue === 1 && renderHelpRequestList(assignedRequests)}
      </Box>
      
      {/* Response Dialog */}
      <Dialog
        open={responseDialogOpen}
        onClose={handleCloseResponseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Response</DialogTitle>
        
        <DialogContent>
          {selectedRequest && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Request:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: theme.palette.background.default }}>
                <Typography variant="body2">
                  {selectedRequest.content}
                </Typography>
              </Paper>
              
              <TextField
                label="Your Response"
                multiline
                rows={4}
                fullWidth
                value={responseMessage}
                onChange={(e) => setResponseMessage(e.target.value)}
                disabled={loading}
                sx={{ mt: 2 }}
              />
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseResponseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendResponse}
            color="primary"
            disabled={loading || !responseMessage.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EnhancedHelpRequestsPanel;
