import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { submitHelpRequest } from '../../services/backendService';
import { useAuth } from '../../contexts/AuthContext';
import { appLog } from '../../components/LogViewer';

interface HelpRequestDialogProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  sectionId?: string;
  sectionTitle?: string;
  selectedText?: string;
}

const HelpRequestDialog: React.FC<HelpRequestDialogProps> = ({
  open,
  onClose,
  bookId,
  sectionId,
  sectionTitle,
  selectedText
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to request help');
      return;
    }

    if (!content.trim()) {
      setError('Please describe what you need help with');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      appLog('HelpRequestDialog', 'Submitting help request', 'info', {
        sectionId,
        hasSelectedText: !!selectedText
      });

      const { error } = await submitHelpRequest(
        user.id,
        bookId,
        content,
        sectionId,
        selectedText
      );

      if (error) {
        appLog('HelpRequestDialog', 'Error submitting help request', 'error', error);
        setError(error.message || 'Failed to submit help request');
      } else {
        appLog('HelpRequestDialog', 'Help request submitted successfully', 'success');
        setSuccess(true);
        // Reset form after successful submission
        setContent('');
        
        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      appLog('HelpRequestDialog', 'Error in help request submission', 'error', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Request Help from a Consultant</DialogTitle>
      <DialogContent>
        {sectionTitle && (
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            About: {sectionTitle}
          </Typography>
        )}

        <Typography variant="body2" paragraph sx={{ mt: 1 }}>
          A reading consultant will respond to your question as soon as possible. 
          Please be specific about what you need help with.
        </Typography>

        {selectedText && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Text:
            </Typography>
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'background.default', 
                borderRadius: 1,
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}
            >
              "{selectedText}"
            </Box>
          </Box>
        )}

        <TextField
          label="What do you need help with?"
          multiline
          rows={4}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={loading}
          sx={{ mb: 2, mt: 2 }}
          placeholder="Example: I'm having trouble understanding what the author means by..."
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Response time:
          </Typography>
          <Chip 
            label="Usually within 24 hours" 
            size="small" 
            color="primary" 
            variant="outlined"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Your help request has been submitted successfully! A consultant will respond soon.
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
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HelpRequestDialog;
