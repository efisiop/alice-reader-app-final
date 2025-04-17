import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import BookIcon from '@mui/icons-material/Book';
import { useAuth } from '../../contexts/AuthContext';
import { localAliceCover } from '../../assets';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = React.useState<null | HTMLElement>(null);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleMenuClose();
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigate = (path: string) => {
    handleMenuClose();
    navigate(path);
  };

  // Don't show header on landing page
  if (location.pathname === '/') {
    return null;
  }

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      {user && (
        <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
            {user.email?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <Typography variant="body2">{user.email}</Typography>
        </Box>
      )}

      <Divider />

      <MenuItem onClick={() => handleNavigate('/reader')}>
        <BookIcon sx={{ mr: 1 }} fontSize="small" />
        {location.pathname.includes('/reader/interaction') ? 'Welcome Dashboard' : 'Reader Dashboard'}
      </MenuItem>

      <MenuItem onClick={handleSignOut}>
        <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
        Sign Out
      </MenuItem>
    </Menu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => handleNavigate('/')}>
        <HomeIcon sx={{ mr: 1 }} fontSize="small" />
        Home
      </MenuItem>

      {user ? (
        <>
          <MenuItem onClick={() => handleNavigate('/reader')}>
            <BookIcon sx={{ mr: 1 }} fontSize="small" />
            {location.pathname.includes('/reader/interaction') ? 'Welcome Dashboard' : 'Reader Dashboard'}
          </MenuItem>

          <Divider />

          <MenuItem onClick={handleSignOut}>
            <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
            Sign Out
          </MenuItem>
        </>
      ) : (
        <>
          <MenuItem onClick={() => handleNavigate('/login')}>
            <AccountCircleIcon sx={{ mr: 1 }} fontSize="small" />
            Sign In
          </MenuItem>

          <MenuItem onClick={() => handleNavigate('/register')}>
            <AccountCircleIcon sx={{ mr: 1 }} fontSize="small" />
            Register
          </MenuItem>
        </>
      )}
    </Menu>
  );

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <IconButton
          component={RouterLink}
          to="/"
          edge="start"
          color="inherit"
          aria-label="home"
          sx={{ mr: 2 }}
        >
          <HomeIcon />
        </IconButton>

        <Box
          component={RouterLink}
          to={user && location.pathname.includes('/reader/interaction') ? '/reader' : '/'}
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'inherit'
          }}
        >
          <Box
            component="img"
            src={localAliceCover}
            alt="Alice Reader"
            sx={{
              height: 40,
              width: 'auto',
              mr: 1,
              borderRadius: 1
            }}
          />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            Alice Reader
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {!isMobile ? (
          <Box sx={{ display: 'flex' }}>
            <Button
              color="inherit"
              component={RouterLink}
              to="/"
            >
              Home
            </Button>

            {user ? (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/reader"
                >
                  {location.pathname.includes('/reader/interaction') ? 'Welcome Dashboard' : 'Reader Dashboard'}
                </Button>

                <IconButton
                  edge="end"
                  aria-label="account of current user"
                  aria-haspopup="true"
                  onClick={handleProfileMenuOpen}
                  color="inherit"
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                </IconButton>
              </>
            ) : (
              <>
                <Button
                  color="inherit"
                  component={RouterLink}
                  to="/login"
                >
                  Sign In
                </Button>

                <Button
                  color="primary"
                  variant="contained"
                  component={RouterLink}
                  to="/register"
                  sx={{ ml: 1 }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        ) : (
          <IconButton
            edge="end"
            aria-label="menu"
            aria-haspopup="true"
            onClick={handleMobileMenuOpen}
            color="inherit"
          >
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>
      {renderMenu}
      {renderMobileMenu}
    </AppBar>
  );
};

export default Header;
