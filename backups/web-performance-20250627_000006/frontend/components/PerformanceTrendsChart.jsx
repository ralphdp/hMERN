import React, { useMemo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Alert,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
} from "@mui/icons-material";
import { LineChart } from "@mui/x-charts/LineChart";

const PerformanceTrendsChart = ({
  data = [],
  title = "Performance Trends",
  timeRange = "24h",
}) => {
  // Process data for chart display
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((item, index) => ({
      ...item,
      time: new Date(item.timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: timeRange === "24h" ? "2-digit" : undefined,
        minute: timeRange === "24h" ? "2-digit" : undefined,
      }),
      index,
    }));
  }, [data, timeRange]);

  // Chart series configuration
  const chartSeries = [
    {
      dataKey: "optimizations",
      label: "Optimizations",
      color: "#1976d2",
    },
    {
      dataKey: "cacheHits",
      label: "Cache Hit Rate (%)",
      color: "#4caf50",
    },
    {
      dataKey: "responseTime",
      label: "Response Time (ms)",
      color: "#ff9800",
    },
  ];

  // X-axis formatter
  const xAxisValueFormatter = (value) => {
    const point = chartData[value];
    if (!point) return "";
    return point.time;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TrendingUpIcon />
            <Typography variant="h6">{title}</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ShowChartIcon fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              {timeRange === "24h" ? "Hourly" : "Daily"} data
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {chartData.length === 0 ? (
          <Alert severity="info">
            <Typography variant="body2">
              No performance data available for the selected time range.
            </Typography>
          </Alert>
        ) : (
          <Box sx={{ width: "100%", height: 300 }}>
            <LineChart
              xAxis={[
                {
                  dataKey: "index",
                  scaleType: "linear",
                  valueFormatter: xAxisValueFormatter,
                },
              ]}
              series={chartSeries}
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
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceTrendsChart;
