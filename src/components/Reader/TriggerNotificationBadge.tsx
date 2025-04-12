// src/components/Reader/TriggerNotificationBadge.tsx
import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Tooltip,
  Fade,
  useTheme
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { getUnprocessedTriggers, subscribeToTriggers } from '../../services/triggerService';
import { appLog } from '../LogViewer';
import { UserId, BookId } from '../../types/idTypes';

interface TriggerNotificationBadgeProps {
  userId: string | UserId;
  bookId: string | BookId;
  onClick: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  color?: 'primary' | 'secondary' | 'default' | 'error' | 'info' | 'success' | 'warning';
}

/**
 * A notification badge that shows when there are unprocessed triggers
 */
const TriggerNotificationBadge: React.FC<TriggerNotificationBadgeProps> = ({
  userId,
  bookId,
  onClick,
  position = 'top-right',
  color = 'primary'
}) => {
  const theme = useTheme();
  const [triggerCount, setTriggerCount] = useState(0);
  const [visible, setVisible] = useState(false);
  
  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 16, left: 16 };
      case 'bottom-right':
        return { bottom: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'top-right':
      default:
        return { top: 16, right: 16 };
    }
  };
  
  // Load initial unprocessed triggers
  useEffect(() => {
    const loadTriggers = async () => {
      try {
        appLog('TriggerNotificationBadge', 'Loading unprocessed triggers', 'info');
        const unprocessedTriggers = await getUnprocessedTriggers(userId);
        
        const count = unprocessedTriggers.length;
        setTriggerCount(count);
        setVisible(count > 0);
        
        appLog('TriggerNotificationBadge', `Found ${count} unprocessed triggers`, 'success');
      } catch (error) {
        appLog('TriggerNotificationBadge', 'Error loading unprocessed triggers', 'error', error);
      }
    };
    
    loadTriggers();
  }, [userId]);
  
  // Subscribe to new triggers
  useEffect(() => {
    appLog('TriggerNotificationBadge', 'Setting up trigger subscription', 'info');
    
    const subscription = subscribeToTriggers(userId, (newTrigger) => {
      appLog('TriggerNotificationBadge', 'New trigger received', 'info', { triggerId: newTrigger.id });
      
      setTriggerCount(prevCount => prevCount + 1);
      setVisible(true);
    });
    
    return () => {
      appLog('TriggerNotificationBadge', 'Cleaning up trigger subscription', 'info');
      subscription.unsubscribe();
    };
  }, [userId]);
  
  // Handle click
  const handleClick = () => {
    appLog('TriggerNotificationBadge', 'Notification badge clicked', 'info');
    onClick();
    
    // Reset the count and hide the badge
    setTriggerCount(0);
    setVisible(false);
  };
  
  if (!visible) {
    return null;
  }
  
  return (
    <Fade in={visible}>
      <Tooltip title={`You have ${triggerCount} new message${triggerCount !== 1 ? 's' : ''}`}>
        <IconButton
          color={color}
          onClick={handleClick}
          sx={{
            position: 'fixed',
            ...getPositionStyles(),
            zIndex: 1000,
            backgroundColor: theme.palette.background.paper,
            boxShadow: 3,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <Badge badgeContent={triggerCount} color={color} max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>
    </Fade>
  );
};

export default TriggerNotificationBadge;
