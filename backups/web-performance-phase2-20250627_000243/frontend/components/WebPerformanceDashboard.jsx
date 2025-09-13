import React, { useState, useEffect, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Divider,
} from "@mui/material";
import {
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Queue as QueueIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayArrowIcon,
  Cached as CacheIcon,
  DataUsage as DataUsageIcon,
  Timer as TimerIcon,
  Memory as MemoryIcon,
} from "@mui/icons-material";
import PerformanceTrendsChart from "./PerformanceTrendsChart";
import OptimizationSparkline from "./OptimizationSparkline";
import { useWebPerformanceMetrics } from "../hooks/useWebPerformanceMetrics";
import { getBackendUrl } from "../../../utils/config";

const MetricCard = ({
  title,
  value,
  unit,
  icon,
  trend,
  loading,
  color = "primary",
  description,
}) => {
  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUpIcon color="success" fontSize="small" />;
    if (trend < -5) return <TrendingDownIcon color="error" fontSize="small" />;
    return <RemoveIcon color="disabled" fontSize="small" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return "success";
    if (trend < -5) return "error";
    return "disabled";
  };

  return (
    <Card
      sx={{
        height: "100%",
        minHeight: "180px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <CardContent
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {React.cloneElement(icon, { color })}
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <Box>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {value}
              <Typography variant="body1" component="span" sx={{ ml: 1 }}>
                {unit}
              </Typography>
            </Typography>
            {trend !== undefined && trend !== null && (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}
              >
                {getTrendIcon()}
                <Typography variant="body2" color={getTrendColor()}>
                  {Math.abs(trend).toFixed(1)}% vs last period
                </Typography>
              </Box>
            )}
            {description && (
              <Typography variant="caption" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const StatusChip = ({ status }) => {
  const statusConfig = {
    pending: { color: "warning", icon: <ScheduleIcon fontSize="small" /> },
    processing: { color: "info", icon: <PlayArrowIcon fontSize="small" /> },
    completed: { color: "success", icon: <CheckCircleIcon fontSize="small" /> },
    failed: { color: "error", icon: <ErrorIcon fontSize="small" /> },
  };

  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Chip
      label={status.toUpperCase()}
      color={config.color}
      size="small"
      icon={config.icon}
      variant="outlined"
    />
  );
};

const WebPerformanceDashboard = ({
  settings,
  stats,
  refreshData,
  showAlert,
}) => {
  const [timeRange, setTimeRange] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const {
    coreWebVitals,
    optimizationStats,
    cachePerformance,
    processingQueue,
    loading,
    error,
    fetchMetrics,
    formatFileSize,
    formatPercentage,
    formatDuration,
  } = useWebPerformanceMetrics(timeRange);

  // Check if master switch is enabled
  const isEnabled = settings?.general?.enabled || false;

  // Time range change handler
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  // Manual refresh handler (only refreshes metrics, not parent data)
  const handleRefresh = () => {
    fetchMetrics();
  };

  // Combined refresh function for auto-refresh (includes parent stats)
  const handleRefreshAll = useCallback(async () => {
    try {
      await Promise.all([fetchMetrics(), refreshData()]);
      // Silent refresh - no alert for success
    } catch (error) {
      showAlert("Failed to refresh data", "error");
    }
  }, [fetchMetrics, refreshData, showAlert]);

  // Auto-refresh toggle (using firewall's 30-second interval pattern)
  const handleAutoRefreshToggle = (event) => {
    setAutoRefresh(event.target.checked);
  };

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh && isEnabled) {
      const interval = setInterval(() => {
        handleRefreshAll();
      }, 30000); // 30 seconds like firewall charts
      setRefreshInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, isEnabled, handleRefreshAll]);

  // Show disabled message when master switch is off
  if (!isEnabled) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Web Performance Optimization Disabled
          </Typography>
          <Typography variant="body2">
            Enable the master "Web Performance Optimization" switch in the
            Settings tab to start collecting detailed performance data including
            Core Web Vitals, optimization statistics, and cache performance
            metrics.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                size="small"
              />
            }
            label="Auto-refresh (30s)"
          />

          {autoRefresh && (
            <Chip
              icon={<PlayArrowIcon />}
              label="Live"
              color="success"
              size="small"
              variant="outlined"
            />
          )}

          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} /> : <RefreshIcon />
            }
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics Overview */}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Optimizations"
            value={stats?.totalOptimizations || 0}
            unit="files"
            icon={<SpeedIcon />}
            trend={stats?.optimizationsTrend}
            loading={false}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Space Saved"
            value={formatFileSize(stats?.totalSpaceSaved || 0)}
            unit=""
            icon={<StorageIcon />}
            trend={stats?.spaceSavedTrend}
            loading={false}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Avg Compression"
            value={formatPercentage(stats?.averageCompression || 0)}
            unit=""
            icon={<AnalyticsIcon />}
            trend={stats?.compressionTrend}
            loading={false}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Queue Items"
            value={processingQueue?.pending || 0}
            unit="pending"
            icon={<QueueIcon />}
            loading={loading}
            color="warning"
          />
        </Grid>
      </Grid>

      {/* Recent Performance Metrics (from Overview) */}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card
            sx={{
              height: "100%",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AnalyticsIcon />
                  <Typography variant="h6">Recent Optimizations</Typography>
                </Box>
              }
            />
            <CardContent
              sx={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : processingQueue?.recentActivities?.length > 0 ? (
                <List dense>
                  {processingQueue.recentActivities
                    .slice(0, 5)
                    .map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <SpeedIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={`${activity.operation || "Optimization"}`}
                          secondary={`${activity.fileName} - ${formatFileSize(
                            activity.size || 0
                          )} (${new Date(
                            activity.timestamp
                          ).toLocaleString()})`}
                        />
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent optimization activities. Start optimizing files to
                  see activity here.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Core Web Vitals */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Core Web Vitals
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {coreWebVitals === null ? (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ textAlign: "center" }}>
              <Typography variant="body2">
                No Core Web Vitals data available. Enable performance monitoring
                to collect metrics.
              </Typography>
            </Alert>
          </Grid>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="LCP"
                value={coreWebVitals?.lcp?.value || "N/A"}
                unit="ms"
                icon={<SpeedIcon />}
                trend={coreWebVitals?.lcp?.trend}
                loading={loading}
                color="info"
                description="Largest Contentful Paint"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="FID"
                value={coreWebVitals?.fid?.value || "N/A"}
                unit="ms"
                icon={<TimerIcon />}
                trend={coreWebVitals?.fid?.trend}
                loading={loading}
                color="success"
                description="First Input Delay"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="CLS"
                value={coreWebVitals?.cls?.value || "N/A"}
                unit=""
                icon={<TimelineIcon />}
                trend={coreWebVitals?.cls?.trend}
                loading={loading}
                color="warning"
                description="Cumulative Layout Shift"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="TTFB"
                value={coreWebVitals?.ttfb?.value || "N/A"}
                unit="ms"
                icon={<DataUsageIcon />}
                trend={coreWebVitals?.ttfb?.trend}
                loading={loading}
                color="error"
                description="Time to First Byte"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* File Optimization Stats */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        File Optimization Performance
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {optimizationStats === null ? (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ textAlign: "center" }}>
              <Typography variant="body2">
                No optimization statistics available. Start optimizing files to
                see performance data.
              </Typography>
            </Alert>
          </Grid>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Files Processed"
                value={optimizationStats?.filesProcessed || 0}
                unit="files"
                icon={<StorageIcon />}
                trend={optimizationStats?.filesProcessedTrend}
                loading={loading}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Bytes Saved"
                value={formatFileSize(optimizationStats?.bytesSaved || 0)}
                unit=""
                icon={<DataUsageIcon />}
                trend={optimizationStats?.bytesSavedTrend}
                loading={loading}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Avg Optimization Time"
                value={formatDuration(
                  optimizationStats?.avgOptimizationTime || 0
                )}
                unit=""
                icon={<TimerIcon />}
                trend={optimizationStats?.optimizationTimeTrend}
                loading={loading}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Success Rate"
                value={formatPercentage(optimizationStats?.successRate || 0)}
                unit=""
                icon={<CheckCircleIcon />}
                trend={optimizationStats?.successRateTrend}
                loading={loading}
                color="success"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Cache Performance */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Cache Performance
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cachePerformance === null ? (
          <Grid item xs={12}>
            <Alert severity="info" sx={{ textAlign: "center" }}>
              <Typography variant="body2">
                No cache performance data available. Enable caching features to
                collect metrics.
              </Typography>
            </Alert>
          </Grid>
        ) : (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Hit Rate"
                value={formatPercentage(cachePerformance?.hitRate || 0)}
                unit=""
                icon={<CacheIcon />}
                trend={cachePerformance?.hitRateTrend}
                loading={loading}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Miss Rate"
                value={formatPercentage(cachePerformance?.missRate || 0)}
                unit=""
                icon={<ErrorIcon />}
                trend={cachePerformance?.missRateTrend}
                loading={loading}
                color="error"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Avg Response Time"
                value={formatDuration(cachePerformance?.avgResponseTime || 0)}
                unit=""
                icon={<SpeedIcon />}
                trend={cachePerformance?.responseTimeTrend}
                loading={loading}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Bandwidth Saved"
                value={formatFileSize(cachePerformance?.bandwidthSaved || 0)}
                unit=""
                icon={<DataUsageIcon />}
                trend={cachePerformance?.bandwidthSavedTrend}
                loading={loading}
                color="success"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Charts and Activity */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Performance Trends & Analytics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={8}>
          <PerformanceTrendsChart
            data={optimizationStats?.trendsData || []}
            title="Performance Trends"
            timeRange={timeRange}
          />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {optimizationStats?.sparklineData ? (
              <OptimizationSparkline
                data={optimizationStats.sparklineData}
                title="Optimization Activity"
                height={120}
              />
            ) : (
              <Alert severity="info" sx={{ textAlign: "center" }}>
                <Typography variant="body2">
                  No optimization activity data available.
                </Typography>
              </Alert>
            )}
            {cachePerformance?.sparklineData ? (
              <OptimizationSparkline
                data={cachePerformance.sparklineData}
                title="Cache Performance"
                color="#4caf50"
                height={120}
              />
            ) : (
              <Alert severity="info" sx={{ textAlign: "center" }}>
                <Typography variant="body2">
                  No cache performance data available.
                </Typography>
              </Alert>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Feature Status (from Overview) */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Feature Status
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Card
            sx={{
              height: "100%",
              minHeight: "200px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent
              sx={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.background.paper,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      CSS Minification
                    </Typography>
                    <Chip
                      label={
                        settings?.fileOptimization?.minification
                          ?.enableCSSMinification
                          ? "Enabled"
                          : "Disabled"
                      }
                      color={
                        settings?.fileOptimization?.minification
                          ?.enableCSSMinification
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.background.paper,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Image Optimization
                    </Typography>
                    <Chip
                      label={
                        settings?.fileOptimization?.images?.enableOptimization
                          ? "Enabled"
                          : "Disabled"
                      }
                      color={
                        settings?.fileOptimization?.images?.enableOptimization
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.background.paper,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Database Caching
                    </Typography>
                    <Chip
                      label={
                        settings?.cachingLayers?.databaseCache?.enabled
                          ? "Enabled"
                          : "Disabled"
                      }
                      color={
                        settings?.cachingLayers?.databaseCache?.enabled
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.grey[800]
                          : theme.palette.background.paper,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Lazy Loading
                    </Typography>
                    <Chip
                      label={
                        settings?.performanceFeatures?.lazyLoading?.enabled
                          ? "Enabled"
                          : "Disabled"
                      }
                      color={
                        settings?.performanceFeatures?.lazyLoading?.enabled
                          ? "success"
                          : "default"
                      }
                      size="small"
                    />
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Processing Queue Status */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: "100%",
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <QueueIcon />
                  <Typography variant="h6">Processing Queue Status</Typography>
                </Box>
              }
            />
            <CardContent>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : processingQueue === null ? (
                <Alert severity="info" sx={{ textAlign: "center" }}>
                  <Typography variant="body2">
                    No processing queue data available. Start optimizing files
                    to see queue status.
                  </Typography>
                </Alert>
              ) : (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? theme.palette.grey[800]
                              : theme.palette.background.paper,
                        }}
                      >
                        <Typography variant="h4" color="warning.main">
                          {processingQueue?.pending || 0}
                        </Typography>
                        <Typography variant="caption">Pending</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? theme.palette.grey[800]
                              : theme.palette.background.paper,
                        }}
                      >
                        <Typography variant="h4" color="info.main">
                          {processingQueue?.processing || 0}
                        </Typography>
                        <Typography variant="caption">Processing</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? theme.palette.grey[800]
                              : theme.palette.background.paper,
                        }}
                      >
                        <Typography variant="h4" color="success.main">
                          {processingQueue?.completed || 0}
                        </Typography>
                        <Typography variant="caption">Completed</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={3}>
                      <Paper
                        sx={{
                          p: 2,
                          textAlign: "center",
                          backgroundColor: (theme) =>
                            theme.palette.mode === "dark"
                              ? theme.palette.grey[800]
                              : theme.palette.background.paper,
                        }}
                      >
                        <Typography variant="h4" color="error.main">
                          {processingQueue?.failed || 0}
                        </Typography>
                        <Typography variant="caption">Failed</Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  {processingQueue?.totalItems > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        Overall Progress
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={
                          ((processingQueue?.completed || 0) /
                            processingQueue?.totalItems) *
                          100
                        }
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {processingQueue?.completed || 0} of{" "}
                        {processingQueue?.totalItems} completed
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: "100%",
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TimelineIcon />
                  <Typography variant="h6">Recent Activities</Typography>
                </Box>
              }
            />
            <CardContent
              sx={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : processingQueue?.recentActivities?.length > 0 ? (
                <List dense>
                  {processingQueue.recentActivities
                    .slice(0, 8)
                    .map((activity, index) => (
                      <ListItem key={index} divider={index < 7}>
                        <ListItemIcon>
                          <StatusChip status={activity.status} />
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.fileName || activity.operation}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {activity.operation} -{" "}
                                {formatFileSize(activity.size || 0)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(activity.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent activities available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WebPerformanceDashboard;
