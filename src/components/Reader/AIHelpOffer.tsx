// src/components/Reader/AIHelpOffer.tsx
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Collapse,
  Fade,
  Slide,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { logHelpOffer } from '../../services/aiService';
import { appLog } from '../LogViewer';
import { BookId, SectionId, UserId } from '../../types/idTypes';

interface AIHelpOfferProps {
  bookId: string | BookId;
  sectionId: string | SectionId;
  userId: string | UserId;
  onAccept: () => void;
  onDecline: () => void;
  onClose: () => void;
  variant?: 'slide' | 'fade' | 'collapse';
  position?: 'bottom' | 'top' | 'right';
}

/**
 * Component for offering AI help to users
 */
const AIHelpOffer: React.FC<AIHelpOfferProps> = ({
  bookId,
  sectionId,
  userId,
  onAccept,
  onDecline,
  onClose,
  variant = 'slide',
  position = 'bottom'
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  
  // Handle accept
  const handleAccept = () => {
    appLog('AIHelpOffer', 'User accepted help offer', 'info');
    
    // Log the acceptance
    logHelpOffer(userId, bookId, sectionId, true)
      .catch(error => {
        appLog('AIHelpOffer', 'Error logging help offer acceptance', 'error', error);
      });
    
    // Close the offer
    setOpen(false);
    
    // Call the accept callback
    setTimeout(() => {
      onAccept();
      onClose();
    }, 300);
  };
  
  // Handle decline
  const handleDecline = () => {
    appLog('AIHelpOffer', 'User declined help offer', 'info');
    
    // Log the decline
    logHelpOffer(userId, bookId, sectionId, false)
      .catch(error => {
        appLog('AIHelpOffer', 'Error logging help offer decline', 'error', error);
      });
    
    // Close the offer
    setOpen(false);
    
    // Call the decline callback
    setTimeout(() => {
      onDecline();
      onClose();
    }, 300);
  };
  
  // Handle close
  const handleClose = () => {
    appLog('AIHelpOffer', 'User closed help offer', 'info');
    
    // Log the decline
    logHelpOffer(userId, bookId, sectionId, false)
      .catch(error => {
        appLog('AIHelpOffer', 'Error logging help offer close', 'error', error);
      });
    
    // Close the offer
    setOpen(false);
    
    // Call the close callback
    setTimeout(onClose, 300);
  };
  
  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top':
        return {
          top: 16,
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto'
        };
      case 'right':
        return {
          top: '50%',
          right: 16,
          transform: 'translateY(-50%)'
        };
      case 'bottom':
      default:
        return {
          bottom: 16,
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto'
        };
    }
  };
  
  // Render the offer content
  const renderContent = () => (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        maxWidth: 400,
        width: '100%',
        borderRadius: 2,
        bgcolor: theme.palette.background.paper,
        boxShadow: theme.shadows[3],
        position: 'fixed',
        zIndex: 1000,
        ...getPositionStyles()
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <SmartToyIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Need some help?
        </Typography>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        I noticed you might be having difficulty with this section. Would you like some assistance understanding the text?
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleDecline}
        >
          No, thanks
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<HelpOutlineIcon />}
          onClick={handleAccept}
        >
          Yes, help me
        </Button>
      </Box>
    </Paper>
  );
  
  // Render the offer with the appropriate animation
  switch (variant) {
    case 'fade':
      return (
        <Fade in={open} timeout={300} unmountOnExit>
          {renderContent()}
        </Fade>
      );
    case 'collapse':
      return (
        <Collapse in={open} timeout={300} unmountOnExit>
          {renderContent()}
        </Collapse>
      );
    case 'slide':
    default:
      return (
        <Slide
          direction={position === 'top' ? 'down' : position === 'right' ? 'left' : 'up'}
          in={open}
          timeout={300}
          unmountOnExit
        >
          {renderContent()}
        </Slide>
      );
  }
};

export default AIHelpOffer;
