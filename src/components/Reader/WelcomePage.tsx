import React from 'react';
import { Box, Typography, Button, Paper, Container, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { appLog } from '../LogViewer';
import BookIcon from '@mui/icons-material/Book';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTheme } from '@mui/material/styles';

interface WelcomePageProps {
  bookTitle: string;
  onStartReading: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ bookTitle, onStartReading }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7)), url('https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=2730&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      pt: 8,
      pb: 6
    }}>
      <Container maxWidth="md">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            animation: 'fadeIn 1.2s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(20px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          <Typography 
            variant="h3" 
            gutterBottom
            sx={{
              fontFamily: '"Alice", serif',
              fontWeight: 'bold',
              color: 'primary.main',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            Welcome to {bookTitle}
          </Typography>
          
          <Typography 
            variant="h6" 
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
    </Box>
  );
};

export default WelcomePage;
