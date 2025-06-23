import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const hasShownSuccess = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { search } = useLocation();
  const token = new URLSearchParams(search).get('token');

  // Helper function to get backend URL
  const getBackendUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_BACKEND_URL || window.location.origin;
    }
    return `http://localhost:${process.env.REACT_APP_PORT_BACKEND || 5050}`;
  };

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('No verification token provided');
        setLoading(false);
        return;
      }

      try {
        const backendUrl = getBackendUrl();
        const response = await fetch(`${backendUrl}/api/auth/verify-email/${token}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          setMessage(data.message || 'Email verified successfully');
          setIsVerified(true);
          hasShownSuccess.current = true;
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setError(data.message || 'Failed to verify email');
        }
      } catch (err) {
        setError('An error occurred while verifying your email');
        console.error('Verification error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: 'text.primary',
              mb: 3
            }}
          >
            Email Verification
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={40} />
              <Typography variant="h6" color="text.secondary">
                Verifying your email...
              </Typography>
            </Box>
          ) : (
            <>
              {error && !isVerified && !hasShownSuccess.current && (
                <Alert severity="error" sx={{ width: '100%', mb: 3 }}>
                  {error}
                </Alert>
              )}

              {message && (
                <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
                  {message}
                </Alert>
              )}

              {error && !message && !isVerified && !hasShownSuccess.current && (
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/verify')}
                    disabled={loading}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem'
                    }}
                  >
                    Resend Verification Email
                  </Button>
                </Box>
              )}

              <Button
                onClick={() => navigate('/login')}
                sx={{
                  mt: 2,
                  textTransform: 'none',
                  color: 'text.secondary'
                }}
              >
                Back to Login
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail; 