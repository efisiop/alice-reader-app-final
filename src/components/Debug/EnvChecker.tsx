import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const EnvChecker: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'Not set';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set (hidden for security)' : 'Not set';

  return (
    <Paper sx={{ p: 3, m: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Environment Variables Check</Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          <strong>VITE_SUPABASE_URL:</strong> {supabaseUrl}
        </Typography>
        <Typography variant="body1">
          <strong>VITE_SUPABASE_ANON_KEY:</strong> {supabaseAnonKey}
        </Typography>
      </Box>
    </Paper>
  );
};

export default EnvChecker;
