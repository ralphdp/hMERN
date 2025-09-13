import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "../../utils/config";
import { STATIC_CONFIG, getApiUrl } from "./config";
import createLogger from "../../utils/logger";
import ErrorBoundary from "../../components/ErrorBoundary";
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
  DialogContentText,
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Badge,
  Snackbar,
  Slide,
} from "@mui/material";
import {
  Speed as SpeedIcon,
  Visibility as EyeIcon,
  Tune as TuneIcon,
  Public as GlobeIcon,
  BarChart as ChartIcon,
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as TrashIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Code as CodeIcon,
  Flag as FlagIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Restore as RestoreIcon,
  AdminPanelSettings as AdminIcon,
  Timer as TimerIcon,
  Memory as MemoryIcon,
  BugReport as BugReportIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  ClearAll as ClearIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  AutoFixHigh as OptimizeIcon,
  Cached as CacheIcon,
  Cloud as CloudIcon,
  Image as ImageIcon,
  Archive as CompressIcon,
} from "@mui/icons-material";

// Enhanced components
import WebPerformanceDashboard from "./components/WebPerformanceDashboard";
import WebPerformanceSettings from "./components/WebPerformanceSettings";
import WebPerformanceOptimizations from "./components/WebPerformanceOptimizations";
import WebPerformanceIntelligence from "./components/WebPerformanceIntelligence";
import WebPerformanceConfigurations from "./components/WebPerformanceConfigurations";

// Enhanced dialogs
import ClearCacheDialog from "./dialogs/ClearCacheDialog";
import OptimizationPreviewDialog from "./dialogs/OptimizationPreviewDialog";
import BulkOptimizationDialog from "./dialogs/BulkOptimizationDialog";
import PerformanceAnalysisDialog from "./dialogs/PerformanceAnalysisDialog";
import TestResultDialog from "./dialogs/TestResultDialog";
import ResetSettingsDialog from "./dialogs/ResetSettingsDialog";

// Enhanced hooks
import { useWebPerformanceConfig } from "./hooks/useWebPerformanceConfig";
import { useWebPerformanceMetrics } from "./hooks/useWebPerformanceMetrics";
import { useWebPerformanceSettings } from "./hooks/useWebPerformanceSettings";
import useWebPerformanceData from "./hooks/useWebPerformanceData";

// Enhanced utilities
import WebPerformanceLocalStorage from "./utils/WebPerformanceLocalStorage";
import { defaultSettings } from "./constants/webPerformanceConstants";

// Initialize logger for web performance admin
const logger = createLogger("WebPerformanceAdmin");

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webperf-tabpanel-${index}`}
      aria-labelledby={`webperf-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// Context for snackbar
const WebPerformanceSnackbarContext = React.createContext();

const SlideTransition = (props) => <Slide {...props} direction="left" />;

// Enhanced Snackbar Provider Component
const WebPerformanceSnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
    autoHideDuration: 6000,
  });

  const showSnackbar = useCallback(
    (message, severity = "success", autoHideDuration = null) => {
      // Set default durations based on severity
      let duration = autoHideDuration;
      if (duration === null) {
        switch (severity) {
          case "success":
            duration = 4000;
            break;
          case "info":
            duration = 6000;
            break;
          case "warning":
            duration = 8000;
            break;
          case "error":
            duration = 10000;
            break;
          default:
            duration = 6000;
        }
      }

      setSnackbar({
        open: true,
        message,
        severity,
        autoHideDuration: duration,
      });
    },
    []
  );

  const hideSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const contextValue = useMemo(
    () => ({
      showSnackbar,
      hideSnackbar,
    }),
    [showSnackbar, hideSnackbar]
  );

  return (
    <WebPerformanceSnackbarContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={SlideTransition}
        sx={{ mt: 8 }} // Offset from top to avoid header
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            minWidth: 300,
            maxWidth: 500,
            wordBreak: "break-word",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </WebPerformanceSnackbarContext.Provider>
  );
};

const useWebPerformanceSnackbar = () => {
  const context = React.useContext(WebPerformanceSnackbarContext);
  if (!context) {
    throw new Error(
      "useWebPerformanceSnackbar must be used within WebPerformanceSnackbarProvider"
    );
  }
  return context;
};

