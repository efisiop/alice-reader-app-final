import React from 'react';
import { Box, CircularProgress, CircularProgressProps, Typography } from '@mui/material';

export interface LoadingIndicatorProps extends Omit<CircularProgressProps, 'ref'> {
  fullHeight?: boolean;
  minHeight?: string | number;
  message?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullHeight = false,
  minHeight = '200px',
  size = 40,
  message,
  ...props
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight={fullHeight ? '100vh' : minHeight}
      width="100%"
    >
      <CircularProgress size={size} {...props} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};