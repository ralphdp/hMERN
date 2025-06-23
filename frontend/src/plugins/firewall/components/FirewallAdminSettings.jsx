import React, { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";
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
} from "@mui/icons-material";

// Memoized sub-component for a generic settings card to prevent re-renders
const SectionCard = React.memo(({ title, icon, children }) => {
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {icon}
            <Typography variant="h6">{title}</Typography>
          </Box>
        }
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
});

const SecurityPerformanceSettings = React.memo(
  ({ settings, updateSetting }) => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
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
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
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
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                    />
                  </Grid>
                )
              )}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: "100%" }}>
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
                  />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const SystemConfiguration = React.memo(({ settings, updateSetting }) => {
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

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ProxyIcon />
            <Typography variant="subtitle1">Trusted Proxies</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            CDN/Proxy IPs for accurate client IP detection via X-Forwarded-For.
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Enter proxy IP address"
              value={newTrustedProxy}
              onChange={(e) => setNewTrustedProxy(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTrustedProxy()}
            />
            <Button
              variant="outlined"
              onClick={addTrustedProxy}
              startIcon={<AddIcon />}
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
        <Paper sx={{ p: 2, height: "100%" }}>
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
            />
            <Button
              variant="outlined"
              onClick={addLocalNetwork}
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          </Box>
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
        <Paper sx={{ p: 2, height: "100%" }}>
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
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.securityThresholds?.enableReDoSProtection ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "securityThresholds.enableReDoSProtection",
                        e.target.checked
                      )
                    }
                  />
                }
                label="Enable ReDoS Protection"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                      updateSetting("autoBlocking.enabled", e.target.checked)
                    }
                  />
                }
                label="Enable Auto-Blocking for excessive rate limit violations"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

const UserExperienceSettings = React.memo(
  ({ settings, updateSetting, showAlert }) => {
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
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
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
                          disabled={!settings.monitoring?.enableRealTimeAlerts}
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
      console.error("Error sending preview report:", error);
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
        <Paper sx={{ p: 2, height: "100%" }}>
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
                  disabled={!settings.emailReports?.enabled}
                />
                <Button
                  variant="outlined"
                  onClick={addReportEmail}
                  startIcon={<AddIcon />}
                  disabled={!settings.emailReports?.enabled}
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
                        disabled={!settings.emailReports?.enabled}
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
              <FormControl fullWidth disabled={!settings.emailReports?.enabled}>
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
                disabled={!settings.emailReports?.enabled}
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
                    disabled={!settings.emailReports?.enabled}
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
                    disabled={!settings.emailReports?.enabled}
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
                    disabled={!settings.emailReports?.enabled}
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
                    disabled={!settings.emailReports?.enabled}
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
                    disabled={!settings.emailReports?.enabled}
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
            <Typography variant="subtitle1">Preview & Testing</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Send a preview report with current data to test your email
            configuration.
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
            disabled={sendingPreview || reportEmails.length === 0}
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

const LogManagement = React.memo(({ showAlert }) => {
  const [deletingLogs, setDeletingLogs] = useState(false);
  const [showDeleteLogsDialog, setShowDeleteLogsDialog] = useState(false);

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
      } else {
        showAlert(data.message || "Failed to delete firewall logs", "error");
      }
    } catch (error) {
      console.error("Error deleting firewall logs:", error);
      showAlert("Network error while deleting firewall logs", "error");
    } finally {
      setDeletingLogs(false);
    }
  };

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <ClearAllIcon />
              <Typography variant="subtitle1">Log Management</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Delete all firewall logs to free up storage space. This action is
              permanent and cannot be undone.
            </Typography>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Warning:</strong> This will permanently delete all
                firewall logs including attack records, traffic data, and
                historical security information.
              </Typography>
            </Alert>

            <Button
              variant="outlined"
              color="error"
              onClick={() => setShowDeleteLogsDialog(true)}
              disabled={deletingLogs}
              startIcon={
                deletingLogs ? <CircularProgress size={20} /> : <ClearAllIcon />
              }
              size="large"
            >
              {deletingLogs ? "Deleting Logs..." : "Delete All Logs"}
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
            Are you sure you want to delete <strong>ALL</strong> firewall logs?
            This action will permanently remove:
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
});

const FirewallTestingSuite = React.memo(
  ({ onTestBypass, onTestRule, testing, rules, showAlert, fetchRules }) => {
    const [addingXssRule, setAddingXssRule] = useState(false);

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
        console.error("Error adding XSS rule:", error);
        showAlert("Network error while adding XSS rule", "error");
      } finally {
        setAddingXssRule(false);
      }
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
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
              onClick={onTestBypass}
              disabled={testing}
              startIcon={
                testing ? <CircularProgress size={20} /> : <ScienceIcon />
              }
            >
              Test Localhost Bypass
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
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
                  disabled={addingXssRule}
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
                onClick={onTestRule}
                disabled={testing || !hasXssRule}
                startIcon={
                  testing ? <CircularProgress size={20} /> : <ScienceIcon />
                }
              >
                Run Live Attack Simulation
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

const FirewallAdminSettings = ({
  initialSettings,
  savingSettings,
  saveSettings,
  showAlert,
  defaultSettings,
  rules,
  onTestBypass,
  onTestRule,
  testing,
  fetchRules,
}) => {
  const [settings, setSettings] = useState(initialSettings);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const confirmReset = () => {
    setSettings(defaultSettings);
    setShowResetDialog(false);
    showAlert("Settings have been reset to default values", "success");
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
    },
    [setSettings]
  );

  const handleSave = () => {
    saveSettings(settings);
  };

  return (
    <>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Firewall Settings
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> These are global settings that control the
          firewall's behavior. Individual rules may override some of these
          settings for specific patterns.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SectionCard title="Security & Performance" icon={<SecurityIcon />}>
            <SecurityPerformanceSettings
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <SectionCard title="System Configuration" icon={<TuneIcon />}>
            <SystemConfiguration
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <SectionCard
            title="User Experience & Notifications"
            icon={<UserExperienceIcon />}
          >
            <UserExperienceSettings
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showAlert}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <SectionCard title="Email Reports" icon={<AnalyticsIcon />}>
            <EmailReports
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showAlert}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <SectionCard title="Firewall Testing Suite" icon={<TuneIcon />}>
            <FirewallTestingSuite
              onTestBypass={onTestBypass}
              onTestRule={onTestRule}
              testing={testing}
              rules={rules}
              showAlert={showAlert}
              fetchRules={fetchRules}
            />
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <SectionCard title="Log Management" icon={<ClearAllIcon />}>
            <LogManagement showAlert={showAlert} />
          </SectionCard>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowResetDialog(true)}
              disabled={savingSettings}
              startIcon={<RestoreIcon />}
              size="large"
              color="warning"
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={savingSettings}
              startIcon={
                savingSettings ? (
                  <CircularProgress size={20} />
                ) : (
                  <SettingsIcon />
                )
              }
              size="large"
            >
              {savingSettings ? "Saving..." : "Save Settings"}
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
    </>
  );
};

export default FirewallAdminSettings;
