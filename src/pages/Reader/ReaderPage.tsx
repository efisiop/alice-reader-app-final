// src/pages/Reader/ReaderPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Drawer,
  Divider,
  TextField,
  Button,
  CircularProgress,
  Tooltip,
  Popover,
  Snackbar,
  Alert,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  useSnackbar
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useBookService, useAuthService, useAnalyticsService, useDictionaryService, useAIService, useTriggerService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../components/common/AccessibilityMenu';
import AccessibilityMenu from '../../components/common/AccessibilityMenu';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import GlossaryAwareTextHighlighter from '../../components/Reader/GlossaryAwareTextHighlighter';
import { useGlossaryTerms } from '../../hooks/useGlossaryTerms';

// Definition popup component
const DefinitionPopup: React.FC<{
  word: string;
  definition: string;
  onClose: () => void;
  onAskAI: () => void;
  anchorEl: HTMLElement | null;
}> = ({ word, definition, onClose, onAskAI, anchorEl }) => {
  return (
    <Popover
      open={Boolean(anchorEl)}
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
      sx={{ mt: 1 }}
    >
      <Box sx={{ p: 2, maxWidth: 300 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3">
            {word}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" paragraph>
          {definition}
        </Typography>
        <Button
          size="small"
          startIcon={<SmartToyIcon />}
          onClick={onAskAI}
          sx={{ mt: 1 }}
        >
          Ask AI about this
        </Button>
      </Box>
    </Popover>
  );
};

// AI Assistant drawer component
const AIAssistant: React.FC<{
  open: boolean;
  onClose: () => void;
  context?: { word: string; sentence: string };
}> = ({ open, onClose, context }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const { service: aiService } = useAIService();
  const { service: analyticsService } = useAnalyticsService();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial query based on context
  useEffect(() => {
    if (context && open) {
      if (context.word) {
        setQuery(`Tell me more about "${context.word}" in this context: "${context.sentence}"`);
      }
    }
  }, [context, open]);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || !aiService) return;

    // Add user message to conversation
    setConversation([...conversation, { role: 'user', content: query }]);

    // Track AI query
    if (analyticsService) {
      analyticsService.trackReaderAction('ai_query', {
        bookId: 'alice-in-wonderland',
        pageNumber: 1,
        content: query
      });
    }

    setLoading(true);

    try {
      const startTime = performance.now();
      const result = await aiService.getResponse(query, context?.sentence || '');

      // Add AI response to conversation
      setConversation([...conversation,
        { role: 'user', content: query },
        { role: 'assistant', content: result.response }
      ]);

      // Clear query input
      setQuery('');

      // Track response time
      if (analyticsService) {
        analyticsService.trackPerformance('api_call', performance.now() - startTime, {
          endpoint: 'ai_response',
          success: true
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Add error message to conversation
      setConversation([...conversation,
        { role: 'user', content: query },
        { role: 'assistant', content: 'I apologize, but I encountered an error processing your request. Please try again.' }
      ]);

      // Track error
      if (analyticsService) {
        analyticsService.trackEvent('ai_error', {
          query,
          error: String(error)
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 400 },
          p: 2,
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          AI Reading Assistant
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
        {conversation.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <SmartToyIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" paragraph>
              Ask me anything about the story, characters, or themes in Alice in Wonderland.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              I can help explain difficult passages, provide context, or discuss literary elements.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ px: 1 }}>
            {conversation.map((message, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  borderRadius: 2,
                  maxWidth: '85%',
                  bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  ml: message.role === 'user' ? 'auto' : 0,
                  boxShadow: 1
                }}
              >
                <Typography variant="body1">
                  {message.content}
                </Typography>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Ask about the story..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          multiline
          maxRows={3}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<HelpOutlineIcon />}
            component="a"
            href="/help/request"
            target="_blank"
          >
            Request Help
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={!query.trim() || loading}
            endIcon={loading ? <CircularProgress size={16} /> : <SmartToyIcon />}
          >
            {loading ? 'Thinking...' : 'Ask'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

// Subtle AI Prompt component
const SubtlePrompt: React.FC<{
  prompt: { id: string; message: string; type: string };
  onRespond: (promptId: string, response: string) => void;
  onDismiss: (promptId: string) => void;
}> = ({ prompt, onRespond, onDismiss }) => {
  return (
    <Snackbar
      open={true}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{ mb: 8 }}
    >
      <Alert
        severity="info"
        sx={{
          width: '100%',
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
        onClose={() => onDismiss(prompt.id)}
      >
        <Typography variant="body2" paragraph>
          {prompt.message}
        </Typography>
        {prompt.type === 'feedback' && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            {['😊', '🤔', '😕', '😄'].map((emoji) => (
              <Button
                key={emoji}
                variant="outlined"
                size="small"
                onClick={() => onRespond(prompt.id, emoji)}
                sx={{ minWidth: 'auto' }}
              >
                {emoji}
              </Button>
            ))}
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
};

const ReaderPage: React.FC = () => {
  const { bookId = 'alice-in-wonderland', pageNumber = '1' } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { service: bookService, loading: bookLoading } = useBookService();
  const { service: dictionaryService, loading: dictionaryLoading } = useDictionaryService();
  const { service: analyticsService } = useAnalyticsService();
  const { service: triggerService } = useTriggerService();
  const { settings: accessibilitySettings } = useAccessibility();

  // Content state
  const [bookData, setBookData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [definitionAnchorEl, setDefinitionAnchorEl] = useState<HTMLElement | null>(null);
  const [definition, setDefinition] = useState<string>('');
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiContext, setAiContext] = useState<{ word: string; sentence: string } | undefined>(undefined);
  const [subtlePrompt, setSubtlePrompt] = useState<any>(null);

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const pageStartTime = useRef<number>(performance.now());

  // Track performance
  const performance = usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'ReaderPage'
  });

  // Glossary terms for hover highlighting
  const { glossaryTerms, isLoading: glossaryLoading, error: glossaryError, termCount } = useGlossaryTerms();

  // Load book content
  useEffect(() => {
    console.log('ReaderPage: useEffect triggered for loading book content', {
      hasBookService: !!bookService,
      bookId,
      pageNumber
    });

    if (!bookService) {
      console.log('ReaderPage: No bookService available, skipping data load');
      return;
    }

    const loadBookContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const startTime = performance.now();
        const book = await bookService.getBook(bookId);
        performance.trackApiCall('getBook', startTime);

        console.log('ReaderPage: Book data received:', book);
        if (book) {
          setBookData(book);
          setTotalPages(book.totalPages || 100);
        } else {
          throw new Error('Failed to load book data');
        }

        // Get current page content
        const page = await bookService.getPage(bookId, parseInt(pageNumber));
        console.log('ReaderPage: Page data received:', page);
        if (page) {
          setCurrentPage(page);
          // Mark as initialized only after both book and page data are loaded
          setInitialized(true);
        } else {
          throw new Error('Failed to load page content');
        }

        // Track page view
        if (analyticsService && user) {
          analyticsService.trackPageView('reader_page', {
            userId: user.id,
            bookId,
            pageNumber
          });
        }

        // Reset page timer
        pageStartTime.current = performance.now();
      } catch (error) {
        console.error('Error loading book content:', error);
        setError('Failed to load book content. Please try again.');

        // Track error
        if (analyticsService) {
          analyticsService.trackEvent('reader_error', {
            bookId,
            pageNumber,
            error: String(error)
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadBookContent();
  }, [bookId, pageNumber, bookService, analyticsService, user, performance]);

  // Subscribe to subtle prompts
  useEffect(() => {
    if (!triggerService || !user) return;

    const unsubscribe = triggerService.subscribeToTriggers(user.id, (prompt) => {
      setSubtlePrompt(prompt);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [triggerService, user]);

  // Update reading progress when unmounting
  useEffect(() => {
    return () => {
      console.log('ReaderPage: Unmounting component, updating reading progress', {
        hasBookService: !!bookService,
        hasUser: !!user,
        bookId,
        pageNumber
      });

      if (bookService && user && bookId && pageNumber) {
        const readingTime = Math.round((performance.now() - pageStartTime.current) / 1000);

        // Only update if they spent at least 5 seconds on the page
        if (readingTime >= 5) {
          try {
            bookService.updateReadingProgress(
              user.id,
              bookId,
              parseInt(pageNumber),
              readingTime
            );

            console.log('ReaderPage: Successfully updated reading progress', {
              userId: user.id,
              bookId,
              pageNumber,
              readingTime
            });

            // Track reading session
            if (analyticsService) {
              analyticsService.trackEvent('reading_session', {
                bookId,
                pageNumber,
                duration: readingTime
              });
            }
          } catch (error) {
            console.error('ReaderPage: Error updating reading progress:', error);
          }
        }
      }
    };
  }, [bookService, user, bookId, pageNumber, analyticsService]);

  // Handle word selection
  const handleTextSelection = useCallback(async (event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.split(' ').length > 3) return;

    // Get the sentence containing the selected word
    const range = selection.getRangeAt(0);
    const sentenceNode = range.startContainer.parentNode;
    const sentence = sentenceNode?.textContent || '';

    setSelectedWord(selectedText);
    setSelectedSentence(sentence);
    setDefinitionAnchorEl(event.currentTarget as HTMLElement);

    // Look up definition
    if (dictionaryService) {
      try {
        const startTime = performance.now();
        const result = await dictionaryService.getDefinition(selectedText);
        performance.trackApiCall('getDefinition', startTime);

        setDefinition(result.definition || 'No definition found');

        // Track word lookup
        if (analyticsService && user) {
          analyticsService.trackReaderAction('definition', {
            bookId,
            pageNumber: parseInt(pageNumber),
            content: selectedText
          });
        }
      } catch (error) {
        console.error('Error getting definition:', error);
        setDefinition('Definition not available');
      }
    }
  }, [dictionaryService, analyticsService, user, bookId, pageNumber, performance]);

  // Handle navigation
  const navigateToPage = (newPage: number) => {
    console.log('ReaderPage: Navigating to page', { newPage, totalPages });
    if (newPage < 1 || newPage > totalPages) {
      console.log('ReaderPage: Invalid page number, not navigating');
      return;
    }

    // Update reading progress before navigating
    if (bookService && user && bookId) {
      const readingTime = Math.round((performance.now() - pageStartTime.current) / 1000);

      if (readingTime >= 5) {
        try {
          bookService.updateReadingProgress(
            user.id,
            bookId,
            parseInt(pageNumber),
            readingTime
          );
          console.log('ReaderPage: Updated reading progress before navigation');
        } catch (error) {
          console.error('ReaderPage: Error updating reading progress before navigation:', error);
        }
      }
    }

    // Reset state before navigating
    setInitialized(false);
    setLoading(true);

    console.log('ReaderPage: Navigating to', `/reader/${bookId}/page/${newPage}`);
    navigate(`/reader/${bookId}/page/${newPage}`);
  };

  // Handle AI assistant
  const openAIAssistant = (withContext?: boolean) => {
    setAiContext(withContext && selectedWord ? {
      word: selectedWord,
      sentence: selectedSentence || ''
    } : undefined);

    setAiDrawerOpen(true);
    setDefinitionAnchorEl(null);
  };

  // Handle prompt response
  const handlePromptResponse = (promptId: string, response: string) => {
    if (triggerService) {
      triggerService.markTriggerProcessed(promptId, response);
    }

    // Track response
    if (analyticsService) {
      analyticsService.trackEvent('prompt_response', {
        promptId,
        response
      });
    }

    setSubtlePrompt(null);
  };

  // Handle prompt dismiss
  const handlePromptDismiss = (promptId: string) => {
    if (triggerService) {
      triggerService.markTriggerProcessed(promptId, 'dismissed');
    }

    // Track dismiss
    if (analyticsService) {
      analyticsService.trackEvent('prompt_dismissed', {
        promptId
      });
    }

    setSubtlePrompt(null);
  };

  // Show loading state
  if (loading || bookLoading || dictionaryLoading) {
    console.log('ReaderPage: Showing loading state');
    return <LoadingSkeleton type="reader" />;
  }

  // Show error state
  if (error) {
    console.log('ReaderPage: Showing error state:', error);
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/reader')}
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  // Check if required data is loaded and initialized
  if (!initialized || !bookData || !currentPage) {
    console.log('ReaderPage: Not fully initialized or missing required data', {
      initialized,
      bookData,
      currentPage
    });
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          Something went wrong... Cannot access required data.
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The reader page could not be loaded because some required data is missing.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/reader')}
          startIcon={<HomeIcon />}
          sx={{ mt: 2 }}
        >
          Return to Dashboard
        </Button>
      </Box>
    );
  }

  // Apply font size from accessibility settings
  const fontSizeStyle = {
    fontSize: `${accessibilitySettings.fontSize / 100}rem`,
    lineHeight: accessibilitySettings.lineHeight
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          boxShadow: 1,
          p: 1
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/reader')} aria-label="Back to dashboard">
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              {bookData?.title || "Alice in Wonderland"}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              Page {pageNumber} of {totalPages}
            </Typography>
            <AccessibilityMenu />
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper
          elevation={2}
          sx={{
            p: 4,
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Typography variant="h5" component="h1" gutterBottom>
            {currentPage?.title || `Chapter ${pageNumber}`}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Glossary terms indicator */}
          {!glossaryLoading && termCount > 0 && (
            <Box sx={{ mb: 2, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                ✨ Alice Glossary Active: {termCount} technical terms available for highlighting
              </Typography>
            </Box>
          )}

          <Box
            ref={contentRef}
            onClick={handleTextSelection}
            sx={{
              mt: 2,
              '& p': {
                ...fontSizeStyle,
                mb: 2
              }
            }}
          >
            {currentPage?.content ? (
              <GlossaryAwareTextHighlighter
                text={currentPage.content}
                onWordSelect={(word, element) => {
                  console.log('Word selected:', word);
                  // Handle word selection for definitions
                  setSelectedWord(word);
                  setDefinitionAnchorEl(element);
                }}
                onTextSelect={(text) => {
                  console.log('Text selected:', text);
                  // Handle text selection
                }}
                fontSize="1.1rem"
                lineHeight={1.8}
                fontFamily="Georgia, serif"
                glossaryTerms={glossaryTerms}
                normalWordHoverColor="rgba(25, 118, 210, 0.1)"
                technicalWordHoverColor="rgba(255, 152, 0, 0.2)"
              />
            ) : (
              <Typography variant="body1">
                No content available for this page.
              </Typography>
            )}
          </Box>

          {/* Page Navigation */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 4
            }}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigateToPage(parseInt(pageNumber) - 1)}
              disabled={parseInt(pageNumber) <= 1}
            >
              Previous
            </Button>

            <Button
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigateToPage(parseInt(pageNumber) + 1)}
              disabled={parseInt(pageNumber) >= totalPages}
            >
              Next
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Definition Popup */}
      {selectedWord && (
        <DefinitionPopup
          word={selectedWord}
          definition={definition}
          onClose={() => setDefinitionAnchorEl(null)}
          onAskAI={() => openAIAssistant(true)}
          anchorEl={definitionAnchorEl}
        />
      )}

      {/* AI Assistant Drawer */}
      <AIAssistant
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        context={aiContext}
      />

      {/* AI Assistant FAB */}
      <Zoom in={!aiDrawerOpen}>
        <Fab
          color="primary"
          aria-label="AI Assistant"
          onClick={() => openAIAssistant()}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16
          }}
        >
          <SmartToyIcon />
        </Fab>
      </Zoom>

      {/* Subtle Prompt */}
      {subtlePrompt && (
        <SubtlePrompt
          prompt={subtlePrompt}
          onRespond={handlePromptResponse}
          onDismiss={handlePromptDismiss}
        />
      )}
    </Box>
  );
};

export default ReaderPage;
