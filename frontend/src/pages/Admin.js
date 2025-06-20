import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import {
  Shield as ShieldIcon,
  Person as UserIcon,
  Settings as SettingsIcon,
  BarChart as ChartIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    // Fetch admin data
    const fetchAdminData = async () => {
      try {
        const response = await fetch("/api/admin", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setAdminData(data);
        } else {
          setError("Failed to load admin data");
        }
      } catch (err) {
        setError("Error connecting to admin API");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, navigate]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading admin dashboard...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Access Error</Typography>
          <Typography>{error}</Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => navigate("/dashboard")}
            sx={{ mt: 2 }}
          >
            Return to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <SettingsIcon sx={{ mr: 1 }} />
            Admin Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.name || user?.email}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </Button>
      </Box>

      {adminData && (
        <Alert severity="success" sx={{ mb: 4 }}>
          <Typography variant="h6">Admin Access Granted</Typography>
          <Typography>
            You have administrator privileges. Available plugins:{" "}
            {adminData.availablePlugins?.join(", ")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last access: {new Date(adminData.timestamp).toLocaleString()}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item lg={3} xs={12}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <UserIcon sx={{ mr: 1 }} />
                  Admin Menu
                </Box>
              }
            />
            <CardContent sx={{ p: 0 }}>
              <List>
                <ListItem
                  button
                  onClick={() => navigate("/admin/firewall")}
                  sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
                >
                  <ListItemIcon>
                    <ShieldIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Firewall Management"
                    secondary="Manage security rules"
                  />
                </ListItem>
                <ListItem disabled sx={{ borderRadius: 1, mx: 1, my: 0.5 }}>
                  <ListItemIcon>
                    <UserIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="User Management"
                    secondary="Coming Soon"
                  />
                </ListItem>
                <ListItem disabled sx={{ borderRadius: 1, mx: 1, my: 0.5 }}>
                  <ListItemIcon>
                    <ChartIcon />
                  </ListItemIcon>
                  <ListItemText primary="Analytics" secondary="Coming Soon" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item lg={9} xs={12}>
          <Grid container spacing={3}>
            <Grid item md={6} xs={12}>
              <Card sx={{ height: "100%" }}>
                <CardContent
                  sx={{
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <ShieldIcon
                    sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Firewall Protection
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flexGrow: 1, mb: 2 }}
                  >
                    Manage IP blocking, rate limiting, geo-blocking, and
                    security rules. Monitor real-time threats and configure
                    protection policies.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/admin/firewall")}
                    fullWidth
                  >
                    Manage Firewall
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item md={6} xs={12}>
              <Card sx={{ height: "100%" }}>
                <CardContent
                  sx={{
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <UserIcon
                    sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    User Management
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flexGrow: 1, mb: 2 }}
                  >
                    View and manage user accounts, roles, and permissions.
                    Monitor user activity and manage access controls.
                  </Typography>
                  <Button variant="contained" disabled fullWidth>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item md={6} xs={12}>
              <Card sx={{ height: "100%" }}>
                <CardContent
                  sx={{
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <ChartIcon sx={{ fontSize: 48, color: "info.main", mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Analytics & Reports
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flexGrow: 1, mb: 2 }}
                  >
                    View detailed analytics, generate reports, and monitor
                    system performance and security metrics.
                  </Typography>
                  <Button variant="contained" color="info" disabled fullWidth>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item md={6} xs={12}>
              <Card sx={{ height: "100%" }}>
                <CardContent
                  sx={{
                    textAlign: "center",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <SettingsIcon
                    sx={{ fontSize: 48, color: "warning.main", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    System Settings
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flexGrow: 1, mb: 2 }}
                  >
                    Configure system-wide settings, manage plugins, and control
                    application behavior and features.
                  </Typography>
                  <Button
                    variant="contained"
                    color="warning"
                    disabled
                    fullWidth
                  >
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mt: 3 }}>
            <CardHeader title="System Information" />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item md={6} xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Admin User:
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user?.name || "N/A"} ({user?.email})
                  </Typography>

                  <Typography variant="subtitle1" fontWeight="bold">
                    User Role:
                  </Typography>
                  <Typography variant="body1" color="primary" fontWeight="bold">
                    {user?.role?.toUpperCase()}
                  </Typography>
                </Grid>
                <Grid item md={6} xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Available Plugins:
                  </Typography>
                  <Box component="ul" sx={{ listStyle: "none", p: 0 }}>
                    {adminData?.availablePlugins?.map((plugin, index) => (
                      <Typography
                        key={index}
                        component="li"
                        variant="body2"
                        color="success.main"
                        sx={{ display: "flex", alignItems: "center" }}
                      >
                        ✓ {plugin.charAt(0).toUpperCase() + plugin.slice(1)}
                      </Typography>
                    )) || (
                      <Typography variant="body2" color="text.secondary">
                        No plugins loaded
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Admin;
