// src/components/Reader/DefinitionPopup.tsx
import React, { useState } from 'react';
import {
  Popover,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Tooltip,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { DictionaryEntry } from '../../services/dictionaryService';
import { appLog } from '../LogViewer';

interface DefinitionPopupProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  term: string;
  definition: DictionaryEntry | null;
  loading: boolean;
  onSaveToVocabulary?: (term: string, definition: string) => void;
  isSaved?: boolean;
}

/**
 * Component for displaying word definitions in a popup
 */
const DefinitionPopup: React.FC<DefinitionPopupProps> = ({
  open,
  anchorEl,
  onClose,
  term,
  definition,
  loading,
  onSaveToVocabulary,
  isSaved = false
}) => {
  const theme = useTheme();
  const [saved, setSaved] = useState<boolean>(isSaved);
  const [speaking, setSpeaking] = useState<boolean>(false);
  
  // Handle save to vocabulary
  const handleSave = () => {
    if (!definition) return;
    
    if (onSaveToVocabulary) {
      onSaveToVocabulary(term, definition.definition);
      setSaved(true);
      appLog('DefinitionPopup', 'Term saved to vocabulary', 'info', { term });
    }
  };
  
  // Handle text-to-speech
  const handleSpeak = () => {
    if (!definition || !window.speechSynthesis) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(term);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    
    // Set speaking state
    setSpeaking(true);
    
    // Add event listeners
    utterance.onend = () => {
      setSpeaking(false);
    };
    
    utterance.onerror = () => {
      setSpeaking(false);
      appLog('DefinitionPopup', 'Speech synthesis error', 'error');
    };
    
    // Speak
    window.speechSynthesis.speak(utterance);
    
    appLog('DefinitionPopup', 'Speaking term', 'info', { term });
  };
  
  // Get source label
  const getSourceLabel = () => {
    if (!definition || !definition.source) return 'Unknown';
    
    switch (definition.source) {
      case 'database':
        return 'Dictionary';
      case 'local':
        return 'Local';
      case 'external':
        return 'Web';
      case 'fallback':
        return 'Fallback';
      default:
        return 'Unknown';
    }
  };
  
  return (
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
      sx={{
        '& .MuiPopover-paper': {
          width: 320,
          maxWidth: '90vw',
          padding: 2,
          borderRadius: 1,
          boxShadow: theme.shadows[3]
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
            {term}
          </Typography>
          
          {definition?.pronunciation && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {definition.pronunciation}
            </Typography>
          )}
          
          <Tooltip title="Pronounce">
            <IconButton
              size="small"
              onClick={handleSpeak}
              disabled={speaking || !window.speechSynthesis}
              sx={{ ml: 0.5 }}
            >
              <VolumeUpIcon fontSize="small" color={speaking ? 'primary' : 'action'} />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Box>
          {onSaveToVocabulary && (
            <Tooltip title={saved ? "Saved to vocabulary" : "Save to vocabulary"}>
              <IconButton size="small" onClick={handleSave} disabled={saved || !definition}>
                {saved ? <BookmarkIcon fontSize="small" color="primary" /> : <BookmarkBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          
          <IconButton size="small" onClick={onClose} sx={{ ml: 0.5 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 1.5 }} />
      
      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : definition ? (
        <Box>
          {/* Definition */}
          <Typography variant="body1" gutterBottom>
            {definition.definition}
          </Typography>
          
          {/* Examples */}
          {definition.examples && definition.examples.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Examples:
              </Typography>
              {definition.examples.map((example, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    fontStyle: 'italic',
                    color: 'text.secondary',
                    mb: 0.5,
                    pl: 1,
                    borderLeft: `2px solid ${theme.palette.divider}`
                  }}
                >
                  {example}
                </Typography>
              ))}
            </Box>
          )}
          
          {/* Related terms */}
          {definition.relatedTerms && definition.relatedTerms.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Related:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {definition.relatedTerms.map((term, index) => (
                  <Chip
                    key={index}
                    label={term}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {/* Source */}
          <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              label={`Source: ${getSourceLabel()}`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ fontSize: '0.7rem' }}
            />
            
            {onSaveToVocabulary && !saved && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<BookmarkBorderIcon />}
                onClick={handleSave}
                sx={{ fontSize: '0.75rem' }}
              >
                Save to Vocabulary
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ py: 1 }}>
          No definition found for "{term}".
        </Typography>
      )}
    </Popover>
  );
};

export default DefinitionPopup;
