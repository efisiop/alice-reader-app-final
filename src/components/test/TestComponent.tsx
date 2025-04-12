// src/components/test/TestComponent.tsx
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

const TestComponent: React.FC = () => {
  return (
    <Box sx={{ p: 4, maxWidth: '800px', mx: 'auto', mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom>
          Alice Reader Test Component
        </Typography>
        <Typography variant="body1" paragraph>
          This is a simple test component to verify that the application is working correctly.
        </Typography>
        <Button variant="contained" color="primary">
          Test Button
        </Button>
      </Paper>
    </Box>
  );
};

export default TestComponent;
