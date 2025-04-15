import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { readerService } from '../../services/readerService';
import { Section } from '../../types/section';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { LoadingButton } from '../../components/common/LoadingButton';
import HelpIcon from '@mui/icons-material/Help';
import HomeIcon from '@mui/icons-material/Home';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export const ReaderInterfacePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const { sectionId } = useParams<{ sectionId: string }>();

  // State for section data
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // State for book data
  const [bookData, setBookData] = useState<any>(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [bookError, setBookError] = useState<string | null>(null);

  // State for reading progress
  const [readingProgress, setReadingProgress] = useState<any>(null);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);

  // UI state
  const [helpDrawerOpen, setHelpDrawerOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadSection();
    loadBookData();
    loadReadingProgress();
  }, [sectionId]);

  const loadSection = async () => {
    if (!sectionId) {
      setError('No section ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Loading section with ID:', sectionId);
      const data = await readerService.getSection(sectionId);

      if (!data) {
        throw new Error('Section not found');
      }

      console.log('Section data loaded:', data);
      setSection(data);
    } catch (error) {
      console.error('Error loading section:', error);
      setError(error instanceof Error ? error.message : 'Failed to load section');
      enqueueSnackbar('Failed to load section', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadBookData = async () => {
    try {
      setIsLoadingBook(true);
      setBookError(null);
      console.log('Loading book data');

      // Replace with your actual book data loading logic
      // const data = await bookService.getBook('alice-in-wonderland');
      const data = { title: 'Alice in Wonderland', chapters: [] }; // Placeholder

      if (!data || !data.chapters) {
        throw new Error('Book data is incomplete or missing');
      }

      console.log('Book data loaded:', data);
      setBookData(data);
    } catch (error) {
      console.error('Error loading book data:', error);
      setBookError(error instanceof Error ? error.message : 'Failed to load book data');
    } finally {
      setIsLoadingBook(false);
    }
  };

  const loadReadingProgress = async () => {
    try {
      setIsLoadingProgress(true);
      setProgressError(null);
      console.log('Loading reading progress');

      // Replace with your actual progress loading logic
      // const progress = await progressService.getReadingProgress(userId, 'alice-in-wonderland');
      const progress = { currentPage: 1, totalPages: 100 }; // Placeholder

      console.log('Reading progress loaded:', progress);
      setReadingProgress(progress);
    } catch (error) {
      console.error('Error loading reading progress:', error);
      setProgressError(error instanceof Error ? error.message : 'Failed to load reading progress');
    } finally {
      setIsLoadingProgress(false);
    }
  };

  const handleRequestHelp = async () => {
    if (!section) return;
    try {
      setSubmitting(true);
      await readerService.requestHelp(section.id);
      enqueueSnackbar('Help request submitted successfully', { variant: 'success' });
      if (isMobile) {
        setHelpDrawerOpen(false);
      }
    } catch (error) {
      console.error('Error requesting help:', error);
      enqueueSnackbar('Failed to submit help request', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderHelpPanel = () => (
    <Box p={isMobile ? 2 : 3}>
      <Typography variant="h6" gutterBottom>
        Need Help?
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        If you're having trouble understanding this section, our consultants are here to help.
      </Typography>
      <LoadingButton
        variant="contained"
        fullWidth
        onClick={handleRequestHelp}
        loading={submitting}
        loadingText="Requesting Help..."
      >
        Request Help
      </LoadingButton>
    </Box>
  );

  // Show loading state if any data is still loading
  if (loading || isLoadingBook || isLoadingProgress) {
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
  if (error || bookError || progressError) {
    const errorMessage = error || bookError || progressError;
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
  if (!bookData || !bookData.chapters || bookData.chapters.length === 0) {
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

  // Check if section data is missing
  if (!section) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
          <ErrorOutlineIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="warning.main" gutterBottom>
            Section Not Found
          </Typography>
          <Typography variant="body1" paragraph>
            The requested section could not be found.
          </Typography>
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
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: isMobile ? 2 : 3, position: 'relative' }}>
              {isMobile && (
                <IconButton
                  color="primary"
                  onClick={() => setHelpDrawerOpen(true)}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                  }}
                >
                  <HelpIcon />
                </IconButton>
              )}
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                gutterBottom
                sx={{ pr: isMobile ? 5 : 0 }}
              >
                {section.chapter.title}
              </Typography>
              <Typography
                variant={isMobile ? 'subtitle1' : 'h6'}
                color="text.secondary"
                gutterBottom
              >
                {section.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  lineHeight: 1.6,
                }}
              >
                {section.content}
              </Typography>
            </Paper>
          </Grid>
          {!isMobile && (
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
                {renderHelpPanel()}
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>

      {isMobile && (
        <Drawer
          anchor="bottom"
          open={helpDrawerOpen}
          onClose={() => setHelpDrawerOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh',
            },
          }}
        >
          {renderHelpPanel()}
        </Drawer>
      )}
    </Container>
  );
};