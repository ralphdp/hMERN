// frontend/src/App.js

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  useMediaQuery,
  ThemeProvider,
  CssBaseline,
  Container,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon
} from '@mui/icons-material';
import Login from './components/Login';
import { getTheme } from './theme';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  useEffect(() => {
    if (!localStorage.getItem('themeMode')) {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const PORT = process.env.PORT_BACKEND || 5050;
  const getBackendUrl = () => {
    // Always use port 5050 or PORT_BACKEND for backend in development
    return `http://localhost:${PORT}`;
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Skip the check if we're already logged out
      if (user === null && !loading) {
        return;
      }

      try {
        const backendUrl = getBackendUrl();
        
        const response = await fetch(`${backendUrl}/api/auth/user`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          // Silently handle 401 - just set user to null
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Remove user dependency to prevent loops

  const handleLogout = async () => {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setUser(null);
        setLogoutDialogOpen(false);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          position: 'relative'
        }}
      >
        <IconButton
          onClick={toggleTheme}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'background.paper',
              opacity: 0.9
            }
          }}
        >
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>

        {user ? (
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'background.default'
            }}
          >
            <Container maxWidth="sm">
              <Paper
                elevation={3}
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="h4" component="h1" gutterBottom>
                  Welcome, {user.name}!
                </Typography>
                {user.avatar ? (
                  <Box
                    component="img"
                    src={user.avatar}
                    alt={user.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://www.gravatar.com/avatar/${user.email}?d=identicon&s=200`;
                    }}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default'
                    }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={`https://www.gravatar.com/avatar/${user.email}?d=identicon&s=200`}
                    alt={user.name}
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default'
                    }}
                  />
                )}
                <Stack spacing={1} width="100%" alignItems="center">
                  <Typography variant="body1" color="text.secondary">
                    Email: {user.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Logged in with: {user.googleId ? 'Google' : user.githubId ? 'GitHub' : 'Unknown'}
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setLogoutDialogOpen(true)}
                  fullWidth
                >
                  Logout
                </Button>
              </Paper>
            </Container>
          </Box>
        ) : (
          <Login />
        )}

        <Dialog
          open={logoutDialogOpen}
          onClose={() => setLogoutDialogOpen(false)}
          aria-labelledby="logout-dialog-title"
          aria-describedby="logout-dialog-description"
        >
          <DialogTitle id="logout-dialog-title">
            Confirm Logout
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="logout-dialog-description">
              Are you sure you want to logout? You'll need to sign in again to access your account.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLogoutDialogOpen(false)} color="primary">
              Cancel
            </Button>
            <Button onClick={handleLogout} color="primary" variant="contained" autoFocus>
              Logout
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default App;
