import React, { useMemo } from "react";
import { Box, Typography, Chip } from "@mui/material";
import {
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";

const OptimizationSparkline = ({
  data = [],
  title = "Optimization Activity",
  color = "#1976d2",
  height = 80,
  width = 200,
}) => {
  // Process data for sparkline display
  const sparklineData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((item, index) => ({
      x: index,
      value: item.value || item,
    }));
  }, [data]);

  // Calculate trend
  const trend = useMemo(() => {
    if (sparklineData.length < 2) return 0;

    const firstHalf = sparklineData.slice(
      0,
      Math.floor(sparklineData.length / 2)
    );
    const secondHalf = sparklineData.slice(
      Math.floor(sparklineData.length / 2)
    );

    const firstAvg =
      firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;

    return ((secondAvg - firstAvg) / firstAvg) * 100;
  }, [sparklineData]);

  const getTrendIcon = () => {
    if (trend > 5) return <TrendingUpIcon fontSize="small" color="success" />;
    if (trend < -5) return <TrendingDownIcon fontSize="small" color="error" />;
    return <RemoveIcon fontSize="small" color="disabled" />;
  };

  const getTrendColor = () => {
    if (trend > 5) return "success";
    if (trend < -5) return "error";
    return "default";
  };

  // Calculate current value and stats
  const currentValue =
    sparklineData.length > 0
      ? sparklineData[sparklineData.length - 1].value
      : 0;
  const maxValue = Math.max(...sparklineData.map((d) => d.value));
  const minValue = Math.min(...sparklineData.map((d) => d.value));

  // Render SVG sparkline like the firewall plugin
  const renderSparkline = () => {
    if (sparklineData.length === 0) return null;

    const values = sparklineData.map((d) => d.value);
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

  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: (theme) =>
          theme.palette.mode === "dark"
            ? theme.palette.grey[700]
            : theme.palette.grey[300],
        borderRadius: 1,
        backgroundColor: (theme) =>
          theme.palette.mode === "dark"
            ? theme.palette.grey[800]
            : theme.palette.grey[50],
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SpeedIcon fontSize="small" />
          <Typography variant="subtitle2">{title}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Chip
            icon={getTrendIcon()}
            label={`${Math.abs(trend).toFixed(1)}%`}
            size="small"
            color={getTrendColor()}
            variant="outlined"
          />
        </Box>
      </Box>

      {sparklineData.length === 0 ? (
        <Box
          sx={{
            height: height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
            mb: 1,
          }}
        >
          <Typography variant="caption">No data available</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ height: height, position: "relative", mb: 1 }}>
            {renderSparkline()}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current: <strong>{currentValue}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Range: {minValue} - {maxValue}
            </Typography>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: "block", textAlign: "center" }}
          >
            {sparklineData.length} data points
          </Typography>
        </>
      )}
    </Box>
  );
};

export default OptimizationSparkline;
