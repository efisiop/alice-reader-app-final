// src/pages/ReaderInterface.dictionary.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  Drawer, Tabs, Tab, IconButton, Tooltip,
  Container, List, ListItem, ListItemText, CircularProgress,
  Alert, SpeedDial, SpeedDialAction, SpeedDialIcon, Chip
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
import WelcomePage from '../components/Reader/WelcomePage';
import { appLog } from '../components/LogViewer';
import FeedbackDialog from '../components/Reader/FeedbackDialog';
import HelpRequestDialog from '../components/Reader/HelpRequestDialog';
import GlossaryAwareTextHighlighter from '../components/Reader/GlossaryAwareTextHighlighter';
import DefinitionPopup from '../components/Reader/DefinitionPopup';
import { useGlossaryTerms } from '../hooks/useGlossaryTerms';
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
  
  // Glossary terms hook
  const { glossaryTerms, isLoading: glossaryLoading, error: glossaryError, termCount } = useGlossaryTerms();
  
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
  const [aiPromptAnchorEl, setAiPromptAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedText, setSelectedText] = useState('');
  
  // Dialog state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Update page number input when current page changes
  useEffect(() => {
    setPageNumber(currentPage.toString());
  }, [currentPage]);
  
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
  const handleWordSelect = useCallback(async (word: string, element: HTMLElement, context?: string) => {
    // Clean the word
    const cleanWord = word.replace(/[.,!?;:'"]/g, '').trim();
    if (!cleanWord) return;
    
    setSelectedWord(cleanWord);
    setDefinitionAnchorEl(element);
    setLoadingDefinition(true);
    setDefinition(null);
    
    appLog('ReaderInterface', 'Looking up definition', 'info', { word: cleanWord, hasContext: !!context });
    
    try {
      // Get definition with context if available
      let definitionData;
      if (context && context.trim().length > 0) {
        definitionData = await getDefinition(
          bookData?.id || 'alice-in-wonderland', 
          cleanWord,
          selectedSection || undefined,
          context // Pass context as additional parameter
        );
      } else {
        definitionData = await getDefinition(
        bookData?.id || 'alice-in-wonderland', 
        cleanWord,
        selectedSection || undefined
      );
      }
      
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
  
  // Handle text selection for AI prompt
  const handleTextSelect = (text: string) => {
    if (text.trim().length > 0) {
      setSelectedText(text);
    }
  };
  
  // Handle AI prompt button click
  const handleAiPromptClick = (event: React.MouseEvent<HTMLElement>) => {
    setAiPromptAnchorEl(event.currentTarget);
  };
  
  // Handle AI prompt close
  const handleAiPromptClose = () => {
    setAiPromptAnchorEl(null);
    setSelectedText('');
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
      <WelcomePage 
        bookTitle={bookData?.title || 'Alice in Wonderland'}
        onStartReading={handleWelcomeClose}
      />
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
            {/* Glossary Status */}
            <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                    ✨ Alice in Wonderland Glossary
                  </Typography>
                  {glossaryLoading && (
                    <Typography variant="body2" color="text.secondary">
                      Loading {termCount} glossary terms...
                    </Typography>
                  )}
                  {glossaryError && (
                    <Typography variant="body2" color="error">
                      Error loading glossary: {glossaryError}
                    </Typography>
                  )}
                  {!glossaryLoading && termCount > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                        ✅ {termCount} Alice terms loaded
                      </Typography>
                      <Chip 
                        label="Enhanced highlighting" 
                        size="small" 
                        color="warning" 
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span 
                    className="glossary-term" 
                    style={{ 
                      display: 'inline-block', 
                      padding: '4px 8px',
                      fontSize: '1rem'
                    }}
                  >
                    Alice
                  </span>
                  <Typography variant="body2" color="text.secondary">
                    Orange = Alice terms
                  </Typography>
                </Box>
              </Box>
            </Paper>

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
                  
                  {/* Enhanced GlossaryAwareTextHighlighter with Alice terms */}
                  <GlossaryAwareTextHighlighter
                    text={section.content}
                    onWordSelect={handleWordSelect}
                    onTextSelect={handleTextSelect}
                    fontSize="1.1rem"
                    lineHeight={1.7}
                    fontFamily="Georgia, serif"
                    glossaryTerms={glossaryTerms}
                    normalWordHoverColor="rgba(25, 118, 210, 0.1)"
                    technicalWordHoverColor="rgba(255, 152, 0, 0.3)"
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
      
      {/* AI prompt speed dial */}
      {selectedText && (
        <SpeedDial
          ariaLabel="AI Assistance"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          icon={<SpeedDialIcon />}
          open={Boolean(aiPromptAnchorEl)}
          onClose={handleAiPromptClose}
          onOpen={() => setAiPromptAnchorEl(document.body)}
        >
          <SpeedDialAction
            icon={<SmartToyIcon />}
            tooltipTitle="Explain this"
            onClick={handleAiPromptClose}
          />
          <SpeedDialAction
            icon={<QuizIcon />}
            tooltipTitle="Quiz me"
            onClick={handleAiPromptClose}
          />
          <SpeedDialAction
            icon={<InsertEmoticonIcon />}
            tooltipTitle="Simplify"
            onClick={handleAiPromptClose}
          />
        </SpeedDial>
      )}
      
      {/* Feedback dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={handleFeedbackClose}
        bookId={bookData?.id || 'alice-in-wonderland'}
        sectionId={selectedSection || undefined}
      />
      
      {/* Help request dialog */}
      <HelpRequestDialog
        open={helpDialogOpen}
        onClose={handleHelpClose}
        bookId={bookData?.id || 'alice-in-wonderland'}
        sectionId={selectedSection || undefined}
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
