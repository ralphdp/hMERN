import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Shield as ShieldIcon,
  Visibility as EyeIcon,
  Block as BanIcon,
  Public as GlobeIcon,
  BarChart as ChartIcon,
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as TrashIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const FirewallAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [rules, setRules] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "success",
  });
  const [activeTab, setActiveTab] = useState(0);

  // Form states
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "ip_block",
    value: "",
    action: "block",
    enabled: true,
    priority: 100,
    description: "",
  });

  const [blockForm, setBlockForm] = useState({
    ip: "",
    reason: "",
    permanent: false,
    expiresIn: 3600,
  });

  // Fetch data functions
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/firewall/stats", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch("/api/firewall/rules", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data.data);
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      const response = await fetch("/api/firewall/blocked-ips", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setBlockedIPs(data.data);
      }
    } catch (error) {
      console.error("Error fetching blocked IPs:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/firewall/logs?limit=100", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRules(),
      fetchBlockedIPs(),
      fetchLogs(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });
    setTimeout(
      () => setAlert({ show: false, message: "", severity: "success" }),
      5000
    );
  };

  // Rule management
  const handleSaveRule = async () => {
    try {
      const url = selectedRule
        ? `/api/firewall/rules/${selectedRule._id}`
        : "/api/firewall/rules";
      const method = selectedRule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(ruleForm),
      });

      if (response.ok) {
        showAlert(`Rule ${selectedRule ? "updated" : "created"} successfully!`);
        setShowRuleModal(false);
        setSelectedRule(null);
        setRuleForm({
          name: "",
          type: "ip_block",
          value: "",
          action: "block",
          enabled: true,
          priority: 100,
          description: "",
        });
        fetchRules();
      } else {
        const error = await response.json();
        showAlert(error.message || "Error saving rule", "error");
      }
    } catch (error) {
      showAlert("Error saving rule", "error");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    try {
      const response = await fetch(`/api/firewall/rules/${ruleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        showAlert("Rule deleted successfully!");
        fetchRules();
      } else {
        showAlert("Error deleting rule", "error");
      }
    } catch (error) {
      showAlert("Error deleting rule", "error");
    }
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setRuleForm({
      name: rule.name,
      type: rule.type,
      value: rule.value,
      action: rule.action,
      enabled: rule.enabled,
      priority: rule.priority,
      description: rule.description || "",
    });
    setShowRuleModal(true);
  };

  // IP blocking
  const handleBlockIP = async () => {
    try {
      const response = await fetch("/api/firewall/blocked-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(blockForm),
      });

      if (response.ok) {
        showAlert("IP blocked successfully!");
        setShowBlockModal(false);
        setBlockForm({
          ip: "",
          reason: "",
          permanent: false,
          expiresIn: 3600,
        });
        fetchBlockedIPs();
      } else {
        const error = await response.json();
        showAlert(error.message || "Error blocking IP", "error");
      }
    } catch (error) {
      showAlert("Error blocking IP", "error");
    }
  };

  const handleUnblockIP = async (ipId) => {
    if (!window.confirm("Are you sure you want to unblock this IP?")) return;

    try {
      const response = await fetch(`/api/firewall/blocked-ips/${ipId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        showAlert("IP unblocked successfully!");
        fetchBlockedIPs();
      } else {
        showAlert("Error unblocking IP", "error");
      }
    } catch (error) {
      showAlert("Error unblocking IP", "error");
    }
  };

  // Utility functions
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getActionChip = (action) => {
    const colors = {
      allowed: "success",
      blocked: "error",
      rate_limited: "warning",
      suspicious: "warning",
    };
    return (
      <Chip label={action} color={colors[action] || "default"} size="small" />
    );
  };

  const getRuleTypeChip = (type) => {
    const colors = {
      ip_block: "error",
      country_block: "warning",
      rate_limit: "info",
      suspicious_pattern: "secondary",
    };
    return (
      <Chip
        label={type.replace("_", " ")}
        color={colors[type] || "default"}
        size="small"
      />
    );
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading firewall dashboard...</Typography>
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
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <ShieldIcon sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h4">Firewall Administration</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Refresh Data
        </Button>
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

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab icon={<ChartIcon />} label="Dashboard" />
          <Tab icon={<ShieldIcon />} label={`Rules (${rules.length})`} />
          <Tab
            icon={<BanIcon />}
            label={`Blocked IPs (${blockedIPs.length})`}
          />
          <Tab icon={<EyeIcon />} label={`Logs (${logs.length})`} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h3" color="primary">
                  {stats.rules?.total || 0}
                </Typography>
                <Typography variant="body1">Total Rules</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.rules?.active || 0} active
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h3" color="error">
                  {stats.blockedIPs?.total || 0}
                </Typography>
                <Typography variant="body1">Blocked IPs</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.blockedIPs?.permanent || 0} permanent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h3" color="success.main">
                  {stats.requests?.last24h?.allowed || 0}
                </Typography>
                <Typography variant="body1">Allowed (24h)</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total: {stats.requests?.last24h?.total || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: "center" }}>
                <Typography variant="h3" color="warning.main">
                  {stats.requests?.last24h?.blocked || 0}
                </Typography>
                <Typography variant="body1">Blocked (24h)</Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 7d: {stats.requests?.last7d || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Top Blocked Countries & IPs */}
        {stats.topBlockedCountries?.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <GlobeIcon sx={{ mr: 1 }} />
                      Top Blocked Countries
                    </Box>
                  }
                />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Country</TableCell>
                          <TableCell>Blocks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.topBlockedCountries
                          .slice(0, 5)
                          .map((country, index) => (
                            <TableRow key={index}>
                              <TableCell>{country._id || "Unknown"}</TableCell>
                              <TableCell>
                                <Chip
                                  label={country.count}
                                  color="error"
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BanIcon sx={{ mr: 1 }} />
                      Top Blocked IPs
                    </Box>
                  }
                />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>IP Address</TableCell>
                          <TableCell>Blocks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.topBlockedIPs?.slice(0, 5).map((ip, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography variant="body2" component="code">
                                {ip._id}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={ip.count}
                                color="error"
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Rules Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5">Firewall Rules</Typography>
          <Button
            variant="contained"
            startIcon={<PlusIcon />}
            onClick={() => setShowRuleModal(true)}
          >
            Add Rule
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{getRuleTypeChip(rule.type)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" component="code">
                      {rule.value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.action}
                      color={rule.action === "block" ? "error" : "success"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.enabled ? "Enabled" : "Disabled"}
                      color={rule.enabled ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(rule.createdAt)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRule(rule)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRule(rule._id)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Blocked IPs Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5">Blocked IP Addresses</Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<BanIcon />}
            onClick={() => setShowBlockModal(true)}
          >
            Block IP
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>IP Address</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Blocked At</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blockedIPs.map((ip) => (
                <TableRow key={ip._id}>
                  <TableCell>
                    <Typography variant="body2" component="code">
                      {ip.ip}
                    </Typography>
                  </TableCell>
                  <TableCell>{ip.country || "Unknown"}</TableCell>
                  <TableCell>{ip.reason}</TableCell>
                  <TableCell>
                    <Chip
                      label={ip.permanent ? "Permanent" : "Temporary"}
                      color={ip.permanent ? "error" : "warning"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(ip.blockedAt)}</TableCell>
                  <TableCell>
                    {ip.expiresAt ? formatDate(ip.expiresAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <Chip label={ip.attempts} color="info" size="small" />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => handleUnblockIP(ip._id)}
                    >
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Logs Tab */}
      <TabPanel value={activeTab} index={3}>
        <Card>
          <CardHeader title="Recent Firewall Activity" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Rule</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>User Agent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(log.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="code">
                          {log.ip}
                        </Typography>
                      </TableCell>
                      <TableCell>{log.country || "Unknown"}</TableCell>
                      <TableCell>{getActionChip(log.action)}</TableCell>
                      <TableCell>{log.rule || "-"}</TableCell>
                      <TableCell>
                        <Chip label={log.method} color="default" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.url}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {log.userAgent
                            ? log.userAgent.substring(0, 50) + "..."
                            : "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Rule Modal */}
      <Dialog
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rule Name"
                value={ruleForm.name}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={ruleForm.type}
                  label="Rule Type"
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, type: e.target.value })
                  }
                >
                  <MenuItem value="ip_block">IP Block</MenuItem>
                  <MenuItem value="country_block">Country Block</MenuItem>
                  <MenuItem value="rate_limit">Rate Limit</MenuItem>
                  <MenuItem value="suspicious_pattern">
                    Suspicious Pattern
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Value"
                value={ruleForm.value}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, value: e.target.value })
                }
                placeholder="IP address, country code, or pattern"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Priority"
                value={ruleForm.priority}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    priority: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={ruleForm.action}
                  label="Action"
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, action: e.target.value })
                  }
                >
                  <MenuItem value="block">Block</MenuItem>
                  <MenuItem value="allow">Allow</MenuItem>
                  <MenuItem value="rate_limit">Rate Limit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.enabled}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, enabled: e.target.checked })
                    }
                  />
                }
                label="Enabled"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={ruleForm.description}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRuleModal(false)}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained">
            {selectedRule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block IP Modal */}
      <Dialog
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Block IP Address</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IP Address"
                value={blockForm.ip}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, ip: e.target.value })
                }
                placeholder="192.168.1.1"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                value={blockForm.reason}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, reason: e.target.value })
                }
                placeholder="Reason for blocking"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={blockForm.permanent}
                    onChange={(e) =>
                      setBlockForm({
                        ...blockForm,
                        permanent: e.target.checked,
                      })
                    }
                  />
                }
                label="Permanent Block"
              />
            </Grid>
            {!blockForm.permanent && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expires In (seconds)"
                  value={blockForm.expiresIn}
                  onChange={(e) =>
                    setBlockForm({
                      ...blockForm,
                      expiresIn: parseInt(e.target.value),
                    })
                  }
                  inputProps={{ min: 60 }}
                  helperText="Default: 3600 seconds (1 hour)"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBlockModal(false)}>Cancel</Button>
          <Button onClick={handleBlockIP} variant="contained" color="error">
            Block IP
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FirewallAdmin;
