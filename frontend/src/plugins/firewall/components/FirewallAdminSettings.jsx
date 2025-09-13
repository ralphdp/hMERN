import React, { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";
import { MasterSwitchProvider, useMasterSwitch } from "./MasterSwitchProvider";
import createLogger from "../../../utils/logger";
import { useFirewallSnackbar } from "./FirewallSnackbarProvider";
import {
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Paper,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  InputAdornment,
  Slider,
  Tooltip,
  Badge,
  Stack,
} from "@mui/material";
import {
  Security as SecurityIcon,
  Tune as TuneIcon,
  Settings as SettingsIcon,
  Restore as RestoreIcon,
  BarChart as ChartIcon,
  AdminPanelSettings as AdminIcon,
  Timer as TimerIcon,
  Memory as MemoryIcon,
  CloudQueue as ProxyIcon,
  Shield as ShieldIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AccessibilityNew as UserExperienceIcon,
  DataUsage as DataIcon,
  MonitorHeart as MonitorIcon,
  Dns as DnsIcon,
  Science as ScienceIcon,
  Analytics as AnalyticsIcon,
  Schedule as ScheduleIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  ClearAll as ClearAllIcon,
  Speed as SpeedIcon,
  BugReport as BugReportIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  Build as BuildIcon,
  Policy as LimitIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  Sync as SyncIcon,
} from "@mui/icons-material";

// Initialize logger for firewall settings
const logger = createLogger("FirewallAdminSettings");

// Memoized sub-component for a generic settings card to prevent re-renders
const SectionCard = React.memo(({ title, icon, children }) => {
  return (
    <Card
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {icon}
            <Typography variant="h6">{title}</Typography>
          </Box>
        }
      />
      <CardContent sx={{ flex: 1, width: "100%" }}>{children}</CardContent>
    </Card>
  );
});

// General Configuration Section with Master Switch
const GeneralConfiguration = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();
  const isDevelopmentMode = settings.developmentMode?.enabled ?? false;

  return (
    <Grid container spacing={3}>
      {/* Master Enable/Disable */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, width: "100%", height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ShieldIcon />
            <Typography variant="subtitle1">Master Control</Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                Firewall Protection System
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Master switch to enable/disable all firewall protection features
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isMainEnabled}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      updateSetting("general.enabled", newValue);
                    }}
                    size="large"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={isMainEnabled ? "Enabled" : "Disabled"}
                      color={isMainEnabled ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                }
                labelPlacement="start"
              />
            </Box>
          </Box>
        </Paper>
      </Grid>

      {/* Development Mode Toggle */}
      <Grid item xs={12} md={6}>
        <Paper
          sx={{
            p: 2,
            width: "100%",
            height: "100%",
            border: isDevelopmentMode ? "2px solid" : "1px solid",
            borderColor: isDevelopmentMode ? "warning.main" : "divider",
            backgroundColor: isDevelopmentMode
              ? (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255, 152, 0, 0.1)"
                    : "rgba(255, 152, 0, 0.05)"
              : "background.paper",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <BugReportIcon color={isDevelopmentMode ? "warning" : "inherit"} />
            <Typography variant="subtitle1">Development Mode</Typography>
            {isDevelopmentMode && (
              <Chip
                label="ACTIVE"
                color="warning"
                size="small"
                variant="filled"
              />
            )}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                Bypass All Restrictions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Disables firewall rules and rate limiting for
                development/testing
              </Typography>
              {isDevelopmentMode && (
                <Typography
                  variant="body2"
                  color="warning.main"
                  sx={{ mt: 1, fontWeight: "medium" }}
                >
                  ⚠️ All traffic will bypass firewall protection
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isDevelopmentMode}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      updateSetting("developmentMode.enabled", newValue);

                      // Log the change for debugging
                      if (newValue) {
                        logger.warn(
                          "Development mode ENABLED - All firewall restrictions bypassed"
                        );
                      } else {
                        logger.info(
                          "Development mode DISABLED - Firewall restrictions restored"
                        );
                      }
                    }}
                    size="large"
                    color="warning"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={isDevelopmentMode ? "Enabled" : "Disabled"}
                      color={isDevelopmentMode ? "warning" : "default"}
                      size="small"
                    />
                  </Box>
                }
                labelPlacement="start"
              />
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
});

