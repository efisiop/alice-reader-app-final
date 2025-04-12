// src/components/common/FeedbackSnackbar.tsx
import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertProps,
  Typography,
  Box,
  IconButton,
  Slide,
  SlideProps
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { TRANSITIONS } from '../../theme/theme';

// Slide transition
const SlideTransition = (props: SlideProps) => {
  return <Slide {...props} direction="up" />;
};

export type FeedbackVariant = 'success' | 'error' | 'info' | 'warning';

interface FeedbackSnackbarProps {
  open: boolean;
  message: string;
  variant?: FeedbackVariant;
  autoHideDuration?: number;
  onClose?: () => void;
  action?: React.ReactNode;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  severity?: AlertProps['severity'];
  icon?: React.ReactNode;
  title?: string;
  TransitionComponent?: React.ComponentType<SlideProps>;
}

/**
 * Enhanced snackbar component for user feedback
 */
const FeedbackSnackbar: React.FC<FeedbackSnackbarProps> = ({
  open,
  message,
  variant = 'info',
  autoHideDuration = 5000,
  onClose,
  action,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  severity,
  icon,
  title,
  TransitionComponent = SlideTransition
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Sync open state with prop
  useEffect(() => {
    setIsOpen(open);
  }, [open]);
  
  // Handle close
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    
    setIsOpen(false);
    
    // Call onClose after animation completes
    if (onClose) {
      setTimeout(onClose, TRANSITIONS.MEDIUM);
    }
  };
  
  // Get icon based on variant
  const getIcon = () => {
    if (icon) return icon;
    
    switch (severity || variant) {
      case 'success':
        return <CheckCircleIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      case 'warning':
        return <WarningIcon fontSize="small" />;
      case 'info':
      default:
        return <InfoIcon fontSize="small" />;
    }
  };
  
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      TransitionComponent={TransitionComponent}
    >
      <Alert
        severity={severity || variant}
        variant="filled"
        icon={getIcon()}
        action={
          action || (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
        sx={{
          width: '100%',
          boxShadow: 3,
          alignItems: 'center',
          '& .MuiAlert-message': {
            padding: '8px 0',
          },
        }}
      >
        <Box>
          {title && (
            <Typography variant="subtitle2" fontWeight="bold" component="div">
              {title}
            </Typography>
          )}
          <Typography variant="body2">{message}</Typography>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default FeedbackSnackbar;
