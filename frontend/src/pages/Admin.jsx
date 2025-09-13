// frontend/src/pages/Admin.jsx

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
  Person as UserIcon,
  Settings as SettingsIcon,
  BarChart as ChartIcon,
  ArrowBack as ArrowBackIcon,
  Extension as ExtensionIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { usePlugins } from "../contexts/PluginContext";
import { useNavigate } from "react-router-dom";

// FirewallStatusPanel is now automatically loaded via plugin overlay system

const Admin = () => {
  const { user } = useAuth();
  const { isPluginEnabled } = usePlugins();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState("");
  const [pluginMenuItems, setPluginMenuItems] = useState([]);
  const [pluginCards, setPluginCards] = useState([]);
  const [pluginsReady, setPluginsReady] = useState(false);
  const [registryAvailable, setRegistryAvailable] = useState(false);

  // Load plugin data with proper async handling
  useEffect(() => {
    const loadPluginData = async () => {
      try {
        console.log("🔌 Attempting to load plugin registry...");

        // Try to dynamically import the registry
        const registryModule = await import("../plugins/registry");
        const { getPluginMenuItems, getPluginCards, getPluginLoadingStatus } =
          registryModule;

        setRegistryAvailable(true);
        console.log("✅ Plugin registry loaded successfully");

        const status = getPluginLoadingStatus();
        console.log("🔌 Plugin loading status:", status);

        if (status.initialized) {
          const menuItems = getPluginMenuItems() || [];
          const cards = getPluginCards() || [];

          console.log("📋 Plugin menu items:", menuItems);
          console.log("🃏 Plugin cards:", cards);

          setPluginMenuItems(menuItems);
          setPluginCards(cards);
          setPluginsReady(true);
        } else {
          console.warn("⚠️ Plugins not yet initialized, retrying...");
          // Retry after a short delay
          setTimeout(loadPluginData, 100);
        }
      } catch (error) {
        console.log("📭 Plugin registry not available:", error.message);
        console.log("🎯 Running in plugin-free mode");
        setRegistryAvailable(false);
        setPluginMenuItems([]);
        setPluginCards([]);
        setPluginsReady(true); // Continue even if there's no registry
      }
    };

    loadPluginData();
  }, []);

  // Refresh plugin data when plugin context changes
  useEffect(() => {
    if (pluginsReady && registryAvailable) {
      const refreshPluginData = async () => {
        try {
          const registryModule = await import("../plugins/registry");
          const { getPluginMenuItems, getPluginCards } = registryModule;

          const menuItems = getPluginMenuItems() || [];
          const cards = getPluginCards() || [];
          setPluginMenuItems(menuItems);
          setPluginCards(cards);
        } catch (error) {
          console.warn("Error refreshing plugin data:", error);
        }
      };

      refreshPluginData();
    }
  }, [pluginsReady, registryAvailable, isPluginEnabled]); // Re-run when plugin states change

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    // Fetch admin data
    const fetchAdminData = async () => {
      try {
        console.info("🚨 Attempting to fetch admin data");
        console.info("🚨 User state:", user);
        console.info("🚨 Document cookies:", document.cookie);

        const response = await fetch("/api/admin", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        console.info("🚨 Response status:", response.status);
        console.info("🚨 Response URL:", response.url);
        console.info(
          "🚨 Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        if (response.ok) {
          const data = await response.json();
          console.info("🚨 Admin data fetched successfully:", data);
          setAdminData(data);
        } else {
          const errorText = await response.text();
          console.error(
            "🚨 Failed to load admin data:",
            response.status,
            errorText
          );
          setError(
            `Failed to load admin data: ${response.status} ${response.statusText}`
          );
        }
      } catch (err) {
        console.error("🚨 Error connecting to admin API:", err);
        setError("Error connecting to admin API: " + err.message);
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
    <Container maxWidth="xxl" sx={{ my: 4 }}>
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

      {!registryAvailable && (
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="h6">Plugin System Not Installed</Typography>
          <Typography>
            The dynamic plugin system is not currently installed. To enable
            plugin functionality, install the plugin registry system.
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
                {/* Dynamic Plugin Menu Items */}
                {registryAvailable &&
                  pluginMenuItems
                    .filter((item) => isPluginEnabled(item.id))
                    .map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <ListItem
                          key={item.id}
                          button
                          onClick={() => navigate(item.path)}
                          sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
                        >
                          <ListItemIcon>
                            <IconComponent />
                          </ListItemIcon>
                          <ListItemText
                            primary={item.title}
                            secondary={item.description}
                          />
                        </ListItem>
                      );
                    })}

                {/* Static Menu Items */}
                <ListItem
                  button
                  onClick={() => navigate("/admin/plugins")}
                  sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
                >
                  <ListItemIcon>
                    <ExtensionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Plugin Management"
                    secondary="Install & configure plugins"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* System Settings Static Grid */}
          <Card sx={{ mt: 3 }}>
            <CardContent
              sx={{
                textAlign: "center",
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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure external service credentials including Redis caching
                and Cloudflare R2 storage settings.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/admin/settings")}
                fullWidth
              >
                Manage Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item lg={9} xs={12}>
          <Grid container spacing={3}>
            {/* Dynamic Plugin Cards */}
            {registryAvailable &&
              pluginCards
                .filter((card) => isPluginEnabled(card.id))
                .map((card) => {
                  const IconComponent = card.icon;
                  return (
                    <Grid key={card.id} item md={6} xs={12}>
                      <Card sx={{ height: "100%" }}>
                        <CardContent
                          sx={{
                            textAlign: "center",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <IconComponent
                            sx={{ fontSize: 48, color: card.color, mb: 2 }}
                          />
                          <Typography variant="h6" gutterBottom>
                            {card.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ flexGrow: 1, mb: 2 }}
                          >
                            {card.description}
                          </Typography>
                          <Button
                            variant="contained"
                            onClick={() => navigate(card.path)}
                            fullWidth
                          >
                            {card.buttonText}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}

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
                  <ExtensionIcon
                    sx={{ fontSize: 48, color: "primary.main", mb: 2 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Plugin Management
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ flexGrow: 1, mb: 2 }}
                  >
                    Install, configure, and manage plugins. Upload new plugins,
                    enable/disable features, and download plugin packages.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/admin/plugins")}
                    fullWidth
                  >
                    Manage Plugins
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
                    {user?.email}
                  </Typography>

                  <Typography variant="subtitle1" fontWeight="bold">
                    User Role:
                  </Typography>
                  <Typography variant="body1" color="primary" fontWeight="bold">
                    {user?.role?.toLowerCase()}
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

                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    sx={{ mt: 2 }}
                  >
                    Plugin System Status:
                  </Typography>
                  <Typography
                    variant="body2"
                    color={registryAvailable ? "success.main" : "warning.main"}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    {registryAvailable
                      ? "✓ Plugin system active"
                      : "⚠ Plugin system not installed"}
                  </Typography>
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
