import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import { verifyEmail } from '../services/auth';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState(null);
  const isVerified = useRef(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        navigate('/verify');
        return;
      }

      try {
        await verifyEmail(token);
        isVerified.current = true;
        setStatus('success');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        if (!isVerified.current) {
          setStatus('error');
          setError(err.message || 'Failed to verify email');
        }
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <>
            <CircularProgress size={40}/>
            <Typography variant="h6" gutterBottom>
              Verifying your email...
            </Typography>
          </>
        );
      case 'success':
        return (
          <Alert severity="success">
            Email verified successfully! Redirecting to login...
          </Alert>
        );
      case 'error':
        return (
          <Alert severity="error">
            {error || 'Invalid or expired verification token'}
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px - 307px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          {renderContent()}
        </Paper>
      </Container>
    </Box>
  );
};

export default Verify; 