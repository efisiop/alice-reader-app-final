// src/pages/ReaderInterface.ai.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  Drawer, Tabs, Tab, IconButton, Tooltip,
  Container, List, ListItem, ListItemText, CircularProgress,
  Alert, SpeedDial, SpeedDialAction, SpeedDialIcon
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import QuizIcon from '@mui/icons-material/Quiz';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RefreshIcon from '@mui/icons-material/Refresh';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { useAuth } from '../contexts/AuthContext';
import { useReader, ReaderProvider } from '../contexts/ReaderContext';
import { getDefinition, logDictionaryLookup, saveToVocabulary, DictionaryEntry } from '../services/dictionaryService';
import { checkIfUserNeedsHelp, AIMode } from '../services/aiService';
import WelcomePage from '../components/Reader/WelcomePage';
import { appLog } from '../components/LogViewer';
import FeedbackDialog from '../components/Reader/FeedbackDialog';
import HelpRequestDialog from '../components/Reader/HelpRequestDialog';
import TextHighlighter from '../components/Reader/TextHighlighter';
import DefinitionPopup from '../components/Reader/DefinitionPopup';
import AIChat from '../components/Reader/AIChat';
import AIHelpOffer from '../components/Reader/AIHelpOffer';
import AIAssistantButton from '../components/Reader/AIAssistantButton';
import { BookId } from '../types/idTypes';

