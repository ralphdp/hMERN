import React from "react";
import { Box, Tooltip, Typography, CircularProgress } from "@mui/material";
import { TrendingUp, TrendingDown, TrendingFlat } from "@mui/icons-material";

const RuleSparkline = ({
  ruleId,
  ruleName,
  timeRange = 30,
  width = 100,
  height = 30,
  showTrend = true,
  showTooltip = true,
}) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!ruleId) {
      setLoading(false);
      return;
    }

    fetchMetrics();
  }, [ruleId, timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/firewall/rules/${ruleId}/metrics?days=${timeRange}`,
        {
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        setError("Failed to load metrics");
      }
    } catch (err) {
      setError("Network error");
      console.error("Error fetching sparkline data:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderSparkline = () => {
    if (!data || !data.timeSeriesData || data.timeSeriesData.length === 0) {
      return null;
    }

    const values = data.timeSeriesData.map((d) => d.blockedRequests);
    const maxValue = Math.max(...values, 1); // Avoid division by zero
    const minValue = Math.min(...values);

    // Create SVG path
    const stepX = width / (values.length - 1 || 1);
    let path = "";

    values.forEach((value, index) => {
      const x = index * stepX;
      const y =
        height - ((value - minValue) / (maxValue - minValue || 1)) * height;

      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });

    // Determine color based on activity level
    const totalBlocked = values.reduce((sum, val) => sum + val, 0);
    const avgBlocked = totalBlocked / values.length;

    let color = "#94a3b8"; // Default gray
    if (avgBlocked > 10) {
      color = "#ef4444"; // High activity - red
    } else if (avgBlocked > 1) {
      color = "#f59e0b"; // Medium activity - orange
    } else if (avgBlocked > 0) {
      color = "#10b981"; // Low activity - green
    }

    return (
      <svg width={width} height={height} style={{ display: "block" }}>
        <path
          d={path}
          stroke={color}
          strokeWidth="2"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* Add dots for data points if there are few points */}
        {values.length <= 7 &&
          values.map((value, index) => {
            const x = index * stepX;
            const y =
              height -
              ((value - minValue) / (maxValue - minValue || 1)) * height;
            return <circle key={index} cx={x} cy={y} r="1.5" fill={color} />;
          })}
      </svg>
    );
  };

  const getTrendInfo = () => {
    if (!data || !data.timeSeriesData || data.timeSeriesData.length < 2) {
      return { trend: "flat", change: 0, icon: TrendingFlat };
    }

    const values = data.timeSeriesData.map((d) => d.blockedRequests);
    const recentValues = values.slice(-7); // Last 7 days
    const earlierValues = values.slice(-14, -7); // Previous 7 days

    const recentAvg =
      recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    const earlierAvg =
      earlierValues.reduce((sum, val) => sum + val, 0) /
      (earlierValues.length || 1);

    const change =
      earlierAvg === 0 ? 0 : ((recentAvg - earlierAvg) / earlierAvg) * 100;

    if (change > 10) {
      return { trend: "up", change, icon: TrendingUp, color: "#ef4444" };
    } else if (change < -10) {
      return { trend: "down", change, icon: TrendingDown, color: "#10b981" };
    } else {
      return { trend: "flat", change, icon: TrendingFlat, color: "#94a3b8" };
    }
  };

  const tooltipContent = () => {
    if (!data) return null;

    const { summary } = data;
    const trendInfo = getTrendInfo();

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
          {ruleName}
        </Typography>
        <Typography variant="body2">
          <strong>Total Blocked:</strong> {summary?.totalHits || 0}
        </Typography>
        <Typography variant="body2">
          <strong>Blocked:</strong> {summary?.blockedHits || 0}
        </Typography>
        <Typography variant="body2">
          <strong>Rate Limited:</strong> {summary?.rateLimitedHits || 0}
        </Typography>
        <Typography variant="body2">
          <strong>Efficiency:</strong> {summary?.efficiency || 0}%
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Trend:</strong>{" "}
          {trendInfo?.change
            ? `${trendInfo.change > 0 ? "+" : ""}${trendInfo.change.toFixed(
                1
              )}%`
            : "No data"}
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        sx={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={16} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.disabled",
        }}
      >
        <Typography variant="caption">--</Typography>
      </Box>
    );
  }

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  const sparklineElement = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      {renderSparkline()}
      {showTrend && (
        <TrendIcon
          sx={{
            fontSize: 16,
            color: trendInfo.color,
            ml: 0.5,
          }}
        />
      )}
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip
        title={tooltipContent()}
        arrow
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "background.paper",
              color: "text.primary",
              border: 1,
              borderColor: "divider",
            },
          },
        }}
      >
        <Box sx={{ cursor: "help" }}>{sparklineElement}</Box>
      </Tooltip>
    );
  }

  return sparklineElement;
};

export default RuleSparkline;
