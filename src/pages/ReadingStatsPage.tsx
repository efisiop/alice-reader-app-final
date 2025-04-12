// src/pages/ReadingStatsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  useTheme
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import ReadingStatsDashboard from '../components/Reader/ReadingStatsDashboard';
import { getBookDetails } from '../services/bookService';
import { appLog } from '../components/LogViewer';
import { ALICE_BOOK_ID } from '../data/fallbackBookData';

/**
 * A page for displaying detailed reading statistics
 */
const ReadingStatsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookDetails, setBookDetails] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load book details
  useEffect(() => {
    if (!user) return;
    
    const loadBookDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        appLog('ReadingStatsPage', 'Loading book details', 'info');
        
        const details = await getBookDetails(ALICE_BOOK_ID);
        
        if (details) {
          appLog('ReadingStatsPage', 'Book details loaded successfully', 'success');
          setBookDetails(details);
        } else {
          appLog('ReadingStatsPage', 'No book details found', 'warning');
          setError('Failed to load book details');
        }
      } catch (error) {
        appLog('ReadingStatsPage', 'Error loading book details', 'error', error);
        setError('Failed to load book details');
      } finally {
        setLoading(false);
      }
    };
    
    loadBookDetails();
  }, [user]);
  
  // Handle back button
  const handleBack = () => {
    navigate('/reader');
  };
  
  // Render loading state
  if (loading && !bookDetails) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // Render error state
  if (error && !bookDetails) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }
  
  // Render not logged in state
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You need to be logged in to view reading statistics.
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate('/login')}
        >
          Log In
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link component={RouterLink} to="/reader" color="inherit">
            Reader Dashboard
          </Link>
          <Typography color="text.primary">Reading Statistics</Typography>
        </Breadcrumbs>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Dashboard
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <ReadingStatsDashboard
          userId={user.id}
          bookId={ALICE_BOOK_ID}
          bookTitle={bookDetails?.title || 'Alice in Wonderland'}
          totalPages={bookDetails?.total_pages || 100}
        />
      </Paper>
      
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2">Reading Statistics</Typography>
        <Typography variant="body2">
          Your reading statistics are updated automatically as you read. Keep reading regularly to improve your stats and earn achievements!
        </Typography>
      </Alert>
    </Container>
  );
};

export default ReadingStatsPage;
