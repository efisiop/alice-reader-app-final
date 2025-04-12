// src/components/Reader/PositiveFeedbackForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Fade,
  useTheme,
  Switch
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { useAuth } from '../../contexts/AuthContext';
import { submitFeedback, FeedbackType, logFeedbackInteraction } from '../../services/feedbackService';
import { appLog } from '../LogViewer';
import { BookId, SectionId } from '../../types/idTypes';

interface PositiveFeedbackFormProps {
  bookId?: string | BookId;
  sectionId?: string | SectionId;
  sectionTitle?: string;
  chapterTitle?: string;
  onClose?: () => void;
  onSubmitSuccess?: () => void;
  standalone?: boolean;
}

/**
 * A positively framed feedback form component
 */
const PositiveFeedbackForm: React.FC<PositiveFeedbackFormProps> = ({
  bookId,
  sectionId,
  sectionTitle,
  chapterTitle,
  onClose,
  onSubmitSuccess,
  standalone = false
}) => {
  const { user } = useAuth();
  const theme = useTheme();

  // State
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.AHA_MOMENT);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);

  // Reset form when props change
  useEffect(() => {
    setFeedbackType(FeedbackType.AHA_MOMENT);
    setContent('');
    setIsPublic(false);
    setError(null);
    setSuccess(false);
    setShowPrompts(true);
  }, [bookId, sectionId]);

  // Get prompts based on feedback type
  const getPrompts = () => {
    switch (feedbackType) {
      case FeedbackType.AHA_MOMENT:
        return [
          "I had an 'aha!' moment when I realized that...",
          "This part helped me understand...",
          "I made a connection between...",
          "I just discovered that..."
        ];
      case FeedbackType.POSITIVE_EXPERIENCE:
        return [
          "I was inspired by...",
          "I felt a strong connection to...",
          "The part that resonated with me most was...",
          "I was moved by how the author..."
        ];
      case FeedbackType.SUGGESTION:
        return [
          "I'd love to explore more about...",
          "I'm excited about the possibility of...",
          "A feature that would enhance my experience is...",
          "I'd be thrilled if you could add..."
        ];
      case FeedbackType.CONFUSION:
        return [
          "I'm curious about...",
          "I'd like to learn more about...",
          "I'm wondering if you could explain...",
          "I'd appreciate more context on..."
        ];
      case FeedbackType.GENERAL:
      default:
        return [
          "My favorite part of this section was...",
          "This reading experience made me think about...",
          "I noticed something interesting about...",
          "I'm excited to share that..."
        ];
    }
  };

  // Get feedback type description
  const getFeedbackTypeDescription = () => {
    switch (feedbackType) {
      case FeedbackType.AHA_MOMENT:
        return "Share your moment of insight or discovery! These 'aha!' moments help us understand what resonates with readers.";
      case FeedbackType.POSITIVE_EXPERIENCE:
        return "Tell us about something that inspired or moved you in your reading journey. Your positive experiences help other readers!";
      case FeedbackType.SUGGESTION:
        return "Share your ideas for enhancing the reading experience! Your creative suggestions help us improve for everyone.";
      case FeedbackType.CONFUSION:
        return "What are you curious to learn more about? Your questions help us provide better explanations and context.";
      case FeedbackType.GENERAL:
      default:
        return "Share your thoughts and reflections on what you've read. Your perspective enriches the reading community!";
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
        return <HelpOutlineIcon color="error" />;
      case FeedbackType.GENERAL:
      default:
        return <FeedbackIcon color="primary" />;
    }
  };

  // Get feedback type color
  const getFeedbackTypeColor = (type: FeedbackType): 'warning' | 'success' | 'info' | 'error' | 'primary' => {
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
        return 'primary';
    }
  };

  // Handle feedback type change
  const handleFeedbackTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newType = event.target.value as FeedbackType;
    setFeedbackType(newType);
    setShowPrompts(true);

    // Log the selection for analytics
    if (user && bookId) {
      logFeedbackInteraction(
        user.id,
        bookId,
        'type_selection',
        { feedbackType: newType }
      ).catch(error => {
        appLog('PositiveFeedbackForm', 'Error logging feedback type selection', 'error', error);
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
        user.id,
        bookId,
        'prompt_selection',
        { prompt, feedbackType }
      ).catch(error => {
        appLog('PositiveFeedbackForm', 'Error logging prompt selection', 'error', error);
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
      appLog('PositiveFeedbackForm', 'Submitting feedback', 'info', {
        feedbackType,
        isPublic,
        sectionId
      });

      const result = await submitFeedback(
        user.id,
        bookId.toString(),
        feedbackType,
        content,
        sectionId?.toString(),
        isPublic
      );

      if (result.error) {
        appLog('PositiveFeedbackForm', 'Error submitting feedback', 'error', result.error);
        setError(result.error.message || 'Failed to submit feedback');
      } else {
        appLog('PositiveFeedbackForm', 'Feedback submitted successfully', 'success', { feedbackId: result.data?.id });
        setSuccess(true);

        // Log the successful submission for analytics
        if (user && bookId) {
          logFeedbackInteraction(
            user.id,
            bookId.toString(),
            'submission_success',
            { feedbackType, sectionId: sectionId?.toString(), isPublic }
          ).catch(error => {
            appLog('PositiveFeedbackForm', 'Error logging submission success', 'warning', error);
          });
        }

        // Reset form
        setContent('');
        setFeedbackType(FeedbackType.AHA_MOMENT);
        setIsPublic(false);

        // Call onSubmitSuccess callback if provided
        if (onSubmitSuccess) {
          setTimeout(() => {
            onSubmitSuccess();
          }, 1500);
        }
      }
    } catch (err: any) {
      appLog('PositiveFeedbackForm', 'Exception in feedback submission', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fade in={true}>
      <Paper
        elevation={standalone ? 3 : 0}
        sx={{
          p: standalone ? 3 : 0,
          borderRadius: standalone ? 2 : 0,
          width: '100%'
        }}
      >
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h5" gutterBottom align="center">
            Share Your Reading Experience
          </Typography>

          <Typography variant="body2" color="text.secondary" paragraph align="center">
            Your feedback helps us improve the reading experience and can inspire other readers.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Feedback Type Selection */}
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              What would you like to share?
            </Typography>

            <RadioGroup
              aria-label="feedback type"
              name="feedback-type"
              value={feedbackType}
              onChange={handleFeedbackTypeChange}
            >
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Paper
                  elevation={feedbackType === FeedbackType.AHA_MOMENT ? 3 : 1}
                  sx={{
                    p: 1.5,
                    flex: '1 1 45%',
                    minWidth: 150,
                    border: feedbackType === FeedbackType.AHA_MOMENT ? `2px solid ${theme.palette.warning.main}` : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setFeedbackType(FeedbackType.AHA_MOMENT)}
                >
                  <FormControlLabel
                    value={FeedbackType.AHA_MOMENT}
                    control={<Radio color="warning" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LightbulbIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="body1">Aha! Moment</Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>

                <Paper
                  elevation={feedbackType === FeedbackType.POSITIVE_EXPERIENCE ? 3 : 1}
                  sx={{
                    p: 1.5,
                    flex: '1 1 45%',
                    minWidth: 150,
                    border: feedbackType === FeedbackType.POSITIVE_EXPERIENCE ? `2px solid ${theme.palette.success.main}` : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setFeedbackType(FeedbackType.POSITIVE_EXPERIENCE)}
                >
                  <FormControlLabel
                    value={FeedbackType.POSITIVE_EXPERIENCE}
                    control={<Radio color="success" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmojiEventsIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="body1">Positive Experience</Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>

                <Paper
                  elevation={feedbackType === FeedbackType.SUGGESTION ? 3 : 1}
                  sx={{
                    p: 1.5,
                    flex: '1 1 45%',
                    minWidth: 150,
                    border: feedbackType === FeedbackType.SUGGESTION ? `2px solid ${theme.palette.info.main}` : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setFeedbackType(FeedbackType.SUGGESTION)}
                >
                  <FormControlLabel
                    value={FeedbackType.SUGGESTION}
                    control={<Radio color="info" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <EmojiObjectsIcon color="info" sx={{ mr: 1 }} />
                        <Typography variant="body1">Suggestion</Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>

                <Paper
                  elevation={feedbackType === FeedbackType.CONFUSION ? 3 : 1}
                  sx={{
                    p: 1.5,
                    flex: '1 1 45%',
                    minWidth: 150,
                    border: feedbackType === FeedbackType.CONFUSION ? `2px solid ${theme.palette.error.main}` : 'none',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setFeedbackType(FeedbackType.CONFUSION)}
                >
                  <FormControlLabel
                    value={FeedbackType.CONFUSION}
                    control={<Radio color="error" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HelpOutlineIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="body1">Curious Questions</Typography>
                      </Box>
                    }
                    sx={{ m: 0, width: '100%' }}
                  />
                </Paper>
              </Box>
            </RadioGroup>
          </FormControl>

          {/* Feedback Description */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              {getFeedbackTypeIcon(feedbackType)}
              <span style={{ marginLeft: '8px' }}>
                {getFeedbackTypeDescription()}
              </span>
            </Typography>
          </Box>

          {/* Feedback Content */}
          <TextField
            label="Your feedback"
            multiline
            rows={5}
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your thoughts here..."
            variant="outlined"
            required
            disabled={loading}
            sx={{ mb: 2 }}
          />

          {/* Prompt Suggestions */}
          {showPrompts && (
            <Box sx={{ mb: 3 }}>
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
                    color={getFeedbackTypeColor(feedbackType)}
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Reading Context */}
          {(sectionTitle || chapterTitle) && (
            <Box sx={{ mb: 2, mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Your feedback is about:
              </Typography>
              <Box sx={{ pl: 2, borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                {chapterTitle && (
                  <Typography variant="body2" color="text.secondary">
                    Chapter: {chapterTitle}
                  </Typography>
                )}
                {sectionTitle && (
                  <Typography variant="body2" color="text.secondary">
                    Section: {sectionTitle}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Public Sharing Option */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Share with other readers"
            />
            <Typography variant="caption" color="text.secondary">
              When enabled, your feedback may be visible to other readers
            </Typography>
          </Box>

          {/* Error and Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Thank you for your feedback! Your insights help us improve the reading experience.
            </Alert>
          )}

          {/* Form Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            {onClose && (
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !content.trim()}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{ ml: onClose ? 'auto' : 0 }}
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
};

export default PositiveFeedbackForm;
