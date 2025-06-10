import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Link as MuiLink,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedLogo from './AnimatedLogo';

const Layout = ({ children, toggleColorMode }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [anchorElUser, setAnchorElUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    await logout();
    handleCloseUserMenu();
    navigate('/');
  };

  const navItems = [
    { label: 'Home', path: '/' }
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        hMERN
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.label}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        {!isAuthenticated && (
          <>
            <ListItem
              component={Link}
              to="/login"
              selected={location.pathname === '/login'}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem
              component={Link}
              to="/register"
              selected={location.pathname === '/register'}
              sx={{
                color: 'inherit',
                textDecoration: 'none',
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              <ListItemText primary="Register" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky">
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                color: 'inherit',
                textDecoration: 'none',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <AnimatedLogo 
                size={32} 
                color={theme.palette.mode === 'dark' ? '#fff' : theme.palette.grey[50]} 
                className="nav-logo"
              />
              hMERN
            </Typography>

            {!isMobile && (
              <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    component={Link}
                    to={item.path}
                    sx={{
                      color: 'inherit',
                      textDecoration: 'none',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                      },
                      ...(location.pathname === item.path && {
                        backgroundColor: 'primary.dark',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }),
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={toggleColorMode} color="inherit">
                {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>

              {!isMobile && !isAuthenticated && (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    color="inherit"
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderColor: 'primary.main',
                      },
                      ...(location.pathname === '/login' && {
                        backgroundColor: 'primary.dark',
                        color: 'white',
                        borderColor: 'primary.dark',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                          borderColor: 'primary.dark',
                        },
                      }),
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    color="primary"
                    variant="contained"
                    size="small"
                    sx={{
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      ...(location.pathname === '/register' && {
                        backgroundColor: 'primary.dark',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }),
                    }}
                  >
                    Register
                  </Button>
                </>
              )}

              {isAuthenticated && (
                <>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar
                        alt={user?.name || 'User'}
                        src={user?.avatar}
                        sx={{ width: 32, height: 32 }}
                      />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    <MenuItem
                      onClick={() => {
                        handleCloseUserMenu();
                        navigate('/dashboard');
                      }}
                    >
                      <Typography textAlign="center">Dashboard</Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <Typography textAlign="center">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[100]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="text.primary" gutterBottom>
                MERN Auth
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A secure and modern authentication system built with the MERN stack.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <AnimatedLogo 
                  size={100} 
                  color={theme.palette.mode === 'dark' ? theme.palette.grey[400] : theme.palette.grey[600]}
                  className="footer-logo"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="text.primary" gutterBottom>
                Quick Links
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <MuiLink component={Link} to="/" color="inherit" underline="hover">
                    Home
                  </MuiLink>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <MuiLink component={Link} to="/terms" color="inherit" underline="hover">
                    Terms of Service
                  </MuiLink>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <MuiLink component={Link} to="/privacy" color="inherit" underline="hover">
                    Privacy Policy
                  </MuiLink>
                </Box>
                <Box component="li" sx={{ mb: 1 }}>
                  <MuiLink component={Link} to="/cookies" color="inherit" underline="hover">
                    Cookie Policy
                  </MuiLink>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" color="text.primary" gutterBottom>
                Contact
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Have questions? We're here to help.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Email: support@mernauth.com
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 