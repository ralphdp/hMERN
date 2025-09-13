import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Card,
  CardHeader,
  CardContent,
} from "@mui/material";
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  AdminPanelSettings as AdminIcon,
  Timer as TimerIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import { getBackendUrl } from "../../../utils/config";
import createLogger from "../../../utils/logger";
import { useFirewallSnackbar } from "./FirewallSnackbarProvider";

const logger = createLogger("FirewallAdminConfigurations");

const FirewallAdminConfigurations = ({
  showAlert, // Keep for backward compatibility
  fetchLogs,
  fetchStats,
  fetchLogCount,
  logCount: centralLogCount,
}) => {
  // Use snackbar hook
  const { showSnackbar } = useFirewallSnackbar();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [loadingLogCount, setLoadingLogCount] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [cleanupRange, setCleanupRange] = useState("all");
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    fetchConfiguration();
    // Use centralized fetchLogCount function
    if (fetchLogCount) {
      setLoadingLogCount(true);
      fetchLogCount().finally(() => setLoadingLogCount(false));
    }
  }, [fetchLogCount]);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasUnsavedChanges(false); // Reset unsaved changes when fetching fresh data

      const response = await fetch(`${getBackendUrl()}/api/firewall/config`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Bypass": "testing",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🔧 [Config] Fetch response:", data);

      // Extract the dynamic config from the consistent response structure
      const configData = data.data?.dynamic || {};
      console.log("🔧 [Config] Using dynamic config:", configData);
      console.log("🔧 [Config] Features from server:", configData.features);

      setConfig(configData);
      setHasUnsavedChanges(false); // Ensure no unsaved changes after loading
    } catch (error) {
      console.error("🔧 [Config] Error fetching configuration:", error);
      setError(`Failed to load configuration: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);

      console.log("🔧 [Config] Starting save process...");
      console.log(
        "🔧 [Config] Configuration to save:",
        JSON.stringify(config, null, 2)
      );

      const response = await fetch(`${getBackendUrl()}/api/firewall/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Bypass": "testing",
        },
        credentials: "include",
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("🔧 [Config] Save response:", data);

      // Extract the dynamic config from the consistent response structure
      const savedConfig = data.data?.dynamic || config;
      console.log("🔧 [Config] Using saved dynamic config:", savedConfig);

      setConfig(savedConfig);
      setHasUnsavedChanges(false);

      // Show success message
      showSnackbar("Configuration saved successfully!", "success");

      // Trigger admin panel refresh to apply dynamic configuration
      try {
        const { refreshDynamicConfigs } = await import("../../registry");
        await refreshDynamicConfigs();
        console.log("✅ Admin panel configuration refreshed");
      } catch (refreshError) {
        console.warn("Failed to refresh admin panel config:", refreshError);
      }
    } catch (error) {
      console.error("🔧 [Config] Error saving configuration:", error);
      setError(`Failed to save configuration: ${error.message}`);
      showSnackbar(`Failed to save configuration: ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultConfig = {
      pluginId: "firewall",
      ui: {
        theme: {
          primaryColor: "primary.main",
          icon: "Shield",
        },
        timeouts: {
          successMessage: 3000,
          loadingMinHeight: "600px",
        },
        messages: {
          title: "Firewall Management",
          subtitle:
            "Advanced security protection with IP blocking, rate limiting, and threat detection",
          successBlock: "IP {ip} has been blocked successfully",
          errorBlock: "Failed to block IP {ip}: {error}",
        },
      },
      features: {
        ipBlocking: true,
        rateLimiting: true,
        geoBlocking: true,
        threatIntelligence: true,
        progressiveDelays: true,
        autoThreatResponse: true,
        realTimeLogging: true,
        bulkActions: true,
        logExport: true,
      },
      thresholds: {
        rateLimitPerMinute: 50,
        rateLimitPerHour: 400,
        maxProgressiveDelay: 120000,
        highRiskThreshold: 8,
        mediumRiskThreshold: 5,
        autoBlockThreshold: 10,
        logRetentionDays: 30,
        maxLogEntries: 10000,
      },
      logging: {
        excludedPatterns: [
          "/api/firewall/my-rate-limit-usage*",
          "/api/firewall/panel-info*",
          "/api/firewall/health*",
          "/api/firewall/ping*",
        ],
        enableVerboseLogging: false,
        maxLogRetentionDays: 90,
      },
      adminPanel: {
        menuItem: {
          title: "Firewall Management",
          description: "Manage security rules",
        },
        card: {
          title: "Firewall Protection",
          description:
            "Manage IP blocking, rate limiting, geo-blocking, and security rules. Monitor real-time threats and configure protection policies.",
          buttonText: "Manage Firewall",
        },
        enabled: true,
      },
    };

    setConfig(defaultConfig);
    setHasUnsavedChanges(true);
    setShowResetDialog(false);
    showSnackbar(
      "Configuration has been reset to default values. Click 'Save Configuration' to apply changes.",
      "info"
    );
  };

  const updateConfig = (path, value) => {
    console.log(`🔧 [Config] Updating config path: ${path}`, value);

    setConfig((prev) => {
      const newConfig = JSON.parse(JSON.stringify(prev));

      if (path.includes(".")) {
        // Handle nested path updates
        const keys = path.split(".");
        let current = newConfig;

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (current[key] === undefined) current[key] = {};
          current = current[key];
        }

        current[keys[keys.length - 1]] = value;
      } else {
        // Handle direct property updates (like 'features')
        newConfig[path] = value;
      }

      console.log(`🔧 [Config] Updated config:`, newConfig);
      return newConfig;
    });
    setHasUnsavedChanges(true);
  };

  // Get cleanup button text based on selected range
  const getCleanupButtonText = () => {
    if (cleaningUp) return "Cleaning Up...";
    if (loadingLogCount) return "Loading...";
    if (centralLogCount === 0) return "No Logs to Clean";

    const rangeTexts = {
      all: "Clean All Logs",
      last7days: "Clean Last 7 Days",
      last30days: "Clean Last 30 Days",
      last90days: "Clean Last 90 Days",
      older6months: "Clean Older than 6 Months",
      older1year: "Clean Older than 1 Year",
    };

    const baseText = rangeTexts[cleanupRange] || "Clean Logs";
    return `${baseText} (${centralLogCount.toLocaleString()} total)`;
  };

  const performCleanup = async () => {
    try {
      setCleaningUp(true);
      const response = await fetch("/api/firewall/cleanup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          force: true,
          range: cleanupRange,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        showSnackbar(data.message, "success");
        // Refresh all data after cleanup
        console.log("🔄 Refreshing all firewall data after cleanup...");
        await Promise.all([
          fetchLogCount(), // Update local log count
          fetchLogs && fetchLogs(), // Refresh logs tab
          fetchStats && fetchStats(), // Refresh dashboard stats
        ]);
        console.log("✅ All firewall data refreshed successfully");
      } else {
        showSnackbar(data.message || "Cleanup failed", "error");
      }
    } catch (error) {
      console.error("Error performing cleanup:", error);
      showSnackbar("Failed to perform cleanup", "error");
    } finally {
      setCleaningUp(false);
    }
  };

  const handleCleanupClick = () => {
    setShowCleanupModal(true);
  };

  const handleCleanupConfirm = async () => {
    setShowCleanupModal(false);
    await performCleanup();
  };

  const handleCleanupCancel = () => {
    setShowCleanupModal(false);
  };

  // Export configuration functionality
  const exportConfig = async () => {
    try {
      const dataStr = JSON.stringify(config, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `firewall-config-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showSnackbar("Configuration exported successfully!", "success");
    } catch (error) {
      showSnackbar("Error exporting configuration", "error");
    }
  };

  // Get cleanup range description for modal
  const getCleanupRangeDescription = () => {
    const descriptions = {
      all: "all firewall logs",
      last7days: "logs from the last 7 days",
      last30days: "logs from the last 30 days",
      last90days: "logs from the last 90 days",
      older6months: "logs older than 6 months",
      older1year: "logs older than 1 year",
    };
    return descriptions[cleanupRange] || "selected logs";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: config?.ui?.timeouts?.loadingMinHeight || "400px",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading configuration...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">Configuration Error</Typography>
        <Typography>{error}</Typography>
        <Button onClick={fetchConfiguration} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!config) {
    return (
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6">No Configuration Found</Typography>
        <Typography>
          No firewall configuration exists in the database.
        </Typography>
        <Button
          onClick={() => {
            resetToDefaults();
            showSnackbar(
              "Default configuration created. You can now edit and save the settings.",
              "info"
            );
          }}
          sx={{ mt: 1 }}
        >
          Create Default Configuration
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: "100%" }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Firewall Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure firewall behavior, features, thresholds, and admin panel
          settings
        </Typography>
      </Box>

      {hasUnsavedChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Configuration" to apply them.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Interface Configuration */}
        <Grid item xs={12} sx={{ display: "flex" }}>
          <Card
            sx={{ width: "100%", display: "flex", flexDirection: "column" }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PaletteIcon />
                  <Typography variant="h6">Interface Configuration</Typography>
                </Box>
              }
            />
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure the appearance, behavior, and user experience of the
                firewall interface
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <PaletteIcon />
                      <Typography variant="subtitle1">
                        Theme & Visual Settings
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>Primary Color</InputLabel>
                          <Select
                            value={
                              config.ui?.theme?.primaryColor || "primary.main"
                            }
                            onChange={(e) =>
                              updateConfig(
                                "ui.theme.primaryColor",
                                e.target.value
                              )
                            }
                            label="Primary Color"
                          >
                            <MenuItem value="primary.main">Primary</MenuItem>
                            <MenuItem value="secondary.main">
                              Secondary
                            </MenuItem>
                            <MenuItem value="error.main">Error</MenuItem>
                            <MenuItem value="warning.main">Warning</MenuItem>
                            <MenuItem value="info.main">Info</MenuItem>
                            <MenuItem value="success.main">Success</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Icon"
                          value={config.ui?.theme?.icon || "Shield"}
                          onChange={(e) =>
                            updateConfig("ui.theme.icon", e.target.value)
                          }
                          helperText="Material-UI icon name"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Loading Min Height"
                          value={
                            config.ui?.timeouts?.loadingMinHeight || "600px"
                          }
                          onChange={(e) =>
                            updateConfig(
                              "ui.timeouts.loadingMinHeight",
                              e.target.value
                            )
                          }
                          helperText="CSS height value (e.g., 600px, 50vh)"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <SettingsIcon />
                      <Typography variant="subtitle1">
                        Interface Messages
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Main Title"
                          value={
                            config.ui?.messages?.title || "Firewall Management"
                          }
                          onChange={(e) =>
                            updateConfig("ui.messages.title", e.target.value)
                          }
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Subtitle"
                          value={config.ui?.messages?.subtitle || ""}
                          onChange={(e) =>
                            updateConfig("ui.messages.subtitle", e.target.value)
                          }
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Success Message Duration"
                          value={config.ui?.timeouts?.successMessage || 3000}
                          onChange={(e) =>
                            updateConfig(
                              "ui.timeouts.successMessage",
                              parseInt(e.target.value)
                            )
                          }
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">ms</InputAdornment>
                            ),
                          }}
                          helperText="How long success messages display"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <SettingsIcon />
                      <Typography variant="subtitle1">
                        User Interface Messages
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Configure display text and messages for the firewall
                      interface
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Success Block Message"
                          value={
                            config.ui?.messages?.successBlock ||
                            "IP {ip} has been blocked successfully"
                          }
                          onChange={(e) =>
                            updateConfig(
                              "ui.messages.successBlock",
                              e.target.value
                            )
                          }
                          helperText="Use {ip} placeholder for IP address"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Error Block Message"
                          value={
                            config.ui?.messages?.errorBlock ||
                            "Failed to block IP {ip}: {error}"
                          }
                          onChange={(e) =>
                            updateConfig(
                              "ui.messages.errorBlock",
                              e.target.value
                            )
                          }
                          helperText="Use {ip} and {error} placeholders"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <AdminIcon />
                      <Typography variant="subtitle1">
                        Admin Panel Integration
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={config.adminPanel?.enabled !== false}
                              onChange={(e) =>
                                updateConfig(
                                  "adminPanel.enabled",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold" }}
                              >
                                Enable Admin Panel
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Show firewall management in admin dashboard
                              </Typography>
                            </Box>
                          }
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Menu Title"
                          value={
                            config.adminPanel?.menuItem?.title ||
                            "Firewall Management"
                          }
                          onChange={(e) =>
                            updateConfig(
                              "adminPanel.menuItem.title",
                              e.target.value
                            )
                          }
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Menu Description"
                          value={
                            config.adminPanel?.menuItem?.description ||
                            "Manage security rules"
                          }
                          onChange={(e) =>
                            updateConfig(
                              "adminPanel.menuItem.description",
                              e.target.value
                            )
                          }
                          helperText="Brief description for the menu item"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <AdminIcon />
                      <Typography variant="subtitle1">
                        Dashboard Card Settings
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Card Title"
                          value={
                            config.adminPanel?.card?.title ||
                            "Firewall Protection"
                          }
                          onChange={(e) =>
                            updateConfig(
                              "adminPanel.card.title",
                              e.target.value
                            )
                          }
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Button Text"
                          value={
                            config.adminPanel?.card?.buttonText ||
                            "Manage Firewall"
                          }
                          onChange={(e) =>
                            updateConfig(
                              "adminPanel.card.buttonText",
                              e.target.value
                            )
                          }
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Card Description"
                          value={
                            config.adminPanel?.card?.description ||
                            "Manage IP blocking, rate limiting, geo-blocking, and security rules. Monitor real-time threats and configure protection policies."
                          }
                          onChange={(e) =>
                            updateConfig(
                              "adminPanel.card.description",
                              e.target.value
                            )
                          }
                          multiline
                          rows={2}
                          helperText="Detailed description for the dashboard card"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Configuration */}
        <Grid item sm={12} md={4}>
          <Card
            sx={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SecurityIcon />
                  <Typography variant="h6">Feature Configuration</Typography>
                </Box>
              }
            />
            <CardContent sx={{ flex: 1 }}>
              {/* Debug info in development */}
              {/* process.env.NODE_ENV === "development" && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Debug: Features object: {JSON.stringify(config.features)}
                </Typography>
              </Alert>
            ) */}

              <Grid container spacing={1}>
                {(() => {
                  // Ensure we have features with fallback defaults
                  const defaultFeatures = {
                    ipBlocking: true,
                    rateLimiting: true,
                    geoBlocking: true,
                    threatIntelligence: true,
                    progressiveDelays: true,
                    autoThreatResponse: true,
                    realTimeLogging: true,
                    bulkActions: true,
                    logExport: true,
                    // Threat Intelligence Features
                    threatIntelligenceFeeds: true,
                    geoAnalysis: true,
                    autoBlockHighRisk: true,
                  };

                  const features = config.features
                    ? { ...defaultFeatures, ...config.features }
                    : defaultFeatures;

                  console.log("🔧 [Config] Features object:", features);

                  const handleFeatureToggle = (feature, checked) => {
                    const updatedFeatures = {
                      ...features,
                      [feature]: checked,
                    };
                    updateConfig("features", updatedFeatures);
                  };

                  return Object.entries(features).map(([feature, enabled]) => (
                    <Grid item xs={12} key={feature}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(enabled)}
                            onChange={(e) =>
                              handleFeatureToggle(feature, e.target.checked)
                            }
                          />
                        }
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2">
                              {feature
                                .replace(/([A-Z])/g, " $1")
                                .replace(/^./, (str) => str.toUpperCase())}
                            </Typography>
                            <Chip
                              label={enabled ? "Enabled" : "Disabled"}
                              color={enabled ? "success" : "default"}
                              size="small"
                            />
                          </Box>
                        }
                      />
                    </Grid>
                  ));
                })()}
              </Grid>

              {(!config.features ||
                Object.keys(config.features).length === 0) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    No features configuration found. Using default values. Save
                    the configuration to persist these settings.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Rate Limiting Configuration */}
        <Grid item sm={12} md={4}>
          <Card
            sx={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SpeedIcon />
                  <Typography variant="h6">
                    Rate Limiting Configuration
                  </Typography>
                </Box>
              }
            />
            <CardContent sx={{ flex: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Rate Limit Per Minute"
                    value={config.thresholds?.rateLimitPerMinute || 50}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.rateLimitPerMinute",
                        parseInt(e.target.value)
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">req/min</InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Rate Limit Per Hour"
                    value={config.thresholds?.rateLimitPerHour || 400}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.rateLimitPerHour",
                        parseInt(e.target.value)
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">req/hr</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Configuration */}
        <Grid item sm={12} md={4}>
          <Card
            sx={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <SecurityIcon />
                  <Typography variant="h6">Security Configuration</Typography>
                </Box>
              }
            />
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure threat detection and automatic response thresholds
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="High Risk Threshold"
                    value={config.thresholds?.highRiskThreshold || 8}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.highRiskThreshold",
                        parseInt(e.target.value)
                      )
                    }
                    helperText="Violations before marking as high risk"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Medium Risk Threshold"
                    value={config.thresholds?.mediumRiskThreshold || 5}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.mediumRiskThreshold",
                        parseInt(e.target.value)
                      )
                    }
                    helperText="Violations before marking as medium risk"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Auto Block Threshold"
                    value={config.thresholds?.autoBlockThreshold || 10}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.autoBlockThreshold",
                        parseInt(e.target.value)
                      )
                    }
                    helperText="Violations before automatic blocking"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Progressive Delay"
                    value={config.thresholds?.maxProgressiveDelay || 120000}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.maxProgressiveDelay",
                        parseInt(e.target.value)
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">ms</InputAdornment>
                      ),
                    }}
                    helperText="Maximum delay for progressive throttling"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Threat Score Threshold"
                    value={config.thresholds?.threatScoreThreshold || 7}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.threatScoreThreshold",
                        parseInt(e.target.value)
                      )
                    }
                    inputProps={{ min: 1, max: 10 }}
                    helperText="Minimum score to consider as threat (1-10)"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Feed Update Interval"
                    value={config.thresholds?.feedUpdateInterval || 24}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.feedUpdateInterval",
                        parseInt(e.target.value)
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">hours</InputAdornment>
                      ),
                    }}
                    helperText="How often to update threat feeds"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Feed Timeout"
                    value={config.thresholds?.feedTimeout || 30}
                    onChange={(e) =>
                      updateConfig(
                        "thresholds.feedTimeout",
                        parseInt(e.target.value)
                      )
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">seconds</InputAdornment>
                      ),
                    }}
                    helperText="Timeout for threat feed downloads"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Logging Configuration */}
        <Grid item xs={12}>
          <Card
            sx={{ width: "100%", display: "flex", flexDirection: "column" }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WarningIcon />
                  <Typography variant="h6">Logging Configuration</Typography>
                </Box>
              }
            />
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure logging behavior, data retention, storage limits, and
                cleanup operations
              </Typography>

              <Grid container spacing={3}>
                {/* Logging Settings */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <SettingsIcon />
                      <Typography variant="subtitle1">
                        Logging Settings
                      </Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                config.logging?.enableVerboseLogging !== false
                              }
                              onChange={(e) =>
                                updateConfig(
                                  "logging.enableVerboseLogging",
                                  e.target.checked
                                )
                              }
                            />
                          }
                          label={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: "bold" }}
                              >
                                Enable Verbose Logging
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Include detailed debugging information in logs
                              </Typography>
                            </Box>
                          }
                          sx={{ mb: 2 }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Log Retention Days"
                          value={config.logging?.maxLogRetentionDays || 90}
                          onChange={(e) =>
                            updateConfig(
                              "logging.maxLogRetentionDays",
                              parseInt(e.target.value)
                            )
                          }
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                days
                              </InputAdornment>
                            ),
                          }}
                          helperText="How long to keep log entries (automatic cleanup after this period)"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Max Log Entries"
                          value={config.thresholds?.maxLogEntries || 10000}
                          onChange={(e) =>
                            updateConfig(
                              "thresholds.maxLogEntries",
                              parseInt(e.target.value)
                            )
                          }
                          helperText="Maximum number of log entries to store"
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Logging Exclusions */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <SecurityIcon />
                      <Typography variant="subtitle1">
                        Logging Exclusions
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      URL patterns to exclude from logging (use * for wildcards)
                    </Typography>

                    <Box sx={{ maxHeight: "200px", overflowY: "auto", mb: 2 }}>
                      {(
                        config.logging?.excludedPatterns || [
                          "/api/firewall/my-rate-limit-usage*",
                          "/api/firewall/panel-info*",
                          "/api/firewall/health*",
                          "/api/firewall/ping*",
                        ]
                      ).map((pattern, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <TextField
                            fullWidth
                            size="small"
                            value={pattern}
                            onChange={(e) => {
                              const updatedPatterns = [
                                ...(config.logging?.excludedPatterns || []),
                              ];
                              updatedPatterns[index] = e.target.value;
                              updateConfig(
                                "logging.excludedPatterns",
                                updatedPatterns
                              );
                            }}
                            placeholder="e.g., /api/firewall/health*"
                            InputProps={{
                              sx: {
                                fontFamily: "monospace",
                                fontSize: "0.9rem",
                              },
                            }}
                          />
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              const updatedPatterns = [
                                ...(config.logging?.excludedPatterns || []),
                              ];
                              updatedPatterns.splice(index, 1);
                              updateConfig(
                                "logging.excludedPatterns",
                                updatedPatterns
                              );
                            }}
                            sx={{ minWidth: "40px" }}
                          >
                            <DeleteIcon />
                          </Button>
                        </Box>
                      ))}
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const updatedPatterns = [
                          ...(config.logging?.excludedPatterns || []),
                        ];
                        updatedPatterns.push("");
                        updateConfig(
                          "logging.excludedPatterns",
                          updatedPatterns
                        );
                      }}
                      sx={{ mt: 1 }}
                    >
                      + Add Pattern
                    </Button>

                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        Examples:
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                      >
                        • /api/firewall/my-rate-limit-usage*
                        <br />
                        • /health
                        <br />• /api/ping*
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>

                {/* Cleanup Operations */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: "100%" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <StorageIcon />
                      <Typography variant="subtitle1">
                        Cleanup Operations
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Manually clean up log data to free storage space
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <FormControl fullWidth>
                        <InputLabel>Cleanup Range</InputLabel>
                        <Select
                          value={cleanupRange}
                          onChange={(e) => setCleanupRange(e.target.value)}
                          label="Cleanup Range"
                        >
                          <MenuItem value="all">All Logs</MenuItem>
                          <MenuItem value="last7days">Last 7 Days</MenuItem>
                          <MenuItem value="last30days">Last 30 Days</MenuItem>
                          <MenuItem value="last90days">Last 90 Days</MenuItem>
                          <MenuItem value="older6months">
                            Older than 6 Months
                          </MenuItem>
                          <MenuItem value="older1year">
                            Older than 1 Year
                          </MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={handleCleanupClick}
                        disabled={
                          cleaningUp || loadingLogCount || centralLogCount === 0
                        }
                        startIcon={
                          cleaningUp ? (
                            <CircularProgress size={20} />
                          ) : (
                            <RestoreIcon />
                          )
                        }
                      >
                        {getCleanupButtonText()}
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportConfig}
              disabled={saving}
            >
              Export Configuration
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowResetDialog(true)}
              startIcon={<RestoreIcon />}
              color="warning"
              disabled={saving}
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              onClick={saveConfiguration}
              disabled={!hasUnsavedChanges || saving}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              size="large"
              sx={{
                backgroundColor: hasUnsavedChanges ? undefined : "grey.300",
                color: hasUnsavedChanges ? undefined : "grey.600",
                "&:hover": {
                  backgroundColor: hasUnsavedChanges ? undefined : "grey.400",
                },
              }}
            >
              {saving
                ? "Saving..."
                : hasUnsavedChanges
                ? "Save Configuration"
                : "No Changes to Save"}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Cleanup Confirmation Modal */}
      <Dialog
        open={showCleanupModal}
        onClose={handleCleanupCancel}
        aria-labelledby="cleanup-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="cleanup-dialog-title">Confirm Log Cleanup</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{getCleanupRangeDescription()}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2, color: "error.main" }}>
            <strong>This action cannot be undone.</strong>
          </DialogContentText>
          {centralLogCount > 0 && (
            <DialogContentText sx={{ mt: 1 }}>
              Total logs currently in database:{" "}
              <strong>{centralLogCount.toLocaleString()}</strong>
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCleanupCancel} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleCleanupConfirm}
            color="error"
            variant="contained"
            startIcon={<RestoreIcon />}
            autoFocus
          >
            Delete Logs
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Configuration Confirmation Modal */}
      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        aria-labelledby="reset-configuration-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="reset-configuration-dialog-title">
          Confirm Reset to Defaults
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to reset all settings to their default values?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResetDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={resetToDefaults}
            color="warning"
            variant="contained"
            autoFocus
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FirewallAdminConfigurations;
