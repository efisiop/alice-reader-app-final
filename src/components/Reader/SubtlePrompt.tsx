// src/components/Reader/SubtlePrompt.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Slide,
  Fade,
  Collapse,
  Tooltip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ChatIcon from '@mui/icons-material/Chat';
import QuizIcon from '@mui/icons-material/Quiz';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import PersonIcon from '@mui/icons-material/Person';
import { ConsultantTrigger, TriggerType } from '../../types/supabase';
import { markTriggerProcessed, logTriggerInteraction } from '../../services/triggerService';
import { appLog } from '../LogViewer';
import { BookId, UserId } from '../../types/idTypes';

interface SubtlePromptProps {
  trigger: ConsultantTrigger;
  userId: string | UserId;
  bookId: string | BookId;
  onClose: () => void;
  onRespond?: (response: string) => void;
  variant?: 'slide' | 'fade' | 'collapse';
  position?: 'bottom' | 'top' | 'right';
}

/**
 * A subtle prompt component for displaying consultant-triggered prompts
 */
const SubtlePrompt: React.FC<SubtlePromptProps> = ({
  trigger,
  userId,
  bookId,
  onClose,
  onRespond,
  variant = 'slide',
  position = 'bottom'
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const [response, setResponse] = useState('');
  const [showResponseField, setShowResponseField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Log that the trigger was viewed
  useEffect(() => {
    logTriggerInteraction(
      trigger.id,
      userId,
      bookId,
      'viewed'
    ).catch(error => {
      appLog('SubtlePrompt', 'Error logging trigger view', 'error', error);
    });
  }, [trigger.id, userId, bookId]);
  
  // Get trigger icon
  const getTriggerIcon = () => {
    switch (trigger.trigger_type) {
      case TriggerType.ENCOURAGE:
        return <LightbulbIcon color="warning" />;
      case TriggerType.CHECK_IN:
        return <ChatIcon color="info" />;
      case TriggerType.QUIZ:
        return <QuizIcon color="secondary" />;
      case TriggerType.ENGAGEMENT:
        return <EmojiObjectsIcon color="success" />;
      case TriggerType.CONSULTANT_MESSAGE:
        return <PersonIcon color="primary" />;
      default:
        return <LightbulbIcon />;
    }
  };
  
  // Get trigger color
  const getTriggerColor = () => {
    switch (trigger.trigger_type) {
      case TriggerType.ENCOURAGE:
        return theme.palette.warning.main;
      case TriggerType.CHECK_IN:
        return theme.palette.info.main;
      case TriggerType.QUIZ:
        return theme.palette.secondary.main;
      case TriggerType.ENGAGEMENT:
        return theme.palette.success.main;
      case TriggerType.CONSULTANT_MESSAGE:
        return theme.palette.primary.main;
      default:
        return theme.palette.primary.main;
    }
  };
  
  // Get trigger title
  const getTriggerTitle = () => {
    switch (trigger.trigger_type) {
      case TriggerType.ENCOURAGE:
        return 'Encouragement';
      case TriggerType.CHECK_IN:
        return 'Check-in';
      case TriggerType.QUIZ:
        return 'Quiz Question';
      case TriggerType.ENGAGEMENT:
        return 'Engagement Prompt';
      case TriggerType.CONSULTANT_MESSAGE:
        return trigger.consultant 
          ? `Message from ${trigger.consultant.first_name}`
          : 'Message from Consultant';
      default:
        return 'Prompt';
    }
  };
  
  // Handle dismiss
  const handleDismiss = async () => {
    appLog('SubtlePrompt', 'Dismissing prompt', 'info', { triggerId: trigger.id });
    
    // Log the dismissal
    await logTriggerInteraction(
      trigger.id,
      userId,
      bookId,
      'dismissed'
    ).catch(error => {
      appLog('SubtlePrompt', 'Error logging trigger dismissal', 'error', error);
    });
    
    // Mark the trigger as processed
    await markTriggerProcessed(trigger.id).catch(error => {
      appLog('SubtlePrompt', 'Error marking trigger as processed', 'error', error);
    });
    
    // Close the prompt
    setOpen(false);
    
    // Call the close callback after animation
    setTimeout(onClose, 300);
  };
  
  // Handle show response field
  const handleShowResponseField = () => {
    setShowResponseField(true);
  };
  
  // Handle response change
  const handleResponseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResponse(e.target.value);
  };
  
  // Handle submit response
  const handleSubmitResponse = async () => {
    if (!response.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      appLog('SubtlePrompt', 'Submitting response', 'info', {
        triggerId: trigger.id,
        responseLength: response.length
      });
      
      // Log the response
      await logTriggerInteraction(
        trigger.id,
        userId,
        bookId,
        'responded',
        response
      );
      
      // Mark the trigger as processed
      await markTriggerProcessed(trigger.id);
      
      // Call the respond callback if provided
      if (onRespond) {
        onRespond(response);
      }
      
      // Close the prompt
      setOpen(false);
      
      // Call the close callback after animation
      setTimeout(onClose, 300);
    } catch (error) {
      appLog('SubtlePrompt', 'Error submitting response', 'error', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render content
  const renderContent = () => {
    const triggerColor = getTriggerColor();
    
    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          m: 2,
          maxWidth: '600px',
          width: 'calc(100% - 32px)',
          position: 'fixed',
          [position]: 16,
          right: 16,
          zIndex: 1000,
          borderLeft: `4px solid ${triggerColor}`,
          borderRadius: '4px',
          boxShadow: `0 4px 12px ${alpha(triggerColor, 0.2)}`
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getTriggerIcon()}
            <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'medium' }}>
              {getTriggerTitle()}
            </Typography>
          </Box>
          
          <Tooltip title="Dismiss">
            <IconButton size="small" onClick={handleDismiss} edge="end">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Message */}
        <Typography variant="body1" sx={{ my: 1 }}>
          {trigger.message}
        </Typography>
        
        {/* Response field */}
        <Collapse in={showResponseField} timeout={300}>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Type your response..."
              value={response}
              onChange={handleResponseChange}
              disabled={isSubmitting}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                size="small"
                endIcon={<SendIcon />}
                onClick={handleSubmitResponse}
                disabled={!response.trim() || isSubmitting}
              >
                Send
              </Button>
            </Box>
          </Box>
        </Collapse>
        
        {/* Actions */}
        {!showResponseField && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleShowResponseField}
            >
              Respond
            </Button>
          </Box>
        )}
      </Paper>
    );
  };
  
  // Render with appropriate animation
  switch (variant) {
    case 'fade':
      return (
        <Fade in={open} timeout={300} unmountOnExit>
          {renderContent()}
        </Fade>
      );
    case 'collapse':
      return (
        <Collapse in={open} timeout={300} unmountOnExit>
          {renderContent()}
        </Collapse>
      );
    case 'slide':
    default:
      return (
        <Slide
          direction={position === 'top' ? 'down' : position === 'right' ? 'left' : 'up'}
          in={open}
          timeout={300}
          unmountOnExit
        >
          {renderContent()}
        </Slide>
      );
  }
};

export default SubtlePrompt;
