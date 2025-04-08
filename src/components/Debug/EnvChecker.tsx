import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { supabaseConfig } from '../../config';

const EnvChecker: React.FC = () => {
  const supabaseUrl = supabaseConfig.supabaseUrl || 'Not set';
  const supabaseAnonKey = supabaseConfig.supabaseAnonKey ? 'Set (hidden for security)' : 'Not set';

  return (
    <Paper sx={{ p: 3, m: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Supabase Configuration Check</Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body1">
          <strong>Supabase URL:</strong> {supabaseUrl}
        </Typography>
        <Typography variant="body1">
          <strong>Supabase Anon Key:</strong> {supabaseAnonKey}
        </Typography>
      </Box>
    </Paper>
  );
};

export default EnvChecker;
