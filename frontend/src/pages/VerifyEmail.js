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

  // Helper function to get backend URL
  const getBackendUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return process.env.REACT_APP_BACKEND_URL || window.location.origin;
    }
    return `http://localhost:${process.env.REACT_APP_PORT_BACKEND || 5050}`;
  };

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    console.log('Initial state:', { token, loading, error, message, isVerified });
    
    if (!token) {
      console.log('No token found in URL');
      setError('No verification token provided');
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      console.log('Starting verification process');
      
      // If already verified or success shown, don't try to verify again
      if (isVerified || hasShownSuccess.current) {
        console.log('Already verified or success shown, skipping verification');
        return;
      }

      try {
        console.log('Setting initial states');
        setLoading(true);
        setError(null);
        setMessage(null);

        const backendUrl = getBackendUrl();
        console.log('Making verification request:', {
          url: `${backendUrl}/api/auth/verify-email/${token}`,
          token
        });

        const response = await axios.get(`${backendUrl}/api/auth/verify-email/${token}`, {
          withCredentials: true
        });
        
        console.log('Verification response received:', response.data);

        // Set verified state and success message
        console.log('Setting success states');
        setIsVerified(true);
        setMessage('Email verified successfully! You can now log in.');
        setError(null);
        hasShownSuccess.current = true;
        
        console.log('States after success:', { loading, error, message, isVerified });
        
        setTimeout(() => {
          console.log('Redirecting to login');
          navigate('/login');
        }, 3000);

      } catch (error) {
        console.error('Verification error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        
        // If we get a 200 status, treat it as success
        if (error.response?.status === 200) {
          console.log('Received 200 status, treating as success');
          setIsVerified(true);
          setMessage('Email verified successfully! You can now log in.');
          setError(null);
          hasShownSuccess.current = true;
          setTimeout(() => navigate('/login'), 3000);
        } else {
          // Only set error if we haven't already verified
          if (!isVerified && !hasShownSuccess.current) {
            console.log('Setting error state');
            setError(error.response?.data?.message || 'Error verifying email');
            setMessage(null);
          }
        }
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    verifyEmail();
  }, [location.search, navigate, isVerified]);

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