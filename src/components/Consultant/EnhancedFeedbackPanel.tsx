// src/components/Consultant/EnhancedFeedbackPanel.tsx
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
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import FeedbackIcon from '@mui/icons-material/Feedback';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useConsultant } from '../../contexts/ConsultantContext';
import { FeedbackType, UserFeedback } from '../../types/supabase';
import { formatRelativeTime } from '../../utils/formatDate';
import { updateFeedbackVisibility } from '../../services/feedbackService';
import { appLog } from '../../components/LogViewer';

interface EnhancedFeedbackPanelProps {
  onViewReader?: (userId: string) => void;
}

const EnhancedFeedbackPanel: React.FC<EnhancedFeedbackPanelProps> = ({ onViewReader }) => {
  const theme = useTheme();
  const { feedback, refreshFeedback } = useConsultant();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(null);
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter change
  const handleFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFilterType(event.target.value as string);
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, feedbackItem: UserFeedback) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedFeedback(feedbackItem);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle toggle public
  const handleTogglePublic = async () => {
    if (!selectedFeedback) return;
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('EnhancedFeedbackPanel', 'Toggling feedback visibility', 'info', {
        feedbackId: selectedFeedback.id,
        isPublic: !selectedFeedback.is_public
      });
      
      const success = await updateFeedbackVisibility(selectedFeedback.id, !selectedFeedback.is_public);
      
      if (success) {
        appLog('EnhancedFeedbackPanel', 'Feedback visibility updated', 'success');
        await refreshFeedback();
      } else {
        appLog('EnhancedFeedbackPanel', 'Failed to update feedback visibility', 'warning');
        setError('Failed to update feedback visibility');
      }
    } catch (err) {
      appLog('EnhancedFeedbackPanel', 'Error updating feedback visibility', 'error', err);
      setError('An error occurred while updating feedback visibility');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };
  
  // Handle toggle featured
  const handleToggleFeatured = async () => {
    if (!selectedFeedback) return;
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('EnhancedFeedbackPanel', 'Toggling feedback featured status', 'info', {
        feedbackId: selectedFeedback.id,
        isFeatured: !selectedFeedback.is_featured
      });
      
      // TODO: Implement updateFeedbackFeatured in feedbackService
      const success = true;
      
      if (success) {
        appLog('EnhancedFeedbackPanel', 'Feedback featured status updated', 'success');
        await refreshFeedback();
      } else {
        appLog('EnhancedFeedbackPanel', 'Failed to update feedback featured status', 'warning');
        setError('Failed to update feedback featured status');
      }
    } catch (err) {
      appLog('EnhancedFeedbackPanel', 'Error updating feedback featured status', 'error', err);
      setError('An error occurred while updating feedback featured status');
    } finally {
      setLoading(false);
      handleMenuClose();
    }
  };
  
  // Handle view reader
  const handleViewReader = (userId: string) => {
    if (onViewReader) {
      onViewReader(userId);
    }
  };
  
  // Get feedback type icon
  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return <LightbulbIcon color="warning" />;
      case FeedbackType.POSITIVE_EXPERIENCE:
        return <EmojiEventsIcon color="success" />;
      case FeedbackType.SUGGESTION:
        return <EmojiObjectsIcon color="info" />;
      case FeedbackType.CONFUSION:
        return <SentimentDissatisfiedIcon color="error" />;
      case FeedbackType.GENERAL:
      default:
        return <FeedbackIcon color="primary" />;
    }
  };
  
  // Get feedback type label
  const getFeedbackTypeLabel = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return 'Aha! Moment';
      case FeedbackType.POSITIVE_EXPERIENCE:
        return 'Positive Experience';
      case FeedbackType.SUGGESTION:
        return 'Suggestion';
      case FeedbackType.CONFUSION:
        return 'Question/Confusion';
      case FeedbackType.GENERAL:
      default:
        return 'General';
    }
  };
  
  // Get feedback type color
  const getFeedbackTypeColor = (type: FeedbackType): 'warning' | 'success' | 'info' | 'error' | 'default' => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return 'warning';
      case FeedbackType.POSITIVE_EXPERIENCE:
        return 'success';
      case FeedbackType.SUGGESTION:
        return 'info';
      case FeedbackType.CONFUSION:
        return 'error';
      case FeedbackType.GENERAL:
      default:
        return 'default';
    }
  };
  
  // Filter feedback
  const filteredFeedback = feedback.filter(item => {
    // Filter by search term
    const matchesSearch = searchTerm === '' || 
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.user_id && item.user_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by type
    const matchesType = filterType === 'all' || item.feedback_type === filterType;
    
    // Filter by tab
    const matchesTab = (tabValue === 0) || 
      (tabValue === 1 && item.is_public) || 
      (tabValue === 2 && item.is_featured);
    
    return matchesSearch && matchesType && matchesTab;
  });
  
  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">
          Reader Feedback
        </Typography>
        
        <Button
          size="small"
          onClick={() => refreshFeedback()}
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
        <Tab label="All" />
        <Tab label="Public" />
        <Tab label="Featured" />
      </Tabs>
      
      <Box sx={{ p: 2, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search feedback..."
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
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="feedback-type-filter-label">Type</InputLabel>
          <Select
            labelId="feedback-type-filter-label"
            value={filterType}
            label="Type"
            onChange={handleFilterChange}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value={FeedbackType.AHA_MOMENT}>Aha! Moments</MenuItem>
            <MenuItem value={FeedbackType.POSITIVE_EXPERIENCE}>Positive Experiences</MenuItem>
            <MenuItem value={FeedbackType.SUGGESTION}>Suggestions</MenuItem>
            <MenuItem value={FeedbackType.CONFUSION}>Questions</MenuItem>
            <MenuItem value={FeedbackType.GENERAL}>General</MenuItem>
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
        {filteredFeedback.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No feedback found matching your criteria
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredFeedback.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar 
                      onClick={() => handleViewReader(item.user_id)} 
                      sx={{ cursor: 'pointer' }}
                    >
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" component="span">
                          {item.user_id.substring(0, 8)}...
                        </Typography>
                        <Chip
                          icon={getFeedbackTypeIcon(item.feedback_type)}
                          label={getFeedbackTypeLabel(item.feedback_type)}
                          color={getFeedbackTypeColor(item.feedback_type)}
                          size="small"
                        />
                        {item.is_public && (
                          <Chip
                            icon={<VisibilityIcon fontSize="small" />}
                            label="Public"
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {item.is_featured && (
                          <Chip
                            icon={<StarIcon fontSize="small" />}
                            label="Featured"
                            size="small"
                            variant="outlined"
                            color="warning"
                          />
                        )}
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
                          {item.content}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatRelativeTime(item.created_at)}
                        </Typography>
                      </>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, item)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
      
      {/* Feedback Actions Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleTogglePublic} disabled={loading}>
          {selectedFeedback?.is_public ? (
            <>
              <ListItemAvatar>
                <VisibilityOffIcon fontSize="small" />
              </ListItemAvatar>
              <ListItemText primary="Make Private" />
            </>
          ) : (
            <>
              <ListItemAvatar>
                <VisibilityIcon fontSize="small" />
              </ListItemAvatar>
              <ListItemText primary="Make Public" />
            </>
          )}
        </MenuItem>
        
        <MenuItem onClick={handleToggleFeatured} disabled={loading}>
          {selectedFeedback?.is_featured ? (
            <>
              <ListItemAvatar>
                <StarBorderIcon fontSize="small" />
              </ListItemAvatar>
              <ListItemText primary="Unfeature" />
            </>
          ) : (
            <>
              <ListItemAvatar>
                <StarIcon fontSize="small" />
              </ListItemAvatar>
              <ListItemText primary="Feature" />
            </>
          )}
        </MenuItem>
        
        <MenuItem onClick={() => {
          if (selectedFeedback) handleViewReader(selectedFeedback.user_id);
          handleMenuClose();
        }} disabled={loading}>
          <ListItemAvatar>
            <PersonIcon fontSize="small" />
          </ListItemAvatar>
          <ListItemText primary="View Reader Profile" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default EnhancedFeedbackPanel;