const SecurityPerformanceSettings = React.memo(
  ({ settings, updateSetting, isFeatureEnabled, getDisabledStyle }) => {
    const { isMainEnabled } = useMasterSwitch();
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ChartIcon />
              <Typography variant="subtitle1">Rate Limiting</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Requests per Minute"
                  value={settings.rateLimit?.perMinute || 120}
                  onChange={(e) =>
                    updateSetting(
                      "rateLimit.perMinute",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="Global default for all users"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Requests per Hour"
                  value={settings.rateLimit?.perHour || 720}
                  onChange={(e) =>
                    updateSetting(
                      "rateLimit.perHour",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="Global default for all users"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AdminIcon />
              <Typography variant="subtitle1">Admin Rate Limiting</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Admin Requests per Minute"
                  value={settings.adminRateLimit?.perMinute || 500}
                  onChange={(e) =>
                    updateSetting(
                      "adminRateLimit.perMinute",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="Higher limits for admin users"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Admin Requests per Hour"
                  value={settings.adminRateLimit?.perHour || 4000}
                  onChange={(e) =>
                    updateSetting(
                      "adminRateLimit.perHour",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="Higher limits for admin users"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* NEW: Advanced Rate Limiting Bypass Settings */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              border: "2px solid",
              borderColor: "warning.main",
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255, 152, 0, 0.1)"
                  : "rgba(255, 152, 0, 0.05)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SpeedIcon color="warning" />
              <Typography variant="subtitle1">
                Advanced Rate Limiting Bypass
              </Typography>
              <Chip label="SECURITY CRITICAL" color="warning" size="small" />
            </Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>⚠️ Security Warning:</strong> These settings bypass rate
                limiting for specific user types. Disabling bypasses will
                enforce rate limits on ALL users, including admins.
              </Typography>
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.rateLimitAdvanced?.bypassAdminUsers ?? true
                      }
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        updateSetting(
                          "rateLimitAdvanced.bypassAdminUsers",
                          newValue
                        );

                        // Log the change for debugging
                        if (newValue) {
                          logger.info(
                            "Admin rate limit bypass ENABLED - Admins will bypass rate limits"
                          );
                        } else {
                          logger.warn(
                            "Admin rate limit bypass DISABLED - Admins will be rate limited"
                          );
                        }
                      }}
                      disabled={!isMainEnabled}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Bypass Admin Users
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow admin users to bypass all rate limiting
                      </Typography>
                      {!settings.rateLimitAdvanced?.bypassAdminUsers && (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          display="block"
                        >
                          ⚠️ Admins will be rate limited
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.rateLimitAdvanced?.bypassAuthenticatedUsers ??
                        false
                      }
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        updateSetting(
                          "rateLimitAdvanced.bypassAuthenticatedUsers",
                          newValue
                        );

                        // Log the change for debugging
                        if (newValue) {
                          logger.warn(
                            "Authenticated user bypass ENABLED - All logged-in users bypass rate limits"
                          );
                        } else {
                          logger.info(
                            "Authenticated user bypass DISABLED - Logged-in users will be rate limited"
                          );
                        }
                      }}
                      disabled={!isMainEnabled}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Bypass Authenticated Users
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow all logged-in users to bypass rate limiting
                      </Typography>
                      {settings.rateLimitAdvanced?.bypassAuthenticatedUsers && (
                        <Typography
                          variant="caption"
                          color="warning.main"
                          display="block"
                        >
                          ⚠️ All authenticated users bypass limits
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* Progressive Delays - Only show if feature is enabled */}
        {isFeatureEnabled && isFeatureEnabled("progressiveDelays") && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <TimerIcon />
                <Typography variant="subtitle1">
                  Progressive Delays & Throttling
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Specific delay durations for successive violations (seconds)
              </Typography>
              <Grid container spacing={2}>
                {(settings.progressiveDelays || [10, 60, 90, 120]).map(
                  (delay, index) => (
                    <Grid item xs={6} sm={3} key={index}>
                      <TextField
                        fullWidth
                        type="number"
                        label={`Violation ${index + 1}`}
                        value={delay}
                        onChange={(e) => {
                          const newDelays = [
                            ...(settings.progressiveDelays || []),
                          ];
                          newDelays[index] = parseInt(e.target.value) || 0;
                          updateSetting("progressiveDelays", newDelays);
                        }}
                        disabled={!isMainEnabled}
                      />
                    </Grid>
                  )
                )}
              </Grid>
            </Paper>
          </Grid>
        )}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <MemoryIcon />
              <Typography variant="subtitle1">Cache Configuration</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.ruleCache?.enabled ?? true}
                      onChange={(e) =>
                        updateSetting("ruleCache.enabled", e.target.checked)
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Rule Caching"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cache TTL (seconds)"
                  value={settings.ruleCache?.ttl ?? 60}
                  onChange={(e) =>
                    updateSetting(
                      "ruleCache.ttl",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="How long to cache rules"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AdminIcon />
              <Typography variant="subtitle1">
                Admin Progressive Delays
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Specific delay durations for admin violations (seconds)
            </Typography>
            <Grid container spacing={2}>
              {(
                settings.adminRateLimit?.progressiveDelays || [5, 30, 60, 120]
              ).map((delay, index) => (
                <Grid item xs={6} sm={3} key={index}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Violation ${index + 1}`}
                    value={delay}
                    onChange={(e) => {
                      const newDelays = [
                        ...(settings.adminRateLimit?.progressiveDelays || []),
                      ];
                      newDelays[index] = parseInt(e.target.value) || 0;
                      updateSetting(
                        "adminRateLimit.progressiveDelays",
                        newDelays
                      );
                    }}
                    disabled={!isMainEnabled}
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Performance Configuration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SpeedIcon />
              <Typography variant="subtitle1">Request Processing</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Request Timeout (ms)"
                  value={settings.performance?.requestTimeout || 30000}
                  onChange={(e) =>
                    updateSetting(
                      "performance.requestTimeout",
                      parseInt(e.target.value) || 30000
                    )
                  }
                  helperText="Maximum time to process a request"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Concurrent Request Limit"
                  value={settings.performance?.concurrentRequests || 1000}
                  onChange={(e) =>
                    updateSetting(
                      "performance.concurrentRequests",
                      parseInt(e.target.value) || 1000
                    )
                  }
                  helperText="Maximum concurrent requests allowed"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.performance?.enableCompression ?? true}
                      onChange={(e) =>
                        updateSetting(
                          "performance.enableCompression",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Response Compression"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <MemoryIcon />
              <Typography variant="subtitle1">Memory Management</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Memory Limit (MB)"
                  value={settings.performance?.memoryLimit || 512}
                  onChange={(e) =>
                    updateSetting(
                      "performance.memoryLimit",
                      parseInt(e.target.value) || 512
                    )
                  }
                  helperText="Maximum memory usage for firewall process"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Garbage Collection Interval (s)"
                  value={settings.performance?.gcInterval || 300}
                  onChange={(e) =>
                    updateSetting(
                      "performance.gcInterval",
                      parseInt(e.target.value) || 300
                    )
                  }
                  helperText="How often to run garbage collection"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const SystemConfiguration = React.memo(
  ({ settings, updateSetting, isFeatureEnabled, getDisabledStyle }) => {
    const { isMainEnabled } = useMasterSwitch();
    const [newTrustedProxy, setNewTrustedProxy] = useState("");
    const [newLocalNetwork, setNewLocalNetwork] = useState("");

    const addTrustedProxy = () => {
      if (newTrustedProxy.trim()) {
        updateSetting("trustedProxies", [
          ...(settings.trustedProxies || []),
          newTrustedProxy.trim(),
        ]);
        setNewTrustedProxy("");
      }
    };

    const removeTrustedProxy = (index) => {
      updateSetting(
        "trustedProxies",
        (settings.trustedProxies || []).filter((_, i) => i !== index)
      );
    };

    const addLocalNetwork = () => {
      if (newLocalNetwork.trim()) {
        updateSetting("localNetworks.ranges", [
          ...(settings.localNetworks?.ranges || []),
          newLocalNetwork.trim(),
        ]);
        setNewLocalNetwork("");
      }
    };

    const removeLocalNetwork = (index) => {
      updateSetting(
        "localNetworks.ranges",
        (settings.localNetworks?.ranges || []).filter((_, i) => i !== index)
      );
    };

    const addCommonLocalhostPatterns = () => {
      const commonPatterns = [
        "127.0.0.1",
        "::1",
        "localhost",
        "192.168.",
        "10.",
        "172.16.",
        "172.17.",
        "172.18.",
        "172.19.",
        "172.20.",
        "172.21.",
        "172.22.",
        "172.23.",
        "172.24.",
        "172.25.",
        "172.26.",
        "172.27.",
        "172.28.",
        "172.29.",
        "172.30.",
        "172.31.",
      ];

      const currentRanges = settings.localNetworks?.ranges || [];
      const newPatterns = commonPatterns.filter(
        (pattern) => !currentRanges.includes(pattern)
      );

      if (newPatterns.length > 0) {
        updateSetting("localNetworks.ranges", [
          ...currentRanges,
          ...newPatterns,
        ]);
        setNewLocalNetwork("");
      }
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ProxyIcon />
              <Typography variant="subtitle1">Trusted Proxies</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              CDN/Proxy IPs for accurate client IP detection via
              X-Forwarded-For.
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Enter proxy IP address"
                value={newTrustedProxy}
                onChange={(e) => setNewTrustedProxy(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTrustedProxy()}
                disabled={!isMainEnabled}
              />
              <Button
                variant="outlined"
                onClick={addTrustedProxy}
                startIcon={<AddIcon />}
                disabled={!isMainEnabled}
              >
                Add
              </Button>
            </Box>
            <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
              {(settings.trustedProxies || []).map((proxy, index) => (
                <ListItem key={index}>
                  <ListItemText primary={proxy} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeTrustedProxy(index)}
                      aria-label={`Remove trusted proxy ${proxy}`}
                      color="error"
                      disabled={!isMainEnabled}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <DnsIcon />
              <Typography variant="subtitle1">Local Network Bypass</Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.localNetworks?.enabled ?? true}
                  onChange={(e) =>
                    updateSetting("localNetworks.enabled", e.target.checked)
                  }
                  disabled={!isMainEnabled}
                />
              }
              label="Bypass firewall for local networks"
            />
            <Box sx={{ display: "flex", gap: 1, my: 2 }}>
              <TextField
                fullWidth
                placeholder="Enter local IP or range"
                value={newLocalNetwork}
                onChange={(e) => setNewLocalNetwork(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addLocalNetwork()}
                disabled={!isMainEnabled}
              />
              <Button
                variant="outlined"
                onClick={addLocalNetwork}
                startIcon={<AddIcon />}
                disabled={!isMainEnabled}
              >
                Add
              </Button>
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Button
                variant="outlined"
                onClick={addCommonLocalhostPatterns}
                startIcon={<AddIcon />}
                disabled={!isMainEnabled}
                color="secondary"
                size="small"
                fullWidth
              >
                Add Common Localhost Patterns
              </Button>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1, fontSize: "0.75rem" }}
            >
              Common patterns include: 127.0.0.1, ::1, localhost, 192.168.*,
              10.*, 172.16-31.*
            </Typography>
            <List dense sx={{ maxHeight: 150, overflow: "auto" }}>
              {(settings.localNetworks?.ranges || []).map((range, index) => (
                <ListItem key={index}>
                  <ListItemText primary={range} />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => removeLocalNetwork(index)}
                      aria-label={`Remove local network range ${range}`}
                      color="error"
                      disabled={!isMainEnabled}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ShieldIcon />
              <Typography variant="subtitle1">Security Thresholds</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Pattern Length"
                  value={settings.securityThresholds?.maxPatternLength ?? 500}
                  onChange={(e) =>
                    updateSetting(
                      "securityThresholds.maxPatternLength",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="Prevents ReDoS attacks via long regex patterns"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Input String Length"
                  value={settings.securityThresholds?.maxInputLength ?? 2000}
                  onChange={(e) =>
                    updateSetting(
                      "securityThresholds.maxInputLength",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="Limits input length for pattern matching"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.securityThresholds?.enableReDoSProtection ??
                        true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "securityThresholds.enableReDoSProtection",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable ReDoS Protection"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* Auto-Blocking - Only show if feature is enabled */}
        {isFeatureEnabled && isFeatureEnabled("autoThreatResponse") && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <ShieldIcon />
                <Typography variant="subtitle1">Auto-Blocking</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoBlocking?.enabled ?? true}
                        onChange={(e) =>
                          updateSetting(
                            "autoBlocking.enabled",
                            e.target.checked
                          )
                        }
                        disabled={!isMainEnabled}
                      />
                    }
                    label="Enable Auto-Blocking for excessive rate limit violations"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  }
);

const UserExperienceSettings = React.memo(
  ({
    settings,
    updateSetting,
    showAlert,
    isFeatureEnabled,
    getDisabledStyle,
  }) => {
    const { isMainEnabled, isSettingsSaved } = useMasterSwitch();
    const [newAlertEmail, setNewAlertEmail] = useState("");
    const [deleteEmailDialog, setDeleteEmailDialog] = useState({
      open: false,
      email: "",
      index: -1,
    });
    const [errorDialog, setErrorDialog] = useState({
      open: false,
      title: "",
      message: "",
    });

    const addAlertEmail = () => {
      const email = newAlertEmail.trim();

      // Validate email format
      if (!email) {
        setErrorDialog({
          open: true,
          title: "Invalid Email",
          message: "Please enter an email address.",
        });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrorDialog({
          open: true,
          title: "Invalid Email Format",
          message:
            "Please enter a valid email address (e.g., user@example.com).",
        });
        return;
      }

      const currentEmails = Array.isArray(settings.monitoring?.alertEmails)
        ? settings.monitoring.alertEmails
        : settings.monitoring?.alertEmail
        ? [settings.monitoring.alertEmail]
        : [];

      // Check for duplicates
      const emailToAdd = email.toLowerCase();
      const isDuplicate = currentEmails.some(
        (existingEmail) => existingEmail.toLowerCase() === emailToAdd
      );

      if (isDuplicate) {
        setErrorDialog({
          open: true,
          title: "Duplicate Email",
          message: `The email address "${email}" is already in the alert list.`,
        });
        return;
      }

      // Add email if all validations pass
      updateSetting("monitoring.alertEmails", [...currentEmails, email]);
      setNewAlertEmail("");
    };

    const handleRemoveAlertEmail = (index) => {
      const currentEmails = Array.isArray(settings.monitoring?.alertEmails)
        ? settings.monitoring.alertEmails
        : settings.monitoring?.alertEmail
        ? [settings.monitoring.alertEmail]
        : [];

      setDeleteEmailDialog({
        open: true,
        email: currentEmails[index],
        index: index,
      });
    };

    const confirmRemoveAlertEmail = () => {
      const currentEmails = Array.isArray(settings.monitoring?.alertEmails)
        ? settings.monitoring.alertEmails
        : settings.monitoring?.alertEmail
        ? [settings.monitoring.alertEmail]
        : [];

      updateSetting(
        "monitoring.alertEmails",
        currentEmails.filter((_, i) => i !== deleteEmailDialog.index)
      );

      setDeleteEmailDialog({ open: false, email: "", index: -1 });
    };

    const cancelRemoveAlertEmail = () => {
      setDeleteEmailDialog({ open: false, email: "", index: -1 });
    };

    const alertEmails = Array.isArray(settings.monitoring?.alertEmails)
      ? settings.monitoring.alertEmails
      : settings.monitoring?.alertEmail
      ? [settings.monitoring.alertEmail]
      : [];

    return (
      <Grid container spacing={3}>
        {/* Status Panel Visibility */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SecurityIcon />
              <Typography variant="subtitle1">
                Status Panel Visibility
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Control who can see the firewall status panel on all pages
              </Typography>
              <FormControl fullWidth disabled={!isMainEnabled}>
                <InputLabel>Panel Visibility</InputLabel>
                <Select
                  value={
                    settings.preferences?.statusPanelVisibility ?? "admin_only"
                  }
                  onChange={(e) =>
                    updateSetting(
                      "preferences.statusPanelVisibility",
                      e.target.value
                    )
                  }
                  label="Panel Visibility"
                >
                  <MenuItem value="admin_only">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label="Admin Only" color="primary" size="small" />
                      <Typography>Admin users only</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="authenticated_users">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label="Authenticated" color="info" size="small" />
                      <Typography>All logged-in users</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="everyone">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip label="Everyone" color="warning" size="small" />
                      <Typography>
                        All visitors (including logged out)
                      </Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {settings.preferences?.statusPanelVisibility === "everyone" &&
                  "⚠️ Panel will be visible to all visitors, including non-authenticated users"}
                {settings.preferences?.statusPanelVisibility ===
                  "authenticated_users" &&
                  "Panel will be visible to all logged-in users"}
                {(settings.preferences?.statusPanelVisibility ===
                  "admin_only" ||
                  !settings.preferences?.statusPanelVisibility) &&
                  "Panel will only be visible to admin users (default)"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <DataIcon />
              <Typography variant="subtitle1">
                Response Configuration
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Blocked Response Message"
                  value={
                    settings.responses?.blocked?.message ??
                    "Request blocked by firewall rules"
                  }
                  onChange={(e) =>
                    updateSetting("responses.blocked.message", e.target.value)
                  }
                  helperText="Message shown when request is blocked"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Blocked Response Status Code"
                  value={settings.responses?.blocked?.statusCode ?? 403}
                  onChange={(e) =>
                    updateSetting(
                      "responses.blocked.statusCode",
                      parseInt(e.target.value) || 0
                    )
                  }
                  helperText="HTTP status code for blocked requests"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.responses?.blocked?.includeDetails ?? true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "responses.blocked.includeDetails",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Include Details in Block Response"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        {/* Real-time Alert Notifications - Only show if feature is enabled */}
        {isFeatureEnabled && isFeatureEnabled("realTimeLogging") && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <MonitorIcon />
                <Typography variant="subtitle1">
                  Real-time Alert Notifications
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          settings.monitoring?.enableRealTimeAlerts ?? false
                        }
                        onChange={(e) =>
                          updateSetting(
                            "monitoring.enableRealTimeAlerts",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Enable Real-time Security Alerts"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    Email addresses for immediate security alerts and threat
                    notifications
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                      fullWidth
                      type="email"
                      placeholder="Enter email address"
                      value={newAlertEmail}
                      onChange={(e) => setNewAlertEmail(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addAlertEmail()}
                      disabled={!settings.monitoring?.enableRealTimeAlerts}
                    />
                    <Button
                      variant="outlined"
                      onClick={addAlertEmail}
                      startIcon={<AddIcon />}
                      disabled={!settings.monitoring?.enableRealTimeAlerts}
                    >
                      Add
                    </Button>
                  </Box>
                  <List dense sx={{ maxHeight: 150, overflow: "auto" }}>
                    {alertEmails.map((email, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={email} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveAlertEmail(index)}
                            aria-label={`Remove alert email ${email}`}
                            color="error"
                            disabled={
                              !settings.monitoring?.enableRealTimeAlerts
                            }
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {/* Delete Alert Email Confirmation Dialog */}
        <Dialog
          open={deleteEmailDialog.open}
          onClose={cancelRemoveAlertEmail}
          aria-labelledby="delete-alert-email-dialog-title"
        >
          <DialogTitle id="delete-alert-email-dialog-title">
            Confirm Email Removal
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to remove "{deleteEmailDialog.email}" from
              the alert email list? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelRemoveAlertEmail} color="primary">
              Cancel
            </Button>
            <Button
              onClick={confirmRemoveAlertEmail}
              color="error"
              variant="contained"
              autoFocus
            >
              Remove Email
            </Button>
          </DialogActions>
        </Dialog>

        {/* Error Dialog */}
        <Dialog
          open={errorDialog.open}
          onClose={() =>
            setErrorDialog({ open: false, title: "", message: "" })
          }
          aria-labelledby="error-dialog-title"
        >
          <DialogTitle id="error-dialog-title">{errorDialog.title}</DialogTitle>
          <DialogContent>
            <DialogContentText>{errorDialog.message}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setErrorDialog({ open: false, title: "", message: "" })
              }
              color="primary"
              variant="contained"
              autoFocus
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    );
  }
);

// Email Reports Section
const EmailReports = React.memo(({ settings, updateSetting, showAlert }) => {
  const { isMainEnabled } = useMasterSwitch();
  const [newReportEmail, setNewReportEmail] = useState("");
  const [sendingPreview, setSendingPreview] = useState(false);
  const [deleteReportEmailDialog, setDeleteReportEmailDialog] = useState({
    open: false,
    email: "",
    index: -1,
  });
  const [reportErrorDialog, setReportErrorDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const addReportEmail = () => {
    const email = newReportEmail.trim();

    // Validate email format
    if (!email) {
      setReportErrorDialog({
        open: true,
        title: "Invalid Email",
        message: "Please enter an email address.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setReportErrorDialog({
        open: true,
        title: "Invalid Email Format",
        message: "Please enter a valid email address (e.g., user@example.com).",
      });
      return;
    }

    const currentEmails = Array.isArray(settings.emailReports?.emails)
      ? settings.emailReports.emails
      : [];

    // Check for duplicates
    const emailToAdd = email.toLowerCase();
    const isDuplicate = currentEmails.some(
      (existingEmail) => existingEmail.toLowerCase() === emailToAdd
    );

    if (isDuplicate) {
      setReportErrorDialog({
        open: true,
        title: "Duplicate Email",
        message: `The email address "${email}" is already in the report list.`,
      });
      return;
    }

    // Add email if all validations pass
    updateSetting("emailReports.emails", [...currentEmails, email]);
    setNewReportEmail("");
  };

  const handleRemoveReportEmail = (index) => {
    const currentEmails = Array.isArray(settings.emailReports?.emails)
      ? settings.emailReports.emails
      : [];

    setDeleteReportEmailDialog({
      open: true,
      email: currentEmails[index],
      index: index,
    });
  };

  const confirmRemoveReportEmail = () => {
    const currentEmails = Array.isArray(settings.emailReports?.emails)
      ? settings.emailReports.emails
      : [];

    updateSetting(
      "emailReports.emails",
      currentEmails.filter((_, i) => i !== deleteReportEmailDialog.index)
    );

    setDeleteReportEmailDialog({ open: false, email: "", index: -1 });
  };

  const cancelRemoveReportEmail = () => {
    setDeleteReportEmailDialog({ open: false, email: "", index: -1 });
  };

  const sendPreviewReport = async () => {
    const reportEmails = Array.isArray(settings.emailReports?.emails)
      ? settings.emailReports.emails
      : [];

    if (reportEmails.length === 0) {
      setReportErrorDialog({
        open: true,
        title: "No Email Addresses",
        message:
          "Please add at least one email address to send the preview report to.",
      });
      return;
    }

    setSendingPreview(true);

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/send-preview-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
          body: JSON.stringify({
            emails: reportEmails,
            reportSettings: {
              frequency: settings.emailReports?.frequency ?? "weekly",
              includeAttackSummary:
                settings.emailReports?.includeAttackSummary ?? true,
              includeTopThreats:
                settings.emailReports?.includeTopThreats ?? true,
              includeTrafficStats:
                settings.emailReports?.includeTrafficStats ?? true,
              includeRulePerformance:
                settings.emailReports?.includeRulePerformance ?? true,
              includeCharts: settings.emailReports?.includeCharts ?? true,
            },
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        showAlert(
          `Preview report sent successfully! ${data.message}`,
          "success"
        );
      } else {
        showAlert(data.message || "Failed to send preview report", "error");
      }
    } catch (error) {
      logger.error("Error sending preview report", { error: error.message });
      showAlert(
        "Network error while sending preview report. Please check your connection.",
        "error"
      );
    } finally {
      setSendingPreview(false);
    }
  };

  const reportEmails = Array.isArray(settings.emailReports?.emails)
    ? settings.emailReports.emails
    : [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AnalyticsIcon />
            <Typography variant="subtitle1">Security Reports</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailReports?.enabled ?? false}
                    onChange={(e) =>
                      updateSetting("emailReports.enabled", e.target.checked)
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Security Email Reports"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Additional email addresses for periodic security reports
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="Enter email address"
                  value={newReportEmail}
                  onChange={(e) => setNewReportEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addReportEmail()}
                  disabled={!isMainEnabled || !settings.emailReports?.enabled}
                />
                <Button
                  variant="outlined"
                  onClick={addReportEmail}
                  startIcon={<AddIcon />}
                  disabled={!isMainEnabled || !settings.emailReports?.enabled}
                >
                  Add
                </Button>
              </Box>
              <List dense sx={{ maxHeight: 150, overflow: "auto" }}>
                {reportEmails.map((email, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={email} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveReportEmail(index)}
                        aria-label={`Remove report email ${email}`}
                        color="error"
                        disabled={
                          !isMainEnabled || !settings.emailReports?.enabled
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ScheduleIcon />
            <Typography variant="subtitle1">
              Report Schedule & Content
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                disabled={!isMainEnabled || !settings.emailReports?.enabled}
              >
                <InputLabel>Report Frequency</InputLabel>
                <Select
                  value={settings.emailReports?.frequency ?? "weekly"}
                  onChange={(e) =>
                    updateSetting("emailReports.frequency", e.target.value)
                  }
                  label="Report Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Report Time (24h format)"
                type="time"
                value={settings.emailReports?.time ?? "09:00"}
                onChange={(e) =>
                  updateSetting("emailReports.time", e.target.value)
                }
                disabled={!isMainEnabled || !settings.emailReports?.enabled}
                helperText="Time to send reports (server timezone)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeAttackSummary ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeAttackSummary",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Attack Summary"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailReports?.includeTopThreats ?? true}
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeTopThreats",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Top Threats"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailReports?.includeTrafficStats ?? true}
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeTrafficStats",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Traffic Statistics"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeRulePerformance ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeRulePerformance",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Rule Performance"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailReports?.includeCharts ?? true}
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeCharts",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Security Charts & Graphs"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <PreviewIcon />
            <Typography variant="subtitle1">Preview Report</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send a preview report to:
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Recipients: <strong>{reportEmails.length}</strong> email
              {reportEmails.length !== 1 ? "s" : ""}
            </Typography>
            {reportEmails.length > 0 && (
              <Box sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                {reportEmails.map((email, index) => (
                  <Typography
                    key={index}
                    variant="caption"
                    sx={{
                      display: "block",
                      pl: 1,
                      "&:before": { content: '"• "' },
                    }}
                  >
                    {email}
                  </Typography>
                ))}
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            onClick={sendPreviewReport}
            disabled={
              !isMainEnabled ||
              !settings.emailReports?.enabled ||
              sendingPreview ||
              reportEmails.length === 0
            }
            startIcon={
              sendingPreview ? <CircularProgress size={20} /> : <SendIcon />
            }
            fullWidth
            size="large"
          >
            {sendingPreview ? "Sending Preview..." : "Send Preview Report"}
          </Button>

          {reportEmails.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Add email addresses above to send preview reports.
              </Typography>
            </Alert>
          )}
        </Paper>
      </Grid>

      {/* Delete Report Email Confirmation Dialog */}
      <Dialog
        open={deleteReportEmailDialog.open}
        onClose={cancelRemoveReportEmail}
        aria-labelledby="delete-report-email-dialog-title"
      >
        <DialogTitle id="delete-report-email-dialog-title">
          Confirm Email Removal
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove "{deleteReportEmailDialog.email}"
            from the report email list? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRemoveReportEmail} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmRemoveReportEmail}
            color="error"
            variant="contained"
            autoFocus
          >
            Remove Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Error Dialog */}
      <Dialog
        open={reportErrorDialog.open}
        onClose={() =>
          setReportErrorDialog({ open: false, title: "", message: "" })
        }
        aria-labelledby="report-error-dialog-title"
      >
        <DialogTitle id="report-error-dialog-title">
          {reportErrorDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{reportErrorDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setReportErrorDialog({ open: false, title: "", message: "" })
            }
            color="primary"
            variant="contained"
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
});

const CacheManagement = React.memo(({ showAlert, settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();
  const [cacheRefreshing, setCacheRefreshing] = useState(false);

  const handleRefreshCache = async () => {
    setCacheRefreshing(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/force-cache-refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        showAlert(result.message || "Cache is now refreshed", "success");

        // Refresh status data after cache refresh
        setTimeout(() => {
          // Trigger a page refresh or status update
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        showAlert(error.message || "Failed to refresh cache", "error");
      }
    } catch (error) {
      showAlert(`Error refreshing cache: ${error.message}`, "error");
    } finally {
      setCacheRefreshing(false);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <MemoryIcon />
            <Typography variant="subtitle1">Cache Configuration</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Cache Size (MB)"
                value={settings?.cache?.maxSize || 100}
                onChange={(e) =>
                  updateSetting(
                    "cache.maxSize",
                    parseInt(e.target.value) || 100
                  )
                }
                helperText="Maximum cache size in memory"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Cache TTL (minutes)"
                value={settings?.cache?.ttl || 60}
                onChange={(e) =>
                  updateSetting("cache.ttl", parseInt(e.target.value) || 60)
                }
                helperText="How long to keep cached items"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.cache?.enablePreloading ?? false}
                    onChange={(e) =>
                      updateSetting("cache.enablePreloading", e.target.checked)
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Cache Preloading"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <StorageIcon />
            <Typography variant="subtitle1">Cache Strategy</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!isMainEnabled}>
                <InputLabel id="cache-strategy-label">
                  Cache Strategy
                </InputLabel>
                <Select
                  labelId="cache-strategy-label"
                  label="Cache Strategy"
                  value={settings?.cache?.strategy || "lru"}
                  onChange={(e) =>
                    updateSetting("cache.strategy", e.target.value)
                  }
                >
                  <MenuItem value="lru">LRU (Least Recently Used)</MenuItem>
                  <MenuItem value="lfu">LFU (Least Frequently Used)</MenuItem>
                  <MenuItem value="fifo">FIFO (First In, First Out)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Cleanup Interval (minutes)"
                value={settings?.cache?.cleanupInterval || 15}
                onChange={(e) =>
                  updateSetting(
                    "cache.cleanupInterval",
                    parseInt(e.target.value) || 15
                  )
                }
                helperText="How often to clean expired cache entries"
                disabled={!isMainEnabled}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <RefreshIcon />
            <Typography variant="subtitle1">Cache Operations</Typography>
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Refresh the firewall cache to fix status display issues. Use this
              if you see "Master: Inactive" when settings show enabled.
            </Typography>
          </Alert>

          <Button
            variant="outlined"
            color="error"
            onClick={handleRefreshCache}
            disabled={cacheRefreshing}
            startIcon={
              cacheRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />
            }
            fullWidth
          >
            {cacheRefreshing ? "Refreshing Cache..." : "Refresh Cache"}
          </Button>
        </Paper>
      </Grid>
    </Grid>
  );
});

const LogManagement = React.memo(
  ({ showAlert, fetchLogs, centralLogCount }) => {
    const [deletingLogs, setDeletingLogs] = useState(false);
    const [showDeleteLogsDialog, setShowDeleteLogsDialog] = useState(false);
    // Log count is now provided by parent component - no local state needed

    const handleDeleteLogs = async () => {
      setDeletingLogs(true);
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/firewall/logs?all=true`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "X-Admin-Bypass": "testing",
            },
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          showAlert(
            data.message || "All firewall logs have been deleted successfully",
            "success"
          );
          setShowDeleteLogsDialog(false);
          // Log count will be updated by parent component refresh
          // Refresh logs table after successful deletion (same pattern as XSS rule addition)
          await fetchLogs();
        } else {
          showAlert(data.message || "Failed to delete firewall logs", "error");
        }
      } catch (error) {
        logger.error("Error deleting firewall logs", { error: error.message });
        showAlert("Network error while deleting firewall logs", "error");
      } finally {
        setDeletingLogs(false);
      }
    };

    return (
      <>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <ClearAllIcon />
                <Typography variant="subtitle1">Log Management</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Delete all firewall logs to free up storage space. This action
                is permanent and cannot be undone.
              </Typography>

              {centralLogCount === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>No logs found.</strong> There are currently no
                    firewall logs to delete.
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Warning:</strong> This will permanently delete all{" "}
                    {centralLogCount.toLocaleString()} firewall logs including
                    attack records, traffic data, and historical security
                    information.
                  </Typography>
                </Alert>
              )}

              <Button
                variant="outlined"
                color="error"
                onClick={() => setShowDeleteLogsDialog(true)}
                disabled={deletingLogs || centralLogCount === 0}
                startIcon={
                  deletingLogs ? (
                    <CircularProgress size={20} />
                  ) : (
                    <ClearAllIcon />
                  )
                }
              >
                {deletingLogs
                  ? "Deleting Logs..."
                  : centralLogCount === 0
                  ? "No Logs to Delete"
                  : `Delete All Logs (${centralLogCount.toLocaleString()})`}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Delete Logs Confirmation Dialog */}
        <Dialog
          open={showDeleteLogsDialog}
          onClose={() => setShowDeleteLogsDialog(false)}
          aria-labelledby="delete-logs-dialog-title"
        >
          <DialogTitle id="delete-logs-dialog-title">
            Confirm Log Deletion
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete <strong>ALL</strong> firewall
              logs? This action will permanently remove:
            </DialogContentText>
            <Box component="ul" sx={{ mt: 1, mb: 2 }}>
              <li>All attack and security logs</li>
              <li>Traffic analysis data</li>
              <li>Rule performance history</li>
              <li>Blocked IP records</li>
              <li>Rate limiting history</li>
            </Box>
            <DialogContentText color="error">
              <strong>This action cannot be undone.</strong>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShowDeleteLogsDialog(false)}
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteLogs}
              color="error"
              variant="contained"
              disabled={deletingLogs}
              startIcon={
                deletingLogs ? <CircularProgress size={20} /> : <ClearAllIcon />
              }
              autoFocus
            >
              {deletingLogs ? "Deleting..." : "Delete All Logs"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
);

const FirewallTestingSuite = React.memo(
  ({ onTestBypass, onTestRule, testing, rules, showAlert, fetchRules }) => {
    const { isMainEnabled, isSettingsSaved } = useMasterSwitch();
    const [addingXssRule, setAddingXssRule] = useState(false);
    const [advancedTesting, setAdvancedTesting] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [testingBypass, setTestingBypass] = useState(false);
    const [testingRule, setTestingRule] = useState(false);

    // Check if XSS blocking rule exists
    const xssRule = rules?.find(
      (rule) =>
        rule.type === "suspicious_pattern" &&
        rule.enabled &&
        (rule.name?.toLowerCase().includes("xss") ||
          rule.value?.includes("<script") ||
          rule.description?.toLowerCase().includes("xss"))
    );

    const hasXssRule = Boolean(xssRule);

    // Wrapper functions to handle individual loading states
    const handleTestBypass = async () => {
      setTestingBypass(true);
      try {
        await onTestBypass();
      } finally {
        setTestingBypass(false);
      }
    };

    const handleTestRule = async () => {
      setTestingRule(true);
      try {
        await onTestRule();
      } finally {
        setTestingRule(false);
      }
    };

    const addXssRule = async () => {
      setAddingXssRule(true);
      try {
        const response = await fetch(`${getBackendUrl()}/api/firewall/rules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
          body: JSON.stringify({
            name: "Block XSS Attacks",
            type: "suspicious_pattern",
            value: "<script[^>]*>.*?</script>",
            action: "block",
            priority: 10,
            enabled: true,
            description:
              "Blocks basic XSS attempts with script tags - Required for Live Attack Simulation",
          }),
        });

        const data = await response.json();

        if (response.ok) {
          showAlert(
            "XSS blocking rule added successfully! You can now run the Live Attack Simulation.",
            "success"
          );
          // Refresh rules to show the new rule
          await fetchRules();
        } else {
          showAlert(data.message || "Failed to add XSS blocking rule", "error");
        }
      } catch (error) {
        logger.error("Error adding XSS rule", { error: error.message });
        showAlert("Network error while adding XSS rule", "error");
      } finally {
        setAddingXssRule(false);
      }
    };

    const runAdvancedTest = async () => {
      setAdvancedTesting(true);
      try {
        console.log("🧪 Starting advanced rule testing...");

        const response = await fetch(
          `${getBackendUrl()}/api/firewall/test-all-rules`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Admin-Bypass": "testing",
            },
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          setTestResults(data);
          setShowResultsModal(true);
          console.log("🧪 Advanced testing completed:", data);

          // Show summary alert
          if (data.success) {
            const { passed, failed, total } = data.summary;
            const message = `Advanced testing completed! ${passed}/${total} rules passed (${data.summary.successRate}% success rate)`;
            showAlert(message, passed === total ? "success" : "warning");
          } else {
            showAlert(data.message || "Advanced testing failed", "error");
          }
        } else {
          showAlert(data.message || "Failed to run advanced testing", "error");
        }
      } catch (error) {
        logger.error("Error running advanced test", { error: error.message });
        showAlert("Network error while running advanced test", "error");
      } finally {
        setAdvancedTesting(false);
      }
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Email Alerts:</strong> To receive email notifications for
              these tests, first enable "Real-time Security Alerts" in the User
              Experience & Notifications section and configure at least one
              email address.
            </Typography>
          </Alert>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SecurityIcon />
              <Typography variant="subtitle1">
                Local Network Bypass Test
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Verify that requests from localhost are correctly bypassing the
              firewall.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleTestBypass}
              disabled={!isMainEnabled || testingBypass}
              startIcon={
                testingBypass ? <CircularProgress size={20} /> : <ScienceIcon />
              }
            >
              Test Localhost Bypass
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ShieldIcon />
              <Typography variant="subtitle1">
                Live Attack Simulation
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Simulate a generic XSS attack to verify that your core rules are
              working.
            </Typography>

            {!hasXssRule && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>XSS blocking rule required:</strong> You need an XSS
                  blocking rule to run this simulation.
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
              {!hasXssRule ? (
                <Button
                  variant="contained"
                  onClick={addXssRule}
                  disabled={!isMainEnabled || !isSettingsSaved || addingXssRule}
                  startIcon={
                    addingXssRule ? <CircularProgress size={20} /> : <AddIcon />
                  }
                  color="primary"
                >
                  {addingXssRule
                    ? "Adding XSS Rule..."
                    : "Add XSS Blocking Rule"}
                </Button>
              ) : (
                <Alert severity="success" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    ✅ XSS rule detected: <strong>{xssRule.name}</strong>
                  </Typography>
                </Alert>
              )}

              <Button
                variant="outlined"
                onClick={handleTestRule}
                disabled={
                  !isMainEnabled ||
                  !isSettingsSaved ||
                  testingRule ||
                  !hasXssRule
                }
                startIcon={
                  testingRule ? <CircularProgress size={20} /> : <ScienceIcon />
                }
              >
                Run Live Attack Simulation
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <BugReportIcon />
              <Typography variant="subtitle1">Advanced Rule Testing</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Comprehensively test ALL enabled firewall rules by simulating
              appropriate attacks for each rule type.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="primary">
                    {rules?.filter(
                      (r) => r.enabled && r.type === "suspicious_pattern"
                    ).length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pattern Rules
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="primary">
                    {rules?.filter((r) => r.enabled && r.type === "ip_block")
                      .length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    IP Blocks
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="primary">
                    {rules?.filter(
                      (r) => r.enabled && r.type === "country_block"
                    ).length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Country Blocks
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h6" color="primary">
                    {rules?.filter((r) => r.enabled).length || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Rules
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={runAdvancedTest}
              disabled={
                !isMainEnabled ||
                !isSettingsSaved ||
                advancedTesting ||
                !rules?.some((r) => r.enabled)
              }
              startIcon={
                advancedTesting ? (
                  <CircularProgress size={20} />
                ) : (
                  <BugReportIcon />
                )
              }
              size="large"
              fullWidth
              color="secondary"
            >
              {advancedTesting
                ? "Testing All Rules..."
                : `Test All ${
                    rules?.filter((r) => r.enabled).length || 0
                  } Rules`}
            </Button>

            {(!rules || rules.filter((r) => r.enabled).length === 0) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  No enabled rules found. Add some firewall rules to test your
                  configuration.
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Advanced Test Results Modal */}
        <Dialog
          open={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          maxWidth="md"
          fullWidth
          aria-labelledby="test-results-dialog-title"
        >
          <DialogTitle id="test-results-dialog-title">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BugReportIcon />
              Advanced Rule Testing Results
              <IconButton
                onClick={() => setShowResultsModal(false)}
                sx={{ ml: "auto" }}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {testResults && (
              <>
                {/* Summary Section */}
                <Box sx={{ mb: 3 }}>
                  <Alert
                    severity={
                      testResults.summary?.successRate === 100
                        ? "success"
                        : testResults.summary?.successRate >= 80
                        ? "warning"
                        : "error"
                    }
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h6">
                      Test Summary: {testResults.summary?.passed}/
                      {testResults.summary?.total} rules passed (
                      {testResults.summary?.successRate}% success rate)
                    </Typography>
                    <Typography variant="body2">
                      {testResults.message}
                    </Typography>
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2,
                          bgcolor: "success.light",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4" color="success.dark">
                          {testResults.summary?.passed || 0}
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                          Passed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2,
                          bgcolor: "error.light",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4" color="error.dark">
                          {testResults.summary?.failed || 0}
                        </Typography>
                        <Typography variant="body2" color="error.dark">
                          Failed
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={4}>
                      <Box
                        sx={{
                          textAlign: "center",
                          p: 2,
                          bgcolor: "info.light",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="h4" color="info.dark">
                          {testResults.summary?.total || 0}
                        </Typography>
                        <Typography variant="body2" color="info.dark">
                          Total
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Detailed Results */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Detailed Results:
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                  {testResults.results?.map((result, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {result.passed ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ErrorIcon color="error" />
                          )}
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: "bold" }}
                          >
                            {result.ruleName}
                          </Typography>
                          <Chip
                            label={result.ruleType}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`Priority: ${result.priority}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          <strong>Rule Value:</strong> {result.ruleValue}
                        </Typography>

                        {result.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            <strong>Description:</strong> {result.description}
                          </Typography>
                        )}

                        <Typography
                          variant="body2"
                          color={result.passed ? "success.main" : "error.main"}
                          sx={{ mb: 1 }}
                        >
                          <strong>Result:</strong> {result.message}
                        </Typography>

                        {result.testPayload && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            <strong>Test Payload:</strong> {result.testPayload}
                          </Typography>
                        )}

                        {result.blockedReason && (
                          <Typography variant="body2" color="success.main">
                            <strong>Block Reason:</strong>{" "}
                            {result.blockedReason}
                          </Typography>
                        )}

                        <Typography variant="caption" color="text.secondary">
                          Tested: {new Date(result.timestamp).toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowResultsModal(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    );
  }
);

// HIGH PRIORITY COMPONENTS
const PerformanceConfiguration = React.memo(
  ({ settings, updateSetting, isFeatureEnabled, getDisabledStyle }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SpeedIcon />
              <Typography variant="subtitle1">Request Processing</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Request Timeout (ms)"
                  value={settings.performance?.requestTimeout || 30000}
                  onChange={(e) =>
                    updateSetting(
                      "performance.requestTimeout",
                      parseInt(e.target.value) || 30000
                    )
                  }
                  helperText="Maximum time to process a request"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Concurrent Request Limit"
                  value={settings.performance?.concurrentRequests || 1000}
                  onChange={(e) =>
                    updateSetting(
                      "performance.concurrentRequests",
                      parseInt(e.target.value) || 1000
                    )
                  }
                  helperText="Maximum concurrent requests allowed"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.performance?.enableCompression ?? true}
                      onChange={(e) =>
                        updateSetting(
                          "performance.enableCompression",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Response Compression"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <MemoryIcon />
              <Typography variant="subtitle1">Memory Management</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Memory Limit (MB)"
                  value={settings.performance?.memoryLimit || 512}
                  onChange={(e) =>
                    updateSetting(
                      "performance.memoryLimit",
                      parseInt(e.target.value) || 512
                    )
                  }
                  helperText="Maximum memory usage for firewall process"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Garbage Collection Interval (s)"
                  value={settings.performance?.gcInterval || 300}
                  onChange={(e) =>
                    updateSetting(
                      "performance.gcInterval",
                      parseInt(e.target.value) || 300
                    )
                  }
                  helperText="How often to run garbage collection"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const AdvancedCacheSettings = React.memo(
  ({ settings, updateSetting, showAlert }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <MemoryIcon />
              <Typography variant="subtitle1">Cache Configuration</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cache Size (MB)"
                  value={settings.cache?.maxSize || 100}
                  onChange={(e) =>
                    updateSetting(
                      "cache.maxSize",
                      parseInt(e.target.value) || 100
                    )
                  }
                  helperText="Maximum cache size in memory"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cache TTL (minutes)"
                  value={settings.cache?.ttl || 60}
                  onChange={(e) =>
                    updateSetting("cache.ttl", parseInt(e.target.value) || 60)
                  }
                  helperText="How long to keep cached items"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.cache?.enablePreloading ?? false}
                      onChange={(e) =>
                        updateSetting(
                          "cache.enablePreloading",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Cache Preloading"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <StorageIcon />
              <Typography variant="subtitle1">Cache Strategy</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isMainEnabled}>
                  <InputLabel id="cache-strategy-label">
                    Cache Strategy
                  </InputLabel>
                  <Select
                    labelId="cache-strategy-label"
                    label="Cache Strategy"
                    value={settings.cache?.strategy || "lru"}
                    onChange={(e) =>
                      updateSetting("cache.strategy", e.target.value)
                    }
                  >
                    <MenuItem value="lru">LRU (Least Recently Used)</MenuItem>
                    <MenuItem value="lfu">LFU (Least Frequently Used)</MenuItem>
                    <MenuItem value="fifo">FIFO (First In, First Out)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cleanup Interval (minutes)"
                  value={settings.cache?.cleanupInterval || 15}
                  onChange={(e) =>
                    updateSetting(
                      "cache.cleanupInterval",
                      parseInt(e.target.value) || 15
                    )
                  }
                  helperText="How often to clean expired cache entries"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const DataRetentionConfiguration = React.memo(
  ({ settings, updateSetting, showAlert }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <StorageIcon />
              <Typography variant="subtitle1">Log Retention</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Log Retention Days"
                  value={settings.retention?.logDays || 30}
                  onChange={(e) =>
                    updateSetting(
                      "retention.logDays",
                      parseInt(e.target.value) || 30
                    )
                  }
                  helperText="How long to keep firewall logs"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Log Entries"
                  value={settings.retention?.maxLogEntries || 100000}
                  onChange={(e) =>
                    updateSetting(
                      "retention.maxLogEntries",
                      parseInt(e.target.value) || 100000
                    )
                  }
                  helperText="Maximum number of log entries to keep"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.retention?.autoCleanup ?? true}
                      onChange={(e) =>
                        updateSetting("retention.autoCleanup", e.target.checked)
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Automatic Cleanup"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <DataIcon />
              <Typography variant="subtitle1">Data Archive</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Archive After Days"
                  value={settings.retention?.archiveAfterDays || 90}
                  onChange={(e) =>
                    updateSetting(
                      "retention.archiveAfterDays",
                      parseInt(e.target.value) || 90
                    )
                  }
                  helperText="Move old data to archive after this many days"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.retention?.enableArchive ?? false}
                      onChange={(e) =>
                        updateSetting(
                          "retention.enableArchive",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Data Archiving"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.retention?.compressArchive ?? true}
                      onChange={(e) =>
                        updateSetting(
                          "retention.compressArchive",
                          e.target.checked
                        )
                      }
                      disabled={
                        !isMainEnabled || !settings.retention?.enableArchive
                      }
                    />
                  }
                  label="Compress Archive Files"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

// MEDIUM PRIORITY COMPONENTS

const RuleProcessingConfiguration = React.memo(
  ({ settings, updateSetting, showAlert }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <BuildIcon />
              <Typography variant="subtitle1">Rule Engine</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Rules Per Request"
                  value={settings.ruleProcessing?.maxRulesPerRequest || 100}
                  onChange={(e) =>
                    updateSetting(
                      "ruleProcessing.maxRulesPerRequest",
                      parseInt(e.target.value) || 100
                    )
                  }
                  helperText="Maximum rules to evaluate per request"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rule Timeout (ms)"
                  value={settings.ruleProcessing?.ruleTimeout || 1000}
                  onChange={(e) =>
                    updateSetting(
                      "ruleProcessing.ruleTimeout",
                      parseInt(e.target.value) || 1000
                    )
                  }
                  helperText="Maximum time to process all rules"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.ruleProcessing?.enableParallelProcessing ??
                        true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "ruleProcessing.enableParallelProcessing",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Parallel Rule Processing"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <TuneIcon />
              <Typography variant="subtitle1">Optimization</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isMainEnabled}>
                  <InputLabel id="priority-strategy-label">
                    Rule Priority Strategy
                  </InputLabel>
                  <Select
                    labelId="priority-strategy-label"
                    label="Rule Priority Strategy"
                    value={
                      settings.ruleProcessing?.priorityStrategy || "priority"
                    }
                    onChange={(e) =>
                      updateSetting(
                        "ruleProcessing.priorityStrategy",
                        e.target.value
                      )
                    }
                  >
                    <MenuItem value="priority">By Priority Number</MenuItem>
                    <MenuItem value="frequency">By Hit Frequency</MenuItem>
                    <MenuItem value="adaptive">Adaptive Learning</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.ruleProcessing?.enableRuleCaching ?? true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "ruleProcessing.enableRuleCaching",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Rule Result Caching"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.ruleProcessing?.earlyTermination ?? true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "ruleProcessing.earlyTermination",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Early Termination"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const AnalyticsConfiguration = React.memo(
  ({ settings, updateSetting, showAlert }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AnalyticsIcon />
              <Typography variant="subtitle1">Data Collection</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.analytics?.enableMetrics ?? true}
                      onChange={(e) =>
                        updateSetting(
                          "analytics.enableMetrics",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Metrics Collection"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Metrics Retention Days"
                  value={settings.analytics?.metricsRetentionDays || 90}
                  onChange={(e) =>
                    updateSetting(
                      "analytics.metricsRetentionDays",
                      parseInt(e.target.value) || 90
                    )
                  }
                  helperText="How long to keep analytics data"
                  disabled={
                    !isMainEnabled || !settings.analytics?.enableMetrics
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sample Rate (%)"
                  value={settings.analytics?.sampleRate || 100}
                  onChange={(e) =>
                    updateSetting(
                      "analytics.sampleRate",
                      parseInt(e.target.value) || 100
                    )
                  }
                  helperText="Percentage of requests to sample"
                  disabled={
                    !isMainEnabled || !settings.analytics?.enableMetrics
                  }
                  inputProps={{ min: 1, max: 100 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ChartIcon />
              <Typography variant="subtitle1">Reporting</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.analytics?.enableRealtimeStats ?? true}
                      onChange={(e) =>
                        updateSetting(
                          "analytics.enableRealtimeStats",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Real-time Statistics"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.analytics?.enableTrendAnalysis ?? true}
                      onChange={(e) =>
                        updateSetting(
                          "analytics.enableTrendAnalysis",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Trend Analysis"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Report Generation Interval (hours)"
                  value={settings.analytics?.reportInterval || 24}
                  onChange={(e) =>
                    updateSetting(
                      "analytics.reportInterval",
                      parseInt(e.target.value) || 24
                    )
                  }
                  helperText="How often to generate automated reports"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

// LOW PRIORITY COMPONENTS
const AdvancedRequestLimits = React.memo(
  ({ settings, updateSetting, isFeatureEnabled, getDisabledStyle }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <LimitIcon />
              <Typography variant="subtitle1">Request Size Limits</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Request Size (MB)"
                  value={settings.requestLimits?.maxRequestSize || 50}
                  onChange={(e) =>
                    updateSetting(
                      "requestLimits.maxRequestSize",
                      parseInt(e.target.value) || 50
                    )
                  }
                  helperText="Maximum size for incoming requests"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Header Size (KB)"
                  value={settings.requestLimits?.maxHeaderSize || 8}
                  onChange={(e) =>
                    updateSetting(
                      "requestLimits.maxHeaderSize",
                      parseInt(e.target.value) || 8
                    )
                  }
                  helperText="Maximum size for request headers"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max URL Length"
                  value={settings.requestLimits?.maxUrlLength || 2048}
                  onChange={(e) =>
                    updateSetting(
                      "requestLimits.maxUrlLength",
                      parseInt(e.target.value) || 2048
                    )
                  }
                  helperText="Maximum length for request URLs"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SpeedIcon />
              <Typography variant="subtitle1">Rate Limit Types</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="API Rate Limit (per minute)"
                  value={settings.requestLimits?.apiRateLimit || 60}
                  onChange={(e) =>
                    updateSetting(
                      "requestLimits.apiRateLimit",
                      parseInt(e.target.value) || 60
                    )
                  }
                  helperText="Rate limit for API endpoints"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Upload Rate Limit (per minute)"
                  value={settings.requestLimits?.uploadRateLimit || 10}
                  onChange={(e) =>
                    updateSetting(
                      "requestLimits.uploadRateLimit",
                      parseInt(e.target.value) || 10
                    )
                  }
                  helperText="Rate limit for file uploads"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Login Attempt Limit (per hour)"
                  value={settings.requestLimits?.loginAttemptLimit || 5}
                  onChange={(e) =>
                    updateSetting(
                      "requestLimits.loginAttemptLimit",
                      parseInt(e.target.value) || 5
                    )
                  }
                  helperText="Maximum login attempts per hour"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const BulkOperationsSettings = React.memo(
  ({ settings, updateSetting, showAlert }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <GroupIcon />
              <Typography variant="subtitle1">Bulk Operations</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.bulkOperations?.enableBulkActions ?? true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "bulkOperations.enableBulkActions",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Bulk Operations"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Bulk Operation Size"
                  value={settings.bulkOperations?.maxBulkSize || 1000}
                  onChange={(e) =>
                    updateSetting(
                      "bulkOperations.maxBulkSize",
                      parseInt(e.target.value) || 1000
                    )
                  }
                  helperText="Maximum items in a single bulk operation"
                  disabled={
                    !isMainEnabled ||
                    !settings.bulkOperations?.enableBulkActions
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Bulk Timeout (seconds)"
                  value={settings.bulkOperations?.bulkTimeout || 300}
                  onChange={(e) =>
                    updateSetting(
                      "bulkOperations.bulkTimeout",
                      parseInt(e.target.value) || 300
                    )
                  }
                  helperText="Maximum time for bulk operations"
                  disabled={
                    !isMainEnabled ||
                    !settings.bulkOperations?.enableBulkActions
                  }
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ScheduleIcon />
              <Typography variant="subtitle1">Batch Processing</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Batch Size"
                  value={settings.bulkOperations?.batchSize || 100}
                  onChange={(e) =>
                    updateSetting(
                      "bulkOperations.batchSize",
                      parseInt(e.target.value) || 100
                    )
                  }
                  helperText="Items processed per batch"
                  disabled={
                    !isMainEnabled ||
                    !settings.bulkOperations?.enableBulkActions
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Batch Delay (ms)"
                  value={settings.bulkOperations?.batchDelay || 100}
                  onChange={(e) =>
                    updateSetting(
                      "bulkOperations.batchDelay",
                      parseInt(e.target.value) || 100
                    )
                  }
                  helperText="Delay between batches"
                  disabled={
                    !isMainEnabled ||
                    !settings.bulkOperations?.enableBulkActions
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.bulkOperations?.enableProgressTracking ?? true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "bulkOperations.enableProgressTracking",
                          e.target.checked
                        )
                      }
                      disabled={
                        !isMainEnabled ||
                        !settings.bulkOperations?.enableBulkActions
                      }
                    />
                  }
                  label="Enable Progress Tracking"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const TimeWindowConfiguration = React.memo(
  ({ settings, updateSetting, showAlert }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AccessTimeIcon />
              <Typography variant="subtitle1">Time Windows</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Analysis Window (minutes)"
                  value={settings.timeWindows?.analysisWindow || 60}
                  onChange={(e) =>
                    updateSetting(
                      "timeWindows.analysisWindow",
                      parseInt(e.target.value) || 60
                    )
                  }
                  helperText="Time window for threat analysis"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Rate Limit Window (minutes)"
                  value={settings.timeWindows?.rateLimitWindow || 1}
                  onChange={(e) =>
                    updateSetting(
                      "timeWindows.rateLimitWindow",
                      parseInt(e.target.value) || 1
                    )
                  }
                  helperText="Time window for rate limiting calculations"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Block Duration (minutes)"
                  value={settings.timeWindows?.blockDuration || 60}
                  onChange={(e) =>
                    updateSetting(
                      "timeWindows.blockDuration",
                      parseInt(e.target.value) || 60
                    )
                  }
                  helperText="How long to block detected threats"
                  disabled={!isMainEnabled}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ScheduleIcon />
              <Typography variant="subtitle1">Scheduling</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isMainEnabled}>
                  <InputLabel id="maintenance-window-label">
                    Maintenance Window
                  </InputLabel>
                  <Select
                    labelId="maintenance-window-label"
                    label="Maintenance Window"
                    value={settings.timeWindows?.maintenanceWindow || "02:00"}
                    onChange={(e) =>
                      updateSetting(
                        "timeWindows.maintenanceWindow",
                        e.target.value
                      )
                    }
                  >
                    <MenuItem value="00:00">12:00 AM</MenuItem>
                    <MenuItem value="01:00">1:00 AM</MenuItem>
                    <MenuItem value="02:00">2:00 AM</MenuItem>
                    <MenuItem value="03:00">3:00 AM</MenuItem>
                    <MenuItem value="04:00">4:00 AM</MenuItem>
                    <MenuItem value="05:00">5:00 AM</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Cleanup Interval (hours)"
                  value={settings.timeWindows?.cleanupInterval || 24}
                  onChange={(e) =>
                    updateSetting(
                      "timeWindows.cleanupInterval",
                      parseInt(e.target.value) || 24
                    )
                  }
                  helperText="How often to run cleanup tasks"
                  disabled={!isMainEnabled}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.timeWindows?.enableScheduledTasks ?? true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "timeWindows.enableScheduledTasks",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Scheduled Tasks"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

// MISSING SETTINGS COMPONENTS - Matching Database Structure
const AnalyticsSettings = React.memo(
  ({ settings, updateSetting, showAlert }) => {
    const { isMainEnabled } = useMasterSwitch();

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AnalyticsIcon />
              <Typography variant="subtitle1">
                Sparkline Configuration
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sparkline Time Range (days)"
                  value={settings.analytics?.sparklineTimeRange || 30}
                  onChange={(e) =>
                    updateSetting(
                      "analytics.sparklineTimeRange",
                      parseInt(e.target.value) || 30
                    )
                  }
                  helperText="Time range for sparkline charts"
                  disabled={!isMainEnabled}
                  inputProps={{ min: 7, max: 90 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!isMainEnabled}>
                  <InputLabel id="update-frequency-label">
                    Update Frequency
                  </InputLabel>
                  <Select
                    labelId="update-frequency-label"
                    label="Update Frequency"
                    value={settings.analytics?.updateFrequency || "periodic"}
                    onChange={(e) =>
                      updateSetting("analytics.updateFrequency", e.target.value)
                    }
                  >
                    <MenuItem value="real-time">Real-time</MenuItem>
                    <MenuItem value="periodic">Periodic</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Periodic Interval (seconds)"
                  value={settings.analytics?.periodicInterval || 300}
                  onChange={(e) =>
                    updateSetting(
                      "analytics.periodicInterval",
                      parseInt(e.target.value) || 300
                    )
                  }
                  helperText="Update interval for periodic mode"
                  disabled={
                    !isMainEnabled ||
                    settings.analytics?.updateFrequency === "real-time"
                  }
                  inputProps={{ min: 60, max: 3600 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <StorageIcon />
              <Typography variant="subtitle1">Analytics Data</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.analytics?.enableSparklines ?? true}
                      onChange={(e) =>
                        updateSetting(
                          "analytics.enableSparklines",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Sparklines"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Retention Days"
                  value={settings.analytics?.retentionDays || 90}
                  onChange={(e) =>
                    updateSetting(
                      "analytics.retentionDays",
                      parseInt(e.target.value) || 90
                    )
                  }
                  helperText="How long to keep analytics data"
                  disabled={!isMainEnabled}
                  inputProps={{ min: 30, max: 365 }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const ResponsesConfiguration = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ErrorIcon />
            <Typography variant="subtitle1">Blocked Requests</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Status Code"
                value={settings.responses?.blocked?.statusCode || 403}
                onChange={(e) =>
                  updateSetting(
                    "responses.blocked.statusCode",
                    parseInt(e.target.value) || 403
                  )
                }
                helperText="HTTP status code for blocked requests"
                disabled={!isMainEnabled}
                inputProps={{ min: 400, max: 599 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Response Message"
                value={
                  settings.responses?.blocked?.message ||
                  "Request blocked by firewall rules"
                }
                onChange={(e) =>
                  updateSetting("responses.blocked.message", e.target.value)
                }
                helperText="Message shown when request is blocked"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.responses?.blocked?.includeDetails ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "responses.blocked.includeDetails",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Include Block Details"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SpeedIcon />
            <Typography variant="subtitle1">Rate Limited Requests</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Status Code"
                value={settings.responses?.rateLimited?.statusCode || 429}
                onChange={(e) =>
                  updateSetting(
                    "responses.rateLimited.statusCode",
                    parseInt(e.target.value) || 429
                  )
                }
                helperText="HTTP status code for rate limited requests"
                disabled={!isMainEnabled}
                inputProps={{ min: 400, max: 599 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Response Message"
                value={
                  settings.responses?.rateLimited?.message ||
                  "Too many requests"
                }
                onChange={(e) =>
                  updateSetting("responses.rateLimited.message", e.target.value)
                }
                helperText="Message shown when rate limited"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.responses?.rateLimited?.includeRetryAfter ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "responses.rateLimited.includeRetryAfter",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Include Retry-After Header"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const AdminSettingsConfiguration = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AdminIcon />
            <Typography variant="subtitle1">
              Admin Emergency Settings
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Delay Reduction Factor"
                value={settings.adminSettings?.delayReductionFactor || 0.1}
                onChange={(e) =>
                  updateSetting(
                    "adminSettings.delayReductionFactor",
                    parseFloat(e.target.value) || 0.1
                  )
                }
                helperText="Factor to reduce delays for admins"
                disabled={!isMainEnabled}
                inputProps={{ min: 0.1, max: 1.0, step: 0.1 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Emergency Delay (ms)"
                value={settings.adminSettings?.emergencyDelayMs || 5000}
                onChange={(e) =>
                  updateSetting(
                    "adminSettings.emergencyDelayMs",
                    parseInt(e.target.value) || 5000
                  )
                }
                helperText="Delay for emergency situations"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Emergency Window (ms)"
                value={settings.adminSettings?.emergencyWindowMs || 30000}
                onChange={(e) =>
                  updateSetting(
                    "adminSettings.emergencyWindowMs",
                    parseInt(e.target.value) || 30000
                  )
                }
                helperText="Time window for emergency detection"
                disabled={!isMainEnabled}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const MetricsLimitsConfiguration = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ChartIcon />
            <Typography variant="subtitle1">
              Metrics Collection Limits
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Countries"
                value={settings.metricsLimits?.maxCountries || 10}
                onChange={(e) =>
                  updateSetting(
                    "metricsLimits.maxCountries",
                    parseInt(e.target.value) || 10
                  )
                }
                helperText="Maximum countries to track in metrics"
                disabled={!isMainEnabled}
                inputProps={{ min: 5, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max User Agents"
                value={settings.metricsLimits?.maxUserAgents || 10}
                onChange={(e) =>
                  updateSetting(
                    "metricsLimits.maxUserAgents",
                    parseInt(e.target.value) || 10
                  )
                }
                helperText="Maximum user agents to track in metrics"
                disabled={!isMainEnabled}
                inputProps={{ min: 5, max: 50 }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const MonitoringConfiguration = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <MonitorIcon />
            <Typography variant="subtitle1">Real-time Monitoring</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.monitoring?.enableRealTimeAlerts ?? false}
                    onChange={(e) =>
                      updateSetting(
                        "monitoring.enableRealTimeAlerts",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Real-time Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Alert Threshold"
                value={settings.monitoring?.alertThreshold || 10}
                onChange={(e) =>
                  updateSetting(
                    "monitoring.alertThreshold",
                    parseInt(e.target.value) || 10
                  )
                }
                helperText="Trigger alerts when blocks exceed threshold per hour"
                disabled={
                  !isMainEnabled || !settings.monitoring?.enableRealTimeAlerts
                }
                inputProps={{ min: 10, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Alert Email"
                value={settings.monitoring?.alertEmail || ""}
                onChange={(e) =>
                  updateSetting("monitoring.alertEmail", e.target.value)
                }
                helperText="Primary email for alerts"
                disabled={
                  !isMainEnabled || !settings.monitoring?.enableRealTimeAlerts
                }
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SpeedIcon />
            <Typography variant="subtitle1">Performance Monitoring</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.monitoring?.enablePerformanceMonitoring ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "monitoring.enablePerformanceMonitoring",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Performance Monitoring"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.monitoring?.logSlowQueries ?? false}
                    onChange={(e) =>
                      updateSetting(
                        "monitoring.logSlowQueries",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.monitoring?.enablePerformanceMonitoring
                    }
                  />
                }
                label="Log Slow Queries"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Slow Query Threshold (ms)"
                value={settings.monitoring?.slowQueryThreshold || 1000}
                onChange={(e) =>
                  updateSetting(
                    "monitoring.slowQueryThreshold",
                    parseInt(e.target.value) || 1000
                  )
                }
                helperText="Log queries slower than this threshold"
                disabled={
                  !isMainEnabled || !settings.monitoring?.logSlowQueries
                }
                inputProps={{ min: 100, max: 5000 }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const DataRetentionSettings = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <StorageIcon />
            <Typography variant="subtitle1">Data Retention</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Log Retention Days"
                value={settings.dataRetention?.logRetentionDays || 90}
                onChange={(e) =>
                  updateSetting(
                    "dataRetention.logRetentionDays",
                    parseInt(e.target.value) || 90
                  )
                }
                helperText="How long to keep firewall logs"
                disabled={!isMainEnabled}
                inputProps={{ min: 7, max: 365 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Metrics Retention Days"
                value={settings.dataRetention?.metricsRetentionDays || 90}
                onChange={(e) =>
                  updateSetting(
                    "dataRetention.metricsRetentionDays",
                    parseInt(e.target.value) || 90
                  )
                }
                helperText="How long to keep metrics data"
                disabled={!isMainEnabled}
                inputProps={{ min: 30, max: 365 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Blocked IP Retention Days"
                value={settings.dataRetention?.blockedIpRetentionDays || 30}
                onChange={(e) =>
                  updateSetting(
                    "dataRetention.blockedIpRetentionDays",
                    parseInt(e.target.value) || 30
                  )
                }
                helperText="How long to keep blocked IP records"
                disabled={!isMainEnabled}
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ClearAllIcon />
            <Typography variant="subtitle1">Cleanup Settings</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.dataRetention?.autoCleanup ?? true}
                    onChange={(e) =>
                      updateSetting(
                        "dataRetention.autoCleanup",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Auto Cleanup"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl
                fullWidth
                disabled={
                  !isMainEnabled || !settings.dataRetention?.autoCleanup
                }
              >
                <InputLabel id="cleanup-frequency-label">
                  Cleanup Frequency
                </InputLabel>
                <Select
                  labelId="cleanup-frequency-label"
                  label="Cleanup Frequency"
                  value={settings.dataRetention?.cleanupFrequency || "daily"}
                  onChange={(e) =>
                    updateSetting(
                      "dataRetention.cleanupFrequency",
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const PreferencesConfiguration = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SettingsIcon />
            <Typography variant="subtitle1">UI Preferences</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences?.autoRefresh ?? false}
                    onChange={(e) =>
                      updateSetting("preferences.autoRefresh", e.target.checked)
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Auto Refresh Data"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Auto Refresh Interval (seconds)"
                value={settings.preferences?.autoRefreshInterval || 30}
                onChange={(e) =>
                  updateSetting(
                    "preferences.autoRefreshInterval",
                    parseInt(e.target.value) || 30
                  )
                }
                helperText="How often to auto refresh data"
                disabled={!isMainEnabled || !settings.preferences?.autoRefresh}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Default Page Size"
                value={settings.preferences?.defaultPageSize || 10}
                onChange={(e) =>
                  updateSetting(
                    "preferences.defaultPageSize",
                    parseInt(e.target.value) || 10
                  )
                }
                helperText="Default number of items per page"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!isMainEnabled}>
                <InputLabel id="theme-label">Theme</InputLabel>
                <Select
                  labelId="theme-label"
                  label="Theme"
                  value={settings.preferences?.theme || "auto"}
                  onChange={(e) =>
                    updateSetting("preferences.theme", e.target.value)
                  }
                >
                  <MenuItem value="auto">Auto</MenuItem>
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TuneIcon />
            <Typography variant="subtitle1">Advanced Preferences</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences?.compactMode ?? false}
                    onChange={(e) =>
                      updateSetting("preferences.compactMode", e.target.checked)
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Compact Mode"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences?.showAdvancedOptions ?? false}
                    onChange={(e) =>
                      updateSetting(
                        "preferences.showAdvancedOptions",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Show Advanced Options"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences?.enableAnimations ?? true}
                    onChange={(e) =>
                      updateSetting(
                        "preferences.enableAnimations",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Animations"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences?.showNotifications ?? true}
                    onChange={(e) =>
                      updateSetting(
                        "preferences.showNotifications",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Show Notifications"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const ThreatIntelligenceSettings = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SecurityIcon />
            <Typography variant="subtitle1">AbuseIPDB Integration</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={settings.threatIntelligence?.abuseIPDB?.apiKey || ""}
                onChange={(e) =>
                  updateSetting(
                    "threatIntelligence.abuseIPDB.apiKey",
                    e.target.value
                  )
                }
                helperText="AbuseIPDB API key for threat intelligence"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.threatIntelligence?.abuseIPDB?.enabled ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "threatIntelligence.abuseIPDB.enabled",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable AbuseIPDB Integration"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SecurityIcon />
            <Typography variant="subtitle1">VirusTotal Integration</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={settings.threatIntelligence?.virusTotal?.apiKey || ""}
                onChange={(e) =>
                  updateSetting(
                    "threatIntelligence.virusTotal.apiKey",
                    e.target.value
                  )
                }
                helperText="VirusTotal API key for threat intelligence"
                disabled={!isMainEnabled}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.threatIntelligence?.virusTotal?.enabled ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "threatIntelligence.virusTotal.enabled",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable VirusTotal Integration"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 2, height: "100%", width: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SyncIcon />
            <Typography variant="subtitle1">Feed Management</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.threatIntelligence?.autoImportFeeds ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "threatIntelligence.autoImportFeeds",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Auto Import Threat Feeds"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Feed Update Interval (hours)"
                value={settings.threatIntelligence?.feedUpdateInterval || 24}
                onChange={(e) =>
                  updateSetting(
                    "threatIntelligence.feedUpdateInterval",
                    parseInt(e.target.value) || 24
                  )
                }
                helperText="How often to update threat feeds"
                disabled={
                  !isMainEnabled ||
                  !settings.threatIntelligence?.autoImportFeeds
                }
                inputProps={{ min: 1, max: 168 }}
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const FirewallAdminSettings = ({
  initialSettings,
  savingSettings,
  saveSettings,
  showAlert, // Keep for backward compatibility
  defaultSettings,
  rules,
  onTestBypass,
  onTestRule,
  testing,
  fetchRules,
  fetchLogs,
  isFeatureEnabled,
  getDisabledStyle,
  logCount: centralLogCount,
}) => {
  // Use snackbar hook
  const { showSnackbar } = useFirewallSnackbar();
  const [settings, setSettings] = useState(initialSettings);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
    setHasUnsavedChanges(false); // Clear unsaved changes when initial settings change
  }, [initialSettings]);

  const confirmReset = () => {
    setSettings(defaultSettings);
    setHasUnsavedChanges(true); // Mark as having unsaved changes after reset
    setShowResetDialog(false);
    showSnackbar(
      "Settings have been reset to default values. Click 'Save Settings' to apply changes.",
      "info"
    );
  };

  const updateSetting = useCallback(
    (path, value) => {
      setSettings((prev) => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        const keys = path.split(".");
        let current = newSettings;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (current[key] === undefined) current[key] = {};
          current = current[key];
        }
        current[keys[keys.length - 1]] = value;
        return newSettings;
      });
      setHasUnsavedChanges(true); // Mark as having unsaved changes when settings are updated
    },
    [setSettings]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await saveSettings(settings);
      if (result && result.success) {
        setHasUnsavedChanges(false); // Clear unsaved changes flag only after successful save
        showSnackbar(
          result.message || "Settings saved successfully",
          "success"
        );
      } else {
        showSnackbar(result?.message || "Failed to save settings", "error");
      }
    } catch (error) {
      showSnackbar(`Error saving settings: ${error.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MasterSwitchProvider
      settings={settings}
      hasUnsavedChanges={hasUnsavedChanges}
    >
      <Typography variant="h5" sx={{ mb: 3 }}>
        Firewall Settings
      </Typography>

      {hasUnsavedChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Click "Save Settings" to apply them.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="General Configuration" icon={<SettingsIcon />}>
            <GeneralConfiguration
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Security & Performance" icon={<SecurityIcon />}>
            <SecurityPerformanceSettings
              settings={settings}
              updateSetting={updateSetting}
              isFeatureEnabled={isFeatureEnabled}
              getDisabledStyle={getDisabledStyle}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="System Configuration" icon={<TuneIcon />}>
            <SystemConfiguration
              settings={settings}
              updateSetting={updateSetting}
              isFeatureEnabled={isFeatureEnabled}
              getDisabledStyle={getDisabledStyle}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Email Reports" icon={<AnalyticsIcon />}>
            <EmailReports
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showSnackbar}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard
            title="User Experience & Notifications"
            icon={<UserExperienceIcon />}
          >
            <UserExperienceSettings
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showSnackbar}
              isFeatureEnabled={isFeatureEnabled}
              getDisabledStyle={getDisabledStyle}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Firewall Testing Suite" icon={<TuneIcon />}>
            <FirewallTestingSuite
              onTestBypass={onTestBypass}
              onTestRule={onTestRule}
              testing={testing}
              rules={rules}
              showAlert={showSnackbar}
              fetchRules={fetchRules}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Cache Management" icon={<RefreshIcon />}>
            <CacheManagement
              showAlert={showSnackbar}
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Log Management" icon={<ClearAllIcon />}>
            <LogManagement
              showAlert={showSnackbar}
              fetchLogs={fetchLogs}
              centralLogCount={centralLogCount}
            />
          </SectionCard>
        </Grid>

        {/* ADDITIONAL REQUIRED SETTINGS - Matching Database Structure */}
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Analytics Settings" icon={<AnalyticsIcon />}>
            <AnalyticsSettings
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showSnackbar}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Response Configuration" icon={<ErrorIcon />}>
            <ResponsesConfiguration
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Admin Settings" icon={<AdminIcon />}>
            <AdminSettingsConfiguration
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Metrics Limits" icon={<ChartIcon />}>
            <MetricsLimitsConfiguration
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Monitoring" icon={<MonitorIcon />}>
            <MonitoringConfiguration
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Data Retention" icon={<StorageIcon />}>
            <DataRetentionSettings
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Threat Intelligence" icon={<SecurityIcon />}>
            <ThreatIntelligenceSettings
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Preferences" icon={<SettingsIcon />}>
            <PreferencesConfiguration
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>

        {/* MEDIUM PRIORITY SECTIONS */}
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard
            title="Rule Processing Configuration"
            icon={<BuildIcon />}
          >
            <RuleProcessingConfiguration
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showSnackbar}
            />
          </SectionCard>
        </Grid>

        {/* LOW PRIORITY SECTIONS */}
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard title="Advanced Request Limits" icon={<LimitIcon />}>
            <AdvancedRequestLimits
              settings={settings}
              updateSetting={updateSetting}
              isFeatureEnabled={isFeatureEnabled}
              getDisabledStyle={getDisabledStyle}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12} sx={{ display: "flex" }}>
          <SectionCard
            title="Time Window Configuration"
            icon={<AccessTimeIcon />}
          >
            <TimeWindowConfiguration
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showSnackbar}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowResetDialog(true)}
              disabled={isSaving || savingSettings}
              startIcon={<RestoreIcon />}
              size="large"
              color="warning"
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving || savingSettings}
              startIcon={
                isSaving || savingSettings ? (
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
              {isSaving || savingSettings
                ? "Saving..."
                : hasUnsavedChanges
                ? "Save Settings"
                : "No Changes to Save"}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Dialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        aria-labelledby="reset-settings-dialog-title"
      >
        <DialogTitle id="reset-settings-dialog-title">
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
            onClick={confirmReset}
            color="warning"
            variant="contained"
            autoFocus
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </MasterSwitchProvider>
  );
};

export default FirewallAdminSettings;
