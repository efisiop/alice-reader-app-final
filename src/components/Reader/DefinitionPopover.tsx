// src/components/Reader/DefinitionPopover.tsx
import React, { useState, useEffect } from 'react';
import { Popover, Box, Typography, Divider, Chip, IconButton, Snackbar, Alert, CircularProgress } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import { appLog } from '../common/LogViewer';

interface DefinitionPopoverProps {
  word: string;
  definition: string;
  examples?: string[];
  relatedTerms?: string[];
  pronunciation?: string;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onSave?: (word: string, definition: string) => void;
  isSaved?: boolean;
}

const DefinitionPopover: React.FC<DefinitionPopoverProps> = ({
  word,
  definition,
  examples,
  relatedTerms,
  pronunciation,
  anchorEl,
  onClose,
  onSave,
  isSaved = false
}) => {
  const open = Boolean(anchorEl);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Update saved state when isSaved prop changes
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleSpeakWord = () => {
    appLog('DefinitionPopover: Speaking word', 'info', { word });

    if ('speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(word);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        appLog('DefinitionPopover: Error speaking word', 'error', error);
        setSnackbarMessage('Unable to pronounce word');
        setSnackbarOpen(true);
      }
    } else {
      appLog('DefinitionPopover: Speech synthesis not supported', 'warning');
      setSnackbarMessage('Speech synthesis not supported in this browser');
      setSnackbarOpen(true);
    }
  };

  const handleSaveDefinition = async () => {
    if (!onSave) return;

    setLoading(true);
    appLog('DefinitionPopover: Saving definition', 'info', { word, definition });

    try {
      onSave(word, definition);
      setSaved(true);
      setSnackbarMessage(`"${word}" added to your vocabulary`);
      setSnackbarOpen(true);
    } catch (error) {
      appLog('DefinitionPopover: Error saving definition', 'error', error);
      setSnackbarMessage('Failed to save word to vocabulary');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{ maxWidth: '90vw' }}
      >
        <Box sx={{ p: 2, maxWidth: 350 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" component="h3">
              {word}
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={handleSpeakWord}
                title="Pronounce word"
                disabled={loading}
              >
                <VolumeUpIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleSaveDefinition}
                title={saved ? "Saved to vocabulary" : "Save to vocabulary"}
                disabled={loading || saved}
                color={saved ? "primary" : "default"}
              >
                {loading ? (
                  <CircularProgress size={16} />
                ) : saved ? (
                  <BookmarkIcon fontSize="small" />
                ) : (
                  <BookmarkBorderIcon fontSize="small" />
                )}
              </IconButton>
              <IconButton size="small" title="Share definition">
                <ShareIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {pronunciation && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {pronunciation}
            </Typography>
          )}

          <Divider sx={{ my: 1 }} />

          <Typography variant="body1">
            {definition}
          </Typography>

          {examples && examples.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Examples:</Typography>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {examples.map((example, index) => (
                  <li key={index}>
                    <Typography variant="body2" fontStyle="italic">
                      {example}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}

          {relatedTerms && relatedTerms.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">Related Terms:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {relatedTerms.map((term, index) => (
                  <Chip
                    key={index}
                    label={term}
                    size="small"
                    color="primary"
                    variant="outlined"
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarMessage.includes('Failed') ? "error" : "success"}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DefinitionPopover;
