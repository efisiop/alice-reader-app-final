// src/components/common/LoadingButton.tsx
import React from 'react';
import {
  Button,
  ButtonProps,
  CircularProgress,
  Box,
  Fade,
  useTheme
} from '@mui/material';
import { TRANSITIONS } from '../../theme/theme';

interface LoadingButtonProps extends Omit<ButtonProps, 'ref'> {
  loading?: boolean;
  loadingText?: string;
  loadingPosition?: 'start' | 'end' | 'center';
  loadingIndicator?: React.ReactNode;
  successIndicator?: React.ReactNode;
  success?: boolean;
  fullWidth?: boolean;
}

/**
 * Enhanced button component with built-in loading state
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  disabled,
  children,
  startIcon,
  endIcon,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={loading || disabled}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : startIcon}
      endIcon={loading ? undefined : endIcon}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};
