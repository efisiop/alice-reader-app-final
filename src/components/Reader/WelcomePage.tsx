import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { appLog } from '../LogViewer';

interface WelcomePageProps {
  bookTitle: string;
  onStartReading: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ bookTitle, onStartReading }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Welcome to {bookTitle}
        </Typography>
        
        <Typography variant="body1" paragraph sx={{ mb: 4 }}>
          You're about to start reading {bookTitle}. This interactive reader will help you
          understand the text better with features like vocabulary lookup, AI assistance,
          and progress tracking.
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={() => {
              appLog('WelcomePage', 'User clicked Start Reading button', 'info');
              onStartReading();
            }}
          >
            Start Reading
          </Button>
          
          <Button 
            variant="outlined"
            onClick={() => {
              appLog('WelcomePage', 'User clicked Back to Dashboard button', 'info');
              navigate('/reader');
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
