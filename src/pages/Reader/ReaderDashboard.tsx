// src/pages/Reader/ReaderDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HomeIcon from '@mui/icons-material/Home';
import { localAliceCover } from '../../assets';
import { useBookService, useAuthService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

const ReaderDashboard: React.FC = () => {
  console.log('ReaderDashboard: Rendering component');
  const navigate = useNavigate();
  const { service: bookService, loading: bookLoading } = useBookService();
  const { service: authService, loading: authLoading } = useAuthService();
  const { service: analyticsService } = useAnalyticsService();
  const { user, profile } = useAuth();
  const [bookData, setBookData] = useState<any>(null);
  const [readingStats, setReadingStats] = useState<any>({
    progress: 0,
    totalTimeRead: 0,
    lastReadTimestamp: null,
    currentPage: 1,
    currentChapter: 'Chapter 1',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'ReaderDashboard'
  });

  // Load user data and book data
  useEffect(() => {
    console.log('ReaderDashboard: useEffect triggered', {
      hasBookService: !!bookService,
      hasUser: !!user,
      userId: user?.id
    });

    if (!bookService || !user) {
      console.log('ReaderDashboard: Missing bookService or user, skipping data load');
      return;
    }

    const loadData = async () => {
      console.log('ReaderDashboard: Starting to load data');
      try {
        // Get book data
        console.log('ReaderDashboard: Fetching book data');
        const book = await bookService.getBook('alice-in-wonderland');
        console.log('ReaderDashboard: Book data received', book);
        setBookData(book);

        // Get reading progress
        if (user.id) {
          console.log('ReaderDashboard: Fetching reading progress for user', user.id);
          const progress = await bookService.getReadingProgress(user.id, 'alice-in-wonderland');
          console.log('ReaderDashboard: Reading progress received', progress);

          if (progress) {
            setReadingStats({
              progress: progress.percentage_complete || 0,
              totalTimeRead: progress.total_reading_time || 0,
              lastReadTimestamp: progress.last_read_at,
              currentPage: progress.current_page || 1,
              currentChapter: progress.current_chapter || 'Chapter 1',
            });
            console.log('ReaderDashboard: Reading stats updated');
          } else {
            console.log('ReaderDashboard: No reading progress found, using defaults');
          }
        }

        // Track page view
        if (analyticsService) {
          console.log('ReaderDashboard: Tracking page view');
          analyticsService.trackPageView('reader_dashboard', {
            userId: user.id,
            bookId: 'alice-in-wonderland'
          });
        }
      } catch (error) {
        console.error('ReaderDashboard: Error loading data:', error);
        setError(error instanceof Error ? error.message : 'An error occurred while loading data');
      } finally {
        console.log('ReaderDashboard: Finished loading data, setting loading to false');
        setLoading(false);
      }
    };

    loadData();
  }, [bookService, user, analyticsService]);

  // Show loading state
  if (authLoading || bookLoading || loading) {
    console.log('ReaderDashboard: Showing loading state');
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    console.log('ReaderDashboard: Showing error state:', error);
    return (
      <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Paper>
      </Box>
    );
  }

  // Fallback if no book data
  if (!bookData) {
    console.log('ReaderDashboard: No book data available, showing fallback');
    return (
      <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {profile?.first_name || 'Reader'}!
        </Typography>
        <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Dashboard Test
          </Typography>
          <Typography variant="body1" paragraph>
            Your book data is being loaded. If this message persists, please try refreshing the page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Welcome back, {profile?.first_name || 'Reader'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your reading companion for Alice in Wonderland
          </Typography>
        </Box>
        <IconButton
          onClick={() => navigate('/')}
          aria-label="Go to home page"
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' }
          }}
        >
          <HomeIcon />
        </IconButton>
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Current Book Card */}
          <Paper
            elevation={2}
            sx={{
              mb: 4,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{
              p: 0,
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              height: { sm: '300px' }
            }}>
              {/* Book Cover */}
              <Box
                sx={{
                  width: { xs: '100%', sm: '200px' },
                  height: { xs: '200px', sm: '100%' },
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box
                  component="img"
                  src={localAliceCover}
                  alt={bookData?.title || "Alice in Wonderland"}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </Box>

              {/* Book Info */}
              <Box sx={{
                p: 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}>
                <Typography variant="h5" gutterBottom>
                  {bookData?.title || "Alice's Adventures in Wonderland"}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  By {bookData?.author || "Lewis Carroll"}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Progress in Physical Book:</strong>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={readingStats.progress}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mt: 1
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(readingStats.progress)}% complete
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Page {readingStats.currentPage}/{bookData?.totalPages || 100}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Button
                    onClick={() => {
                      console.log('ReaderDashboard: Navigating to reader page', {
                        currentPage: readingStats.currentPage || 1
                      });
                      navigate('/reader/interaction');
                    }}
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<BookmarkIcon />}
                  >
                    Sync My Reading
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Reading Stats */}
          <Typography variant="h6" gutterBottom>
            Your Physical Book Progress
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              {
                title: 'Reading Time',
                value: `${Math.round((readingStats.totalTimeRead || 0) / 60)} mins`,
                icon: <TimerIcon />,
                color: '#4caf50'
              },
              {
                title: 'Current Chapter',
                value: readingStats.currentChapter,
                icon: <MenuBookIcon />,
                color: '#2196f3'
              },
              {
                title: 'Reading Pace',
                value: '3 pages/day',
                icon: <TrendingUpIcon />,
                color: '#ff9800'
              }
            ].map((stat, index) => (
              <Grid item xs={12} sm={4} key={index}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%'
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: stat.color,
                      mr: 2
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h6">
                      {stat.value}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Recent Activity */}
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
            <List>
              {[
                {
                  action: 'Looked up definition',
                  item: 'curiosity',
                  time: '2 hours ago'
                },
                {
                  action: 'Asked AI Assistant',
                  item: 'Why does the White Rabbit have a watch?',
                  time: '2 hours ago'
                },
                {
                  action: 'Completed reading',
                  item: 'Chapter 1',
                  time: '3 days ago'
                }
              ].map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={activity.action}
                      secondary={
                        <>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                          >
                            {activity.item}
                          </Typography>
                          {` — ${activity.time}`}
                        </>
                      }
                    />
                    <Chip
                      label="View"
                      size="small"
                      component={RouterLink}
                      to="#"
                      clickable
                    />
                  </ListItem>
                  {index < 2 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Access */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Access
            </Typography>
            <List>
              {[
                { title: 'Sync My Reading', onClick: () => {
                  console.log('ReaderDashboard: Navigating to reader page');
                  navigate('/reader/interaction');
                }},
                { title: 'Reading Statistics', link: '/reader/statistics' },
                { title: 'Take Chapter Quiz', onClick: () => {
                  console.log('ReaderDashboard: Opening AI drawer for quiz');
                  // This will be implemented later
                  alert('Quiz feature coming soon!');
                }},
                { title: 'Sign Out', link: '#', onClick: () => {
                  if (authService) {
                    authService.signOut().then(() => navigate('/'));
                  }
                }}
              ].map((item, index) => (
                <ListItem
                  key={index}
                  component={item.onClick || !item.link ? 'div' : RouterLink}
                  to={item.onClick ? undefined : item.link}
                  onClick={item.onClick}
                  button
                >
                  <ListItemText primary={item.title} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Help & Resources */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Help & Resources
            </Typography>
            <Typography variant="body2" paragraph>
              Need help with the Alice Reader app? Check out these resources:
            </Typography>
            <List>
              {[
                { title: 'User Guide', link: '/help/guide' },
                { title: 'FAQ', link: '/help/faq' },
                { title: 'Contact Support', link: '/help/contact' }
              ].map((item, index) => (
                <ListItem key={index} component={RouterLink} to={item.link} button>
                  <ListItemText primary={item.title} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReaderDashboard;
