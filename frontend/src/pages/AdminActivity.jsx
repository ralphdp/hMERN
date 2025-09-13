import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Badge,
  Avatar,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const AdminActivity = () => {
  // State management
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    type: "",
    pluginName: "",
    status: "",
    severity: "",
    search: "",
    startDate: null,
    endDate: null,
  });

  // UI state
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);

  // Activity types for filtering
  const activityTypes = [
    "plugin_installed",
    "plugin_updated",
    "plugin_removed",
    "plugin_enabled",
    "plugin_disabled",
    "plugin_hot_reloaded",
    "plugin_failed",
    "plugin_recovered",
    "permission_granted",
    "permission_revoked",
    "signature_verified",
    "signature_failed",
    "api_call",
    "network_request",
    "file_read",
    "file_write",
    "admin_action",
    "configuration_changed",
    "permission_violation",
    "suspicious_activity",
    "health_check_failed",
  ];

  // Fetch activities
  const fetchActivities = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(
            ([_, value]) => value !== null && value !== ""
          )
        ),
      });

      if (filters.startDate) {
        queryParams.set("startDate", filters.startDate.toISOString());
      }
      if (filters.endDate) {
        queryParams.set("endDate", filters.endDate.toISOString());
      }

      const response = await fetch(`/api/admin/activity?${queryParams}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setActivities(result.data.activities);
        setTotalCount(result.data.pagination.total);
        setStats(result.data.stats);
      } else {
        throw new Error(result.message || "Failed to fetch activities");
      }
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Fetch activity statistics
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/activity/stats", {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchActivities();
    fetchStats();
  }, [page, rowsPerPage, filters]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActivities(false);
      }, 30000); // Refresh every 30 seconds
      setRefreshInterval(interval);
    } else if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefresh]);

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setPage(0); // Reset to first page when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "",
      pluginName: "",
      status: "",
      severity: "",
      search: "",
      startDate: null,
      endDate: null,
    });
    setPage(0);
  };

  // Get status color and icon
  const getStatusDisplay = (status, severity) => {
    const config = {
      success: { color: "success", icon: <CheckCircleIcon fontSize="small" /> },
      failure: { color: "error", icon: <ErrorIcon fontSize="small" /> },
      warning: { color: "warning", icon: <WarningIcon fontSize="small" /> },
      info: { color: "info", icon: <InfoIcon fontSize="small" /> },
    };

    const statusConfig = config[status] || config.info;

    // Override color for critical severity
    if (severity === "critical") {
      return { ...statusConfig, color: "error" };
    }

    return statusConfig;
  };

  // Get activity type display name
  const getActivityTypeDisplay = (type) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Export activities
  const exportActivities = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        limit: 10000, // Large limit for export
        format: "csv",
      });

      const response = await fetch(
        `/api/admin/activity/export?${queryParams}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `plugin-activity-${dayjs().format("YYYY-MM-DD")}.csv`;
        a.click();
      }
    } catch (err) {
      console.error("Error exporting activities:", err);
    }
  };

  // Cleanup old activities
  const cleanupActivities = async () => {
    try {
      const response = await fetch("/api/admin/activity/cleanup?days=90", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert(
            `Successfully cleaned up ${result.deletedCount} old activity records`
          );
          fetchActivities();
        }
      }
    } catch (err) {
      console.error("Error cleaning up activities:", err);
      alert("Error cleaning up activities");
    }
    setShowCleanupDialog(false);
  };

  // Memoized summary cards
  const summaryCards = useMemo(() => {
    if (!stats.pluginActivity) return [];

    const total = activities.length;
    const errors = activities.filter((a) => a.status === "failure").length;
    const warnings = activities.filter((a) => a.status === "warning").length;
    const security = activities.filter(
      (a) =>
        a.severity === "critical" ||
        a.type.includes("security") ||
        a.type.includes("permission")
    ).length;

    return [
      {
        title: "Total Activities",
        value: total,
        icon: <TimelineIcon />,
        color: "primary",
      },
      {
        title: "Errors",
        value: errors,
        icon: <ErrorIcon />,
        color: "error",
      },
      {
        title: "Warnings",
        value: warnings,
        icon: <WarningIcon />,
        color: "warning",
      },
      {
        title: "Security Events",
        value: security,
        icon: <SecurityIcon />,
        color: "error",
      },
    ];
  }, [activities, stats]);

  if (loading && activities.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading activity data...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Plugin Activity Monitor
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip
              title={
                autoRefresh ? "Auto-refresh enabled" : "Enable auto-refresh"
              }
            >
              <IconButton
                color={autoRefresh ? "primary" : "default"}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Badge variant="dot" color="success" invisible={!autoRefresh}>
                  <RefreshIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <IconButton
              color={showFilters ? "primary" : "default"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FilterIcon />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportActivities}
            >
              Export
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setShowCleanupDialog(true)}
            >
              Cleanup
            </Button>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {summaryCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent sx={{ display: "flex", alignItems: "center" }}>
                  <Avatar sx={{ bgcolor: `${card.color}.main`, mr: 2 }}>
                    {card.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" component="div">
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        {showFilters && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search activities..."
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    {activityTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {getActivityTypeDisplay(type)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="failure">Failure</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="info">Info</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    onChange={(e) =>
                      handleFilterChange("severity", e.target.value)
                    }
                  >
                    <MenuItem value="">All Severities</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => handleFilterChange("startDate", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => handleFilterChange("endDate", date)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  sx={{ height: "56px" }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Activities Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Plugin</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => {
                  const statusDisplay = getStatusDisplay(
                    activity.status,
                    activity.severity
                  );

                  return (
                    <TableRow
                      key={activity.id}
                      hover
                      sx={{ cursor: "pointer" }}
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(activity.timestamp).format("MMM DD, HH:mm:ss")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.pluginName}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getActivityTypeDisplay(activity.type)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {activity.action}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusDisplay.icon}
                          label={activity.status}
                          size="small"
                          color={statusDisplay.color}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {activity.userEmail || "System"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(activity.duration)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {activities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No activities found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Paper>

        {/* Activity Detail Dialog */}
        <Dialog
          open={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedActivity && (
            <>
              <DialogTitle>Activity Details</DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Plugin
                    </Typography>
                    <Typography variant="body1">
                      {selectedActivity.pluginName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1">
                      {getActivityTypeDisplay(selectedActivity.type)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Action
                    </Typography>
                    <Typography variant="body1">
                      {selectedActivity.action}
                    </Typography>
                  </Grid>
                  {selectedActivity.description && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {selectedActivity.description}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip
                      label={selectedActivity.status}
                      color={
                        getStatusDisplay(
                          selectedActivity.status,
                          selectedActivity.severity
                        ).color
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Severity
                    </Typography>
                    <Typography variant="body1">
                      {selectedActivity.severity}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      User
                    </Typography>
                    <Typography variant="body1">
                      {selectedActivity.userEmail || "System"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Timestamp
                    </Typography>
                    <Typography variant="body1">
                      {dayjs(selectedActivity.timestamp).format(
                        "MMMM DD, YYYY HH:mm:ss"
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedActivity(null)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Cleanup Confirmation Dialog */}
        <Dialog
          open={showCleanupDialog}
          onClose={() => setShowCleanupDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Cleanup</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to clean up old activity logs? This action
              will permanently delete activity records older than 90 days and
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowCleanupDialog(false)}>Cancel</Button>
            <Button
              onClick={cleanupActivities}
              color="error"
              variant="contained"
            >
              Delete Old Records
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default AdminActivity;
