import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Container, Typography, Box, Button, Paper } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';

// Basic theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6a51ae', // Purple shade for Alice in Wonderland theme
    },
    secondary: {
      main: '#ff6b8b', // Pink shade for highlights
    },
  },
});

function SimpleApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Alice Reader App
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to the Alice Reader App. This is a simplified version of the application
            to test if the basic React setup is working correctly.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary">
              Start Reading
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default SimpleApp;
