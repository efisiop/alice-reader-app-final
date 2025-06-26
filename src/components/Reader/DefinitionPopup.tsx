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
  useTheme,
  Collapse
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  // New props for context-aware definitions
  fullDefinition?: DictionaryEntry | null;
  onShowFullDefinition?: () => void;
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
  isSaved = false,
  fullDefinition,
  onShowFullDefinition
}) => {
  const theme = useTheme();
  const [saved, setSaved] = useState<boolean>(isSaved);
  const [speaking, setSpeaking] = useState<boolean>(false);
  const [showFullDefinition, setShowFullDefinition] = useState<boolean>(false);
  
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

  // Handle show/hide full definition
  const handleToggleFullDefinition = () => {
    if (showFullDefinition) {
      setShowFullDefinition(false);
    } else {
      if (onShowFullDefinition) {
        onShowFullDefinition();
      }
      setShowFullDefinition(true);
    }
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

  // Determine which definition to show
  const displayDefinition = showFullDefinition && fullDefinition ? fullDefinition : definition;
  
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
          width: 350,
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
          
          {displayDefinition?.pronunciation && (
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {displayDefinition.pronunciation}
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
      ) : displayDefinition ? (
        <Box>
          {/* Context-aware indicator */}
          {displayDefinition.isContextAware && (
            <Box sx={{ mb: 1.5 }}>
              <Chip
                label="Context-aware"
                size="small"
                color="success"
                variant="outlined"
                sx={{ fontSize: '0.7rem', mb: 1 }}
              />
              {displayDefinition.contextScore && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Relevance: {Math.round(displayDefinition.contextScore * 100)}%
                </Typography>
              )}
            </Box>
          )}

          {/* Definition */}
          <Typography variant="body1" gutterBottom>
            {displayDefinition.definition}
          </Typography>

          {/* Show full definition toggle */}
          {definition?.isContextAware && fullDefinition && (
            <Box sx={{ mt: 1.5 }}>
              <Button
                size="small"
                variant="text"
                onClick={handleToggleFullDefinition}
                startIcon={showFullDefinition ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ fontSize: '0.8rem' }}
              >
                {showFullDefinition ? 'Show context-aware' : 'Show full definition'}
              </Button>
            </Box>
          )}
          
          {/* Examples */}
          {displayDefinition.examples && displayDefinition.examples.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Examples:
              </Typography>
              {displayDefinition.examples.map((example, index) => (
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
          {displayDefinition.relatedTerms && displayDefinition.relatedTerms.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Related:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {displayDefinition.relatedTerms.map((term, index) => (
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

          {/* Context keywords */}
          {displayDefinition.contextKeywords && displayDefinition.contextKeywords.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Context keywords:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {displayDefinition.contextKeywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    size="small"
                    variant="outlined"
                    color="secondary"
                    sx={{ fontSize: '0.7rem' }}
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
