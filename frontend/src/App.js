// frontend/src/App.js

import React, { useState, useEffect, useMemo } from 'react';
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
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PrivateRoute from './components/PrivateRoute';
import { createTheme } from '@mui/material/styles';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('light');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  useEffect(() => {
    if (!localStorage.getItem('themeMode')) {
      setMode(prefersDarkMode ? 'dark' : 'light');
    }
  }, [prefersDarkMode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
        typography: {
          fontFamily: '"Cabin", "PT Sans", sans-serif',
          h1: {
            fontFamily: '"Cabin", sans-serif',
            fontWeight: 700,
          },
          h2: {
            fontFamily: '"Cabin", sans-serif',
            fontWeight: 600,
          },
          h3: {
            fontFamily: '"Cabin", sans-serif',
            fontWeight: 600,
          },
          h4: {
            fontFamily: '"Cabin", sans-serif',
            fontWeight: 600,
          },
          h5: {
            fontFamily: '"Cabin", sans-serif',
            fontWeight: 500,
          },
          h6: {
            fontFamily: '"Cabin", sans-serif',
            fontWeight: 500,
          },
          body1: {
            fontFamily: '"PT Sans", sans-serif',
          },
          body2: {
            fontFamily: '"PT Sans", sans-serif',
          },
          button: {
            fontFamily: '"Cabin", sans-serif',
            fontWeight: 500,
            textTransform: 'none',
          },
        },
      }),
    [mode]
  );

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const getBackendUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_BACKEND_URL || window.location.origin;
    }
    return `http://localhost:${process.env.REACT_APP_PORT_BACKEND || 5050}`;
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
      <AuthProvider>
        <Router>
          <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
            <IconButton onClick={toggleColorMode} color="inherit">
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Box>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
