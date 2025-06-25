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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  IconButton
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import NoteIcon from '@mui/icons-material/Note';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HelpIcon from '@mui/icons-material/Help';
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
  // Simplified state - removed detailed reading stats
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
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
          Welcome, {profile?.first_name || 'Reader'}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Your reading companion for Alice in Wonderland
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={9}>
          {/* Main Call to Action Card */}
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              mb: 4,
              textAlign: 'center',
              p: 0
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

              {/* Book Info and Main CTA */}
              <Box sx={{
                p: 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center'
              }}>
                <Typography variant="h5" gutterBottom>
                  {bookData?.title || "Alice's Adventures in Wonderland"}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  By {bookData?.author || "Lewis Carroll"}
                </Typography>

                <Divider sx={{ my: 2, width: '100%' }} />

                <Typography variant="body1" sx={{ mb: 3 }}>
                  Ready to continue your reading journey? Sync with your physical book to get contextual help, definitions, and AI assistance.
                </Typography>

                <Button
                  onClick={() => {
                    console.log('ReaderDashboard: Navigating to reader page');
                    navigate('/reader/interaction');
                  }}
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<MenuBookIcon />}
                  sx={{
                    py: 2,
                    px: 5,
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    minWidth: '280px',
                    boxShadow: 4,
                    mt: 2,
                    borderRadius: 2,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 6
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  Open Reading Companion
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Welcome Message */}
          <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              How to Use Your Reading Companion
            </Typography>
            <Typography variant="body1" paragraph>
              The Alice Reader App is designed to enhance your experience with the physical book, not replace it.
            </Typography>
            <List>
              {[
                "Tell us what page you're on in your physical copy of Alice in Wonderland",
                "Get contextual information about characters, themes, and plot points",
                "Look up definitions for unfamiliar words by highlighting text",
                "Ask the AI assistant questions about what you're reading"
              ].map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: '36px' }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </Box>
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sidebar - Narrower */}
        <Grid item xs={12} md={3}>
          {/* Help & Resources */}
          <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <HelpIcon sx={{ mr: 1, color: 'primary.main' }} />
              Help & Resources
            </Typography>
            <Typography variant="body2" paragraph>
              Need help with the Alice Reader app? Check out these resources:
            </Typography>
            <List>
              {[
                { title: 'User Guide', link: '/help/guide' },
                { title: 'FAQ', link: '/help/faq' },
                { title: 'Contact Support', link: '/help/contact' },
                // Add Alice glossary demo link in development mode
                ...(import.meta.env.DEV ? [{ title: '✨ Alice Glossary Demo', link: '/alice-glossary-demo' }] : [])
              ].map((item, index) => (
                <ListItem
                  key={index}
                  component={RouterLink}
                  to={item.link}
                  button
                  sx={{
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <ListItemText primary={item.title} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Demo Video Placeholder */}
          <Paper sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <OndemandVideoIcon sx={{ mr: 1, color: 'primary.main' }} />
              Quick Demo
            </Typography>
            <Typography variant="body2" paragraph>
              See how the Alice Reader App enhances your reading experience:
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PlayCircleOutlineIcon />}
              disabled
              sx={{ mt: 1 }}
            >
              Watch Demo (Coming Soon)
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReaderDashboard;
