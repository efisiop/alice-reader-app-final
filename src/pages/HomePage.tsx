import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Alice Reader
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          An interactive reading experience for Alice in Wonderland
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, my: 4 }}>
          <Typography variant="body1" paragraph>
            Alice Reader is an interactive reading application that enhances your experience
            of Lewis Carroll's classic "Alice's Adventures in Wonderland" with AI-powered
            features, word definitions, and a customizable reading interface.
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
            <Button 
              component={Link} 
              to="/login" 
              variant="contained" 
              color="primary" 
              size="large"
            >
              Sign In
            </Button>
            <Button 
              component={Link} 
              to="/register" 
              variant="outlined" 
              color="primary" 
              size="large"
            >
              Register
            </Button>
          </Box>
        </Paper>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            This is a demo application. For debugging, visit the <Link to="/debug">debug page</Link>.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default HomePage;
