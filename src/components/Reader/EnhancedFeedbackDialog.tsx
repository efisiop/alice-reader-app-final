// src/components/Reader/EnhancedFeedbackDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Switch,
  Box,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import SchoolIcon from '@mui/icons-material/School';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { FeedbackType } from '../../types/supabase';
import { submitFeedback, logFeedbackInteraction } from '../../services/feedbackService';
import { useAuth } from '../../contexts/AuthContext';
import { appLog } from '../LogViewer';
import { BookId, SectionId } from '../../types/idTypes';

interface EnhancedFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  bookId?: string | BookId;
  sectionId?: string | SectionId;
  sectionTitle?: string;
  chapterTitle?: string;
}

/**
 * Enhanced feedback dialog with positive framing and guided experience
 */
const EnhancedFeedbackDialog: React.FC<EnhancedFeedbackDialogProps> = ({
  open,
  onClose,
  bookId,
  sectionId,
  sectionTitle,
  chapterTitle
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [activeStep, setActiveStep] = useState(0);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.GENERAL);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setFeedbackType(FeedbackType.GENERAL);
      setContent('');
      setIsPublic(false);
      setError(null);
      setSuccess(false);
      setShowPrompts(true);
    }
  }, [open]);
  
  // Steps for the feedback process
  const steps = [
    'Choose Feedback Type',
    'Share Your Thoughts',
    'Review & Submit'
  ];
  
  // Prompts for different feedback types
  const getPrompts = () => {
    switch (feedbackType) {
      case FeedbackType.AHA_MOMENT:
        return [
          'What insight did you gain from this section?',
          'How did this change your understanding of the story?',
          'What connections did you make to other parts of the book?',
          'How might this insight apply to your own life?'
        ];
      case FeedbackType.CONFUSION:
        return [
          'What specific part was unclear to you?',
          'What would have made this section easier to understand?',
          'What questions do you still have about this part?',
          'What additional information would be helpful?'
        ];
      case FeedbackType.GENERAL:
      default:
        return [
          'What did you enjoy most about this section?',
          'What feelings or thoughts did this section evoke?',
          'How does this section compare to others you\'ve read?',
          'What would you like to see more of in future sections?'
        ];
    }
  };
  
  // Get icon for feedback type
  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return <LightbulbIcon color="success" />;
      case FeedbackType.CONFUSION:
        return <SentimentVeryDissatisfiedIcon color="warning" />;
      case FeedbackType.GENERAL:
      default:
        return <FeedbackIcon color="info" />;
    }
  };
  
  // Get color for feedback type
  const getFeedbackTypeColor = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return 'success';
      case FeedbackType.CONFUSION:
        return 'warning';
      case FeedbackType.GENERAL:
      default:
        return 'info';
    }
  };
  
  // Get title for feedback type
  const getFeedbackTypeTitle = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return 'Share Your Insight';
      case FeedbackType.CONFUSION:
        return 'Help Us Improve';
      case FeedbackType.GENERAL:
      default:
        return 'Share Your Thoughts';
    }
  };
  
  // Get description for feedback type
  const getFeedbackTypeDescription = (type: FeedbackType) => {
    switch (type) {
      case FeedbackType.AHA_MOMENT:
        return 'Your insights help us understand what resonates with readers and can inspire others.';
      case FeedbackType.CONFUSION:
        return 'Your feedback helps us identify areas where we can provide better explanations or context.';
      case FeedbackType.GENERAL:
      default:
        return 'Your thoughts and reactions help us understand the reader experience and improve our content.';
    }
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  // Handle feedback type change
  const handleFeedbackTypeChange = (type: FeedbackType) => {
    setFeedbackType(type);
    // Log the selection for analytics
    if (user && bookId) {
      logFeedbackInteraction(
        user.id.toString(),
        bookId.toString(),
        'type_selection',
        { feedbackType: type }
      ).catch(error => {
        appLog('EnhancedFeedbackDialog', 'Error logging feedback type selection', 'error', error);
      });
    }
  };
  
  // Handle prompt selection
  const handlePromptSelect = (prompt: string) => {
    setContent(prompt);
    setShowPrompts(false);
    
    // Log the prompt selection for analytics
    if (user && bookId) {
      logFeedbackInteraction(
        user.id.toString(),
        bookId.toString(),
        'prompt_selection',
        { prompt }
      ).catch(error => {
        appLog('EnhancedFeedbackDialog', 'Error logging prompt selection', 'error', error);
      });
    }
  };
  
  // Handle submit
  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to submit feedback');
      return;
    }
    
    if (!bookId) {
      setError('Book ID is required');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter your feedback');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      appLog('EnhancedFeedbackDialog', 'Submitting feedback', 'info', {
        feedbackType,
        isPublic,
        sectionId
      });
      
      const result = await submitFeedback(
        user.id.toString(),
        bookId.toString(),
        feedbackType,
        content,
        sectionId?.toString(),
        isPublic
      );
      
      if (result.error) {
        appLog('EnhancedFeedbackDialog', 'Error submitting feedback', 'error', result.error);
        setError(result.error.message || 'Failed to submit feedback');
      } else {
        appLog('EnhancedFeedbackDialog', 'Feedback submitted successfully', 'success');
        setSuccess(true);
        
        // Log the submission for analytics
        logFeedbackInteraction(
          user.id.toString(),
          bookId.toString(),
          'submission',
          { 
            feedbackType,
            isPublic,
            sectionId: sectionId?.toString(),
            contentLength: content.length
          }
        ).catch(error => {
          appLog('EnhancedFeedbackDialog', 'Error logging feedback submission', 'error', error);
        });
        
        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      appLog('EnhancedFeedbackDialog', 'Error in feedback submission', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              What type of feedback would you like to share?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Choose the option that best matches what you'd like to share with us.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Paper
                elevation={feedbackType === FeedbackType.AHA_MOMENT ? 3 : 1}
                sx={{
                  p: 2,
                  border: feedbackType === FeedbackType.AHA_MOMENT ? `2px solid ${theme.palette.success.main}` : 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleFeedbackTypeChange(FeedbackType.AHA_MOMENT)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LightbulbIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6">Insight or "Aha!" Moment</Typography>
                </Box>
                <Typography variant="body2">
                  Share a realization, connection, or moment of understanding you experienced while reading.
                </Typography>
              </Paper>
              
              <Paper
                elevation={feedbackType === FeedbackType.CONFUSION ? 3 : 1}
                sx={{
                  p: 2,
                  border: feedbackType === FeedbackType.CONFUSION ? `2px solid ${theme.palette.warning.main}` : 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleFeedbackTypeChange(FeedbackType.CONFUSION)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SentimentVeryDissatisfiedIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Question or Confusion</Typography>
                </Box>
                <Typography variant="body2">
                  Let us know about anything that was unclear or raised questions for you.
                </Typography>
              </Paper>
              
              <Paper
                elevation={feedbackType === FeedbackType.GENERAL ? 3 : 1}
                sx={{
                  p: 2,
                  border: feedbackType === FeedbackType.GENERAL ? `2px solid ${theme.palette.info.main}` : 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => handleFeedbackTypeChange(FeedbackType.GENERAL)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FeedbackIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">General Thoughts</Typography>
                </Box>
                <Typography variant="body2">
                  Share your overall impressions, reactions, or any other thoughts about what you've read.
                </Typography>
              </Paper>
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              {getFeedbackTypeTitle(feedbackType)}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {getFeedbackTypeDescription(feedbackType)}
            </Typography>
            
            <TextField
              label="Your Feedback"
              multiline
              rows={6}
              fullWidth
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              placeholder="Type your thoughts here..."
              sx={{ mb: 2 }}
            />
            
            {showPrompts && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Need inspiration? Try one of these prompts:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {getPrompts().map((prompt, index) => (
                    <Chip
                      key={index}
                      label={prompt}
                      onClick={() => handlePromptSelect(prompt)}
                      clickable
                      color={getFeedbackTypeColor(feedbackType) as any}
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Review Your Feedback
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please review your feedback before submitting.
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getFeedbackTypeIcon(feedbackType)}
                <Typography variant="subtitle2" sx={{ ml: 1 }}>
                  {feedbackType === FeedbackType.AHA_MOMENT
                    ? 'Insight or "Aha!" Moment'
                    : feedbackType === FeedbackType.CONFUSION
                    ? 'Question or Confusion'
                    : 'General Thoughts'}
                </Typography>
              </Box>
              
              <Typography variant="body1" paragraph>
                {content}
              </Typography>
              
              {(sectionTitle || chapterTitle) && (
                <Box sx={{ mt: 2 }}>
                  {chapterTitle && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Chapter: {chapterTitle}
                    </Typography>
                  )}
                  {sectionTitle && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Section: {sectionTitle}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Share with other readers"
              />
              <Typography variant="caption" color="text.secondary">
                When enabled, your feedback may be visible to other readers
              </Typography>
            </Box>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FeedbackIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Reader Feedback</Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            disabled={loading}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel={!isMobile}
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ mb: 4 }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Thank you for your feedback! Your insights help us improve the reading experience.
          </Alert>
        )}
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Box sx={{ flex: '1 1 auto' }} />
        
        {activeStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
          >
            Back
          </Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={activeStep === 1 && !content.trim()}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            Submit Feedback
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default EnhancedFeedbackDialog;
