import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePlugins } from "../contexts/PluginContext";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Checkbox,
  FormGroup,
} from "@mui/material";
import {
  Extension as ExtensionIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
} from "@mui/icons-material";

const AdminPlugins = () => {
  const navigate = useNavigate();
  const { plugins, loading, setPlugins, refreshPlugins } = usePlugins();
  const [localLoading, setLocalLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "success",
  });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [retainData, setRetainData] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });
    setTimeout(
      () => setAlert({ show: false, message: "", severity: "success" }),
      5000
    );
  };

  const refreshData = async () => {
    setRefreshing(true);
    await refreshPlugins();
    setRefreshing(false);
  };

  const handleTogglePlugin = async (pluginName, enabled) => {
    // Update local state immediately for smooth animation
    setPlugins((prevPlugins) =>
      prevPlugins.map((plugin) =>
        plugin.name === pluginName ? { ...plugin, enabled } : plugin
      )
    );

    try {
      const response = await fetch(`/api/plugins/${pluginName}/toggle`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Bypass": "testing",
        },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(data.message, "success");
        // Fetch latest state to ensure consistency
        refreshPlugins();
      } else {
        showAlert(data.message || "Error toggling plugin", "error");
        // Revert the optimistic update on error
        setPlugins((prevPlugins) =>
          prevPlugins.map((plugin) =>
            plugin.name === pluginName
              ? { ...plugin, enabled: !enabled }
              : plugin
          )
        );
      }
    } catch (error) {
      showAlert("Error toggling plugin", "error");
      console.error("Error:", error);
      // Revert the optimistic update on error
      setPlugins((prevPlugins) =>
        prevPlugins.map((plugin) =>
          plugin.name === pluginName ? { ...plugin, enabled: !enabled } : plugin
        )
      );
    }
  };

  const handleUploadPlugin = async () => {
    if (!selectedFile) {
      showAlert("Please select a plugin file", "error");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("plugin", selectedFile);

    try {
      const response = await fetch("/api/plugins/upload", {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(data.message, "success");
        setUploadDialogOpen(false);
        setSelectedFile(null);
        refreshPlugins();
      } else {
        showAlert(data.message || "Error uploading plugin", "error");
      }
    } catch (error) {
      showAlert("Error uploading plugin", "error");
      console.error("Error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPlugin = async (pluginName) => {
    try {
      const response = await fetch(`/api/plugins/${pluginName}/download`, {
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `${pluginName}-plugin.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showAlert(`Plugin ${pluginName} downloaded successfully`, "success");
      } else {
        showAlert("Error downloading plugin", "error");
      }
    } catch (error) {
      showAlert("Error downloading plugin", "error");
      console.error("Error:", error);
    }
  };

  const handleDeletePlugin = async () => {
    if (!selectedPlugin) return;

    setDeleting(true);
    try {
      const url = `/api/plugins/${selectedPlugin.name}${
        retainData ? "?retainData=true" : ""
      }`;

      const response = await fetch(url, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(data.message, "success");
        setDeleteDialogOpen(false);
        setSelectedPlugin(null);
        setRetainData(false);
        refreshPlugins();
      } else {
        showAlert(data.message || "Error deleting plugin", "error");
      }
    } catch (error) {
      showAlert("Error deleting plugin", "error");
      console.error("Error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const getPluginStatusIcon = (plugin) => {
    if (!plugin.backendExists && !plugin.frontendExists) {
      return <ErrorIcon color="error" />;
    }
    if (plugin.enabled) {
      return <CheckIcon color="success" />;
    }
    return <BlockIcon color="disabled" />;
  };

  const getPluginStatusText = (plugin) => {
    if (!plugin.backendExists && !plugin.frontendExists) {
      return "Not Installed";
    }
    if (plugin.enabled) {
      return "Enabled";
    }
    return "Disabled";
  };

  const getPluginStatusColor = (plugin) => {
    if (!plugin.backendExists && !plugin.frontendExists) {
      return "error";
    }
    if (plugin.enabled) {
      return "success";
    }
    return "default";
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading plugins...</Typography>
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin")}
          >
            Back to Admin
          </Button>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ExtensionIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h4">Plugin Management</Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={refreshData}
            disabled={refreshing}
            startIcon={
              refreshing ? <CircularProgress size={20} /> : <RefreshIcon />
            }
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Plugin
          </Button>
        </Box>
      </Box>

      {alert.show && (
        <Alert
          severity={alert.severity}
          sx={{ mb: 3 }}
          onClose={() =>
            setAlert({ show: false, message: "", severity: "success" })
          }
        >
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="primary">
                {plugins.length}
              </Typography>
              <Typography variant="body1">Total Plugins</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="success.main">
                {plugins.filter((p) => p.enabled).length}
              </Typography>
              <Typography variant="body1">Enabled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="warning.main">
                {
                  plugins.filter(
                    (p) => !p.enabled && (p.backendExists || p.frontendExists)
                  ).length
                }
              </Typography>
              <Typography variant="body1">Disabled</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="primary">
                {plugins.filter((p) => p.core).length}
              </Typography>
              <Typography variant="body1">Core Plugins</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Plugins Table */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ExtensionIcon />
                  <Typography variant="h6">Installed Plugins</Typography>
                  <Badge badgeContent={plugins.length} color="primary" />
                </Box>
              }
            />
            <CardContent>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Plugin</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Dependencies</TableCell>
                      <TableCell>Components</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {plugins.map((plugin) => (
                      <TableRow key={plugin.name}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {getPluginStatusIcon(plugin)}
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                {plugin.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {plugin.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getPluginStatusText(plugin)}
                            color={getPluginStatusColor(plugin)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {plugin.core && (
                              <Chip label="Core" color="primary" size="small" />
                            )}
                            {plugin.type && (
                              <Chip
                                label={plugin.type}
                                color={
                                  plugin.type === "Security"
                                    ? "error"
                                    : plugin.type === "Essential"
                                    ? "warning"
                                    : plugin.type === "Performance"
                                    ? "secondary"
                                    : "default"
                                }
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {plugin.dependsOn?.length > 0 ? (
                            <Box
                              sx={{
                                display: "flex",
                                gap: 0.5,
                                flexWrap: "wrap",
                              }}
                            >
                              {plugin.dependsOn.map((dep) => (
                                <Chip
                                  key={dep}
                                  label={dep}
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                />
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            {plugin.backendExists && (
                              <Chip
                                label="Backend"
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            )}
                            {plugin.frontendExists && (
                              <Chip
                                label="Frontend"
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              alignItems: "center",
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={plugin.enabled}
                                  onChange={(e) =>
                                    handleTogglePlugin(
                                      plugin.name,
                                      e.target.checked
                                    )
                                  }
                                  disabled={
                                    plugin.name === "licensing" &&
                                    plugin.enabled
                                  }
                                />
                              }
                              label=""
                            />
                            <Tooltip
                              title={
                                <Typography variant="body2">
                                  Download Plugin
                                </Typography>
                              }
                              arrow
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleDownloadPlugin(plugin.name)
                                  }
                                  disabled={
                                    !plugin.backendExists &&
                                    !plugin.frontendExists
                                  }
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <Tooltip
                              title={
                                <Typography variant="body2">
                                  Delete Plugin
                                </Typography>
                              }
                              arrow
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedPlugin(plugin);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={plugin.core}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Plugin Info */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InfoIcon />
                  <Typography variant="h6">
                    Plugin System Information
                  </Typography>
                </Box>
              }
            />
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Licensing Plugin Dependency:</strong> When the
                  licensing plugin is disabled, all other plugins that depend on
                  it will be automatically disabled to maintain system
                  integrity.
                </Typography>
              </Alert>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SecurityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Core Plugins"
                    secondary="Core plugins cannot be deleted and are essential for system operation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <UploadIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Plugin Upload"
                    secondary="Upload ZIP files containing plugin backend and/or frontend components"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DownloadIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Plugin Export"
                    secondary="Download plugins as ZIP files for backup or redistribution"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload New Plugin</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a ZIP file containing your plugin. The ZIP should contain
              either:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Backend and frontend folders with plugin files" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• A single plugin directory with either backend or frontend files" />
              </ListItem>
            </List>
            <TextField
              type="file"
              fullWidth
              inputProps={{ accept: ".zip" }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
              sx={{ mt: 2 }}
            />
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUploadPlugin}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={
              uploading ? <CircularProgress size={20} /> : <UploadIcon />
            }
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Confirm Plugin Deletion</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPlugin && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete the plugin{" "}
                <strong>{selectedPlugin.name}</strong>?
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  This action will permanently remove all plugin files and
                  cannot be undone. The plugin will need to be re-uploaded to
                  use it again.
                </Typography>
              </Alert>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={retainData}
                      onChange={(e) => setRetainData(e.target.checked)}
                      disabled={deleting}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">
                        <strong>Retain plugin database data</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Keep database collections and settings when deleting the
                        plugin
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
              {!retainData && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Warning:</strong> All database data associated with
                    this plugin (including configurations, logs, and user data)
                    will be permanently deleted!
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setRetainData(false);
            }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeletePlugin}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            {deleting ? "Deleting..." : "Delete Plugin"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPlugins;
