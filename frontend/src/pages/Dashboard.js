import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
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
              Logged in with: {user.googleId ? 'Google' : user.githubId ? 'GitHub' : 'Email/Password'}
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
  );
};

export default Dashboard; 