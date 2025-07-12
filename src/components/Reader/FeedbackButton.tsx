// src/components/Reader/FeedbackButton.tsx
import React, { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Zoom,
  useMediaQuery,
  useTheme,
  Box
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import CloseIcon from '@mui/icons-material/Close';
import PositiveFeedbackForm from './PositiveFeedbackForm';
import { appLog } from '../LogViewer';
import { useAuth } from '../../contexts/AuthContext';
import { logFeedbackInteraction } from '../../services/feedbackService';
import { BookId, SectionId } from '../../types/idTypes';

interface FeedbackButtonProps {
  bookId?: string | BookId;
  sectionId?: string | SectionId;
  sectionTitle?: string;
  chapterTitle?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: 'primary' | 'secondary' | 'default' | 'success' | 'error' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
}

/**
 * A floating action button that opens a feedback dialog
 */
const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  bookId,
  sectionId,
  sectionTitle,
  chapterTitle,
  position = 'bottom-right',
  color = 'secondary',
  size = 'medium'
}) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  
  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'top-right':
        return { top: 16, right: 16 };
      case 'top-left':
        return { top: 16, left: 16 };
      case 'bottom-right':
      default:
        return { bottom: 16, right: 16 };
    }
  };
  
  // Handle dialog open
  const handleOpen = () => {
    appLog('FeedbackButton', 'Opening feedback dialog', 'info');
    setOpen(true);
    
    // Log the interaction
    if (user && bookId) {
      logFeedbackInteraction(
        user.id,
        bookId,
        'view',
        { sectionId: sectionId?.toString() }
      ).catch(error => {
        appLog('FeedbackButton', 'Error logging feedback view', 'error', error);
      });
    }
  };
  
  // Handle dialog close
  const handleClose = () => {
    appLog('FeedbackButton', 'Closing feedback dialog', 'info');
    setOpen(false);
    
    // Log the interaction
    if (user && bookId) {
      logFeedbackInteraction(
        user.id,
        bookId,
        'cancellation',
        { sectionId: sectionId?.toString() }
      ).catch(error => {
        appLog('FeedbackButton', 'Error logging feedback cancellation', 'error', error);
      });
    }
  };
  
  // Handle successful submission
  const handleSubmitSuccess = () => {
    // Close the dialog after a short delay
    setTimeout(() => {
      setOpen(false);
    }, 2000);
  };
  
  return (
    <>
      <Tooltip title="Share your experience" placement="left">
        <Zoom in={true}>
          <Fab
            color={color}
            aria-label="feedback"
            onClick={handleOpen}
            size={size}
            sx={{
              position: 'fixed',
              ...getPositionStyles(),
              zIndex: 1000
            }}
          >
            <FeedbackIcon />
          </Fab>
        </Zoom>
      </Tooltip>
      
      <Dialog
        open={open}
        onClose={handleClose}
        fullScreen={fullScreen}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FeedbackIcon sx={{ mr: 1 }} />
              Share Your Experience
            </Box>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <PositiveFeedbackForm
            bookId={bookId}
            sectionId={sectionId}
            sectionTitle={sectionTitle}
            chapterTitle={chapterTitle}
            onClose={handleClose}
            onSubmitSuccess={handleSubmitSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackButton;
