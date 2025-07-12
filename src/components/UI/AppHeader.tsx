import React from 'react';
import { AppBar, Toolbar, Typography, Box, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ConnectionStatus from './ConnectionStatus';
import { useAuth } from '../../contexts/AuthContext';

const AppHeader: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isConsultant } = useAuth();
  
  // Determine if we should show the header
  const shouldShowHeader = () => {
    // Don't show on login/register pages
    if (['/login', '/register', '/verify'].includes(location.pathname)) {
      return false;
    }
    
    return true;
  };
  
  if (!shouldShowHeader()) {
    return null;
  }
  
  // Get the title based on the current route
  const getTitle = () => {
    const path = location.pathname;
    
    if (path.startsWith('/reader/read')) return 'Alice Reader';
    if (path.startsWith('/reader')) return 'Reader Dashboard';
    if (path.startsWith('/consultant')) return 'Consultant Dashboard';
    if (path.startsWith('/status')) return 'System Status';
    if (path.startsWith('/test')) return 'Test Page';
    
    return 'Alice Reader';
  };
  
  return (
    <AppBar position="static" elevation={1} sx={{ backgroundColor: theme.palette.background.paper }}>
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => navigate(isConsultant ? '/consultant' : '/reader')}
        >
          {getTitle()}
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, color: theme.palette.text.secondary }}>
              {user.email}
            </Typography>
            <ConnectionStatus />
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default AppHeader;
