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
  }, [token]);

  // Log state changes
  useEffect(() => {
    console.log('State updated:', { loading, error, message, isVerified });
  }, [loading, error, message, isVerified]);

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const email = new URLSearchParams(location.search).get('email');
      const backendUrl = getBackendUrl();
      
      console.log('Resending verification email to:', email);
      
      const response = await axios.post(
        `${backendUrl}/api/auth/resend-verification`,
        { email },
        { withCredentials: true }
      );
      
      console.log('Resend verification response:', response.data);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error('Resend verification error:', error);
      setError(error.response?.data?.message || 'Error sending verification email');
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  console.log('Rendering main component with states:', { loading, error, message, isVerified });

  return (
    <Container maxWidth="sm">
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px - 307px)">
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Email Verification
          </Typography>

          {error && !isVerified && !hasShownSuccess.current && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {error && !message && !isVerified && !hasShownSuccess.current && (
            <Box mt={2} textAlign="center">
              <Button
                variant="contained"
                color="primary"
                onClick={handleResendVerification}
                disabled={loading}
              >
                Resend Verification Email
              </Button>
            </Box>
          )}

          <Box mt={2} textAlign="center">
            <Button
              variant="text"
              color="primary"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmail; 