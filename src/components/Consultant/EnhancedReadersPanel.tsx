// src/components/Consultant/EnhancedReadersPanel.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tooltip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MessageIcon from '@mui/icons-material/Message';
import HelpIcon from '@mui/icons-material/Help';
import SendIcon from '@mui/icons-material/Send';
import BookIcon from '@mui/icons-material/Book';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useConsultant } from '../../contexts/ConsultantContext';
import { TriggerType } from '../../types/supabase';
import { formatRelativeTime } from '../../utils/formatDate';
import { appLog } from '../../components/LogViewer';

interface EnhancedReadersPanelProps {
  onViewReader?: (userId: string) => void;
}

const EnhancedReadersPanel: React.FC<EnhancedReadersPanelProps> = ({ onViewReader }) => {
  const theme = useTheme();
  const { assignments, refreshAssignments, createTrigger } = useConsultant();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEngagement, setFilterEngagement] = useState<string>('all');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReader, setSelectedReader] = useState<any | null>(null);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [promptType, setPromptType] = useState<TriggerType>(TriggerType.ENCOURAGE);
  const [promptMessage, setPromptMessage] = useState('');
  
  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterEngagement(event.target.value as string);
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reader: any) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedReader(reader);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle open prompt dialog
  const handleOpenPromptDialog = () => {
    setPromptDialogOpen(true);
    setPromptType(TriggerType.ENCOURAGE);
    setPromptMessage('');
    handleMenuClose();
  };
  
  // Handle close prompt dialog
  const handleClosePromptDialog = () => {
    setPromptDialogOpen(false);
  };
  
  // Handle send prompt
  const handleSendPrompt = async () => {
    if (!selectedReader) return;
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('EnhancedReadersPanel', 'Sending prompt to reader', 'info', {
        userId: selectedReader.user_id,
        promptType,
        message: promptMessage
      });
      
      const success = await createTrigger(
        selectedReader.user_id,
        promptType,
        promptMessage
      );
      
      if (success) {
        appLog('EnhancedReadersPanel', 'Prompt sent successfully', 'success');
        handleClosePromptDialog();
      } else {
        appLog('EnhancedReadersPanel', 'Failed to send prompt', 'warning');
        setError('Failed to send prompt');
      }
    } catch (err) {
      appLog('EnhancedReadersPanel', 'Error sending prompt', 'error', err);
      setError('An error occurred while sending the prompt');
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
  
  // Get engagement level
  const getEngagementLevel = (reader: any) => {
    if (!reader.last_active_at) return 'low';
    
    const lastActive = new Date(reader.last_active_at);
    const now = new Date();
    const daysSinceActive = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceActive < 7) return 'high';
    if (daysSinceActive < 14) return 'medium';
    return 'low';
  };
  
  // Get engagement chip
  const getEngagementChip = (level: string) => {
    switch (level) {
      case 'high':
        return <Chip label="High Engagement" color="success" size="small" />;
      case 'medium':
        return <Chip label="Medium Engagement" color="info" size="small" />;
      case 'low':
        return <Chip label="Low Engagement" color="warning" size="small" />;
      default:
        return <Chip label="Unknown" size="small" />;
    }
  };
  
  // Filter readers
  const filteredReaders = assignments.filter(reader => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      (reader.user?.first_name && reader.user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reader.user?.last_name && reader.user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (reader.user_id && reader.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by engagement
    const engagement = getEngagementLevel(reader);
    const matchesEngagement = filterEngagement === 'all' || engagement === filterEngagement;
    
    return matchesSearch && matchesEngagement;
  });
  
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Assigned Readers
        </Typography>
        
        <Button
          size="small"
          onClick={() => refreshAssignments()}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      <Divider />
      
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search readers..."
          size="small"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="engagement-filter-label">Engagement</InputLabel>
          <Select
            labelId="engagement-filter-label"
            value={filterEngagement}
            label="Engagement"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="high">High Engagement</MenuItem>
            <MenuItem value="medium">Medium Engagement</MenuItem>
            <MenuItem value="low">Low Engagement</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
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
        {filteredReaders.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No readers found matching your criteria
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredReaders.map((reader) => {
              const engagement = getEngagementLevel(reader);
              
              return (
                <React.Fragment key={reader.id || reader.user_id}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar 
                        onClick={() => handleViewReader(reader.user_id)} 
                        sx={{ cursor: 'pointer' }}
                      >
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            component="span"
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            onClick={() => handleViewReader(reader.user_id)}
                          >
                            {reader.user?.first_name || ''} {reader.user?.last_name || ''}
                          </Typography>
                          {getEngagementChip(engagement)}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <BookIcon fontSize="small" />
                              {reader.current_section ? `Reading: ${reader.current_section}` : 'No reading progress'}
                            </Box>
                          </Typography>
                          
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <AccessTimeIcon fontSize="small" />
                            {reader.last_active_at ? `Last active ${formatRelativeTime(reader.last_active_at)}` : 'Never active'}
                          </Typography>
                        </>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <Tooltip title="Send Prompt">
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={(e) => {
                            setSelectedReader(reader);
                            handleOpenPromptDialog();
                          }}
                          disabled={loading}
                          sx={{ mr: 1 }}
                        >
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <IconButton
                        edge="end"
                        onClick={(e) => handleMenuOpen(e, reader)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Box>
      
      {/* Reader Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedReader) handleViewReader(selectedReader.user_id);
          handleMenuClose();
        }} disabled={loading}>
          <ListItemAvatar>
            <PersonIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText primary="View Reader Profile" />
        </MenuItem>
        
        <MenuItem onClick={handleOpenPromptDialog} disabled={loading}>
          <ListItemAvatar>
            <SendIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText primary="Send Prompt" />
        </MenuItem>
      </Menu>
      
      {/* Prompt Dialog */}
      <Dialog
        open={promptDialogOpen}
        onClose={handleClosePromptDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Prompt to Reader</DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Reader:
            </Typography>
            <Typography variant="body1">
              {selectedReader?.user?.first_name || ''} {selectedReader?.user?.last_name || ''}
            </Typography>
          </Box>
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="prompt-type-label">Prompt Type</InputLabel>
            <Select
              labelId="prompt-type-label"
              value={promptType}
              label="Prompt Type"
              onChange={(e) => setPromptType(e.target.value as TriggerType)}
            >
              <MenuItem value={TriggerType.ENCOURAGE}>Encouragement</MenuItem>
              <MenuItem value={TriggerType.CHECK_IN}>Check-in</MenuItem>
              <MenuItem value={TriggerType.QUIZ}>Quiz Question</MenuItem>
              <MenuItem value={TriggerType.ENGAGEMENT}>Engagement Prompt</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Message"
            multiline
            rows={4}
            fullWidth
            value={promptMessage}
            onChange={(e) => setPromptMessage(e.target.value)}
            disabled={loading}
          />
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              This prompt will be sent to the reader and will appear in their reading interface.
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClosePromptDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSendPrompt}
            color="primary"
            disabled={loading || !promptMessage.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EnhancedReadersPanel;
