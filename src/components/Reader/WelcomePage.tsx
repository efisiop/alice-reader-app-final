import React from 'react';
import { Box, Typography, Button, Paper, Container, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { appLog } from '../LogViewer';
import BookIcon from '@mui/icons-material/Book';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface WelcomePageProps {
  bookTitle: string;
  onStartReading: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ bookTitle, onStartReading }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 2,
          background: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{
            fontFamily: '"Alice", serif',
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Welcome to {bookTitle}
        </Typography>
        
        <Typography 
          variant="body1" 
          paragraph 
          sx={{ 
            mb: 4,
            maxWidth: 600,
            mx: 'auto',
            color: 'text.secondary'
          }}
        >
          You're about to start reading {bookTitle}. This interactive reader will help you
          understand the text better with features like vocabulary lookup and AI assistance.
        </Typography>
        
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 2, 
            maxWidth: 300, 
            mx: 'auto' 
          }}
        >
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            startIcon={<BookIcon />}
            onClick={() => {
              appLog('WelcomePage', 'User clicked Start Reading button', 'info');
              onStartReading();
            }}
            sx={{
              py: 1.5,
              fontSize: '1.1rem',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: 6
              }
            }}
          >
            Start Reading
          </Button>
          
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              appLog('WelcomePage', 'User clicked Back to Dashboard button', 'info');
              navigate('/reader');
            }}
            sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: 2
              }
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default WelcomePage;
