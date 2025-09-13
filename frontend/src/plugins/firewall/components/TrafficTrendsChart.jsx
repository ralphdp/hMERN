import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  TextField,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";
import { getBackendUrl } from "../../../utils/config";
import createLogger from "../../../utils/logger";
import FirewallLocalStorage from "../../../utils/localStorage";
import { alpha } from "@mui/material/styles";

const logger = createLogger("TrafficTrendsChart");

const chartSeriesConfig = [
  {
    dataKey: "total",
    label: "Total Requests",
    color: "#1976d2",
    curve: "linear",
  },
  {
    dataKey: "allowed",
    label: "Allowed",
    color: "#2e7d32",
    curve: "linear",
  },
  {
    dataKey: "blocked",
    label: "Blocked",
    color: "#d32f2f",
    curve: "linear",
  },
  {
    dataKey: "rateLimited",
    label: "Rate Limited",
    color: "#f57c00",
    curve: "linear",
  },
  {
    dataKey: "suspicious",
    label: "Suspicious",
    color: "#7b1fa2",
    curve: "linear",
  },
];

const TrafficTrendsChart = React.memo(
  ({ config }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState(() => {
      return (
        FirewallLocalStorage.getPreference("trafficChartTimeRange") || "12h"
      );
    });
    const [granularity, setGranularity] = useState(() => {
      const storedTimeRange =
        FirewallLocalStorage.getPreference("trafficChartTimeRange") || "12h";
      const storedGranularity =
        FirewallLocalStorage.getPreference("trafficChartGranularity") ||
        "minute";

      // If stored time range is 1min, force granularity to second
      if (storedTimeRange === "1min") {
        return "second";
      }

      // If stored time range is 1y, force granularity to month
      if (storedTimeRange === "1y") {
        return "month";
      }

      return storedGranularity;
    });
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(null);
    const [isToggling, setIsToggling] = useState(false);

    // Load visible series from local storage, defaulting to all visible
    const [visibleSeries, setVisibleSeries] = useState(() => {
      const saved = FirewallLocalStorage.getPreference(
        "trafficChartVisibleSeries"
      );
      return saved !== null
        ? saved
        : {
            total: true,
            allowed: true,
            blocked: true,
            rateLimited: true,
            suspicious: true,
          };
    });

    // Save visible series to local storage when it changes
    useEffect(() => {
      FirewallLocalStorage.setPreference(
        "trafficChartVisibleSeries",
        visibleSeries
      );
    }, [visibleSeries]);

    // Save time range to local storage when it changes
    useEffect(() => {
      FirewallLocalStorage.setPreference("trafficChartTimeRange", timeRange);
    }, [timeRange]);

    // Save granularity to local storage when it changes
    useEffect(() => {
      FirewallLocalStorage.setPreference(
        "trafficChartGranularity",
        granularity
      );
    }, [granularity]);

    // Turn off toggle loading state after render
    useEffect(() => {
      if (isToggling) {
        // Set to false in the next event loop cycle to allow the UI to update with the spinner first
        const timer = setTimeout(() => setIsToggling(false), 0);
        return () => clearTimeout(timer);
      }
    }, [isToggling]);

    // Fetch traffic trends data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${getBackendUrl()}/api/firewall/traffic-trends?timeRange=${timeRange}&granularity=${granularity}`,
          {
            credentials: "include",
            headers: {
              "X-Admin-Bypass": "testing",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data.chartData);

          // Show notification if time range was auto-expanded
          if (result.data.autoExpanded) {
            console.log(
              `[TrafficTrends] Time range auto-expanded to include existing data. Total logs: ${result.data.totalLogsInDB}, Original range had: ${result.data.logsInOriginalRange}`
            );
          }
        } else {
          throw new Error(result.message || "Failed to fetch data");
        }
      } catch (err) {
        logger.error("Error fetching traffic trends", { error: err.message });
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Handle time range change
    const handleTimeRangeChange = (event) => {
      const newTimeRange = event.target.value;
      setTimeRange(newTimeRange);

      // Auto-adjust granularity if current selection isn't suitable for the new time range
      const getValidGranularities = (timeRange) => {
        switch (timeRange) {
          case "1min":
            return ["second"];
          case "1h":
            return ["minute"];
          case "12h":
            return ["hour"];
          case "24h":
            return ["hour"];
          case "1w":
            return ["hour", "day"];
          case "1m":
            return ["day", "week"];
          case "1y":
            return ["week", "month"];
          default:
            return ["minute", "hour", "day", "week"];
        }
      };

      const validGranularities = getValidGranularities(newTimeRange);

      if (!validGranularities.includes(granularity)) {
        // Switch to the most appropriate default granularity
        switch (newTimeRange) {
          case "1min":
            setGranularity("second");
            break;
          case "1h":
            setGranularity("minute");
            break;
          case "12h":
          case "24h":
            setGranularity("hour");
            break;
          case "1w":
            setGranularity("day");
            break;
          case "1m":
            setGranularity("day");
            break;
          case "1y":
            setGranularity("month");
            break;
          default:
            setGranularity("hour");
        }
      }
    };

    // Handle granularity change
    const handleGranularityChange = (event) => {
      setGranularity(event.target.value);
    };

    // Toggle a series' visibility
    const handleToggleSeries = (dataKey) => {
      setIsToggling(true);
      setVisibleSeries((prev) => ({
        ...prev,
        [dataKey]: !prev[dataKey],
      }));
    };

    // Toggle auto-refresh
    const handleAutoRefreshToggle = (event) => {
      setAutoRefresh(event.target.checked);
    };

    // Manual refresh
    const handleManualRefresh = () => {
      fetchData();
    };

    // Setup auto-refresh
    useEffect(() => {
      if (autoRefresh) {
        const interval = setInterval(() => {
          fetchData();
        }, 10000); // 10 seconds
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
    }, [autoRefresh, timeRange, granularity]);

    // Fetch data when time range or granularity changes
    useEffect(() => {
      fetchData();
    }, [timeRange, granularity]);

    // Cleanup interval on unmount
    useEffect(() => {
      return () => {
        if (refreshInterval) clearInterval(refreshInterval);
      };
    }, []);

    // Memoize chart data preparation
    const chartData = React.useMemo(
      () =>
        data.map((point, index) => {
          const date = new Date(point.timestamp);
          let timeLabel;

          switch (granularity) {
            case "second":
              timeLabel = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
              break;
            case "minute":
              timeLabel = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              break;
            case "hour":
              timeLabel = date.toLocaleString([], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
              });
              break;
            case "day":
              timeLabel = date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
              });
              break;
            case "week":
              timeLabel = date.toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "2-digit",
              });
              break;
            case "month":
              timeLabel = date.toLocaleDateString([], {
                month: "long",
                year: "numeric",
              });
              break;
            default:
              timeLabel = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
          }

          return {
            ...point,
            index,
            timeLabel,
          };
        }),
      [data, granularity]
    );

    // Calculate summary stats
    const totalRequests = data.reduce((sum, point) => sum + point.total, 0);
    const totalBlocked = data.reduce((sum, point) => sum + point.blocked, 0);
    const totalAllowed = data.reduce((sum, point) => sum + point.allowed, 0);
    const totalRateLimited = data.reduce(
      (sum, point) => sum + point.rateLimited,
      0
    );
    const blockRate =
      totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : 0;

    // Memoize active series filtering
    const activeSeries = React.useMemo(
      () => chartSeriesConfig.filter((series) => visibleSeries[series.dataKey]),
      [visibleSeries]
    );

    // Memoize the xAxis formatter function
    const xAxisValueFormatter = React.useCallback(
      (value) => {
        const point = chartData[value];
        if (!point) return "";

        const date = new Date(point.timestamp);

        switch (granularity) {
          case "second":
            return date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });
          case "minute":
            return date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          case "hour":
            return date.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
            });
          case "day":
            return date.toLocaleDateString([], {
              month: "short",
              day: "numeric",
            });
          case "week":
            return date.toLocaleDateString([], {
              month: "short",
              day: "numeric",
              year: "2-digit",
            });
          case "month":
            return date.toLocaleDateString([], {
              month: "short",
              year: "numeric",
            });
          default:
            return date.toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
            });
        }
      },
      [chartData, granularity]
    );

    const isChartLoading = loading || isToggling;

    return (
      <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TimelineIcon />
              <Typography variant="h6">Traffic Trends</Typography>
              {autoRefresh && (
                <Chip
                  icon={<PlayIcon />}
                  label="Live"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          }
          action={
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TextField
                id="time-range"
                name="time-range"
                select
                value={timeRange}
                onChange={handleTimeRangeChange}
                disabled={loading}
                size="small"
                sx={{ minWidth: 120 }}
                SelectProps={{
                  inputProps: {
                    "aria-label": "Time Range",
                  },
                }}
              >
                <MenuItem value="1min">1 Minute</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="12h">12 Hours</MenuItem>
                <MenuItem value="24h">24 Hours</MenuItem>
                <MenuItem value="1w">1 Week</MenuItem>
                <MenuItem value="1m">1 Month</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </TextField>

              <TextField
                id="granularity"
                name="granularity"
                select
                value={granularity}
                onChange={handleGranularityChange}
                disabled={loading}
                size="small"
                sx={{ minWidth: 120 }}
                SelectProps={{
                  inputProps: {
                    "aria-label": "Granularity",
                  },
                }}
              >
                {/* Conditionally show granularity options based on time range */}
                {timeRange === "1min" && (
                  <MenuItem value="second">Second</MenuItem>
                )}
                {timeRange === "1h" && (
                  <MenuItem value="minute">Minute</MenuItem>
                )}
                {(timeRange === "12h" ||
                  timeRange === "24h" ||
                  timeRange === "1w") && <MenuItem value="hour">Hour</MenuItem>}
                {(timeRange === "1w" || timeRange === "1m") && (
                  <MenuItem value="day">Day</MenuItem>
                )}
                {(timeRange === "1m" || timeRange === "1y") && (
                  <MenuItem value="week">Week</MenuItem>
                )}
                {timeRange === "1y" && <MenuItem value="month">Month</MenuItem>}
              </TextField>

              <FormControlLabel
                control={
                  <Switch
                    id="auto-refresh"
                    name="auto-refresh"
                    checked={autoRefresh}
                    onChange={handleAutoRefreshToggle}
                    disabled={loading}
                    inputProps={{ "aria-label": "Toggle Auto-refresh" }}
                  />
                }
                label="Auto-refresh"
              />

              <Button
                variant="outlined"
                size="small"
                startIcon={
                  loading ? <CircularProgress size={16} /> : <RefreshIcon />
                }
                onClick={handleManualRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          }
        />
        <CardContent sx={{ flex: 1, width: "100%" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Series Toggles */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
            <Typography variant="subtitle2" sx={{ alignSelf: "center", mr: 1 }}>
              Show:
            </Typography>
            {chartSeriesConfig.map((series) => (
              <Chip
                key={series.dataKey}
                label={series.label}
                onClick={() => handleToggleSeries(series.dataKey)}
                variant={visibleSeries[series.dataKey] ? "filled" : "outlined"}
                sx={{
                  backgroundColor: visibleSeries[series.dataKey]
                    ? series.color
                    : "transparent",
                  color: visibleSeries[series.dataKey] ? "#fff" : series.color,
                  borderColor: series.color,
                  "&:hover": {
                    backgroundColor: visibleSeries[series.dataKey]
                      ? series.color
                      : `${series.color}1A`, // Light background on hover for outlined
                  },
                }}
              />
            ))}
          </Box>

          {/* Summary Statistics */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="primary">
                  {totalRequests.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="success.main">
                  {totalAllowed.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Allowed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="error.main">
                  {totalBlocked.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Blocked
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="h4" color="warning.main">
                  {blockRate}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Block Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Chart */}
          <Box
            sx={{
              position: "relative",
              minHeight: config?.ui?.timeouts?.loadingMinHeight || "400px",
            }}
          >
            {isChartLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: (theme) =>
                    alpha(theme.palette.background.paper, 0.7),
                  zIndex: 10,
                  borderRadius: 1,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            {chartData.length > 0 ? (
              <Box
                sx={{
                  width: "100%",
                  height: 400,
                  opacity: isChartLoading ? 0.5 : 1,
                  transition: "opacity 0.3s ease",
                }}
              >
                <LineChart
                  xAxis={[
                    {
                      dataKey: "index",
                      scaleType: "linear",
                      valueFormatter: xAxisValueFormatter,
                    },
                  ]}
                  series={activeSeries}
                  dataset={chartData}
                  margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
                  grid={{ vertical: true, horizontal: true }}
                  slotProps={{
                    legend: {
                      direction: "row",
                      position: { vertical: "bottom", horizontal: "middle" },
                      padding: 0,
                    },
                  }}
                />
              </Box>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 4,
                  height: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No traffic data available for the selected time range.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Data Info */}
          {data.length > 0 && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="caption" color="text.secondary">
                Showing {data.length} data points • Last updated:{" "}
                {new Date().toLocaleTimeString()}
                {autoRefresh && " • Auto-refreshing every 10 seconds"}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return prevProps.config === nextProps.config;
  }
);

export default TrafficTrendsChart;
