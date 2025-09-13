import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
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
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Lightbulb as LightbulbIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  AutoFixHigh as AutoFixHighIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Star as StarIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";

const WebPerformanceIntelligence = ({
  stats = {},
  settings = {},
  intelligence = null,
  onPerformanceAnalysis,
  apiCall,
  showSnackbar,
  analyzing = false,
  refreshing = false,
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [intelligenceStats, setIntelligenceStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(false);

  // Fetch intelligence data
  const fetchIntelligenceData = async () => {
    try {
      setLoading(true);
      const [recsData, alertsData, statsData] = await Promise.all([
        apiCall("recommendations"),
        apiCall("alerts"),
        apiCall("intelligence"),
      ]);

      setRecommendations(recsData.data.recommendations || []);
      setAlerts(alertsData.data.alerts || []);
      setIntelligenceStats(statsData.data.stats || {});
    } catch (error) {
      showSnackbar("Error fetching intelligence data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  const handleAnalyzeCurrentPerformance = async () => {
    // Simulate current performance metrics
    const mockMetrics = {
      performance: {
        loadTime: 2500,
        firstByte: 300,
        domReady: 1800,
        fullyLoaded: 3200,
        coreWebVitals: {
          lcp: 2100,
          fid: 85,
          cls: 0.08,
        },
      },
      resources: {
        javascript: 180,
        css: 16,
        images: 850,
        fonts: 75,
      },
    };

    await onPerformanceAnalysis(mockMetrics);
    await fetchIntelligenceData(); // Refresh data after analysis
  };

  const getRecommendationIcon = (category) => {
    switch (category) {
      case "performance":
        return <SpeedIcon />;
      case "optimization":
        return <AutoFixHighIcon />;
      case "caching":
        return <AssessmentIcon />;
      case "core-web-vitals":
        return <TrendingUpIcon />;
      default:
        return <LightbulbIcon />;
    }
  };

  const getRecommendationColor = (priority) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case "error":
        return <ErrorIcon />;
      case "warning":
        return <WarningIcon />;
      case "info":
        return <InfoIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "success";
    }
  };

  const getPerformanceScore = () => {
    // Calculate overall performance score
    if (!intelligenceStats.analysisCount) return 0;
    return Math.round(75 + Math.random() * 20); // Mock score between 75-95
  };

  const performanceScore = getPerformanceScore();
  const getScoreColor = (score) => {
    if (score >= 90) return "success";
    if (score >= 70) return "warning";
    return "error";
  };

  const filteredRecommendations = recommendations.filter((rec) => {
    if (filter === "all") return true;
    return rec.priority === filter;
  });

  const recentAlerts = alerts.slice(0, 5);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Performance Intelligence
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={
              analyzing ? <CircularProgress size={16} /> : <PlayArrowIcon />
            }
            onClick={handleAnalyzeCurrentPerformance}
            disabled={analyzing}
          >
            {analyzing ? "Analyzing..." : "Analyze Now"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchIntelligenceData}
            disabled={loading || refreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Performance Score Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={80}
                    thickness={4}
                    sx={{ color: "grey.200" }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={performanceScore}
                    size={80}
                    thickness={4}
                    color={getScoreColor(performanceScore)}
                    sx={{ position: "absolute", left: 0 }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: "absolute",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="div"
                      color="text.secondary"
                    >
                      {performanceScore}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="h6">Performance Score</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall performance rating
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="h6">
                      {intelligenceStats.analysisCount || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analyses
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="h6">
                      {intelligenceStats.recommendationsGenerated || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Recommendations
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="h6">
                      {intelligenceStats.optimizationsApplied || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applied
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box>
                    <Typography variant="h6">
                      {intelligenceStats.alertsTriggered || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alerts
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Recommendations */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader
              title="AI Recommendations"
              action={
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={filter}
                    label="Priority"
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              }
            />
            <CardContent>
              {filteredRecommendations.length === 0 ? (
                <Alert severity="info" icon={<PsychologyIcon />}>
                  No recommendations available. Run an analysis to get
                  AI-powered performance insights.
                </Alert>
              ) : (
                <List>
                  {filteredRecommendations.map((rec, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {getRecommendationIcon(rec.category)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Typography variant="subtitle1">
                                {rec.title}
                              </Typography>
                              <Chip
                                label={rec.priority}
                                color={getRecommendationColor(rec.priority)}
                                size="small"
                              />
                              <Chip
                                label={rec.category}
                                variant="outlined"
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {rec.description}
                              </Typography>
                              <Accordion>
                                <AccordionSummary
                                  expandIcon={<ExpandMoreIcon />}
                                >
                                  <Typography variant="body2">
                                    View Actions
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <List dense>
                                    {rec.actions?.map((action, actionIndex) => (
                                      <ListItem key={actionIndex}>
                                        <ListItemIcon>
                                          <CheckCircleIcon
                                            color="primary"
                                            fontSize="small"
                                          />
                                        </ListItemIcon>
                                        <ListItemText
                                          primary={action}
                                          primaryTypographyProps={{
                                            variant: "body2",
                                          }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                                    <Chip
                                      label={`Impact: ${
                                        rec.estimatedImpact || "Unknown"
                                      }`}
                                      color="primary"
                                      variant="outlined"
                                      size="small"
                                    />
                                    <Chip
                                      label={`Effort: ${
                                        rec.estimatedEffort || "Unknown"
                                      }`}
                                      color="secondary"
                                      variant="outlined"
                                      size="small"
                                    />
                                  </Box>
                                </AccordionDetails>
                              </Accordion>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < filteredRecommendations.length - 1 && (
                        <Divider />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts & Status */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Recent Alerts */}
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="h6">Recent Alerts</Typography>
                      <Badge badgeContent={recentAlerts.length} color="error">
                        <WarningIcon />
                      </Badge>
                    </Box>
                  }
                />
                <CardContent>
                  {recentAlerts.length === 0 ? (
                    <Alert severity="success" icon={<CheckCircleIcon />}>
                      No recent performance alerts
                    </Alert>
                  ) : (
                    <List dense>
                      {recentAlerts.map((alert, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {getAlertIcon(alert.severity)}
                          </ListItemIcon>
                          <ListItemText
                            primary={alert.title}
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  {alert.message}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {new Date(alert.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Intelligence Status */}
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Intelligence Status" />
                <CardContent>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon
                          color={
                            intelligenceStats.available ? "success" : "error"
                          }
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary="AI Service"
                        secondary={
                          intelligenceStats.available ? "Active" : "Unavailable"
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <StarIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Cache Size"
                        secondary={`${
                          intelligenceStats.cacheSize || 0
                        } entries`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <FlagIcon color="info" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Queue Size"
                        secondary={`${
                          intelligenceStats.queueSize || 0
                        } pending`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WebPerformanceIntelligence;
