import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  Drawer, Tabs, Tab, IconButton, Tooltip, Popover,
  Container, List, ListItem, ListItemText, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Menu, Alert,
  SpeedDial, SpeedDialAction, SpeedDialIcon
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
import { getBookWithChapters, getSectionsForPage, saveReadingProgress } from '../services/supabaseClient';
import { ALICE_BOOK_ID } from '../utils/bookIdUtils';
import WelcomePage from '../components/Reader/WelcomePage';
import { appLog } from '../components/LogViewer';
import FeedbackDialog from '../components/Reader/FeedbackDialog';
import HelpRequestDialog from '../components/Reader/HelpRequestDialog';
import PromptManager from '../components/Reader/PromptManager';
import TriggerNotificationBadge from '../components/Reader/TriggerNotificationBadge';
import ReadingProgressWidget from '../components/Reader/ReadingProgressWidget';

const ReaderInterface: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookData, setBookData] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageNumber, setPageNumber] = useState('1');
  const [sections, setSections] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [definitionAnchorEl, setDefinitionAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedWord, setSelectedWord] = useState('');
  const [definition, setDefinition] = useState<string | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [aiPromptAnchorEl, setAiPromptAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [helpRequestDialogOpen, setHelpRequestDialogOpen] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [showProgressWidget, setShowProgressWidget] = useState(true);

  // Load book data
  useEffect(() => {
    const loadBookData = async () => {
      try {
        appLog('ReaderInterface', 'Loading book data', 'info');
        setLoading(true);
        setError(null);

        const data = await getBookWithChapters(ALICE_BOOK_ID);

        if (!data) {
          appLog('ReaderInterface', 'Failed to load book data', 'error');
          setError('Failed to load book data. Please try again later.');
          setLoading(false);
          return;
        }

        appLog('ReaderInterface', 'Book data loaded successfully', 'success', { title: data.title });
        setBookData(data);
        setChapters(data.chapters || []);

        // Load initial page
        await loadPage(1);

        // Check for saved progress
        const savedProgress = localStorage.getItem('readingProgress');
        if (savedProgress) {
          appLog('ReaderInterface', 'Found saved reading progress', 'info', { sectionId: savedProgress });
          setSelectedSection(savedProgress);

          // Find the section in the loaded data
          let foundSection = null;
          for (const chapter of data.chapters || []) {
            for (const section of chapter.sections || []) {
              if (section.id === savedProgress) {
                foundSection = section;
                break;
              }
            }
            if (foundSection) break;
          }

          if (foundSection) {
            appLog('ReaderInterface', 'Loading saved section', 'info', {
              section: foundSection.title,
              page: foundSection.start_page
            });
            setCurrentSection(foundSection);
            await loadPage(foundSection.start_page);
          }
        }
      } catch (error) {
        appLog('ReaderInterface', 'Error loading book data', 'error', error);
        setError('An error occurred while loading the book. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadBookData();
  }, []);

  // Load page content
  const loadPage = async (page: number) => {
    try {
      appLog('ReaderInterface', 'Loading page content', 'info', { page });
      setLoading(true);
      setError(null);

      const sectionsData = await getSectionsForPage(ALICE_BOOK_ID, page);

      if (!sectionsData || sectionsData.length === 0) {
        appLog('ReaderInterface', 'No sections found for page', 'warning', { page });
        setError(`No content found for page ${page}.`);
        setSections([]);
        setLoading(false);
        return;
      }

      appLog('ReaderInterface', 'Page content loaded successfully', 'success', {
        page,
        sectionCount: sectionsData.length
      });

      setSections(sectionsData);
      setCurrentPage(page);

      // Update current section if it's on this page
      if (sectionsData.length > 0) {
        const firstSection = sectionsData[0];
        setCurrentSection(firstSection);
        setSelectedSection(firstSection.id);

        // Save reading progress
        saveProgress(firstSection.id);
      }
    } catch (error) {
      appLog('ReaderInterface', 'Error loading page content', 'error', error);
      setError('An error occurred while loading the page content. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle page navigation
  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageNumber);
    if (isNaN(page) || page < 1) {
      appLog('ReaderInterface', 'Invalid page number entered', 'warning', { input: pageNumber });
      return;
    }

    appLog('ReaderInterface', 'User navigated to page', 'info', { page });
    loadPage(page);
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle section selection
  const handleSectionClick = (section: any) => {
    appLog('ReaderInterface', 'User selected section', 'info', {
      section: section.title,
      page: section.start_page
    });

    setSelectedSection(section.id);
    setCurrentSection(section);
    loadPage(section.start_page);
    setDrawerOpen(false);
  };

  // Save reading progress
  const saveProgress = (sectionId: string) => {
    if (!user) {
      appLog('ReaderInterface', 'User not logged in, not saving progress to server', 'info');
      localStorage.setItem('readingProgress', sectionId);
      return;
    }

    try {
      appLog('ReaderInterface', 'Saving reading progress', 'info', { sectionId });

      // Save to localStorage as backup
      localStorage.setItem('readingProgress', sectionId);

      // Save to server
      if (user) {
        saveReadingProgress(user.id, ALICE_BOOK_ID, sectionId);
      }
    } catch (error) {
      appLog('ReaderInterface: Error saving reading progress', 'error', error);
    }
  };

  // Check if we should redirect to the dashboard or skip welcome
  useEffect(() => {
    // Check if we should skip the welcome page (set by admin dashboard)
    const skipWelcome = localStorage.getItem('skipWelcome');

    if (skipWelcome === 'true') {
      // Clear the flag so it's only used once
      localStorage.removeItem('skipWelcome');
      appLog('ReaderInterface', 'Skip welcome flag detected, proceeding to reader', 'info');
      setShowWelcome(false);
      return;
    }

    // Check if user has read before
    const hasReadBefore = localStorage.getItem('readingProgress');

    if (hasReadBefore) {
      appLog('ReaderInterface', 'User has read before, skipping welcome', 'info');
      setShowWelcome(false);
    }
  }, []);

  // Handle word selection for definition
  const handleWordClick = (event: React.MouseEvent<HTMLElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;

    const word = selection.toString().trim();
    if (word.length > 30) return; // Probably not a single word

    appLog('ReaderInterface', 'User selected word for definition', 'info', { word });

    setSelectedWord(word);
    setDefinitionAnchorEl(event.currentTarget);
    setDefinition(null);
    setLoadingDefinition(true);

    // Simulate fetching definition
    setTimeout(() => {
      // Mock definition for demo
      const definitions: Record<string, string> = {
        'Alice': 'The main character of the story, a young girl who falls down a rabbit hole into a fantasy world.',
        'Wonderland': 'A fictional setting in Lewis Carroll\'s novel, a strange and fantastical world.',
        'rabbit': 'A small mammal with long ears, a short tail, and powerful hind legs.',
        'curious': 'Eager to know or learn something; showing interest.',
        'tea': 'A hot drink made by infusing the dried, crushed leaves of the tea plant in boiling water.',
        'Queen': 'The female ruler of an independent state, especially one who inherits the position by right of birth.',
        'Cheshire': 'Relating to the English county of Cheshire, known for its dairy products.',
        'cat': 'A small domesticated carnivorous mammal with soft fur, a short snout, and retractable claws.',
        'mad': 'Mentally insane; extremely foolish or unwise.',
        'hatter': 'A person who makes, sells, or repairs hats.',
        'dormouse': 'A small rodent with a furry tail that spends most of the winter in a state of torpor.',
        'March': 'The third month of the year, in the northern hemisphere usually considered the first month of spring.',
        'Hare': 'A fast-running, long-eared mammal that resembles a large rabbit, noted for its speed and for boxing with others of its species.',
      };

      const definition = definitions[word] || 'No definition found for this word.';
      setDefinition(definition);
      setLoadingDefinition(false);

      appLog('ReaderInterface', 'Definition loaded', 'info', { word, hasDefinition: !!definitions[word] });
    }, 500);
  };

  // Handle definition popover close
  const handleDefinitionClose = () => {
    setDefinitionAnchorEl(null);
  };

  // Handle text selection for AI assistant
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim() === '') return;

      const text = selection.toString().trim();
      if (text.length < 20) return; // Too short for AI

      setSelectedText(text);
    };

    document.addEventListener('mouseup', handleTextSelection);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  // Show AI prompt after text selection
  useEffect(() => {
    if (!selectedText || selectedText.length < 20) return;

    // Don't show if definition popover is open
    if (definitionAnchorEl) return;

    const promptTimer = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Create a temporary element at the selection position
      const tempElement = document.createElement('span');
      tempElement.style.position = 'absolute';
      tempElement.style.left = `${rect.left + window.scrollX}px`;
      tempElement.style.top = `${rect.bottom + window.scrollY}px`;
      document.body.appendChild(tempElement);

      setAiPromptAnchorEl(tempElement);

      // Clean up
      setTimeout(() => {
        document.body.removeChild(tempElement);
      }, 100);
    }, 500);

    return () => clearTimeout(promptTimer);
  }, [selectedText, definitionAnchorEl]);

  // Handle AI prompt close
  const handleAiPromptClose = () => {
    setAiPromptAnchorEl(null);
    setSelectedText('');
  };

  // Handle AI prompt accept
  const handleAiPromptAccept = () => {
    appLog('ReaderInterface', 'User accepted AI prompt', 'info', { textLength: selectedText.length });
    handleAiPromptClose();
    // Here you would open the AI chat interface
    alert('AI Assistant would open here with the selected text as context.');
  };

  // Show welcome page if needed
  if (showWelcome && bookData) {
    return (
      <WelcomePage
        bookTitle={bookData.title || 'Alice in Wonderland'}
        onStartReading={() => {
          appLog('ReaderInterface', 'User clicked Start Reading on welcome page', 'info');
          setShowWelcome(false);
        }}
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
              localStorage.setItem('readingProgress', selectedSection);
              appLog('ReaderInterface', 'Saved reading progress before navigation', 'info', { sectionId: selectedSection });
            }
            navigate('/reader');
          }}
          aria-label="Back to Dashboard"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ ml: 2, flexGrow: 1 }}>
          {bookData?.title || 'Alice in Wonderland'}
        </Typography>
        <IconButton
          color="inherit"
          onClick={() => setDrawerOpen(true)}
          aria-label="Table of Contents"
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
                    onClick={() => loadPage(currentPage - 1)}
                    sx={{ mr: 1 }}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={loading}
                    onClick={() => loadPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {sections.map((section) => (
                <Box key={section.id} sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: 'primary.main',
                      fontWeight: section.id === selectedSection ? 'bold' : 'normal'
                    }}
                  >
                    {section.title}
                  </Typography>
                  <Typography
                    variant="body1"
                    paragraph
                    onMouseUp={handleWordClick}
                    sx={{ lineHeight: 1.7, textAlign: 'justify' }}
                  >
                    {section.content}
                  </Typography>
                </Box>
              ))}
            </Paper>

            <Box component="form" onSubmit={handlePageSubmit} sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Go to page:
              </Typography>
              <TextField
                size="small"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                sx={{ width: 80, mr: 2 }}
                type="number"
                inputProps={{ min: 1, max: 100 }}
                disabled={loading}
              />
              <Button
                type="submit"
                variant="contained"
                size="small"
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Go'}
              </Button>
            </Box>
          </>
        )}
      </Container>

      {/* Table of Contents Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Table of Contents</Typography>
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
                      primary={chapter.title}
                      primaryTypographyProps={{
                        fontWeight: 'bold',
                        color: 'primary.main'
                      }}
                    />
                  </ListItem>
                  <List disablePadding>
                    {chapter.sections.map((section: any) => (
                      <ListItem
                        key={section.id}
                        button
                        onClick={() => handleSectionClick(section)}
                        sx={{
                          pl: 4,
                          bgcolor: section.id === selectedSection ? 'action.selected' : 'transparent'
                        }}
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
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <BookmarkIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                You haven't added any bookmarks yet.
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Definition Popover */}
      <Popover
        open={Boolean(definitionAnchorEl)}
        anchorEl={definitionAnchorEl}
        onClose={handleDefinitionClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle1" gutterBottom>
            {selectedWord}
          </Typography>
          {loadingDefinition ? (
            <CircularProgress size={20} />
          ) : (
            <Typography variant="body2">
              {definition || 'No definition found.'}
            </Typography>
          )}
        </Box>
      </Popover>

      {/* AI Assistant Prompt */}
      <Popover
        open={Boolean(aiPromptAnchorEl)}
        anchorEl={aiPromptAnchorEl}
        onClose={handleAiPromptClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <SmartToyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1">
              Need help understanding this?
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 2 }}>
            I can explain this passage or answer questions about it.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={handleAiPromptClose}>
              No, thanks
            </Button>
            <Button size="small" variant="contained" onClick={handleAiPromptAccept}>
              Yes, help me
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* SpeedDial for feedback and help */}
      <SpeedDial
        ariaLabel="Reader actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
      >
        <SpeedDialAction
          icon={<FeedbackIcon />}
          tooltipTitle="Share Feedback"
          onClick={() => setFeedbackDialogOpen(true)}
        />
        <SpeedDialAction
          icon={<HelpOutlineIcon />}
          tooltipTitle="Ask for Help"
          onClick={() => setHelpRequestDialogOpen(true)}
        />
      </SpeedDial>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        bookId={ALICE_BOOK_ID}
        sectionId={currentSection?.id}
        sectionTitle={currentSection?.title}
      />

      {/* Help Request Dialog */}
      <HelpRequestDialog
        open={helpRequestDialogOpen}
        onClose={() => setHelpRequestDialogOpen(false)}
        bookId={ALICE_BOOK_ID}
        sectionId={currentSection?.id}
        sectionTitle={currentSection?.title}
        selectedText={selectedText}
      />

      {/* Reading Progress Widget */}
      {user && showProgressWidget && (
        <Box sx={{ position: 'fixed', bottom: 16, left: 16, zIndex: 1000, maxWidth: 300 }}>
          <ReadingProgressWidget
            userId={user.id}
            bookId={ALICE_BOOK_ID}
            currentPage={currentPage}
            totalPages={totalPages}
            expanded={false}
            onToggleExpand={() => {}}
          />
        </Box>
      )}

      {/* Notification Badge for new prompts */}
      {user && !showPrompts && (
        <TriggerNotificationBadge
          userId={user.id}
          bookId={ALICE_BOOK_ID}
          onClick={() => setShowPrompts(true)}
          position="top-right"
          color="primary"
        />
      )}

      {/* Prompt Manager for consultant-triggered prompts */}
      {user && showPrompts && (
        <PromptManager
          userId={user.id}
          bookId={ALICE_BOOK_ID}
          onResponse={(response, trigger) => {
            appLog('ReaderInterface', 'Prompt response received', 'info', {
              triggerId: trigger.id,
              triggerType: trigger.trigger_type,
              responseLength: response.length
            });
          }}
          onAllProcessed={() => {
            appLog('ReaderInterface', 'All prompts processed', 'info');
            setShowPrompts(false);
          }}
        />
      )}
    </Box>
  );
};

export default ReaderInterface;
