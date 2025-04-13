// src/AppTest.tsx
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress, Typography, AppBar, Toolbar, Button, Container } from '@mui/material';
import TestComponent from './components/test/TestComponent';
import ServiceTestComponent from './components/test/ServiceTestComponent';
import registerMockServices from './services/mockServices';

const AppTest: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const initServices = async () => {
      try {
        // Register mock services
        registerMockServices();
        setInitialized(true);
      } catch (err: any) {
        console.error('Error initializing services:', err);
        setError(err.message || 'Failed to initialize services');
      }
    };
    
    initServices();
  }, []);
  
  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h4" color="error" gutterBottom>
          Initialization Error
        </Typography>
        <Typography color="error">
          {error}
        </Typography>
      </Box>
    );
  }
  
  if (!initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Alice Reader Test App
          </Typography>
          <Button color="inherit" component="a" href="/#/">Home</Button>
          <Button color="inherit" component="a" href="/#/test">Test</Button>
          <Button color="inherit" component="a" href="/#/service-test">Service Test</Button>
        </Toolbar>
      </AppBar>
      
      <Container>
        <Routes>
          <Route path="/" element={<TestComponent />} />
          <Route path="/test" element={<TestComponent />} />
          <Route path="/service-test" element={<ServiceTestComponent />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </Router>
  );
};

const NotFound: React.FC = () => (
  <Box sx={{ p: 4, textAlign: 'center' }}>
    <Typography variant="h4">Page Not Found</Typography>
  </Box>
);

export default AppTest;
