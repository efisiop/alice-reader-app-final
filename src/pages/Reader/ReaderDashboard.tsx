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
  CircularProgress
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useBookService, useAuthService, useAnalyticsService } from '../../hooks/useService';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../contexts/AuthContext';

const ReaderDashboard: React.FC = () => {
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

  // Track performance
  usePerformance({
    trackPageLoad: true,
    trackRender: true,
    componentName: 'ReaderDashboard'
  });

  // Load user data and book data
  useEffect(() => {
    if (!bookService || !user) return;

    const loadData = async () => {
      try {
        // Get book data
        const book = await bookService.getBook('alice-in-wonderland');
        setBookData(book);

        // Get reading progress
        if (user.id) {
          const progress = await bookService.getReadingProgress(user.id, 'alice-in-wonderland');

          if (progress) {
            setReadingStats({
              progress: progress.percentage_complete || 0,
              totalTimeRead: progress.total_reading_time || 0,
              lastReadTimestamp: progress.last_read_at,
              currentPage: progress.current_page || 1,
              currentChapter: progress.current_chapter || 'Chapter 1',
            });
          }
        }

        // Track page view
        if (analyticsService) {
          analyticsService.trackPageView('reader_dashboard', {
            userId: user.id,
            bookId: 'alice-in-wonderland'
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [bookService, user, analyticsService]);

  if (authLoading || bookLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {profile?.first_name || 'Reader'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Continue your journey through Wonderland
        </Typography>
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
                  src="https://m.media-amazon.com/images/I/71pmz7EqjdL._AC_UF1000,1000_QL80_.jpg"
                  alt="Alice in Wonderland"
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
                  Alice's Adventures in Wonderland
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  By Lewis Carroll
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Your Progress:
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
                    component={RouterLink}
                    to={`/reader/alice-in-wonderland/page/${readingStats.currentPage}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<BookmarkIcon />}
                  >
                    Continue Reading
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Reading Stats */}
          <Typography variant="h6" gutterBottom>
            Your Reading Stats
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
                { title: 'Start from beginning', link: '/reader/alice-in-wonderland/page/1' },
                { title: 'View chapters', link: '/reader/alice-in-wonderland/chapters' },
                { title: 'Reading statistics', link: '/reader/statistics' },
                { title: 'Your notes', link: '/reader/notes' }
              ].map((item, index) => (
                <ListItem key={index} component={RouterLink} to={item.link} button>
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
