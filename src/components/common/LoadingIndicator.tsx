import React from 'react';
import { Box, CircularProgress, CircularProgressProps } from '@mui/material';

interface LoadingIndicatorProps extends Omit<CircularProgressProps, 'ref'> {
  fullHeight?: boolean;
  minHeight?: string | number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullHeight = false,
  minHeight = '200px',
  size = 40,
  ...props
}) => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={fullHeight ? '100vh' : minHeight}
      width="100%"
    >
      <CircularProgress size={size} {...props} />
    </Box>
  );
}; 