const WebPerformanceAdminContent = () => {
  const navigate = useNavigate();

  // Use the centralized data management hook
  const {
    loading,
    error,
    authError,
    stats,
    settings,
    config,
    configFeatures,
    uiMessages,
    uiTheme,
    dashboardSettings,
    metrics,
    alerts,
    jobs,
    intelligence,
    apiCall,
    rawApiCall,
    fetchStats,
    fetchSettings,
    fetchMetrics,
    fetchAlerts,
    fetchJobs,
    loadInitialData,
    saveSettings,
    handleDashboardSettingChange,
    setSettings,
    setStats,
  } = useWebPerformanceData();

  // Initialize states from localStorage
  const [activeTab, setActiveTab] = useState(() =>
    WebPerformanceLocalStorage.getLastActiveTab()
  );

  // Dialog states
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showOptimizationPreviewDialog, setShowOptimizationPreviewDialog] =
    useState(false);
  const [showBulkOptimizationDialog, setShowBulkOptimizationDialog] =
    useState(false);
  const [showPerformanceAnalysisDialog, setShowPerformanceAnalysisDialog] =
    useState(false);
  const [showTestResultDialog, setShowTestResultDialog] = useState(false);
  const [showResetSettingsDialog, setShowResetSettingsDialog] = useState(false);

  // Dialog data states
  const [optimizationPreviewData, setOptimizationPreviewData] = useState(null);
  const [bulkOptimizationData, setBulkOptimizationData] = useState(null);
  const [performanceAnalysisData, setPerformanceAnalysisData] = useState(null);
  const [testResultData, setTestResultData] = useState(null);

  // Operation states
  const [optimizing, setOptimizing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Save active tab to localStorage when it changes
  React.useEffect(() => {
    WebPerformanceLocalStorage.setLastActiveTab(activeTab);
  }, [activeTab]);

  // Save dashboard settings to localStorage when they change
  React.useEffect(() => {
    WebPerformanceLocalStorage.setDashboardSettings(dashboardSettings);
  }, [dashboardSettings]);

  // Load initial data on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        logger.debug("Checking authentication status");

        // Test web performance ping (no auth required)
        const pingResponse = await fetch(
          `${getBackendUrl()}/api/web-performance/ping`,
          {
            credentials: "include",
          }
        );
        const pingData = await pingResponse.json();
        logger.debug("Web Performance ping successful", {
          status: pingData.status,
        });

        logger.debug("Authentication check completed");
      } catch (error) {
        logger.error("Auth check failed", { error: error.message });
      }
    };

    checkAuth().then(() => {
      loadInitialData();
    });
  }, [loadInitialData]);

  // Snackbar helper
  const { showSnackbar } = useWebPerformanceSnackbar();

  // Temporary alias for compatibility
  const showAlert = showSnackbar;

  // Function to reload configuration
  const reloadConfiguration = async () => {
    try {
      logger.debug("Reloading configuration...");
      const configData = await apiCall("config");

      const features =
        configData.data.dynamic?.features || configData.data?.features;
      if (features) {
        logger.debug("Reloaded features from config", { features });
      }
    } catch (error) {
      logger.error("Error reloading configuration", { error: error.message });
    }
  };

  // Handle tab change with persistence and configuration reload
  const handleTabChange = async (event, newValue) => {
    const previousTab = activeTab;
    setActiveTab(newValue);

    // If switching away from Configuration tab (index 5), reload configuration
    if (previousTab === 5 && newValue !== 5) {
      logger.debug(
        "Switching away from Configuration tab, reloading config..."
      );
      await reloadConfiguration();
    }
  };

  // Enhanced feature toggle with optimistic updates
  const handleFeatureToggle = React.useCallback(
    async (featureName, newValue) => {
      // Update local state immediately for smooth animation
      setSettings((prevSettings) => ({
        ...prevSettings,
        features: {
          ...prevSettings.features,
          [featureName]: newValue,
        },
      }));

      try {
        const updatedSettings = {
          ...settings,
          features: {
            ...settings.features,
            [featureName]: newValue,
          },
        };

        const response = await rawApiCall("/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updatedSettings),
        });

        const data = await response.json();

        if (response.ok) {
          const featureNames = {
            optimization: "Optimization",
            caching: "Caching",
            compression: "Compression",
            monitoring: "Monitoring",
            intelligence: "Performance Intelligence",
            backgroundJobs: "Background Jobs",
            analytics: "Analytics",
          };

          showSnackbar(
            `${featureNames[featureName]} ${
              newValue ? "enabled" : "disabled"
            } successfully!`
          );

          // Refresh other data if needed
          if (featureName === "optimization" || featureName === "caching") {
            fetchStats();
          }
        } else {
          showSnackbar(data.message || "Error toggling feature", "error");
          // Revert the optimistic update on error
          setSettings((prevSettings) => ({
            ...prevSettings,
            features: {
              ...prevSettings.features,
              [featureName]: !newValue,
            },
          }));
        }
      } catch (error) {
        showSnackbar("Error toggling feature", "error");
        logger.error("Error toggling feature", {
          error: error.message,
          featureName,
        });
        // Revert the optimistic update on error
        setSettings((prevSettings) => ({
          ...prevSettings,
          features: {
            ...prevSettings.features,
            [featureName]: !newValue,
          },
        }));
      }
    },
    [settings, rawApiCall, fetchStats, showSnackbar, setSettings]
  );

  // Enhanced optimization handling
  const handleOptimizeFile = async (filePath, taskType) => {
    try {
      setOptimizing(true);

      const response = await apiCall("optimize", {
        method: "POST",
        body: JSON.stringify({ filePath, taskType }),
      });

      if (response.success) {
        showSnackbar("File added to optimization queue successfully!");
        await fetchStats(); // Refresh stats
      } else {
        showSnackbar(response.message || "Error optimizing file", "error");
      }
    } catch (error) {
      showSnackbar("Error optimizing file", "error");
      logger.error("Error optimizing file", { error: error.message });
    } finally {
      setOptimizing(false);
    }
  };

  // Enhanced bulk operations
  const handleBulkOperation = async (action, targets, options = {}) => {
    try {
      const response = await apiCall("bulk-actions", {
        method: "POST",
        body: JSON.stringify({ action, targets, options }),
      });

      if (response.success) {
        showSnackbar(`Bulk ${action} operation started successfully!`);
        await fetchStats(); // Refresh stats
        await fetchJobs(); // Refresh background jobs
      } else {
        showSnackbar(
          response.message || "Error starting bulk operation",
          "error"
        );
      }
    } catch (error) {
      showSnackbar("Error starting bulk operation", "error");
      logger.error("Error starting bulk operation", { error: error.message });
    }
  };

  // Enhanced performance analysis
  const handlePerformanceAnalysis = async (metrics) => {
    try {
      setAnalyzing(true);

      const response = await apiCall("analysis", {
        method: "POST",
        body: JSON.stringify({ metrics }),
      });

      if (response.success) {
        setPerformanceAnalysisData(response.data);
        setShowPerformanceAnalysisDialog(true);
        showSnackbar("Performance analysis completed!");
      } else {
        showSnackbar(response.message || "Error performing analysis", "error");
      }
    } catch (error) {
      showSnackbar("Error performing analysis", "error");
      logger.error("Error performing analysis", { error: error.message });
    } finally {
      setAnalyzing(false);
    }
  };

  // Enhanced cache management
  const handleClearCache = async (type = "all") => {
    try {
      setClearingCache(true);

      const response = await apiCall("cache/clear", {
        method: "POST",
        body: JSON.stringify({ type }),
      });

      if (response.success) {
        showSnackbar(
          `Cache ${type === "all" ? "completely" : type} cleared successfully!`
        );
        await fetchStats(); // Refresh stats
      } else {
        showSnackbar(response.message || "Error clearing cache", "error");
      }
    } catch (error) {
      showSnackbar("Error clearing cache", "error");
      logger.error("Error clearing cache", { error: error.message });
    } finally {
      setClearingCache(false);
    }
  };

  // Enhanced refresh data
  const refreshData = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchSettings(),
        fetchMetrics(),
        fetchAlerts(),
        fetchJobs(),
      ]);
      showSnackbar("Data refreshed successfully!");
    } catch (error) {
      logger.error("Error refreshing data", { error: error.message });
      showSnackbar("Failed to refresh data", "error");
    } finally {
      setRefreshing(false);
    }
  };

  // Enhanced benchmark handling
  const handleBenchmark = async (url, options = {}) => {
    try {
      const response = await apiCall("benchmark", {
        method: "POST",
        body: JSON.stringify({ url, options }),
      });

      if (response.success) {
        setTestResultData({
          title: "Performance Benchmark",
          data: response.data,
          type: "benchmark",
        });
        setShowTestResultDialog(true);
        showSnackbar("Benchmark completed successfully!");
      } else {
        showSnackbar(response.message || "Error running benchmark", "error");
      }
    } catch (error) {
      showSnackbar("Error running benchmark", "error");
      logger.error("Error running benchmark", { error: error.message });
    }
  };

  // Enhanced settings reset
  const handleResetSettings = async () => {
    try {
      const response = await apiCall("reset", {
        method: "POST",
        body: JSON.stringify({ confirm: true }),
      });

      if (response.success) {
        showSnackbar("Settings reset to defaults successfully!");
        await fetchSettings(); // Refresh settings
        setShowResetSettingsDialog(false);
      } else {
        showSnackbar(response.message || "Error resetting settings", "error");
      }
    } catch (error) {
      showSnackbar("Error resetting settings", "error");
      logger.error("Error resetting settings", { error: error.message });
    }
  };

  // Tab configuration (Analytics merged into Dashboard)
  const tabs = [
    {
      label: "Dashboard",
      icon: <ChartIcon />,
      component: WebPerformanceDashboard,
    },
    {
      label: "Optimizations",
      icon: <OptimizeIcon />,
      component: WebPerformanceOptimizations,
    },
    {
      label: "Intelligence",
      icon: <AssessmentIcon />,
      component: WebPerformanceIntelligence,
    },
    {
      label: "Settings",
      icon: <SettingsIcon />,
      component: WebPerformanceSettings,
    },
    {
      label: "Configuration",
      icon: <TuneIcon />,
      component: WebPerformanceConfigurations,
    },
  ];

  // Early returns for loading and error states (following FirewallAdmin pattern)
  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Web Performance...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Connection Error</Typography>
          <Typography>{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Make sure the web-performance plugin is enabled and the backend is
            running.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin")}
          sx={{ minWidth: "auto" }}
        >
          Back to Admin
        </Button>
        <Box>
          <Typography variant="h4">
            {uiMessages?.title || "Web Performance Optimization"}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {uiMessages?.subtitle ||
              "Advanced performance optimization with intelligent recommendations and monitoring"}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Refresh Data">
          <IconButton onClick={refreshData} disabled={refreshing}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear Cache">
          <IconButton
            onClick={() => setShowClearCacheDialog(true)}
            disabled={clearingCache}
          >
            <ClearIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {authError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          }
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Admin Access Required
          </Typography>
          <Typography variant="body2">
            You need to be logged in as an admin user to access the web
            performance administration panel. Please log in with an admin
            account.
          </Typography>
        </Alert>
      )}

      {/* Status Banner */}
      {settings?.general?.enabled === false && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Web Performance optimization is currently disabled. Enable it in the
          Settings tab to start optimizing your application's performance.
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Web Performance navigation tabs"
        >
          <Tab
            icon={<ChartIcon />}
            label="Dashboard"
            id="webperf-tab-0"
            aria-controls="webperf-tabpanel-0"
          />
          <Tab
            icon={<OptimizeIcon />}
            label="Optimizations"
            id="webperf-tab-1"
            aria-controls="webperf-tabpanel-1"
          />
          <Tab
            icon={<AssessmentIcon />}
            label="Intelligence"
            id="webperf-tab-2"
            aria-controls="webperf-tabpanel-2"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Settings"
            id="webperf-tab-3"
            aria-controls="webperf-tabpanel-3"
          />
          <Tab
            icon={<TuneIcon />}
            label="Configuration"
            id="webperf-tab-4"
            aria-controls="webperf-tabpanel-4"
          />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
        <ErrorBoundary
          componentName="WebPerformanceDashboard"
          showDetails={process.env.NODE_ENV === "development"}
        >
          <WebPerformanceDashboard
            stats={stats}
            settings={settings}
            config={config}
            metrics={metrics}
            alerts={alerts}
            jobs={jobs}
            intelligence={intelligence}
            onFeatureToggle={handleFeatureToggle}
            onOptimizeFile={handleOptimizeFile}
            onBulkOperation={handleBulkOperation}
            onPerformanceAnalysis={handlePerformanceAnalysis}
            onClearCache={handleClearCache}
            onBenchmark={handleBenchmark}
            refreshData={refreshData}
            showAlert={showSnackbar}
            showSnackbar={showSnackbar}
            apiCall={apiCall}
            optimizing={optimizing}
            analyzing={analyzing}
            clearingCache={clearingCache}
            refreshing={refreshing}
          />
        </ErrorBoundary>
      </TabPanel>

      {/* Optimizations Tab */}
      <TabPanel value={activeTab} index={1}>
        <ErrorBoundary
          componentName="WebPerformanceOptimizations"
          showDetails={process.env.NODE_ENV === "development"}
        >
          <WebPerformanceOptimizations
            stats={stats}
            settings={settings}
            config={config}
            metrics={metrics}
            onFeatureToggle={handleFeatureToggle}
            onOptimizeFile={handleOptimizeFile}
            onBulkOperation={handleBulkOperation}
            refreshData={refreshData}
            showSnackbar={showSnackbar}
            optimizing={optimizing}
            refreshing={refreshing}
          />
        </ErrorBoundary>
      </TabPanel>

      {/* Intelligence Tab */}
      <TabPanel value={activeTab} index={2}>
        <ErrorBoundary
          componentName="WebPerformanceIntelligence"
          showDetails={process.env.NODE_ENV === "development"}
        >
          <WebPerformanceIntelligence
            stats={stats}
            settings={settings}
            config={config}
            intelligence={intelligence}
            onPerformanceAnalysis={handlePerformanceAnalysis}
            onBenchmark={handleBenchmark}
            refreshData={refreshData}
            showSnackbar={showSnackbar}
            analyzing={analyzing}
            refreshing={refreshing}
          />
        </ErrorBoundary>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={3}>
        {activeTab === 3 && (
          <ErrorBoundary
            componentName="WebPerformanceSettings"
            showDetails={process.env.NODE_ENV === "development"}
          >
            <WebPerformanceSettings
              initialSettings={settings}
              handleFeatureToggle={handleFeatureToggle}
              saveSettings={saveSettings}
              savingSettings={savingSettings}
              showAlert={showSnackbar}
              defaultSettings={defaultSettings}
              refreshData={refreshData}
            />
          </ErrorBoundary>
        )}
      </TabPanel>

      {/* Configuration Tab */}
      <TabPanel value={activeTab} index={4}>
        {activeTab === 4 && (
          <ErrorBoundary
            componentName="WebPerformanceConfigurations"
            showDetails={process.env.NODE_ENV === "development"}
          >
            <WebPerformanceConfigurations
              config={config}
              showSnackbar={showSnackbar}
              refreshData={refreshData}
              apiCall={apiCall}
              rawApiCall={rawApiCall}
            />
          </ErrorBoundary>
        )}
      </TabPanel>

      {/* Enhanced Dialogs */}
      <ClearCacheDialog
        open={showClearCacheDialog}
        onClose={() => setShowClearCacheDialog(false)}
        onConfirm={handleClearCache}
        clearing={clearingCache}
      />

      <OptimizationPreviewDialog
        open={showOptimizationPreviewDialog}
        onClose={() => setShowOptimizationPreviewDialog(false)}
        data={optimizationPreviewData}
        onConfirm={handleOptimizeFile}
      />

      <BulkOptimizationDialog
        open={showBulkOptimizationDialog}
        onClose={() => setShowBulkOptimizationDialog(false)}
        data={bulkOptimizationData}
        onConfirm={handleBulkOperation}
      />

      <PerformanceAnalysisDialog
        open={showPerformanceAnalysisDialog}
        onClose={() => setShowPerformanceAnalysisDialog(false)}
        data={performanceAnalysisData}
      />

      <TestResultDialog
        open={showTestResultDialog}
        onClose={() => setShowTestResultDialog(false)}
        data={testResultData}
      />

      <ResetSettingsDialog
        open={showResetSettingsDialog}
        onClose={() => setShowResetSettingsDialog(false)}
        onConfirm={handleResetSettings}
      />
    </Container>
  );
};

// Wrapper component that provides the snackbar context
const WebPerformanceAdmin = () => {
  return (
    <WebPerformanceSnackbarProvider>
      <WebPerformanceAdminContent />
    </WebPerformanceSnackbarProvider>
  );
};

export default WebPerformanceAdmin;
