import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Switch,
  Alert,
  Paper,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  InputLabel,
  Slider,
  CircularProgress,
} from "@mui/material";
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Timer as TimerIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  Palette as PaletteIcon,
  Message as MessageIcon,
  QueryStats as PerformanceIcon,
  Article as FileIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

const WebPerformanceConfigurations = ({
  config = {},
  settings = {},
  onSaveSettings,
  apiCall,
  rawApiCall,
  showSnackbar,
  savingSettings = false,
}) => {
  const [configData, setConfigData] = useState({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Handle both config.dynamic (firewall pattern) and direct config data (web-performance pattern)
    const configToUse = config.dynamic || config;
    if (configToUse && Object.keys(configToUse).length > 0) {
      setConfigData(configToUse);
      setHasUnsavedChanges(false); // Reset unsaved changes when loading fresh data
    }
  }, [config]);

  const handleConfigChange = (section, key, value) => {
    setConfigData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleNestedConfigChange = (section, subsection, key, value) => {
    setConfigData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subsection]: {
          ...prev[section]?.[subsection],
          [key]: value,
        },
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveConfig = async () => {
    // Store previous config for potential rollback
    const previousConfig = JSON.parse(JSON.stringify(configData));

    try {
      setLoading(true);

      // Optimistic update - not needed for this case since we're not using local state

      const response = await rawApiCall("/config", {
        method: "PUT",
        body: JSON.stringify(configData),
      });

      if (response.ok) {
        const result = await response.json();
        setHasUnsavedChanges(false);
        showSnackbar(
          result.message || "Configuration saved successfully!",
          "success"
        );
      } else {
        const error = await response.json();
        showSnackbar(error.message || "Error saving configuration", "error");
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      showSnackbar("Error saving configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetConfig = () => {
    const defaultConfig = {
      pluginId: "web-performance-optimization",
      ui: {
        theme: {
          primaryColor: "primary.main",
          icon: "Speed",
        },
        timeouts: {
          successMessage: 3000,
          loadingMinHeight: "500px",
        },
        messages: {
          title: "Web Performance Optimization",
          subtitle:
            "Advanced web performance optimization with file optimization, caching layers, and performance features",
          successOptimization:
            "File optimization completed: {type} - {savings} saved",
          errorOptimization: "Failed to optimize file: {error}",
        },
      },
      features: {
        fileOptimization: true,
        cachingLayers: true,
        performanceFeatures: true,
        performanceMonitoring: true,
        emailReports: false,
        debugMode: false,
      },
      thresholds: {
        maxFileSize: 10485760,
        imageQuality: 80,
        cacheMaxAge: 86400,
        maxResponseTime: 5000,
        maxQueueSize: 1000,
        queueProcessInterval: 30000,
      },
      adminPanel: {
        menuItem: {
          title: "Web Performance",
          description: "Optimize web performance",
        },
        card: {
          title: "Web Performance Optimization",
          description:
            "Advanced web performance optimization with file optimization, caching layers, lazy loading, and performance monitoring features.",
          buttonText: "Manage Performance",
        },
        enabled: true,
      },
    };

    setConfigData(defaultConfig);
    setHasUnsavedChanges(true);
    setShowResetDialog(false);
    showSnackbar(
      "Configuration has been reset to default values. Click 'Save Configuration' to apply changes.",
      "info"
    );
  };

  const exportConfig = async () => {
    try {
      const dataStr = JSON.stringify(configData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `web-performance-config-${
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
          Plugin Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure Web Performance plugin behavior, features, thresholds, and
          settings
        </Typography>
      </Box>

      {hasUnsavedChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Configuration" to apply them.
        </Alert>
      )}

      {/* Interface Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CodeIcon />
              <Typography variant="h6">Interface Configuration</Typography>
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MessageIcon />
                      <Typography variant="subtitle1">
                        Interface Messages
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Plugin Title"
                    value={configData.ui?.messages?.title || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "ui",
                        "messages",
                        "title",
                        e.target.value
                      )
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Plugin Subtitle"
                    value={configData.ui?.messages?.subtitle || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "ui",
                        "messages",
                        "subtitle",
                        e.target.value
                      )
                    }
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Success Optimization Message"
                    value={configData.ui?.messages?.successOptimization || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "ui",
                        "messages",
                        "successOptimization",
                        e.target.value
                      )
                    }
                    placeholder="File optimization completed: {type} - {savings} saved"
                    helperText="Use {type} and {savings} as placeholders"
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Error Optimization Message"
                    value={configData.ui?.messages?.errorOptimization || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "ui",
                        "messages",
                        "errorOptimization",
                        e.target.value
                      )
                    }
                    placeholder="Failed to optimize file: {error}"
                    helperText="Use {error} as placeholder"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PaletteIcon />
                      <Typography variant="subtitle1">
                        Theme Configuration
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Primary Color</InputLabel>
                    <Select
                      value={
                        configData.ui?.theme?.primaryColor || "primary.main"
                      }
                      onChange={(e) =>
                        handleNestedConfigChange(
                          "ui",
                          "theme",
                          "primaryColor",
                          e.target.value
                        )
                      }
                      label="Primary Color"
                    >
                      <MenuItem value="primary.main">Primary Blue</MenuItem>
                      <MenuItem value="secondary.main">Secondary Pink</MenuItem>
                      <MenuItem value="success.main">Success Green</MenuItem>
                      <MenuItem value="warning.main">Warning Orange</MenuItem>
                      <MenuItem value="error.main">Error Red</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Icon</InputLabel>
                    <Select
                      value={configData.ui?.theme?.icon || "Speed"}
                      onChange={(e) =>
                        handleNestedConfigChange(
                          "ui",
                          "theme",
                          "icon",
                          e.target.value
                        )
                      }
                      label="Icon"
                    >
                      <MenuItem value="Speed">Speed</MenuItem>
                      <MenuItem value="Dashboard">Dashboard</MenuItem>
                      <MenuItem value="Analytics">Analytics</MenuItem>
                      <MenuItem value="Timeline">Timeline</MenuItem>
                      <MenuItem value="TrendingUp">Trending Up</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Timeouts Configuration
                  </Typography>

                  <TextField
                    fullWidth
                    label="Success Message Duration (ms)"
                    type="number"
                    value={configData.ui?.timeouts?.successMessage || 3000}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "ui",
                        "timeouts",
                        "successMessage",
                        parseInt(e.target.value)
                      )
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Loading Min Height"
                    value={configData.ui?.timeouts?.loadingMinHeight || "500px"}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "ui",
                        "timeouts",
                        "loadingMinHeight",
                        e.target.value
                      )
                    }
                    placeholder="500px"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Feature Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SettingsIcon />
              <Typography variant="h6">Feature Configuration</Typography>
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Core Features</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configData.features?.fileOptimization || false}
                        onChange={(e) =>
                          handleConfigChange(
                            "features",
                            "fileOptimization",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="File Optimization"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configData.features?.cachingLayers || false}
                        onChange={(e) =>
                          handleConfigChange(
                            "features",
                            "cachingLayers",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Caching Layers"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          configData.features?.performanceFeatures || false
                        }
                        onChange={(e) =>
                          handleConfigChange(
                            "features",
                            "performanceFeatures",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Performance Features"
                  />
                </FormGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Advanced Features</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          configData.features?.performanceMonitoring || false
                        }
                        onChange={(e) =>
                          handleConfigChange(
                            "features",
                            "performanceMonitoring",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Performance Monitoring"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configData.features?.emailReports || false}
                        onChange={(e) =>
                          handleConfigChange(
                            "features",
                            "emailReports",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Email Reports"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configData.features?.debugMode || false}
                        onChange={(e) =>
                          handleConfigChange(
                            "features",
                            "debugMode",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Debug Mode"
                  />
                </FormGroup>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Performance Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SpeedIcon />
              <Typography variant="h6">Performance Configuration</Typography>
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FileIcon />
                      <Typography variant="subtitle1">
                        File and Size Limits
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography gutterBottom>Maximum File Size (MB)</Typography>
                    <Slider
                      value={
                        (configData.thresholds?.maxFileSize || 10485760) /
                        1024 /
                        1024
                      }
                      onChange={(e, value) =>
                        handleConfigChange(
                          "thresholds",
                          "maxFileSize",
                          value * 1024 * 1024
                        )
                      }
                      min={1}
                      max={100}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="Image Quality (%)"
                    type="number"
                    value={configData.thresholds?.imageQuality || 80}
                    onChange={(e) =>
                      handleConfigChange(
                        "thresholds",
                        "imageQuality",
                        parseInt(e.target.value)
                      )
                    }
                    inputProps={{ min: 10, max: 100 }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Cache Max Age (seconds)"
                    type="number"
                    value={configData.thresholds?.cacheMaxAge || 86400}
                    onChange={(e) =>
                      handleConfigChange(
                        "thresholds",
                        "cacheMaxAge",
                        parseInt(e.target.value)
                      )
                    }
                    helperText="86400 = 24 hours"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <PerformanceIcon />
                      <Typography variant="subtitle1">
                        Performance and Queue Limits
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Max Response Time (ms)"
                    type="number"
                    value={configData.thresholds?.maxResponseTime || 5000}
                    onChange={(e) =>
                      handleConfigChange(
                        "thresholds",
                        "maxResponseTime",
                        parseInt(e.target.value)
                      )
                    }
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Max Queue Size"
                    type="number"
                    value={configData.thresholds?.maxQueueSize || 1000}
                    onChange={(e) =>
                      handleConfigChange(
                        "thresholds",
                        "maxQueueSize",
                        parseInt(e.target.value)
                      )
                    }
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Queue Process Interval (ms)"
                    type="number"
                    value={configData.thresholds?.queueProcessInterval || 30000}
                    onChange={(e) =>
                      handleConfigChange(
                        "thresholds",
                        "queueProcessInterval",
                        parseInt(e.target.value)
                      )
                    }
                    helperText="30000 = 30 seconds"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Admin Configuration */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AdminIcon />
              <Typography variant="h6">Admin Configuration</Typography>
            </Box>
          }
        />
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MenuIcon />
                      <Typography variant="subtitle1">
                        Menu Item Settings
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Menu Title"
                    value={configData.adminPanel?.menuItem?.title || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "adminPanel",
                        "menuItem",
                        "title",
                        e.target.value
                      )
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Menu Description"
                    value={configData.adminPanel?.menuItem?.description || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "adminPanel",
                        "menuItem",
                        "description",
                        e.target.value
                      )
                    }
                    multiline
                    rows={2}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <StorageIcon />
                      <Typography variant="subtitle1">
                        Admin Card Settings
                      </Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <TextField
                    fullWidth
                    label="Card Title"
                    value={configData.adminPanel?.card?.title || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "adminPanel",
                        "card",
                        "title",
                        e.target.value
                      )
                    }
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Card Description"
                    value={configData.adminPanel?.card?.description || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "adminPanel",
                        "card",
                        "description",
                        e.target.value
                      )
                    }
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Button Text"
                    value={configData.adminPanel?.card?.buttonText || ""}
                    onChange={(e) =>
                      handleNestedConfigChange(
                        "adminPanel",
                        "card",
                        "buttonText",
                        e.target.value
                      )
                    }
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Admin Panel Access</FormLabel>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={configData.adminPanel?.enabled !== false}
                        onChange={(e) =>
                          handleConfigChange(
                            "adminPanel",
                            "enabled",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Enable Admin Panel Access"
                  />
                </FormGroup>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Configuration Info */}
      <Card sx={{ mt: 2 }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <InfoIcon />
              <Typography variant="h6">Configuration Information</Typography>
            </Box>
          }
        />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>Plugin ID</TableCell>
                  <TableCell>
                    {configData.pluginId || "web-performance-optimization"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>
                    {configData.updatedAt
                      ? new Date(configData.updatedAt).toLocaleString()
                      : "Never"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Updated By</TableCell>
                  <TableCell>{configData.updatedBy || "System"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Configuration Version</TableCell>
                  <TableCell>1.0.0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={exportConfig}
          disabled={loading || savingSettings}
        >
          Export Configuration
        </Button>
        <Button
          variant="outlined"
          startIcon={<RestoreIcon />}
          onClick={() => setShowResetDialog(true)}
          color="warning"
          disabled={loading || savingSettings}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveConfig}
          disabled={!hasUnsavedChanges || loading || savingSettings}
          startIcon={
            loading || savingSettings ? (
              <CircularProgress size={20} />
            ) : (
              <SaveIcon />
            )
          }
          size="large"
          sx={{
            backgroundColor: hasUnsavedChanges ? undefined : "grey.300",
            color: hasUnsavedChanges ? undefined : "grey.600",
            "&:hover": {
              backgroundColor: hasUnsavedChanges ? undefined : "grey.400",
            },
          }}
        >
          {loading || savingSettings
            ? "Saving..."
            : hasUnsavedChanges
            ? "Save Configuration"
            : "No Changes to Save"}
        </Button>
      </Box>

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
            onClick={handleResetConfig}
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

export default WebPerformanceConfigurations;