// Reader interface component that uses the ReaderContext
const ReaderInterfaceContent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    bookData, 
    chapters, 
    sections, 
    currentPage, 
    totalPages,
    selectedSection,
    loading, 
    error,
    loadPage,
    saveProgress,
    navigateToPage,
    navigateToSection
  } = useReader();
  
  // Local state
  const [pageNumber, setPageNumber] = useState(currentPage.toString());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Dictionary state
  const [definitionAnchorEl, setDefinitionAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedWord, setSelectedWord] = useState('');
  const [definition, setDefinition] = useState<DictionaryEntry | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  
  // AI assistant state
  const [selectedText, setSelectedText] = useState('');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiMode, setAiMode] = useState<AIMode>('chat');
  const [showHelpOffer, setShowHelpOffer] = useState(false);
  
  // Dialog state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Update page number input when current page changes
  useEffect(() => {
    setPageNumber(currentPage.toString());
  }, [currentPage]);
  
  // Check if user needs help periodically
  useEffect(() => {
    if (!user || !bookData || !selectedSection) return;
    
    // Check every 2 minutes
    const interval = setInterval(async () => {
      const needsHelp = await checkIfUserNeedsHelp(
        user.id,
        bookData.id,
        selectedSection
      );
      
      if (needsHelp) {
        setShowHelpOffer(true);
      }
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, bookData, selectedSection]);
  
  // Handle page number input change
  const handlePageNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageNumber(e.target.value);
  };
  
  // Handle page number submit
  const handlePageSubmit = () => {
    const page = parseInt(pageNumber);
    if (isNaN(page) || page < 1 || page > (totalPages || 1)) {
      appLog('ReaderInterface', 'Invalid page number', 'warning', { page });
      return;
    }
    
    navigateToPage(page);
  };
  
  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle section selection
  const handleSectionSelect = (sectionId: string) => {
    saveProgress(sectionId);
    setDrawerOpen(false);
  };
  
  // Handle word selection for definition
  const handleWordSelect = useCallback(async (word: string, element: HTMLElement) => {
    // Clean the word
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    if (!cleanWord) return;
    
    setSelectedWord(cleanWord);
    setDefinitionAnchorEl(element);
    setLoadingDefinition(true);
    setDefinition(null);
    
    appLog('ReaderInterface', 'Looking up definition', 'info', { word: cleanWord });
    
    try {
      // Get definition
      const definitionData = await getDefinition(
        bookData?.id || 'alice-in-wonderland', 
        cleanWord,
        selectedSection || undefined
      );
      
      setDefinition(definitionData);
      
      // Log the lookup for analytics
      if (user) {
        logDictionaryLookup(
          user.id,
          bookData?.id || 'alice-in-wonderland',
          selectedSection || undefined,
          cleanWord,
          !!definitionData
        );
      }
    } catch (error) {
      appLog('ReaderInterface', 'Error getting definition', 'error', error);
      setDefinition({
        term: cleanWord,
        definition: 'Error getting definition. Please try again.',
        source: 'fallback'
      });
    } finally {
      setLoadingDefinition(false);
    }
  }, [bookData?.id, selectedSection, user]);
  
  // Handle definition popup close
  const handleDefinitionClose = () => {
    setDefinitionAnchorEl(null);
    setSelectedWord('');
  };
  
  // Handle save to vocabulary
  const handleSaveToVocabulary = (term: string, definition: string) => {
    if (!user) {
      appLog('ReaderInterface', 'User not logged in, cannot save to vocabulary', 'warning');
      return;
    }
    
    saveToVocabulary(user.id, term, definition);
    appLog('ReaderInterface', 'Saved word to vocabulary', 'success', { term });
  };
  
  // Handle text selection for AI assistant
  const handleTextSelect = (text: string) => {
    if (text.trim().length > 0) {
      setSelectedText(text);
    }
  };
  
  // Handle AI mode selection
  const handleAiModeSelect = (mode: AIMode) => {
    setAiMode(mode);
    setAiChatOpen(true);
  };
  
  // Handle AI chat close
  const handleAiChatClose = () => {
    setAiChatOpen(false);
    setSelectedText('');
  };
  
  // Handle help offer accept
  const handleHelpOfferAccept = () => {
    setAiMode('chat');
    setAiChatOpen(true);
  };
  
  // Handle help offer decline
  const handleHelpOfferDecline = () => {
    // Do nothing, just close the offer
  };
  
  // Handle help offer close
  const handleHelpOfferClose = () => {
    setShowHelpOffer(false);
  };
  
  // Handle feedback dialog open
  const handleFeedbackOpen = () => {
    setFeedbackDialogOpen(true);
  };
  
  // Handle feedback dialog close
  const handleFeedbackClose = () => {
    setFeedbackDialogOpen(false);
  };
  
  // Handle help dialog open
  const handleHelpOpen = () => {
    setHelpDialogOpen(true);
  };
  
  // Handle help dialog close
  const handleHelpClose = () => {
    setHelpDialogOpen(false);
  };
  
  // Handle welcome page close
  const handleWelcomeClose = () => {
    setShowWelcome(false);
    appLog('ReaderInterface', 'Welcome page closed', 'info');
  };
  
  // Render welcome page if needed
  if (showWelcome) {
    return (
      <WelcomePage onClose={handleWelcomeClose} />
    );
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', p: 2, display: 'flex', alignItems: 'center' }}>
        <IconButton
          color="inherit"
          onClick={() => {
            appLog('ReaderInterface', 'User clicked back to dashboard button', 'info');
            // Save current progress before navigating back
            if (selectedSection) {
              appLog('ReaderInterface', 'Saved reading progress before navigation', 'info', { sectionId: selectedSection });
            }
            navigate('/reader');
          }}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          {bookData?.title || 'Alice in Wonderland'}
        </Typography>
        
        <IconButton
          color="inherit"
          onClick={() => setDrawerOpen(true)}
          sx={{ ml: 2 }}
        >
          <MenuBookIcon />
        </IconButton>
      </Box>
      
      {/* Main content */}
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => loadPage(currentPage)}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        ) : (
          <>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  Page {currentPage}
                </Typography>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={currentPage <= 1 || loading}
                    onClick={() => navigateToPage(currentPage - 1)}
                    sx={{ mr: 1 }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={currentPage >= (totalPages || 1) || loading}
                    onClick={() => navigateToPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {sections.map((section) => (
                <Box key={section.id} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    {section.chapter_title} - {section.title}
                  </Typography>
                  
                  {/* Use TextHighlighter for interactive text */}
                  <TextHighlighter
                    text={section.content}
                    onWordSelect={handleWordSelect}
                    onTextSelect={handleTextSelect}
                    fontSize="1.1rem"
                    lineHeight={1.7}
                    fontFamily="Georgia, serif"
                  />
                </Box>
              ))}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    label="Page"
                    type="number"
                    size="small"
                    value={pageNumber}
                    onChange={handlePageNumberChange}
                    sx={{ width: '80px', mr: 1 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handlePageSubmit}
                  >
                    Go
                  </Button>
                </Box>
                <Typography variant="body2">
                  Page {currentPage} of {totalPages || '?'}
                </Typography>
              </Box>
            </Paper>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<FeedbackIcon />}
                onClick={handleFeedbackOpen}
              >
                Feedback
              </Button>
              <Button
                variant="outlined"
                startIcon={<HelpOutlineIcon />}
                onClick={handleHelpOpen}
              >
                Help
              </Button>
            </Box>
          </>
        )}
      </Container>
      
      {/* Chapter/Section drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Contents</Typography>
            <IconButton onClick={() => setDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Chapters" />
            <Tab label="Bookmarks" />
          </Tabs>
          
          {tabValue === 0 && (
            <List>
              {chapters.map((chapter) => (
                <React.Fragment key={chapter.id}>
                  <ListItem>
                    <ListItemText
                      primary={`Chapter ${chapter.number}: ${chapter.title}`}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                  </ListItem>
                  <List disablePadding>
                    {chapter.sections?.map((section: any) => (
                      <ListItem
                        key={section.id}
                        button
                        selected={selectedSection === section.id}
                        onClick={() => handleSectionSelect(section.id)}
                        sx={{ pl: 4 }}
                      >
                        <ListItemText
                          primary={section.title}
                          secondary={`Page ${section.start_page}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </React.Fragment>
              ))}
            </List>
          )}
          
          {tabValue === 1 && (
            <Typography variant="body2" sx={{ p: 2 }}>
              Bookmarks feature coming soon!
            </Typography>
          )}
        </Box>
      </Drawer>
      
      {/* Definition popup */}
      <DefinitionPopup
        open={Boolean(definitionAnchorEl)}
        anchorEl={definitionAnchorEl}
        onClose={handleDefinitionClose}
        term={selectedWord}
        definition={definition}
        loading={loadingDefinition}
        onSaveToVocabulary={user ? handleSaveToVocabulary : undefined}
      />
      
      {/* AI assistant button */}
      <AIAssistantButton
        bookId={bookData?.id}
        sectionId={selectedSection}
        userId={user?.id}
        selectedText={selectedText}
        position="bottom-right"
        variant="speed-dial"
      />
      
      {/* AI help offer */}
      {showHelpOffer && user && bookData && selectedSection && (
        <AIHelpOffer
          bookId={bookData.id}
          sectionId={selectedSection}
          userId={user.id}
          onAccept={handleHelpOfferAccept}
          onDecline={handleHelpOfferDecline}
          onClose={handleHelpOfferClose}
          variant="slide"
          position="bottom"
        />
      )}
      
      {/* Feedback dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={handleFeedbackClose}
        bookId={bookData?.id}
        sectionId={selectedSection}
      />
      
      {/* Help request dialog */}
      <HelpRequestDialog
        open={helpDialogOpen}
        onClose={handleHelpClose}
        bookId={bookData?.id}
        sectionId={selectedSection}
      />
    </Box>
  );
};

// Wrapper component that provides the ReaderContext
const ReaderInterface: React.FC = () => {
  const { bookId = 'alice-in-wonderland' } = useParams<{ bookId?: string }>();
  
  return (
    <ReaderProvider bookId={bookId}>
      <ReaderInterfaceContent />
    </ReaderProvider>
  );
};

export default ReaderInterface;
