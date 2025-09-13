import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { getBackendUrl } from "../../utils/config";
import { STATIC_CONFIG, getApiUrl } from "./config";

// TabPanel component - exact same as firewall plugin
const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`plugin-template-tabpanel-${index}`}
      aria-labelledby={`plugin-template-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const PluginTemplateAdmin = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);

  // Handle tab change - exact same as firewall plugin
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // API helper function using static config
  const apiCall = async (endpoint, options = {}) => {
    try {
      const url = endpoint.startsWith("/")
        ? `${getBackendUrl()}${STATIC_CONFIG.api.basePath}${endpoint}`
        : `${getBackendUrl()}${getApiUrl(endpoint)}`;

      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API call failed:", error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Test the connection first
      const healthData = await apiCall("health");
      console.log("Plugin Template health check:", healthData);

      // Try to load config
      try {
        const configData = await apiCall("config");
        setConfig(configData.data.dynamic);
      } catch (configError) {
        console.log("Config not available, using defaults");
      }
    } catch (error) {
      setError(`Failed to connect to plugin template: ${error.message}`);
      console.error("Plugin template connection error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Plugin Template...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Connection Error</Typography>
          <Typography>{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Make sure the plugin template is enabled and the backend is running.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Plugin Template
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          A template plugin for creating new plugins in the hMERN stack
        </Typography>
      </Box>

      {/* Tab Navigation - exact same structure as firewall plugin */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Plugin Template navigation tabs"
        >
          <Tab
            icon={<DashboardIcon />}
            label="Dashboard"
            id="plugin-template-tab-0"
            aria-controls="plugin-template-tabpanel-0"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Settings"
            id="plugin-template-tab-1"
            aria-controls="plugin-template-tabpanel-1"
          />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Hello World
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome to the Plugin Template dashboard! This is a simple example
              tab.
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Settings coming soon...
            </Typography>
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
};

export default PluginTemplateAdmin;
