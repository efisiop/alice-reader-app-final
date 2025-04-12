// src/components/UI/EnhancedAppHeader.tsx
import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Badge,
  useTheme,
  useScrollTrigger,
  Slide,
  Fade
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ConnectionStatus from './ConnectionStatus';
import { useAuth } from '../../contexts/AuthContext';
import { TRANSITIONS } from '../../theme/theme';

// Hide on scroll
interface HideOnScrollProps {
  children: React.ReactElement;
}

const HideOnScroll: React.FC<HideOnScrollProps> = ({ children }) => {
  const trigger = useScrollTrigger();
  
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
};

const EnhancedAppHeader: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isConsultant, logout } = useAuth();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  
  // Show header with animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
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
    if (path.startsWith('/reader/stats')) return 'Reading Statistics';
    if (path.startsWith('/reader')) return 'Reader Dashboard';
    if (path.startsWith('/consultant')) return 'Consultant Dashboard';
    if (path.startsWith('/status')) return 'System Status';
    if (path.startsWith('/test')) return 'Test Page';
    
    return 'Alice Reader';
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Handle user menu open
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  // Handle user menu close
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  // Handle navigation
  const handleNavigate = (path: string) => {
    handleMenuClose();
    handleUserMenuClose();
    navigate(path);
  };
  
  // Handle logout
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
    navigate('/login');
  };
  
  // Get user initials
  const getUserInitials = () => {
    if (!user) return '?';
    
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
  };
  
  return (
    <HideOnScroll>
      <AppBar
        position="sticky"
        elevation={1}
        sx={{
          backgroundColor: theme.palette.background.paper,
          transition: `all ${TRANSITIONS.MEDIUM}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(-20px)',
        }}
      >
        <Toolbar>
          {/* Mobile menu button */}
          <IconButton
            edge="start"
            color="primary"
            aria-label="menu"
            sx={{ mr: 2, display: { xs: 'flex', md: 'none' } }}
            onClick={handleMenuOpen}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo/Title */}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: theme.palette.primary.main,
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            onClick={() => navigate(isConsultant ? '/consultant' : '/reader')}
          >
            <MenuBookIcon sx={{ mr: 1 }} />
            {getTitle()}
          </Typography>
          
          {/* Desktop navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {isConsultant ? (
              <>
                <Button
                  color="inherit"
                  startIcon={<DashboardIcon />}
                  onClick={() => handleNavigate('/consultant')}
                  sx={{ mr: 1 }}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  startIcon={<DashboardIcon />}
                  onClick={() => handleNavigate('/reader')}
                  sx={{ mr: 1 }}
                >
                  Dashboard
                </Button>
                <Button
                  color="inherit"
                  startIcon={<MenuBookIcon />}
                  onClick={() => handleNavigate('/reader/read')}
                  sx={{ mr: 1 }}
                >
                  Read
                </Button>
                <Button
                  color="inherit"
                  startIcon={<BarChartIcon />}
                  onClick={() => handleNavigate('/reader/stats')}
                  sx={{ mr: 1 }}
                >
                  Statistics
                </Button>
              </>
            )}
          </Box>
          
          {/* User section */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ConnectionStatus />
              
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleUserMenuOpen}
                  size="small"
                  sx={{ ml: 2 }}
                  aria-controls={Boolean(userMenuAnchorEl) ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={Boolean(userMenuAnchorEl) ? 'true' : undefined}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: theme.palette.primary.main,
                      transition: `all ${TRANSITIONS.MEDIUM}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                      },
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {/* Mobile menu */}
          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
            TransitionComponent={Fade}
            PaperProps={{
              elevation: 3,
              sx: {
                minWidth: 200,
                borderRadius: 2,
                mt: 1.5,
              },
            }}
          >
            {isConsultant ? (
              <MenuItem onClick={() => handleNavigate('/consultant')}>
                <ListItemIcon>
                  <DashboardIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Dashboard</ListItemText>
              </MenuItem>
            ) : (
              <>
                <MenuItem onClick={() => handleNavigate('/reader')}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Dashboard</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/reader/read')}>
                  <ListItemIcon>
                    <MenuBookIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Read</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/reader/stats')}>
                  <ListItemIcon>
                    <BarChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Statistics</ListItemText>
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem onClick={() => handleNavigate('/status')}>
              <ListItemIcon>
                <HelpOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>System Status</ListItemText>
            </MenuItem>
          </Menu>
          
          {/* User menu */}
          <Menu
            anchorEl={userMenuAnchorEl}
            open={Boolean(userMenuAnchorEl)}
            onClose={handleUserMenuClose}
            TransitionComponent={Fade}
            PaperProps={{
              elevation: 3,
              sx: {
                minWidth: 200,
                borderRadius: 2,
                mt: 1.5,
              },
            }}
          >
            <MenuItem onClick={handleUserMenuClose} disabled>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={user?.email} />
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </HideOnScroll>
  );
};

export default EnhancedAppHeader;
