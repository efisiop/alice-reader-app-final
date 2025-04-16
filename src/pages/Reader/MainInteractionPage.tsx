import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme,
  useMediaQuery,
  Drawer,
  IconButton,
  Button,
  Alert,
  TextField,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Collapse,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSnackbar } from '../../utils/notistackUtils';
import { useBookService, useAuthService } from '../../hooks/useService';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { LoadingButton } from '../../components/common/LoadingButton';

// Icons
import HelpIcon from '@mui/icons-material/Help';
import HomeIcon from '@mui/icons-material/Home';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import SearchIcon from '@mui/icons-material/Search';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import UpdateIcon from '@mui/icons-material/Update';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ChatIcon from '@mui/icons-material/Chat';
import BookIcon from '@mui/icons-material/Book';
import CloseIcon from '@mui/icons-material/Close';

// Types
interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  sections?: Section[];
}

interface Section {
  id: string;
  section_number: number;
  title: string;
  content?: string;
}

const MainInteractionPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { service: bookService, loading: bookServiceLoading } = useBookService();
  const { service: authService } = useAuthService();
  const { enqueueSnackbar } = useSnackbar();

  // State for book structure and selection
  const [bookData, setBookData] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

  // State for page and section selection
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [pageInputValue, setPageInputValue] = useState<string>('1');
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  // State for selected section
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [sectionContent, setSectionContent] = useState<string | null>(null);
  const [isLoadingSection, setIsLoadingSection] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [showSectionContent, setShowSectionContent] = useState(false);

  // State for reading progress
  const [readingProgress, setReadingProgress] = useState<any>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);

  // State for sidebar and UI
  const [sidebarContent, setSidebarContent] = useState<'context' | 'definition' | 'ai'>('context');
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [definitionData, setDefinitionData] = useState<any>(null);
  const [isLoadingDefinition, setIsLoadingDefinition] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Refs
  const textAreaRef = useRef<HTMLDivElement>(null);

  // Add keyboard event listener for Escape key to clear definition
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && sidebarContent === 'definition') {
        clearDefinition();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarContent]);

  // Load book data and reading progress
  useEffect(() => {
    loadBookData();
    loadReadingProgress();
  }, []);

  // Load section content when selection changes
  useEffect(() => {
    if (selectedSectionId) {
      loadSectionContent(selectedSectionId);
    }
  }, [selectedSectionId]);

  // Update page input value when reading progress changes
  useEffect(() => {
    if (readingProgress && readingProgress.currentPage) {
      setCurrentPageNumber(readingProgress.currentPage);
      setPageInputValue(readingProgress.currentPage.toString());
    }
  }, [readingProgress]);

  const loadBookData = async () => {
    if (!bookService) return;

    try {
      setIsLoadingBook(true);
      setBookError(null);
      console.log('Loading book data');

      const bookId = 'alice-in-wonderland'; // Hardcoded for now
      const data = await bookService.getBook(bookId);

      if (!data || !data.chapters) {
        throw new Error('Book data is incomplete or missing');
      }

      console.log('Book data loaded:', data);
      setBookData(data);

      // Transform chapters data to include sections
      const chaptersWithSections = data.chapters.map((chapter: any) => ({
        ...chapter,
        sections: Array.from({ length: 5 }, (_, i) => ({
          id: `${chapter.id}_section_${i + 1}`,
          section_number: i + 1,
          title: `Section ${i + 1}`,
        })),
      }));

      setChapters(chaptersWithSections);

      // Select first chapter by default
      if (chaptersWithSections.length > 0) {
        setSelectedChapterId(chaptersWithSections[0].id);

        // Select first section by default
        if (chaptersWithSections[0].sections && chaptersWithSections[0].sections.length > 0) {
          setSelectedSectionId(chaptersWithSections[0].sections[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading book data:', error);
      setBookError(error instanceof Error ? error.message : 'Failed to load book data');
    } finally {
      setIsLoadingBook(false);
    }
  };

  const loadReadingProgress = async () => {
    if (!bookService || !user) return;

    try {
      setIsLoadingProgress(true);
      setProgressError(null);
      console.log('Loading reading progress');

      const bookId = 'alice-in-wonderland'; // Hardcoded for now
      const progress = await bookService.getReadingProgress(user.id, bookId);

      console.log('Reading progress loaded:', progress);
      setReadingProgress(progress);
    } catch (error) {
      console.error('Error loading reading progress:', error);
      setProgressError(error instanceof Error ? error.message : 'Failed to load reading progress');
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const fetchSectionsByPage = async (pageNumber: number) => {
    if (!bookService) return;

    try {
      setIsLoadingSections(true);
      setSectionsError(null);
      console.log('Fetching sections for page:', pageNumber);

      // Update current page number
      setCurrentPageNumber(pageNumber);

      // In a real app, you'd call the getSectionsByPage API
      // For now, we'll generate mock sections
      const bookId = 'alice-in-wonderland'; // Hardcoded for now

      // Simulate API call with timeout
      setTimeout(() => {
        // Generate 2-4 mock sections for this page
        const numSections = Math.floor(Math.random() * 3) + 2;
        const mockSections = Array.from({ length: numSections }, (_, i) => {
          const sectionId = `page_${pageNumber}_section_${i + 1}`;
          return {
            id: sectionId,
            title: `Page ${pageNumber} - Section ${i + 1}`,
            preview: `This is a preview of section ${i + 1} on page ${pageNumber}...`,
            page_number: pageNumber
          };
        });

        setAvailableSections(mockSections);
        setIsLoadingSections(false);

        // Update reading progress
        if (user) {
          const bookId = 'alice-in-wonderland';
          const readingTime = 0; // Not tracking reading time in this example
          bookService.updateReadingProgress(user.id, bookId, pageNumber, readingTime)
            .then(() => {
              // Update local state
              setReadingProgress({
                ...readingProgress,
                currentPage: pageNumber,
                percentage_complete: Math.round((pageNumber / 100) * 100) // Assuming 100 total pages
              });
            })
            .catch(error => {
              console.error('Error updating reading progress:', error);
            });
        }
      }, 500);
    } catch (error) {
      console.error('Error fetching sections by page:', error);
      setSectionsError(error instanceof Error ? error.message : 'Failed to fetch sections');
      setIsLoadingSections(false);
    }
  };

  const loadSectionContent = async (sectionId: string) => {
    try {
      setIsLoadingSection(true);
      setSectionError(null);
      console.log('Loading section content for:', sectionId);

      // Extract page and section numbers from the ID
      const [_, pageNumber, __, sectionNumber] = sectionId.split('_');

      // In a real app, you'd fetch the actual section content
      // For now, we'll generate mock content
      const section = availableSections.find(sec => sec.id === sectionId);
      const sectionTitle = section ? section.title : `Page ${pageNumber}, Section ${sectionNumber}`;

      const content = `This is the content for ${sectionTitle}.\n\n` +
        `Alice was beginning to get very tired of sitting by her sister on the bank, ` +
        `and of having nothing to do: once or twice she had peeped into the book her sister was reading, ` +
        `but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice ` +
        `'without pictures or conversations?'\n\n` +
        `So she was considering in her own mind (as well as she could, for the hot day made her feel very ` +
        `sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of ` +
        `getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.`;

      setSectionContent(content);

      // Update the sidebar with context for this section
      updateSidebarContext(pageNumber, sectionId);
    } catch (error) {
      console.error('Error loading section content:', error);
      setSectionError(error instanceof Error ? error.message : 'Failed to load section content');
    } finally {
      setIsLoadingSection(false);
    }
  };

  const updateSidebarContext = (pageNumber: string, sectionId: string) => {
    // In a real app, you'd fetch contextual information about this section
    // For now, we'll just set some placeholder content
    setSidebarContent('context');
  };

  const handlePageInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageInputValue(event.target.value);
  };

  const handlePageSubmit = () => {
    const pageNumber = parseInt(pageInputValue);
    if (isNaN(pageNumber) || pageNumber < 1) {
      enqueueSnackbar('Please enter a valid page number', { variant: 'error' });
      return;
    }

    // Clear any existing definition when changing pages
    clearDefinition();

    // Reset section selection
    setSelectedSectionId('');
    setShowSectionContent(false);
    setSectionContent(null);

    // Fetch sections for this page
    fetchSectionsByPage(pageNumber);
  };

  const clearDefinition = () => {
    setSelectedText(null);
    setDefinitionData(null);
    setIsLoadingDefinition(false);
    setSidebarContent('context');
  };

  const handleSectionSelect = (sectionId: string) => {
    // Clear any existing definition when selecting a new section
    clearDefinition();

    // Set the new section and show its content
    setSelectedSectionId(sectionId);
    setShowSectionContent(true);
  };

  const handleChapterChange = (event: SelectChangeEvent) => {
    const chapterId = event.target.value;
    setSelectedChapterId(chapterId);

    // When chapter changes, select the first section by default
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (chapter && chapter.sections && chapter.sections.length > 0) {
      setSelectedSectionId(chapter.sections[0].id);
    } else {
      setSelectedSectionId('');
    }
  };

  const handleSectionChange = (event: SelectChangeEvent) => {
    setSelectedSectionId(event.target.value);
  };

  const handleUpdateProgress = async () => {
    if (!bookService || !user) return;

    try {
      // Find the current chapter and section
      const chapter = chapters.find(ch => ch.id === selectedChapterId);
      const section = chapter?.sections?.find(sec => sec.id === selectedSectionId);

      if (!chapter || !section) {
        enqueueSnackbar('Please select a chapter and section first', { variant: 'error' });
        return;
      }

      // Calculate the page number based on chapter and section
      // This is a simplified example - in a real app, you'd have a more accurate mapping
      const pageNumber = (chapter.chapter_number - 1) * 10 + section.section_number;

      // Update reading progress
      const bookId = 'alice-in-wonderland'; // Hardcoded for now
      const readingTime = 0; // Not tracking reading time in this example

      await bookService.updateReadingProgress(user.id, bookId, pageNumber, readingTime);

      // Update local state
      setReadingProgress({
        ...readingProgress,
        currentPage: pageNumber,
        currentChapter: chapter.title,
        percentage_complete: Math.round((pageNumber / 100) * 100) // Assuming 100 total pages
      });

      enqueueSnackbar('Reading progress updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error updating reading progress:', error);
      enqueueSnackbar('Failed to update reading progress', { variant: 'error' });
    }
  };

  const handleTextSelection = async () => {
    if (!textAreaRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (selectedText) {
      console.log('Text selected:', selectedText);
      setSelectedText(selectedText);
      setSidebarContent('definition');

      // Show loading state
      setIsLoadingDefinition(true);

      try {
        // Call the dictionary service to get the definition
        const bookId = 'alice-in-wonderland'; // Hardcoded for now

        if (!bookService) {
          throw new Error('Book service not available');
        }

        // Get the definition from the service
        const result = await bookService.getDefinition(bookId, selectedText, selectedSectionId);

        if (result && result.data) {
          // Format the definition data
          setDefinitionData({
            word: selectedText,
            definition: result.data,
            examples: [],
            source: 'database'
          });

          // Show a success message
          enqueueSnackbar(`Found definition for "${selectedText}"`, {
            variant: 'success',
            anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
          });
        } else {
          // No definition found
          setDefinitionData({
            word: selectedText,
            definition: `No definition found for "${selectedText}".`,
            examples: [],
            source: 'not_found'
          });

          enqueueSnackbar(`No definition found for "${selectedText}"`, {
            variant: 'info',
            anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
          });
        }
      } catch (error) {
        console.error('Error fetching definition:', error);

        // Set error state
        setDefinitionData({
          word: selectedText,
          definition: `Error looking up definition for "${selectedText}".`,
          examples: [],
          source: 'error'
        });

        // Show error message
        enqueueSnackbar(`Error looking up definition for "${selectedText}"`, {
          variant: 'error',
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
        });
      } finally {
        setIsLoadingDefinition(false);
      }
    }
  };

  const handleOpenAI = () => {
    setSidebarContent('ai');
    if (isMobile) {
      setAiDrawerOpen(true);
    }
  };

  const renderSidebarContent = () => {
    switch (sidebarContent) {
      case 'definition':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Definition
              </Typography>
              {definitionData && (
                <IconButton
                  size="small"
                  onClick={clearDefinition}
                  aria-label="Clear definition"
                  title="Clear definition"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            {isLoadingDefinition ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Looking up definition...
                </Typography>
              </Box>
            ) : definitionData ? (
              <>
                <Box sx={{
                  mb: 2,
                  pb: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    {definitionData.word}
                  </Typography>
                  {definitionData.source === 'database' ? (
                    <Chip
                      size="small"
                      label="From Dictionary"
                      color="primary"
                      variant="outlined"
                      sx={{ mt: 0.5, mb: 1.5 }}
                    />
                  ) : definitionData.source === 'not_found' ? (
                    <Chip
                      size="small"
                      label="Not Found"
                      color="warning"
                      variant="outlined"
                      sx={{ mt: 0.5, mb: 1.5 }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      label="Error"
                      color="error"
                      variant="outlined"
                      sx={{ mt: 0.5, mb: 1.5 }}
                    />
                  )}
                </Box>

                <Typography variant="body1" paragraph sx={{
                  fontStyle: definitionData.source === 'not_found' || definitionData.source === 'error' ? 'italic' : 'normal',
                  color: definitionData.source === 'not_found' ? 'text.secondary' :
                         definitionData.source === 'error' ? 'error.main' : 'text.primary'
                }}>
                  {definitionData.definition}
                </Typography>

                {definitionData.examples && definitionData.examples.length > 0 && (
                  <Box sx={{ mt: 2, bgcolor: 'background.default', p: 1.5, borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="primary.main" gutterBottom>
                      Examples:
                    </Typography>
                    {definitionData.examples.map((example: string, index: number) => (
                      <Typography key={index} variant="body2" paragraph sx={{
                        pl: 1,
                        borderLeft: '2px solid',
                        borderColor: 'primary.light',
                        mb: index === definitionData.examples.length - 1 ? 0 : 1.5
                      }}>
                        {example}
                      </Typography>
                    ))}
                  </Box>
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<ChatIcon />}
                    onClick={handleOpenAI}
                  >
                    Ask AI about this word
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<SearchIcon />}
                    onClick={() => window.open(`https://www.merriam-webster.com/dictionary/${encodeURIComponent(definitionData.word)}`, '_blank')}
                  >
                    Full Dictionary
                  </Button>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Select any word or phrase in the text area to look up its definition.
                </Typography>

                <Box sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: 'background.default',
                  p: 2,
                  borderRadius: 1,
                  mt: 2,
                  mb: 2
                }}>
                  <Box
                    component="img"
                    src="https://cdn-icons-png.flaticon.com/512/1829/1829371.png"
                    alt="Select text illustration"
                    sx={{ width: 60, height: 60, opacity: 0.7, mb: 1.5 }}
                  />
                  <Typography variant="caption" color="text.secondary" align="center">
                    <strong>How it works:</strong> Highlight any text in the section to instantly see its definition here.
                  </Typography>
                </Box>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Try words like "curious", "rabbit", "wonderland", or any unfamiliar terms you encounter while reading.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Box>
        );

      case 'ai':
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              AI Assistant
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ask the AI assistant about the current section or selected text.
            </Typography>
            <TextField
              fullWidth
              label="Ask a question"
              placeholder="e.g., Who is the White Rabbit?"
              multiline
              rows={2}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              fullWidth
              startIcon={<ChatIcon />}
            >
              Ask AI
            </Button>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              AI Response:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI responses will appear here after you ask a question.
            </Typography>
          </Box>
        );

      case 'context':
      default:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Context & Notes
            </Typography>

            {/* Current Location */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current Location:
              </Typography>
              <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <MenuBookIcon sx={{ mr: 1, color: 'primary.main', fontSize: '0.9rem' }} />
                    Page {currentPageNumber}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <BookmarkIcon sx={{ mr: 1, color: 'primary.main', fontSize: '0.9rem' }} />
                    {availableSections.find(sec => sec.id === selectedSectionId)?.title || 'Select a section'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Characters in this section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Characters in this section:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Alice, White Rabbit
              </Typography>
            </Box>

            {/* Key themes */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Key themes:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Curiosity, Adventure, Fantasy
              </Typography>
            </Box>

            {/* Reading notes */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Your Notes:
              </Typography>
              <TextField
                fullWidth
                placeholder="Add your notes about this section..."
                multiline
                rows={3}
                variant="outlined"
                size="small"
              />
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 1 }}
              >
                Save Notes
              </Button>
            </Box>
          </Box>
        );
    }
  };

  // Show loading state if services or initial data are still loading
  if (bookServiceLoading || isLoadingBook || isLoadingProgress) {
    return (
      <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3 }}>
        <Box py={isMobile ? 2 : 4}>
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: isMobile ? 2 : 3 }}>
                <LoadingSkeleton variant="text" width="60%" height={32} />
                <Box mt={2}>
                  <LoadingSkeleton variant="text" count={5} />
                </Box>
              </Paper>
            </Grid>
            {!isMobile && (
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3 }}>
                  <LoadingSkeleton variant="text" width="80%" height={24} />
                  <Box mt={2}>
                    <LoadingSkeleton variant="text" count={3} />
                  </Box>
                  <Box mt={3}>
                    <LoadingSkeleton variant="text" width="100%" height={36} />
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      </Container>
    );
  }

  // Show error state if any error occurred
  if (bookError || progressError) {
    const errorMessage = bookError || progressError;
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Content
          </Typography>
          <Typography variant="body1" paragraph>
            {errorMessage}
          </Typography>
          <Alert severity="info" sx={{ mb: 3, mx: 'auto', maxWidth: 500 }}>
            <Typography variant="body2">
              Please ensure the book content has been populated in the database. If the problem persists, please contact support.
            </Typography>
          </Alert>
          <Button
            component={RouterLink}
            to="/reader"
            variant="contained"
            startIcon={<HomeIcon />}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  // Check if book data is missing or empty
  if (!bookData || !chapters || chapters.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
          <ErrorOutlineIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="warning.main" gutterBottom>
            Book Content Missing
          </Typography>
          <Typography variant="body1" paragraph>
            We couldn't load the chapters and sections for Alice in Wonderland at this time.
          </Typography>
          <Alert severity="info" sx={{ mb: 3, mx: 'auto', maxWidth: 500 }}>
            <Typography variant="body2">
              The book content appears to be missing from the database. Please ensure it has been properly populated.
            </Typography>
          </Alert>
          <Button
            component={RouterLink}
            to="/reader"
            variant="contained"
            startIcon={<HomeIcon />}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ px: isMobile ? 2 : 3 }}>
      <Box py={isMobile ? 2 : 4}>
        <Grid container spacing={isMobile ? 2 : 3}>
          {/* Main Content Area */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: isMobile ? 2 : 3, position: 'relative' }}>
              <Typography variant="h5" gutterBottom>
                Reading Companion
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  This companion is designed to <strong>enhance your physical book reading experience</strong>. Tell us what page you're on, and we'll provide contextual help, definitions, and AI assistance to deepen your understanding of the story.
                </Typography>
              </Alert>

              <Divider sx={{ mb: 3 }} />

              {/* Page Number Input */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Sync with your Physical Book
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Tell us what page you're currently reading in your physical copy of "Alice in Wonderland".
                </Typography>

                <Box sx={{
                  p: 3,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'primary.light',
                  mb: 3
                }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                    What page are you currently reading in 'Alice in Wonderland'?
                  </Typography>

                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Page Number"
                        type="number"
                        value={pageInputValue}
                        onChange={handlePageInputChange}
                        variant="outlined"
                        InputProps={{
                          inputProps: { min: 1 }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <LoadingButton
                        variant="contained"
                        onClick={handlePageSubmit}
                        loading={isLoadingSections}
                        startIcon={<UpdateIcon />}
                        fullWidth
                      >
                        Find Page
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Box>

                {/* Section Snippets */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {availableSections.length > 0 ? 'Sections on this page:' : 'Enter a page number above to see sections'}
                  </Typography>

                  {sectionsError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {sectionsError}
                    </Alert>
                  )}

                  {isLoadingSections ? (
                    <Box sx={{ p: 2 }}>
                      <LoadingSkeleton variant="text" count={3} />
                    </Box>
                  ) : availableSections.length > 0 ? (
                    <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                      {availableSections.map((section) => (
                        <ListItem
                          key={section.id}
                          disablePadding
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-child': {
                              borderBottom: 'none'
                            }
                          }}
                        >
                          <ListItemButton
                            onClick={() => handleSectionSelect(section.id)}
                            selected={selectedSectionId === section.id}
                          >
                            <ListItemText
                              primary={section.title}
                              secondary={section.preview}
                              primaryTypographyProps={{ fontWeight: selectedSectionId === section.id ? 'bold' : 'regular' }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  ) : currentPageNumber > 0 ? (
                    <Alert severity="info">
                      No sections found on page {currentPageNumber}. Try a different page number.
                    </Alert>
                  ) : null}
                </Box>
              </Box>

              {/* Interactive Text Area */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    Interactive Text Area
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={showSectionContent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    onClick={() => setShowSectionContent(!showSectionContent)}
                  >
                    {showSectionContent ? 'Hide Text' : 'Show Text'}
                  </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                  {showSectionContent
                    ? <>
                        <strong>This is NOT for reading the entire book.</strong> Instead, <span style={{ color: theme.palette.primary.main }}>select any text</span> to look up definitions or ask the AI assistant for help.
                      </>
                    : <>
                        Click "Show Text" to display a snippet of this section for highlighting and interaction. <strong>Remember:</strong> This is a companion to your physical book, not a replacement.
                      </>}
                </Typography>

                <Collapse in={showSectionContent}>
                  {isLoadingSection ? (
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <LoadingSkeleton variant="text" count={5} />
                    </Box>
                  ) : sectionError ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {sectionError}
                    </Alert>
                  ) : (
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        ref={textAreaRef}
                        onClick={handleTextSelection}
                        onMouseUp={handleTextSelection}
                        sx={{
                          p: 2,
                          bgcolor: 'background.default',
                          borderRadius: 1,
                          whiteSpace: 'pre-wrap',
                          border: '2px dashed',
                          borderColor: 'primary.light',
                          position: 'relative',
                          '& ::selection': {
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                          }
                        }}
                      >
                        {/* Tooltip overlay */}
                        <Box sx={{
                          position: 'absolute',
                          top: '-12px',
                          right: '10px',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          zIndex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          boxShadow: 1
                        }}>
                          <SearchIcon fontSize="inherit" />
                          Highlight any text to look up
                        </Box>
                        {sectionContent || 'No content available for this section.'}
                      </Box>
                    </Box>
                  )}
                </Collapse>

                {!showSectionContent && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      This area is for interaction with the text, not for continuous reading.
                      Use your physical book for reading, and this tool as a companion.
                    </Typography>
                  </Alert>
                )}
              </Box>

              {/* Quick Tools */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Tools
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<SearchIcon />}
                      onClick={() => setSidebarContent('definition')}
                      sx={{ height: '100%' }}
                    >
                      Dictionary
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<ChatIcon />}
                      onClick={handleOpenAI}
                      sx={{ height: '100%' }}
                    >
                      AI Help
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<BookIcon />}
                      onClick={() => setSidebarContent('context')}
                      sx={{ height: '100%' }}
                    >
                      Context
                    </Button>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<TextFieldsIcon />}
                      onClick={() => enqueueSnackbar('Vocabulary tools coming soon!', { variant: 'info' })}
                      sx={{ height: '100%' }}
                    >
                      Vocabulary
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Button
                  component={RouterLink}
                  to="/reader"
                  variant="contained"
                  startIcon={<HomeIcon />}
                >
                  Back to Dashboard
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Contextual Sidebar */}
          {!isMobile && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
                {renderSidebarContent()}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Mobile Drawer for Sidebar Content */}
      {isMobile && (
        <Drawer
          anchor="bottom"
          open={aiDrawerOpen}
          onClose={() => setAiDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh',
            },
          }}
        >
          <Box p={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {sidebarContent === 'ai' ? 'AI Assistant' :
                 sidebarContent === 'definition' ? 'Definition' : 'Context & Notes'}
              </Typography>
              <IconButton onClick={() => setAiDrawerOpen(false)}>
                <ExpandMoreIcon />
              </IconButton>
            </Box>
            {renderSidebarContent()}
          </Box>
        </Drawer>
      )}
    </Container>
  );
};

export default MainInteractionPage;
