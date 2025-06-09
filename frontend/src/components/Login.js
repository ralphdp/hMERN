import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Stack,
  useTheme
} from '@mui/material';
import {
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon
} from '@mui/icons-material';

const Login = () => {
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const PORT = process.env.PORT_BACKEND || 5050;
  const getBackendUrl = () => {
    return `http://localhost:${PORT}`;
  };

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const backendUrl = getBackendUrl();
        console.log('Fetching providers with backend URL:', backendUrl);
        
        const response = await fetch(`${backendUrl}/api/auth/providers`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          const providersList = Array.isArray(data) ? data : 
                              Array.isArray(data.providers) ? data.providers : [];
          console.log('Received providers:', providersList);
          setProviders(providersList);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.message || 'Failed to fetch login options');
        }
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Failed to fetch login options');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleLogin = (provider) => {
    const backendUrl = getBackendUrl();
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!Array.isArray(providers) || providers.length === 0) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default'
        }}
      >
        <Alert severity="info" sx={{ maxWidth: 400 }}>
          No login options available
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4
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
            Welcome
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
            Please sign in to continue
          </Typography>

          <Stack spacing={2} width="100%">
            {providers.map((provider) => {
              const icons = {
                google: <GoogleIcon />,
                github: <GitHubIcon />,
                facebook: <FacebookIcon />,
                instagram: <InstagramIcon />
              };

              const colors = {
                google: '#DB4437',
                github: '#333',
                facebook: '#4267B2',
                instagram: '#E1306C'
              };

              return (
                <Button
                  key={provider}
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={icons[provider]}
                  onClick={() => handleLogin(provider)}
                  sx={{
                    bgcolor: colors[provider],
                    color: 'white',
                    '&:hover': {
                      bgcolor: colors[provider],
                      opacity: 0.9
                    },
                    py: 1.5,
                    boxShadow: theme.shadows[2]
                  }}
                >
                  Sign in with {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </Button>
              );
            })}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 