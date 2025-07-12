import React, { useState } from 'react';
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
  Alert
} from '@mui/material';
import { submitFeedback, FeedbackType, logFeedbackInteraction } from '../../services/feedbackService';
import { useAuth } from '../../contexts/AuthContext';
import { appLog } from '../../components/LogViewer';

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  sectionId?: string;
  sectionTitle?: string;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  onClose,
  bookId,
  sectionId,
  sectionTitle
}) => {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(FeedbackType.AHA_MOMENT);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to submit feedback');
      return;
    }

    if (!content.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      appLog('FeedbackDialog', 'Submitting feedback', 'info', {
        feedbackType,
        isPublic,
        sectionId
      });

      const result = await submitFeedback(
        user.id,
        bookId,
        feedbackType,
        content,
        sectionId,
        isPublic
      );

      if (result.error) {
        appLog('FeedbackDialog', 'Error submitting feedback', 'error', result.error);
        setError(result.error.message || 'Failed to submit feedback');
      } else {
        appLog('FeedbackDialog', 'Feedback submitted successfully', 'success', { feedbackId: result.data?.id });
        setSuccess(true);

        // Log the successful submission for analytics
        logFeedbackInteraction(
          user.id,
          bookId,
          'dialog_submission_success',
          { feedbackType, sectionId, isPublic }
        ).catch(error => {
          appLog('FeedbackDialog', 'Error logging submission success', 'warning', error);
        });

        // Reset form after successful submission
        setContent('');
        setFeedbackType(FeedbackType.AHA_MOMENT);
        setIsPublic(false);

        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      appLog('FeedbackDialog', 'Error in feedback submission', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Your Reading Experience</DialogTitle>
      <DialogContent>
        {sectionTitle && (
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            About: {sectionTitle}
          </Typography>
        )}

        <FormControl component="fieldset" sx={{ mb: 2, mt: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            What would you like to share today?
          </Typography>
          <RadioGroup
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
          >
            <FormControlLabel
              value={FeedbackType.AHA_MOMENT}
              control={<Radio color="warning" />}
              label="An insight or 'Aha!' moment I experienced"
            />
            <FormControlLabel
              value={FeedbackType.POSITIVE_EXPERIENCE}
              control={<Radio color="success" />}
              label="Something that inspired or moved me"
            />
            <FormControlLabel
              value={FeedbackType.CONFUSION}
              control={<Radio color="info" />}
              label="A question I'm curious about"
            />
            <FormControlLabel
              value={FeedbackType.GENERAL}
              control={<Radio color="primary" />}
              label="My thoughts and reflections"
            />
          </RadioGroup>
        </FormControl>

        <TextField
          label="Your Thoughts"
          multiline
          rows={4}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
              />
            }
            label="Inspire other readers with my thoughts"
          />
          <Typography variant="caption" color="text.secondary">
            When enabled, your insights may help inspire the reading community
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your feedback has been submitted successfully!
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !content.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Submit Feedback
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeedbackDialog;
