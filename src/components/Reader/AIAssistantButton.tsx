// src/components/Reader/AIAssistantButton.tsx
import React, { useState } from 'react';
import {
  Box,
  Fab,
  Tooltip,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Dialog,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExplainIcon from '@mui/icons-material/Psychology';
import QuizIcon from '@mui/icons-material/Quiz';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import AIChat from './AIChat';
import { AIMode } from '../../services/aiService';
import { appLog } from '../LogViewer';
import { BookId, SectionId, UserId } from '../../types/idTypes';

interface AIAssistantButtonProps {
  bookId?: string | BookId;
  sectionId?: string | SectionId;
  userId?: string | UserId;
  selectedText?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'fab' | 'speed-dial';
}

/**
 * Button component for accessing the AI assistant
 */
const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  bookId,
  sectionId,
  userId,
  selectedText = '',
  position = 'bottom-right',
  variant = 'speed-dial'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<AIMode>('chat');
  
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
  
  // Handle open
  const handleOpen = () => {
    setOpen(true);
  };
  
  // Handle close
  const handleClose = () => {
    setOpen(false);
  };
  
  // Handle dialog open
  const handleDialogOpen = (selectedMode: AIMode = 'chat') => {
    appLog('AIAssistantButton', 'Opening AI assistant dialog', 'info', { mode: selectedMode });
    setMode(selectedMode);
    setDialogOpen(true);
    setOpen(false);
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  // Speed dial actions
  const actions = [
    { icon: <ChatIcon />, name: 'Chat', mode: 'chat' as AIMode },
    { icon: <ExplainIcon />, name: 'Explain', mode: 'explain' as AIMode },
    { icon: <QuizIcon />, name: 'Quiz', mode: 'quiz' as AIMode },
    { icon: <AutoFixHighIcon />, name: 'Simplify', mode: 'simplify' as AIMode }
  ];
  
  // Render speed dial
  const renderSpeedDial = () => (
    <SpeedDial
      ariaLabel="AI Assistant"
      icon={<SpeedDialIcon icon={<SmartToyIcon />} openIcon={<CloseIcon />} />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
      direction="up"
      sx={{
        position: 'fixed',
        ...getPositionStyles(),
        '& .MuiFab-primary': {
          width: 56,
          height: 56
        }
      }}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          tooltipOpen={isMobile}
          onClick={() => handleDialogOpen(action.mode)}
        />
      ))}
    </SpeedDial>
  );
  
  // Render fab
  const renderFab = () => (
    <Tooltip title="AI Assistant">
      <Fab
        color="primary"
        aria-label="AI Assistant"
        onClick={() => handleDialogOpen()}
        sx={{
          position: 'fixed',
          ...getPositionStyles()
        }}
      >
        <SmartToyIcon />
      </Fab>
    </Tooltip>
  );
  
  return (
    <>
      {variant === 'speed-dial' ? renderSpeedDial() : renderFab()}
      
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        fullScreen={isMobile}
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            overflow: 'hidden',
            height: isMobile ? '100%' : 'auto',
            m: isMobile ? 0 : 2
          }
        }}
      >
        <AIChat
          bookId={bookId}
          sectionId={sectionId}
          userId={userId}
          selectedText={selectedText}
          initialMode={mode}
          onClose={handleDialogClose}
          fullScreen={isMobile}
        />
      </Dialog>
    </>
  );
};

export default AIAssistantButton;
