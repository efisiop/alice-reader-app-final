import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Container, Paper, Grid, Card, CardContent,
  CardActions, Divider, LinearProgress, Chip, CircularProgress, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import BookIcon from '@mui/icons-material/Book';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAuth } from '../contexts/AuthContext';
import { useConsultant } from '../contexts/ConsultantContext';
import { getReadingProgress, getReadingStats } from '../services/backendService';
import { ALICE_BOOK_ID } from '../data/fallbackBookData';
import LoadingState from '../components/common/LoadingState';
import { appLog } from '../components/LogViewer';

const ReaderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConsultant } = useConsultant();
  const [lastReadSection, setLastReadSection] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [bookData, setBookData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSectionInfo, setCurrentSectionInfo] = useState<{title: string, chapterTitle: string} | null>(null);
  const [readingStats, setReadingStats] = useState<any>(null);

  // Load book data and reading progress on component mount
  useEffect(() => {
    const loadBookData = async () => {
      appLog('ReaderDashboard', 'Loading your reading dashboard...', 'info');

      // For now, we'll use a hardcoded book ID for the Alice in Wonderland book
      // In a real app, we would get this from the user's verified books
      const bookId = ALICE_BOOK_ID;
      appLog('ReaderDashboard', `Using book ID: ${bookId}`, 'debug');

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        appLog('ReaderDashboard', 'Dashboard loading timed out', 'error');
        setLoading(false);
        setError('Loading took too long. Please try again.');

        // Try to load with fallback data
        import('../services/mockBackend')
          .then(fallbackBookService => {
            const fallbackBook = fallbackBookService.mockBackend.books.getBookContent(bookId);
            if (fallbackBook.data) {
              setBookData(fallbackBook.data);
              appLog('ReaderDashboard', 'Loaded fallback book data', 'info');
            }
          })
          .catch(fallbackError => {
            appLog('ReaderDashboard', 'Failed to load fallback data', 'error', fallbackError);
          });
      }, 30000); // Increased timeout to 30 seconds

      try {
        if (!user) {
          appLog('ReaderDashboard', 'No user found, skipping data loading', 'warning');
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }

        // We're using the bookId defined above

        // Step 1: Get book data using bookService (do this first as it's most critical)
        appLog('ReaderDashboard', 'Step 1 - Fetching book content...', 'info');

        // Import the getBookContent function from bookService
        const bookService = await import('../services/bookService');
        const book = await bookService.getBookContent(bookId);

        if (!book) {
          appLog('ReaderDashboard', 'No book content found', 'error');
          throw new Error('No book content found. Please try again later.');
        }

        appLog('ReaderDashboard', `Book content loaded successfully: ${book.title}`, 'success', {
          title: book.title,
          chapters: book.chapters?.length || 0,
          sections: book.chapters?.reduce((total: number, chapter: any) => total + chapter.sections.length, 0) || 0
        });
        setBookData(book);

        // Step 2: Get reading progress using backend service
        appLog('ReaderDashboard', 'Step 2 - Fetching reading progress...', 'info');
        try {
          const { data: progress, error: progressError } = await getReadingProgress(user.id, bookId);

          if (progressError) {
            appLog('ReaderDashboard', 'Error fetching reading progress', 'error', progressError);
            // Non-critical error, continue with defaults
            if (book.chapters && book.chapters.length > 0 && book.chapters[0].sections.length > 0) {
              const firstSection = book.chapters[0].sections[0];
              setLastReadSection(firstSection.id);
              setCurrentSectionInfo({
                title: firstSection.title || '',
                chapterTitle: book.chapters[0].title || ''
              });
            }
          } else if (progress) {
            appLog('ReaderDashboard', 'Reading progress loaded successfully', 'success', progress);
            setLastReadSection(progress.section_id);
            setCurrentSectionInfo({
              title: progress.section_title || '',
              chapterTitle: progress.chapter_title || ''
            });
          } else {
            appLog('ReaderDashboard', 'No reading progress found, using default', 'info');
            // Set default section (first section of first chapter)
            if (book.chapters && book.chapters.length > 0 && book.chapters[0].sections.length > 0) {
              const firstSection = book.chapters[0].sections[0];
              appLog('ReaderDashboard', `Using first section as default: ${firstSection.title}`, 'debug');
              setLastReadSection(firstSection.id);
              setCurrentSectionInfo({
                title: firstSection.title || '',
                chapterTitle: book.chapters[0].title || ''
              });
            }
          }
        } catch (progressError) {
          appLog('ReaderDashboard', 'Exception fetching reading progress', 'error', progressError);
          // Continue with defaults
          if (book.chapters && book.chapters.length > 0 && book.chapters[0].sections.length > 0) {
            const firstSection = book.chapters[0].sections[0];
            setLastReadSection(firstSection.id);
            setCurrentSectionInfo({
              title: firstSection.title || '',
              chapterTitle: book.chapters[0].title || ''
            });
          }
        }

        // Step 3: Get reading stats using backend service
        appLog('ReaderDashboard', 'Step 3 - Fetching reading stats...', 'info');
        try {
          const { data: stats, error: statsError } = await getReadingStats(user.id, bookId);

          if (statsError) {
            appLog('ReaderDashboard', 'Error fetching reading stats', 'error', statsError);
            // Non-critical error, continue with defaults
            setReadingProgress(0);
            setReadingStats({
              total_reading_time: 0,
              pages_read: 0,
              percentage_complete: 0
            });
          } else if (stats) {
            appLog('ReaderDashboard', 'Reading stats loaded successfully', 'success', stats);
            setReadingProgress(stats.percentage_complete || 0);
            setReadingStats(stats);
          } else {
            appLog('ReaderDashboard', 'No reading stats found, using defaults', 'info');
            // Set default stats
            setReadingProgress(0);
            setReadingStats({
              total_reading_time: 0,
              pages_read: 0,
              percentage_complete: 0
            });
          }
        } catch (statsError) {
          appLog('ReaderDashboard', 'Exception fetching reading stats', 'error', statsError);
          // Continue with defaults
          setReadingProgress(0);
          setReadingStats({
            total_reading_time: 0,
            pages_read: 0,
            percentage_complete: 0
          });
        }

        appLog('ReaderDashboard', 'All dashboard data loaded successfully', 'success');
      } catch (error: any) {
        appLog('ReaderDashboard', 'Error loading book data', 'error', error);
        setError(error.message || 'Failed to load your reading data. Please try again later.');
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadBookData();
  }, [user]);

  // Get current section title
  const getCurrentSectionTitle = () => {
    if (!lastReadSection) return null;

    if (currentSectionInfo) {
      return `${currentSectionInfo.chapterTitle}: ${currentSectionInfo.title}`;
    }

    // Fallback to book data if available
    if (bookData && bookData.chapters) {
      for (const chapter of bookData.chapters) {
        for (const section of chapter.sections) {
          if (section.id === lastReadSection) {
            return `${chapter.title}: ${section.title}`;
          }
        }
      }
    }

    return 'Continue Reading';
  };

  // Continue reading handler
  const handleContinueReading = () => {
    appLog('ReaderDashboard', 'User clicked Continue Reading button', 'info', { section: lastReadSection });
    navigate('/reader/read');
  };

  // Start new reading handler
  const handleStartReading = () => {
    appLog('ReaderDashboard', 'User clicked Start Reading button', 'info');
    // Clear previous progress if starting fresh
    localStorage.removeItem('readingProgress');
    appLog('ReaderDashboard', 'Cleared reading progress from localStorage', 'debug');
    navigate('/reader/read');
  };

  // Handle refresh when returning to this page
  useEffect(() => {
    // This will run when the component mounts or when the URL changes to this page
    appLog('ReaderDashboard', 'Component mounted or revisited', 'info');

    // Only reload if we have a user
    if (user && !loading) {
      appLog('ReaderDashboard', 'Reloading dashboard data', 'info');
      setLoading(true);
      setError(null);
      loadBookData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only depend on user to avoid unnecessary reloads

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading your reading dashboard..." className="reader-dashboard-loading" />;
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Typography variant="body1" paragraph>
            We're having trouble loading your reading data. This could be due to a network issue or a problem with our servers.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/status')}
            >
              Check System Status
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          p: 2,
          borderBottom: '1px solid #eee',
          bgcolor: 'primary.main',
          color: 'white'
        }}
      >
        <Container>
          <Typography variant="h5" component="h1">
            Alice Reader Dashboard
          </Typography>
        </Container>
      </Box>

      <Container sx={{ flex: 1, py: 4 }}>
        {/* Welcome Section */}
        <Paper sx={{ p: 4, mb: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                Welcome to Alice in Wonderland
              </Typography>
              <Typography variant="body1" paragraph>
                Continue your reading journey through Lewis Carroll's classic tale of
                imagination, adventure, and nonsense. Use the AI assistant to help you
                understand the story better.
              </Typography>

              {lastReadSection ? (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AutoStoriesIcon />}
                  onClick={handleContinueReading}
                  sx={{ mr: 2 }}
                >
                  Continue Reading
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<BookIcon />}
                  onClick={handleStartReading}
                >
                  Start Reading
                </Button>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Your Reading Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={readingProgress}
                      sx={{
                        flexGrow: 1,
                        mr: 2,
                        height: 10,
                        borderRadius: 5
                      }}
                    />
                    <Typography variant="body2">
                      {readingProgress}%
                    </Typography>
                  </Box>
                  {lastReadSection && (
                    <Typography variant="body2" color="text.secondary">
                      Last read: {getCurrentSectionTitle()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Book Information */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                About the Book
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" paragraph>
                "Alice's Adventures in Wonderland" (commonly shortened to "Alice in Wonderland")
                is an 1865 novel by English author Lewis Carroll (the pseudonym of Charles Dodgson).
                It tells the story of a young girl named Alice who falls through a rabbit hole into
                a fantasy world populated by peculiar, anthropomorphic creatures.
              </Typography>
              <Typography variant="body1" paragraph>
                The tale plays with logic, giving the story lasting popularity with adults as well
                as children. It is considered to be one of the best examples of the literary nonsense
                genre, and its narrative, structure, characters, and imagery have been enormously
                influential in both popular culture and literature, especially in the fantasy genre.
              </Typography>

              <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip label="Fantasy" />
                <Chip label="Classic" />
                <Chip label="Children's Literature" />
                <Chip label="Victorian Era" />
                <Chip label="Nonsense" />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reading Statistics
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Chapters
                  </Typography>
                  <Typography variant="h5">
                    {bookData?.chapters?.length || '12'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Sections
                  </Typography>
                  <Typography variant="h5">
                    {bookData?.chapters ?
                      bookData.chapters.reduce((total: number, chapter: any) => total + chapter.sections.length, 0) :
                      '42'
                    }
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Reading Time
                  </Typography>
                  <Typography variant="h5">
                    {readingStats?.total_reading_time ?
                      `${Math.round(readingStats.total_reading_time / 60)} minutes` :
                      'Not started'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pages Read
                  </Typography>
                  <Typography variant="h5">
                    {readingStats?.pages_read || 0}
                  </Typography>
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  startIcon={<EmojiEventsIcon />}
                  onClick={() => navigate('/reader/stats')}
                >
                  View Detailed Statistics
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Staff Access Section */}
      <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #ccc', textAlign: 'center' }}>
        <Typography variant="subtitle2" color="primary" sx={{ display: 'block', mb: 1 }}>
          Staff Access
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          {isConsultant && (
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => {
                appLog('ReaderDashboard', 'Navigating to consultant dashboard', 'info');
                navigate('/consultant');
              }}
            >
              Consultant Dashboard
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={() => {
              // Set admin flag and navigate to status dashboard
              localStorage.setItem('isAdmin', 'true');
              appLog('ReaderDashboard', 'Admin access granted', 'info');
              navigate('/status');
            }}
          >
            System Status Dashboard
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ReaderDashboard;
