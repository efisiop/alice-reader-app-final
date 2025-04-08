import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ReaderInterface: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" component="h1">Reader Interface</Typography>
          <Typography paragraph sx={{ mt: 2 }}>
            This is where you'll read the book.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/reader')}
            sx={{ mt: 2 }}
          >
            Back to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default ReaderInterface;
