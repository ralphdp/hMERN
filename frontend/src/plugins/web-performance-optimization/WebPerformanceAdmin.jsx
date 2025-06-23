import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "../../utils/config";
import {
  Container,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Typography,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  BarChart as ChartIcon,
} from "@mui/icons-material";
import WebPerformanceSettings from "./components/WebPerformanceSettings";
import WebPerformanceDashboard from "./components/WebPerformanceDashboard";
import { useWebPerformanceConfig } from "./hooks/useWebPerformanceConfig";

// Local storage utilities
const getLastActiveTab = () => {
  try {
    const tab = localStorage.getItem("webPerformanceLastActiveTab");
    return tab ? parseInt(tab, 10) : 0;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return 0;
  }
};

const setLastActiveTab = (tabIndex) => {
  try {
    localStorage.setItem("webPerformanceLastActiveTab", tabIndex);
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

const defaultSettings = {
  general: {
    enabled: false,
  },
  fileOptimization: {
    minification: {
      enableCSSMinification: false,
      enableJSMinification: false,
      enableConcatenation: false,
      preserveComments: false,
      removeUnusedCSS: false,
    },
    images: {
      enableOptimization: false,
      enableWebPConversion: false,
      jpegQuality: 80,
      pngQuality: 80,
      webpQuality: 80,
      maxWidth: 1920,
      maxHeight: 1080,
    },
    compression: {
      enableGzip: true,
      enableBrotli: false,
      compressionLevel: 6,
      threshold: 1024,
    },
  },
  cachingLayers: {
    databaseCache: {
      enabled: false,
      redisPassword: "",
      defaultTTL: 300,
      maxMemory: "100mb",
    },
    fragmentCache: {
      enabled: false,
      defaultTTL: 600,
      enableFragmentCaching: false,
      enableObjectCaching: false,
    },
    staticFileCache: {
      enabled: false,
      cloudflareR2: {
        token: "",
        accessKeyId: "",
        secretAccessKey: "",
        endpointS3: "",
        bucketName: "", // Will be set from backend config
      },
      cacheTTL: 86400,
      enableVersioning: true,
    },
    browserCache: {
      enabled: true,
      staticFilesTTL: 31536000,
      dynamicContentTTL: 0,
      enableETag: true,
      enableLastModified: true,
    },
  },
  performanceFeatures: {
    lazyLoading: {
      enabled: false,
      enableImageLazyLoading: false,
      enableIframeLazyLoading: false,
      threshold: 100,
    },
    criticalCSS: {
      enabled: false,
      inlineThreshold: 14000,
      enableAutomaticExtraction: false,
    },
    preloading: {
      enabled: false,
      enableDNSPrefetch: false,
      enablePreconnect: false,
      enableResourceHints: false,
      preloadFonts: false,
      preloadCriticalImages: false,
    },
  },
};

const WebPerformanceAdmin = () => {
  const navigate = useNavigate();
  const { config } = useWebPerformanceConfig();
  const [activeTab, setActiveTab] = useState(() => getLastActiveTab());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [stats, setStats] = useState({});
  const [settings, setSettings] = useState(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "success",
  });

  // Fetch functions
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/stats`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setAuthError(false);
      } else if (response.status === 403) {
        setAuthError(true);
        console.error("Admin access required - please log in as an admin user");
      } else {
        console.error(
          "Failed to fetch stats:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/settings`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data.data }));
      } else {
        console.error(
          "Failed to fetch settings:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  // Update settings when config changes
  useEffect(() => {
    if (config.defaultBucketName) {
      setSettings((prev) => ({
        ...prev,
        cachingLayers: {
          ...prev.cachingLayers,
          staticFileCache: {
            ...prev.cachingLayers.staticFileCache,
            cloudflareR2: {
              ...prev.cachingLayers.staticFileCache.cloudflareR2,
              bucketName: config.defaultBucketName,
            },
          },
        },
      }));
    }
  }, [config.defaultBucketName]);

  // Settings management (following firewall pattern)
  const handleFeatureToggle = useCallback(
    async (section, subsection, field, newValue) => {
      const newSettings = { ...settings };

      // Handle master switch
      if (section === "general" && field === "enabled") {
        newSettings.general.enabled = newValue;

        // Enable/disable all features
        Object.keys(newSettings).forEach((key) => {
          if (
            typeof newSettings[key] === "object" &&
            newSettings[key] !== null
          ) {
            Object.keys(newSettings[key]).forEach((subKey) => {
              if (
                typeof newSettings[key][subKey] === "object" &&
                newSettings[key][subKey] !== null
              ) {
                if ("enabled" in newSettings[key][subKey]) {
                  newSettings[key][subKey].enabled = newValue;
                }
              }
            });
          }
        });

        newSettings.fileOptimization.minification.enableCSSMinification =
          newValue;
        newSettings.fileOptimization.minification.enableJSMinification =
          newValue;
        newSettings.fileOptimization.minification.enableConcatenation =
          newValue;
        newSettings.fileOptimization.images.enableOptimization = newValue;
        newSettings.performanceFeatures.lazyLoading.enabled = newValue;
        newSettings.performanceFeatures.criticalCSS.enabled = newValue;
        newSettings.performanceFeatures.preloading.enabled = newValue;
        newSettings.cachingLayers.databaseCache.enabled = newValue;
        newSettings.cachingLayers.browserCache.enabled = newValue;
      } else {
        // Handle individual feature toggle
        if (subsection) {
          if (!newSettings[section]) newSettings[section] = {};
          if (!newSettings[section][subsection])
            newSettings[section][subsection] = {};
          newSettings[section][subsection][field] = newValue;
        } else {
          if (!newSettings[section]) newSettings[section] = {};
          newSettings[section][field] = newValue;
        }
      }

      // Optimistic update
      setSettings(newSettings);

      try {
        const response = await fetch(
          `${getBackendUrl()}/api/web-performance/settings`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            credentials: "include",
            body: JSON.stringify(newSettings),
          }
        );

        const data = await response.json();

        if (response.ok) {
          const featureName =
            section === "general" && field === "enabled"
              ? "Master switch"
              : subsection
              ? `${section}.${subsection}.${field}`
              : `${section}.${field}`;

          showAlert(
            `${featureName} ${newValue ? "enabled" : "disabled"} successfully!`
          );

          if (section === "general" && field === "enabled") {
            fetchStats();
          }
        } else {
          showAlert(data.message || "Error updating setting", "error");
          // Revert on error - fetch latest from server
          fetchSettings();
        }
      } catch (error) {
        showAlert("Error updating setting", "error");
        console.error("Error:", error);
        // Revert on error
        fetchSettings();
      }
    },
    [settings, fetchSettings]
  );

  const saveSettings = async (settingsToSave) => {
    setSavingSettings(true);

    // Combine settings from the form with the existing state
    const finalSettings = {
      ...settings,
      ...settingsToSave,
    };

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(finalSettings),
        }
      );

      if (response.ok) {
        showAlert("Settings saved successfully!", "success");
        // Update local settings to ensure consistency
        setSettings(finalSettings);
      } else {
        const error = await response.json();
        showAlert(error.message || "Error saving settings", "error");
      }
    } catch (error) {
      showAlert("Error saving settings", "error");
      console.error("Settings save error:", error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSettingChange = (section, subsection, field, value) => {
    const newSettings = { ...settings };
    if (subsection) {
      if (!newSettings[section]) newSettings[section] = {};
      if (!newSettings[section][subsection])
        newSettings[section][subsection] = {};
      newSettings[section][subsection][field] = value;
    } else {
      if (!newSettings[section]) newSettings[section] = {};
      newSettings[section][field] = value;
    }
    setSettings(newSettings);
  };

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchSettings()]);
    setLoading(false);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setLastActiveTab(newValue);
  };

  const refreshData = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchSettings()]);
      // Silent refresh - no alert for success
    } catch (error) {
      console.error("Error refreshing data:", error);
      showAlert("Failed to refresh data", "error");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/web-performance/health`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          await loadData();
        } else if (response.status === 401 || response.status === 403) {
          setAuthError(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setAuthError(true);
        setLoading(false);
      }
    };

    checkAuth();
  }, [loadData]);

  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });
    setTimeout(() => {
      setAlert({ show: false, message: "", severity: "success" });
    }, 5000);
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`web-performance-tabpanel-${index}`}
      aria-labelledby={`web-performance-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xxl" sx={{ my: 4 }}>
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
        <Typography variant="h4">Web Performance Administration</Typography>
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
            account (ralphdp21@gmail.com) using regular login, Google, or GitHub
            authentication.
          </Typography>
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<ChartIcon />} label="Dashboard" />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <WebPerformanceDashboard
          settings={settings}
          stats={stats}
          refreshData={refreshData}
          showAlert={showAlert}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <WebPerformanceSettings
          initialSettings={settings}
          saveSettings={saveSettings}
          savingSettings={savingSettings}
          showAlert={showAlert}
          defaultSettings={defaultSettings}
          handleFeatureToggle={handleFeatureToggle}
          refreshData={refreshData}
        />
      </TabPanel>
    </Container>
  );
};

export default WebPerformanceAdmin;
