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
import { useSnackbar } from 'notistack';
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
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

  // State for section content
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

  // Load book data and structure
  useEffect(() => {
    loadBookData();
    loadReadingProgress();
  }, []);

  // Update selected chapter/section when reading progress changes
  useEffect(() => {
    if (readingProgress && chapters.length > 0) {
      // Find the chapter that contains the current page
      const currentPage = readingProgress.currentPage || 1;

      // This is a simplified example - in a real app, you'd need to map pages to chapters/sections
      const chapterIndex = Math.min(Math.floor((currentPage - 1) / 10), chapters.length - 1);
      const chapter = chapters[chapterIndex];

      if (chapter) {
        setSelectedChapterId(chapter.id);

        // If the chapter has sections, select the first one
        if (chapter.sections && chapter.sections.length > 0) {
          setSelectedSectionId(chapter.sections[0].id);
        }
      }
    }
  }, [readingProgress, chapters]);

  // Load section content when selection changes
  useEffect(() => {
    if (selectedSectionId) {
      loadSectionContent(selectedSectionId);
    }
  }, [selectedSectionId]);

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

  const loadSectionContent = async (sectionId: string) => {
    try {
      setIsLoadingSection(true);
      setSectionError(null);
      console.log('Loading section content for:', sectionId);

      // Extract chapter and section numbers from the ID
      const [chapterId, _, sectionNumber] = sectionId.split('_');

      // In a real app, you'd fetch the actual section content
      // For now, we'll generate mock content
      const chapterObj = chapters.find(ch => ch.id === chapterId);
      const chapterTitle = chapterObj ? chapterObj.title : 'Unknown Chapter';

      const content = `This is the content for ${chapterTitle}, Section ${sectionNumber}.\n\n` +
        `Alice was beginning to get very tired of sitting by her sister on the bank, ` +
        `and of having nothing to do: once or twice she had peeped into the book her sister was reading, ` +
        `but it had no pictures or conversations in it, 'and what is the use of a book,' thought Alice ` +
        `'without pictures or conversations?'\n\n` +
        `So she was considering in her own mind (as well as she could, for the hot day made her feel very ` +
        `sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of ` +
        `getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.`;

      setSectionContent(content);

      // Update the sidebar with context for this section
      updateSidebarContext(chapterId, sectionId);
    } catch (error) {
      console.error('Error loading section content:', error);
      setSectionError(error instanceof Error ? error.message : 'Failed to load section content');
    } finally {
      setIsLoadingSection(false);
    }
  };

  const updateSidebarContext = (chapterId: string, sectionId: string) => {
    // In a real app, you'd fetch contextual information about this section
    // For now, we'll just set some placeholder content
    setSidebarContent('context');
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

  const handleTextSelection = () => {
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

      // Simulate API call with timeout
      setTimeout(() => {
        // In a real app, you'd fetch the definition from a dictionary API
        // For now, we'll just set a placeholder
        setDefinitionData({
          word: selectedText,
          definition: `Definition for "${selectedText}" would appear here.`,
          examples: [`Example sentence using "${selectedText}".`]
        });
        setIsLoadingDefinition(false);

        // Show a success message
        enqueueSnackbar(`Looking up "${selectedText}"`, {
          variant: 'success',
          anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
        });
      }, 500);
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
            <Typography variant="h6" gutterBottom>
              Definition
            </Typography>
            {isLoadingDefinition ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Looking up definition...
                </Typography>
              </Box>
            ) : definitionData ? (
              <>
                <Typography variant="subtitle1" fontWeight="bold">
                  {definitionData.word}
                </Typography>
                <Typography variant="body1" paragraph>
                  {definitionData.definition}
                </Typography>
                {definitionData.examples && definitionData.examples.length > 0 && (
                  <>
                    <Typography variant="subtitle2">Examples:</Typography>
                    {definitionData.examples.map((example: string, index: number) => (
                      <Typography key={index} variant="body2" paragraph>
                        {example}
                      </Typography>
                    ))}
                  </>
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
                  Select text in the content area to see its definition.
                </Typography>
                <Box
                  component="img"
                  src="https://cdn-icons-png.flaticon.com/512/1829/1829371.png"
                  alt="Select text illustration"
                  sx={{ width: 80, height: 80, opacity: 0.6, mt: 2 }}
                />
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
                    {chapters.find(ch => ch.id === selectedChapterId)?.title || 'Select a chapter'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <BookmarkIcon sx={{ mr: 1, color: 'primary.main', fontSize: '0.9rem' }} />
                    {chapters.find(ch => ch.id === selectedChapterId)?.sections?.find(sec => sec.id === selectedSectionId)?.title || 'Select a section'}
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
                  This page is designed to be used <strong>alongside your physical book</strong>. Select your current chapter and section, then use the tools below to enhance your reading experience.
                </Typography>
              </Alert>

              <Divider sx={{ mb: 3 }} />

              {/* Chapter/Section Selection */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Select Your Current Location
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Choose the chapter and section you're currently reading in your physical book.
                </Typography>

                <Grid container spacing={2}>
                  {/* Chapter Selection */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="chapter-select-label">Chapter</InputLabel>
                      <Select
                        labelId="chapter-select-label"
                        id="chapter-select"
                        value={selectedChapterId}
                        label="Chapter"
                        onChange={handleChapterChange}
                      >
                        {chapters.map((chapter) => (
                          <MenuItem key={chapter.id} value={chapter.id}>
                            {chapter.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Section Selection */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!selectedChapterId}>
                      <InputLabel id="section-select-label">Section</InputLabel>
                      <Select
                        labelId="section-select-label"
                        id="section-select"
                        value={selectedSectionId}
                        label="Section"
                        onChange={handleSectionChange}
                      >
                        {chapters
                          .find(ch => ch.id === selectedChapterId)
                          ?.sections?.map((section) => (
                            <MenuItem key={section.id} value={section.id}>
                              {section.title}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <LoadingButton
                    variant="contained"
                    onClick={handleUpdateProgress}
                    loading={false}
                    startIcon={<UpdateIcon />}
                  >
                    Update My Progress
                  </LoadingButton>
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
                        '&::before': {
                          content: '"Try selecting some text here"',
                          position: 'absolute',
                          top: '-12px',
                          right: '10px',
                          bgcolor: 'primary.light',
                          color: 'primary.contrastText',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          zIndex: 1,
                        },
                        '& ::selection': {
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                        }
                      }}
                    >
                      {sectionContent || 'No content available for this section.'}
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
