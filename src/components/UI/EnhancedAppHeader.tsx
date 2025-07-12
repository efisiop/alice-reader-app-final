// src/components/UI/EnhancedAppHeader.tsx
import React, { useState, useContext } from 'react';
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
  Fade,
  useMediaQuery
} from '@mui/material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BarChartIcon from '@mui/icons-material/BarChart';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useAuth } from '../../contexts/AuthContext';
import { TRANSITIONS } from '../../theme/theme';
import { appLog } from '../LogViewer';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  
  // Show header with animation on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle mobile menu open
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };
  
  // Handle mobile menu close
  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
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
    handleMobileMenuClose();
    handleUserMenuClose();
    navigate(path);
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Get user initials
  const getUserInitials = () => {
    if (!user) return '?';
    
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
  };
  
  // Don't show header on login/register pages
  if (['/login', '/register', '/verify'].includes(location.pathname)) {
    return null;
  }
  
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
          {/* Logo/Title */}
          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontFamily: '"Alice", serif',
            }}
          >
            <MenuBookIcon sx={{ mr: 1 }} />
            Alice Reader
          </Typography>
          
          {/* User section */}
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
          
          {/* Mobile menu button */}
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={handleMobileMenuOpen}
              size="large"
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Mobile menu */}
          <Menu
            anchorEl={mobileMenuAnchorEl}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleMobileMenuClose}
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
            {user ? (
              <>
                <MenuItem onClick={() => handleNavigate('/reader')}>
                  <ListItemIcon>
                    <DashboardIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/reader/stats')}>
                  <ListItemIcon>
                    <AssessmentIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="My Stats" />
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/settings')}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </>
            ) : (
              <>
                <MenuItem onClick={() => handleNavigate('/login')}>
                  <ListItemText primary="Login" />
                </MenuItem>
                <MenuItem onClick={() => handleNavigate('/register')}>
                  <ListItemText primary="Sign Up" />
                </MenuItem>
              </>
            )}
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
            <MenuItem onClick={() => handleNavigate('/')}>
              <ListItemIcon>
                <HomeIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Welcome Page" 
                secondary="Start your reading journey"
              />
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/reader')}>
              <ListItemIcon>
                <DashboardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                secondary="View your reading overview"
              />
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/reader/stats')}>
              <ListItemIcon>
                <AssessmentIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="My Reading Stats" 
                secondary="View progress and notes"
              />
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Settings" 
                secondary="Customize your experience"
              />
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
