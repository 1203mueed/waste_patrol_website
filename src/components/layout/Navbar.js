import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  Report,
  ExitToApp,
  Map
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const renderProfileMenu = (
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
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem 
        onClick={() => { navigate('/profile'); handleMenuClose(); }}
        sx={{ minWidth: 150 }}
      >
        <AccountCircle sx={{ mr: 1 }} />
        Profile
      </MenuItem>
      <MenuItem 
        onClick={() => { navigate('/dashboard'); handleMenuClose(); }}
      >
        <Dashboard sx={{ mr: 1 }} />
        Dashboard
      </MenuItem>
      {user?.role === 'citizen' && (
        <MenuItem 
          onClick={() => { navigate('/report-waste'); handleMenuClose(); }}
        >
          <Report sx={{ mr: 1 }} />
          Report Waste
        </MenuItem>
      )}
      <MenuItem onClick={handleLogout}>
        <ExitToApp sx={{ mr: 1 }} />
        Logout
      </MenuItem>
    </Menu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMenuAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      open={Boolean(mobileMenuAnchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem 
        key="heatmap"
        onClick={() => { navigate('/heatmap'); handleMenuClose(); }}
      >
        <Map sx={{ mr: 1 }} />
        Live Heatmap
      </MenuItem>
      
      {isAuthenticated ? (
        [
          <MenuItem 
            key="dashboard"
            onClick={() => { navigate('/dashboard'); handleMenuClose(); }}
          >
            Dashboard
          </MenuItem>,
          user?.role === 'citizen' && (
            <MenuItem 
              key="report"
              onClick={() => { navigate('/report-waste'); handleMenuClose(); }}
            >
              Report Waste
            </MenuItem>
          ),
          <MenuItem 
            key="profile"
            onClick={() => { navigate('/profile'); handleMenuClose(); }}
          >
            Profile
          </MenuItem>,
          <MenuItem key="logout" onClick={handleLogout}>
            Logout
          </MenuItem>
        ]
      ) : (
        [
          <MenuItem 
            key="login"
            onClick={() => { navigate('/login'); handleMenuClose(); }}
          >
            Login
          </MenuItem>,
          <MenuItem 
            key="register"
            onClick={() => { navigate('/register'); handleMenuClose(); }}
          >
            Register
          </MenuItem>
        ]
      )}
    </Menu>
  );

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #1e4d2b 0%, #2d7d4a 100%)',
        boxShadow: '0 4px 20px rgba(30, 77, 43, 0.3)'
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 64, sm: 70 } }}>
        {/* Logo and Title */}
        <Box 
          component={Link} 
          to="/" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: 'inherit',
            mr: 4,
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)'
            }
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <img 
              src="/logo.png" 
              alt="Waste Patrol Logo" 
              style={{ 
                height: 28, 
                width: 28,
                filter: 'brightness(0) invert(1)', // Makes logo white
                objectFit: 'contain'
              }}
            />
          </Box>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Waste Patrol
          </Typography>
        </Box>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: 'flex', gap: 1, mr: 'auto' }}>
            <Button
              component={Link}
              to="/heatmap"
              color="inherit"
              startIcon={<Map />}
              sx={{ 
                fontWeight: isActive('/heatmap') ? 600 : 500,
                borderRadius: 2,
                px: 2,
                py: 1,
                position: 'relative',
                backgroundColor: isActive('/heatmap') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                backdropFilter: isActive('/heatmap') ? 'blur(10px)' : 'none',
                border: isActive('/heatmap') ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                },
                transition: 'all 0.3s ease-in-out'
              }}
            >
              Live Heatmap
            </Button>
            
            {isAuthenticated && (
              <Button
                component={Link}
                to="/dashboard"
                color="inherit"
                sx={{ 
                  fontWeight: isActive('/dashboard') ? 600 : 500,
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  backgroundColor: isActive('/dashboard') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  backdropFilter: isActive('/dashboard') ? 'blur(10px)' : 'none',
                  border: isActive('/dashboard') ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                Dashboard
              </Button>
            )}
            {user?.role === 'citizen' && (
              <Button
                component={Link}
                to="/report-waste"
                color="inherit"
                sx={{ 
                  fontWeight: isActive('/report-waste') ? 600 : 500,
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  backgroundColor: isActive('/report-waste') ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  backdropFilter: isActive('/report-waste') ? 'blur(10px)' : 'none',
                  border: isActive('/report-waste') ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease-in-out'
                }}
              >
                Report Waste
              </Button>
            )}
          </Box>
        )}

        {/* Spacer for mobile */}
        {isMobile && <Box sx={{ flexGrow: 1 }} />}

        {/* Right side buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isAuthenticated ? (
            <>
              {!isMobile && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mr: 2, 
                    opacity: 0.9,
                    fontWeight: 500,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}
                >
                  Welcome, {user?.name}
                </Typography>
              )}
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
                sx={{
                  '&:hover': {
                    transform: 'scale(1.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '1rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
            </>
          ) : (
            <>
              {!isMobile ? (
                <>
                  <Button 
                    component={Link} 
                    to="/login" 
                    color="inherit" 
                    sx={{ 
                      mr: 1,
                      fontWeight: 500,
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    Login
                  </Button>
                  <Button 
                    component={Link} 
                    to="/register" 
                    variant="outlined" 
                    sx={{ 
                      color: 'white', 
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      fontWeight: 500,
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: 'white',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                      },
                      transition: 'all 0.3s ease-in-out'
                    }}
                  >
                    Register
                  </Button>
                </>
              ) : (
                <IconButton
                  size="large"
                  edge="end"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMobileMenuOpen}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
            </>
          )}
        </Box>

        {/* Mobile menu for unauthenticated users */}
        {isMobile && !isAuthenticated && renderMobileMenu}
        
        {/* Profile menu for authenticated users */}
        {isAuthenticated && renderProfileMenu}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;