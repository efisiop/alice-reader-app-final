// src/pages/Consultant/HelpRequests.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  TextField,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
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

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const HelpRequests: React.FC = () => {
  const { user } = useAuth();
  const { service: consultantService, loading: consultantLoading } = useConsultantService();
  const { service: analyticsService } = useAnalyticsService();
  const query = useQuery();
  const readerFilter = query.get('reader');
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [helpRequests, setHelpRequests] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseType, setResponseType] = useState('text');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'HelpRequests'
  });
  
  // Load help requests
  useEffect(() => {
    if (!consultantService || !user) return;
    
    const loadHelpRequests = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const startTime = performance.now();
        const data = await consultantService.getHelpRequests(user.id);
        
        // In a real app, we would use the actual data from the service
        // For now, we'll use mock data
        const mockHelpRequests = [
          { 
            id: 'h1', 
            reader: { id: 'r1', name: 'Leo Johnson', avatar: null },
            question: 'I don\'t understand why the Queen wants to cut off heads?', 
            context: 'Chapter 8: The Queen\'s Croquet Ground',
            status: 'pending', 
            created_at: '2023-06-15T10:30:00Z',
            book_page: 45,
            priority: 'high'
          },
          { 
            id: 'h2', 
            reader: { id: 'r3', name: 'Michael Brown', avatar: null },
            question: 'What does "curiouser and curiouser" mean?', 
            context: 'Chapter 2: The Pool of Tears',
            status: 'pending', 
            created_at: '2023-06-15T08:15:00Z',
            book_page: 12,
            priority: 'medium'
          },
          { 
            id: 'h3', 
            reader: { id: 'r5', name: 'James Wilson', avatar: null },
            question: 'Why is the Cheshire Cat always smiling?', 
            context: 'Chapter 6: Pig and Pepper',
            status: 'resolved', 
            created_at: '2023-06-14T14:45:00Z',
            resolved_at: '2023-06-14T15:20:00Z',
            response: 'The Cheshire Cat\'s smile is a symbol of enigmatic knowledge. In the story, it represents the mysterious and sometimes nonsensical nature of Wonderland. The cat appears and disappears at will, but its smile remains, suggesting that in Wonderland, nothing is quite as it seems.',
            book_page: 32,
            priority: 'medium'
          },
          { 
            id: 'h4', 
            reader: { id: 'r2', name: 'Sarah Williams', avatar: null },
            question: 'What is the significance of the "Drink Me" bottle?', 
            context: 'Chapter 1: Down the Rabbit Hole',
            status: 'resolved', 
            created_at: '2023-06-13T09:30:00Z',
            resolved_at: '2023-06-13T10:15:00Z',
            response: 'The "Drink Me" bottle represents Alice\'s willingness to embrace the unknown. By drinking from it, she shows her curiosity and adaptability, key themes in the story. The resulting size change is also a metaphor for the confusing transitions of childhood to adulthood.',
            book_page: 5,
            priority: 'low'
          },
          { 
            id: 'h5', 
            reader: { id: 'r1', name: 'Leo Johnson', avatar: null },
            question: 'Why is the Mad Hatter mad?', 
            context: 'Chapter 7: A Mad Tea-Party',
            status: 'resolved', 
            created_at: '2023-06-12T16:20:00Z',
            resolved_at: '2023-06-12T17:00:00Z',
            response: 'The term "mad as a hatter" comes from the 19th century when hat makers often suffered from mercury poisoning due to the hat-making process, causing neurological damage. Carroll used this common phrase to create his eccentric character. In the story, the Hatter is "mad" because he\'s stuck in a perpetual tea time due to his quarrel with Time.',
            book_page: 38,
            priority: 'medium'
          }
        ];
        
        // Filter by reader if specified
        let filteredRequests = mockHelpRequests;
        if (readerFilter) {
          filteredRequests = mockHelpRequests.filter(req => req.reader.id === readerFilter);
          // If filtering by reader, show all requests regardless of status
          setTabValue(2);
        }
        
        setHelpRequests(data?.helpRequests || filteredRequests);
        
        // Track page view
        if (analyticsService) {
          analyticsService.trackPageView('help_requests', {
            userId: user.id,
            readerFilter: readerFilter || 'none'
          });
        }
      } catch (error) {
        console.error('Error loading help requests:', error);
        setError('Failed to load help requests. Please try again.');
        
        // Track error
        if (analyticsService) {
          analyticsService.trackEvent('help_requests_error', {
            error: String(error)
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadHelpRequests();
  }, [consultantService, user, analyticsService, readerFilter]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Track tab change
    if (analyticsService) {
      analyticsService.trackEvent('help_requests_tab_change', {
        tabIndex: newValue
      });
    }
  };
  
  // Handle response type change
  const handleResponseTypeChange = (event: SelectChangeEvent) => {
    setResponseType(event.target.value);
  };
  
  // Open response dialog
  const handleOpenDialog = (request: any) => {
    setSelectedRequest(request);
    setResponseText('');
    setResponseType('text');
    setDialogOpen(true);
    
    // Track dialog open
    if (analyticsService) {
      analyticsService.trackEvent('help_request_response_start', {
        requestId: request.id,
        readerId: request.reader.id
      });
    }
  };
  
  // Close response dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRequest(null);
  };
  
  // Submit response
  const handleSubmitResponse = async () => {
    if (!selectedRequest || !responseText.trim() || !consultantService) return;
    
    setSubmitting(true);
    
    try {
      const startTime = performance.now();
      await consultantService.respondToHelpRequest(selectedRequest.id, {
        response: responseText,
        responseType: responseType
      });
      
      // Update local state
      setHelpRequests(prev => prev.map(req => 
        req.id === selectedRequest.id 
          ? { 
              ...req, 
              status: 'resolved', 
              response: responseText,
              resolved_at: new Date().toISOString()
            } 
          : req
      ));
      
      // Track response
      if (analyticsService) {
        analyticsService.trackEvent('help_request_response_submit', {
          requestId: selectedRequest.id,
          readerId: selectedRequest.reader.id,
          responseType: responseType,
          timeToComplete: performance.now() - startTime
        });
      }
      
      // Close dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Error submitting response:', error);
      
      // Track error
      if (analyticsService) {
        analyticsService.trackEvent('help_request_response_error', {
          requestId: selectedRequest.id,
          error: String(error)
        });
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get filtered requests based on tab
  const getFilteredRequests = () => {
    if (tabValue === 0) {
      return helpRequests.filter(req => req.status === 'pending');
    } else if (tabValue === 1) {
      return helpRequests.filter(req => req.status === 'resolved');
    } else {
      return helpRequests;
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
  
  const filteredRequests = getFilteredRequests();
  
  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <Button 
          component={RouterLink} 
          to="/consultant"
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Dashboard
        </Button>
        <Typography variant="h4">
          Help Requests
          {readerFilter && ' (Filtered by Reader)'}
        </Typography>
      </Box>
      
      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
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
                Pending
                <Chip 
                  label={helpRequests.filter(req => req.status === 'pending').length} 
                  color="error"
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            } 
          />
          <Tab label="Resolved" />
          <Tab label="All Requests" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          {filteredRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No pending help requests
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredRequests.map((request) => (
                <ListItem 
                  key={request.id}
                  sx={{ 
                    mb: 2, 
                    p: 3, 
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
                        <Typography variant="subtitle1">
                          {request.reader.name}
                        </Typography>
                        <Chip 
                          label={request.priority} 
                          color={
                            request.priority === 'high' 
                              ? 'error' 
                              : request.priority === 'medium' 
                                ? 'warning' 
                                : 'info'
                          }
                          size="small"
                          sx={{ ml: 2 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                          {formatDate(request.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
                          "{request.question}"
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Context: {request.context} (Page {request.book_page})
                        </Typography>
                      </>
                    }
                  />
                  <Box sx={{ ml: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleOpenDialog(request)}
                    >
                      Respond
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {filteredRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No resolved help requests
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredRequests.map((request) => (
                <ListItem 
                  key={request.id}
                  sx={{ 
                    mb: 2, 
                    p: 3, 
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
                        <Typography variant="subtitle1">
                          {request.reader.name}
                        </Typography>
                        <Chip 
                          label="Resolved" 
                          color="success"
                          size="small"
                          sx={{ ml: 2 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                          Resolved: {formatDate(request.resolved_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
                          Question: "{request.question}"
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Context: {request.context} (Page {request.book_page})
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body1">
                          Response: "{request.response}"
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {filteredRequests.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary">
                No help requests found
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredRequests.map((request) => (
                <ListItem 
                  key={request.id}
                  sx={{ 
                    mb: 2, 
                    p: 3, 
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
                        <Typography variant="subtitle1">
                          {request.reader.name}
                        </Typography>
                        <Chip 
                          label={request.status === 'pending' ? 'Pending' : 'Resolved'} 
                          color={request.status === 'pending' ? 'error' : 'success'}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                          {request.status === 'pending' 
                            ? `Requested: ${formatDate(request.created_at)}` 
                            : `Resolved: ${formatDate(request.resolved_at)}`}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body1" sx={{ mt: 1, mb: 1 }}>
                          Question: "{request.question}"
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Context: {request.context} (Page {request.book_page})
                        </Typography>
                        {request.status === 'resolved' && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body1">
                              Response: "{request.response}"
                            </Typography>
                          </>
                        )}
                      </>
                    }
                  />
                  {request.status === 'pending' && (
                    <Box sx={{ ml: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleOpenDialog(request)}
                      >
                        Respond
                      </Button>
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </TabPanel>
      </Paper>
      
      {/* Summary */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Total Requests:
            </Typography>
            <Typography variant="h5">
              {helpRequests.length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Pending Requests:
            </Typography>
            <Typography variant="h5">
              {helpRequests.filter(req => req.status === 'pending').length}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              Resolved Requests:
            </Typography>
            <Typography variant="h5">
              {helpRequests.filter(req => req.status === 'resolved').length}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Response Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Respond to Help Request
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRequest && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Reader: {selectedRequest.reader.name}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  Question: "{selectedRequest.question}"
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Context: {selectedRequest.context} (Page {selectedRequest.book_page})
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="response-type-label">Response Type</InputLabel>
                <Select
                  labelId="response-type-label"
                  id="response-type"
                  value={responseType}
                  label="Response Type"
                  onChange={handleResponseTypeChange}
                >
                  <MenuItem value="text">Direct Text Response</MenuItem>
                  <MenuItem value="prompt">Subtle AI Prompt</MenuItem>
                  <MenuItem value="resource">Resource Recommendation</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Your Response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder={
                  responseType === 'text' 
                    ? 'Provide a clear, helpful explanation...' 
                    : responseType === 'prompt' 
                      ? 'Write a subtle prompt for the AI assistant to deliver...'
                      : 'Recommend resources or pages to review...'
                }
              />
              
              {responseType === 'prompt' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Note: This will be delivered as a subtle prompt through the AI assistant, not as a direct message from you.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSubmitResponse}
            disabled={!responseText.trim() || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {submitting ? 'Sending...' : 'Send Response'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HelpRequests;
