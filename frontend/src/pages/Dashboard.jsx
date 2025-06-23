import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import MD5 from "crypto-js/md5";
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
  DialogActions,
} from "@mui/material";

const Dashboard = () => {
  const { user, logout, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // Refresh user data when component mounts (useful after OAuth redirect)
  useEffect(() => {
    // Only check auth if we don't have user data
    if (!user) {
      checkAuth();
    }
  }, []); // Empty dependency array to run only once

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px - 307px)", // Subtract header (64px) and footer (200px) height
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard
          </Typography>
          <Box
            component="img"
            src={`https://www.gravatar.com/avatar/${MD5(
              user.email.toLowerCase().trim()
            ).toString()}?d=mp&s=200`}
            alt={user.name}
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          />
          <Stack spacing={1} width="100%" alignItems="center">
            <Typography variant="body1" color="text.secondary">
              Email: {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Logged in with:{" "}
              {user.googleId ? "Google" : user.githubId ? "GitHub" : "Email"}
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
        <DialogTitle id="logout-dialog-title">Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to logout? You'll need to sign in again to
            access your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleLogout}
            color="primary"
            variant="contained"
            autoFocus
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
