import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  IconButton,
  Divider,
  Avatar,
  Rating,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkCheckIcon,
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Dashboard as DashboardIcon,
  BugReport as BugReportIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";

const PerformanceAnalysisDialog = ({
  open,
  onClose,
  analysisData = null,
  loading = false,
  onRefresh,
  onExport,
  onImplementRecommendation,
}) => {
  const [tabValue, setTabValue] = useState(0);

  // Mock data structure for demonstration
  const defaultData = {
    overallScore: 78,
    metrics: {
      loadTime: { value: 2.4, target: 2.0, status: "warning", trend: -0.3 },
      firstContentfulPaint: {
        value: 1.2,
        target: 1.0,
        status: "warning",
        trend: -0.1,
      },
      largestContentfulPaint: {
        value: 2.8,
        target: 2.5,
        status: "error",
        trend: 0.2,
      },
      cumulativeLayoutShift: {
        value: 0.15,
        target: 0.1,
        status: "error",
        trend: 0.05,
      },
      firstInputDelay: {
        value: 45,
        target: 100,
        status: "success",
        trend: -10,
      },
      cacheHitRate: { value: 85, target: 90, status: "warning", trend: 5 },
      compressionRate: { value: 72, target: 80, status: "warning", trend: 8 },
      imageOptimization: { value: 64, target: 85, status: "error", trend: 12 },
    },
    recommendations: [
      {
        id: 1,
        type: "critical",
        title: "Optimize Large Images",
        description: "Several large images are slowing down page load times",
        impact: "High",
        effort: "Medium",
        estimatedImprovement: "1.2s faster load time",
        files: ["hero-image.jpg", "gallery-1.png", "background.jpg"],
        actionable: true,
      },
      {
        id: 2,
        type: "warning",
        title: "Enable WebP Format",
        description: "Convert images to WebP for better compression",
        impact: "Medium",
        effort: "Low",
        estimatedImprovement: "25% size reduction",
        files: [],
        actionable: true,
      },
      {
        id: 3,
        type: "info",
        title: "Implement Critical CSS",
        description: "Inline critical CSS to improve first paint",
        impact: "Medium",
        effort: "High",
        estimatedImprovement: "0.5s faster FCP",
        files: [],
        actionable: false,
      },
    ],
    issues: [
      {
        id: 1,
        severity: "error",
        category: "Performance",
        title: "Unoptimized Images Detected",
        description: "12 images larger than 500KB found",
        url: "/uploads/gallery/",
        suggestion: "Compress images to reduce file size",
      },
      {
        id: 2,
        severity: "warning",
        category: "Caching",
        title: "Missing Cache Headers",
        description: "Static files lack proper cache headers",
        url: "/assets/css/",
        suggestion: "Configure browser caching for static assets",
      },
    ],
    optimization: {
      opportunities: [
        { name: "Image Optimization", impact: "High", savings: "2.1MB" },
        { name: "CSS Minification", impact: "Medium", savings: "150KB" },
        { name: "JavaScript Minification", impact: "Medium", savings: "320KB" },
        { name: "WebP Conversion", impact: "High", savings: "1.8MB" },
      ],
      completed: [
        { name: "GZIP Compression", date: "2024-01-15", savings: "45%" },
        { name: "Browser Caching", date: "2024-01-14", savings: "2.3s" },
      ],
    },
  };

  const data = analysisData || defaultData;

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "error";
  };

  const formatDuration = (seconds) => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes === "string") return bytes;
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const OverviewTab = () => (
    <Box sx={{ p: 2 }}>
      {/* Overall Score */}
      <Card variant="outlined" sx={{ mb: 3, textAlign: "center" }}>
        <CardContent>
          <Typography
            variant="h3"
            fontWeight={700}
            color={`${getScoreColor(data.overallScore)}.main`}
          >
            {data.overallScore}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Performance Score
          </Typography>
          <Rating
            value={data.overallScore / 20}
            readOnly
            size="large"
            sx={{ mt: 1 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {data.overallScore >= 90
              ? "Excellent"
              : data.overallScore >= 70
              ? "Good"
              : "Needs Improvement"}
          </Typography>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <Typography variant="h6" gutterBottom>
        Core Web Vitals
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(data.metrics)
          .slice(0, 5)
          .map(([key, metric]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: "center", p: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      color={`${getStatusColor(metric.status)}.main`}
                    >
                      {key === "cacheHitRate" ||
                      key === "compressionRate" ||
                      key === "imageOptimization"
                        ? `${metric.value}%`
                        : key === "firstInputDelay"
                        ? `${metric.value}ms`
                        : typeof metric.value === "string"
                        ? metric.value
                        : formatDuration(metric.value)}
                    </Typography>
                    {metric.trend !== 0 && (
                      <Tooltip
                        title={`${metric.trend > 0 ? "+" : ""}${
                          metric.trend
                        } change`}
                      >
                        {metric.trend > 0 ? (
                          <TrendingUpIcon color="error" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="success" fontSize="small" />
                        )}
                      </Tooltip>
                    )}
                  </Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((metric.value / metric.target) * 100, 100)}
                    color={getStatusColor(metric.status)}
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    Target:{" "}
                    {typeof metric.target === "string"
                      ? metric.target
                      : key === "cacheHitRate" ||
                        key === "compressionRate" ||
                        key === "imageOptimization"
                      ? `${metric.target}%`
                      : key === "firstInputDelay"
                      ? `${metric.target}ms`
                      : formatDuration(metric.target)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {/* Quick Actions */}
      <Alert severity="info">
        <Typography variant="subtitle2" gutterBottom>
          🚀 Quick Actions
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
          <Chip
            icon={<TuneIcon />}
            label="Optimize Images"
            clickable
            color="primary"
            variant="outlined"
          />
          <Chip
            icon={<SpeedIcon />}
            label="Enable WebP"
            clickable
            color="secondary"
            variant="outlined"
          />
          <Chip
            icon={<StorageIcon />}
            label="Clear Cache"
            clickable
            color="warning"
            variant="outlined"
          />
        </Box>
      </Alert>
    </Box>
  );

  const RecommendationsTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Performance Recommendations
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Prioritized suggestions to improve your website's performance
      </Typography>

      {data.recommendations.map((rec) => (
        <Card key={rec.id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor:
                    rec.type === "critical"
                      ? "error.main"
                      : rec.type === "warning"
                      ? "warning.main"
                      : "info.main",
                  width: 40,
                  height: 40,
                }}
              >
                {rec.type === "critical" ? (
                  <ErrorIcon />
                ) : rec.type === "warning" ? (
                  <WarningIcon />
                ) : (
                  <LightbulbIcon />
                )}
              </Avatar>

              <Box sx={{ flexGrow: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Typography variant="h6">{rec.title}</Typography>
                  <Chip
                    label={rec.type}
                    size="small"
                    color={
                      rec.type === "critical"
                        ? "error"
                        : rec.type === "warning"
                        ? "warning"
                        : "info"
                    }
                  />
                  <Chip
                    label={`${rec.impact} Impact`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`${rec.effort} Effort`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {rec.description}
                </Typography>

                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    📈 Estimated Improvement: {rec.estimatedImprovement}
                  </Typography>
                </Alert>

                {rec.files && rec.files.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Affected Files:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {rec.files.map((file) => (
                        <Chip
                          key={file}
                          label={file}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!rec.actionable}
                    onClick={() =>
                      onImplementRecommendation &&
                      onImplementRecommendation(rec)
                    }
                  >
                    {rec.actionable ? "Implement" : "Manual Action Required"}
                  </Button>
                  <Button size="small" variant="outlined">
                    Learn More
                  </Button>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const IssuesTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Performance Issues
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Detected issues that may be affecting your website's performance
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Severity</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Issue</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Suggestion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.issues.map((issue) => (
              <TableRow key={issue.id} hover>
                <TableCell>
                  <Chip
                    icon={
                      issue.severity === "error" ? (
                        <ErrorIcon />
                      ) : issue.severity === "warning" ? (
                        <WarningIcon />
                      ) : (
                        <InfoIcon />
                      )
                    }
                    label={issue.severity}
                    size="small"
                    color={
                      issue.severity === "error"
                        ? "error"
                        : issue.severity === "warning"
                        ? "warning"
                        : "info"
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{issue.category}</Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="subtitle2">{issue.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {issue.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {issue.url}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {issue.suggestion}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const OptimizationTab = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Optimization Opportunities
      </Typography>

      {/* Opportunities */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Available Optimizations" />
        <CardContent>
          <List>
            {data.optimization.opportunities.map((opportunity, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <TuneIcon
                    color={opportunity.impact === "High" ? "error" : "warning"}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={opportunity.name}
                  secondary={`Potential savings: ${opportunity.savings}`}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={`${opportunity.impact} Impact`}
                    size="small"
                    color={opportunity.impact === "High" ? "error" : "warning"}
                    variant="outlined"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Completed Optimizations */}
      <Card variant="outlined">
        <CardHeader title="Recently Completed" />
        <CardContent>
          <List>
            {data.optimization.completed.map((completed, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary={completed.name}
                  secondary={`Completed on ${completed.date} • Saved ${completed.savings}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <AssessmentIcon color="primary" />
        Performance Analysis Results
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh Analysis">
          <IconButton onClick={onRefresh} disabled={loading} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export Report">
          <IconButton onClick={onExport} size="small">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Overview" icon={<DashboardIcon />} iconPosition="start" />
          <Tab
            label="Recommendations"
            icon={<LightbulbIcon />}
            iconPosition="start"
          />
          <Tab label="Issues" icon={<BugReportIcon />} iconPosition="start" />
          <Tab label="Optimization" icon={<TuneIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ height: "calc(100% - 48px)", overflow: "auto" }}>
          {tabValue === 0 && <OverviewTab />}
          {tabValue === 1 && <RecommendationsTab />}
          {tabValue === 2 && <IssuesTab />}
          {tabValue === 3 && <OptimizationTab />}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          variant="contained"
          startIcon={<ShareIcon />}
          onClick={onExport}
        >
          Export Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PerformanceAnalysisDialog;
