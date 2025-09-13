import React, { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import PasswordInput from "../components/PasswordInput";
import FacebookIcon from "@mui/icons-material/Facebook";
import { getBackendUrl } from "../utils/config";

// FirewallStatusPanel is now automatically loaded via plugin overlay system

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [message, setMessage] = useState("");

  // Check for error in URL query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get("error");
    if (errorParam === "auth_failed") {
      setError("Authentication failed. Please try again.");
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.data?.needsVerification) {
        setNeedsVerification(true);
        setError("Please verify your email before logging in.");
      } else {
        setError(err.response?.data?.message || "Error logging in");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${getBackendUrl()}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to resend verification email");
      }

      setMessage("Verification email sent! Please check your inbox.");
    } catch (error) {
      setError(error.message || "Error sending verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // OAuth redirects must use full backend URL to bypass React Router
    const backendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_BACKEND_URL || window.location.origin
        : "http://localhost:5050";
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleGithubLogin = () => {
    // OAuth redirects must use full backend URL to bypass React Router
    const backendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_BACKEND_URL || window.location.origin
        : "http://localhost:5050";
    window.location.href = `${backendUrl}/api/auth/github`;
  };

  const handleFacebookLogin = () => {
    // OAuth redirects must use full backend URL to bypass React Router
    const backendUrl =
      process.env.NODE_ENV === "production"
        ? process.env.REACT_APP_BACKEND_URL || window.location.origin
        : "http://localhost:5050";
    window.location.href = `${backendUrl}/api/auth/facebook`;
  };

  return (
    <>
      {/* Firewall Status Panel - Available based on visibility settings */}

      <Container maxWidth="sm">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            py: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              bgcolor: "background.paper",
            }}
          >
            <Typography
              component="h1"
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "text.primary",
                mb: 3,
              }}
            >
              Sign In
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="success" sx={{ width: "100%", mb: 2 }}>
                {message}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "divider",
                    },
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                }}
              />

              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <Box mt={1}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1.1rem",
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Button
                  component={RouterLink}
                  to="/forgot-password"
                  sx={{
                    textTransform: "none",
                    color: "text.secondary",
                  }}
                >
                  Forgot Password?
                </Button>
                <Button
                  component={RouterLink}
                  to="/verify"
                  sx={{
                    textTransform: "none",
                    color: "text.secondary",
                  }}
                >
                  Resend Verification
                </Button>
              </Box>

              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Or continue with
                </Typography>
              </Divider>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                }}
              >
                <IconButton
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  sx={{
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <GoogleIcon />
                </IconButton>
                <IconButton
                  onClick={handleGithubLogin}
                  disabled={loading}
                  sx={{
                    bgcolor: "background.paper",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <GitHubIcon />
                </IconButton>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{" "}
                  <Button
                    component={RouterLink}
                    to="/register"
                    sx={{
                      textTransform: "none",
                      color: "primary.main",
                      fontWeight: "bold",
                    }}
                  >
                    Sign Up
                  </Button>
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </>
  );
};

export default Login;
