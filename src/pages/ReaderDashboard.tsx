import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ReaderDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1">Reader Dashboard</Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            Welcome to your reading journey!
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/reader/read')}
            sx={{ mt: 2 }}
          >
            Start Reading
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default ReaderDashboard;
