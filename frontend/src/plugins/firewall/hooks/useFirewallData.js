import { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";
import { STATIC_CONFIG, getApiUrl } from "../config";
import createLogger from "../../../utils/logger";
import FirewallLocalStorage from "../../../utils/localStorage";

const logger = createLogger("useFirewallData");

/**
 * Comprehensive hook for managing all firewall data
 * Extracted from FirewallAdmin to reduce component complexity
 * @param {boolean} shouldFetchData - Whether to fetch authenticated data (default: true)
 */
export const useFirewallData = (shouldFetchData = true) => {
  // Core data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [stats, setStats] = useState({});
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logCount, setLogCount] = useState(0);
  const [settings, setSettings] = useState({
    rateLimit: { perMinute: 120, perHour: 720 },
    progressiveDelays: [10, 60, 90, 120],
    features: {
      ipBlocking: true,
      countryBlocking: true,
      rateLimiting: true,
      suspiciousPatterns: true,
    },
    threatIntelligence: {
      abuseIPDB: { apiKey: "", enabled: false },
      virusTotal: { apiKey: "", enabled: false },
      autoImportFeeds: false,
      feedUpdateInterval: 24,
    },
  });

  // Configuration states
  const [config, setConfig] = useState(null);
  const [configFeatures, setConfigFeatures] = useState({
    // Main firewall features (required for Rules tab)
    ipBlocking: true,
    countryBlocking: true,
    rateLimiting: true,
    suspiciousPatterns: true,
    // Additional features
    progressiveDelays: true,
    autoThreatResponse: true,
    realTimeLogging: true,
    bulkActions: true,
    logExport: true,
  });

  // UI states
  const [uiMessages, setUiMessages] = useState({
    title: "Firewall Management",
    subtitle:
      "Advanced security protection with IP blocking, rate limiting, and threat detection",
  });

  const [uiTheme, setUiTheme] = useState({
    primaryColor: "primary.main",
    icon: "Shield",
  });

  // Version tracking for cache invalidation
  const [rulesVersion, setRulesVersion] = useState(0);

  // Auto-refresh state
  const [dashboardSettings, setDashboardSettings] = useState(() =>
    FirewallLocalStorage.getDashboardSettings()
  );
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);

  // API helper function
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const url = endpoint.startsWith("/")
        ? `${getBackendUrl()}${STATIC_CONFIG.api.basePath}${endpoint}`
        : `${getBackendUrl()}${getApiUrl(endpoint)}`;

      console.log("🔥 FIREWALL API CALL:", {
        url,
        endpoint,
        credentials: "include",
        options,
      });

      const response = await fetch(url, {
        method: options.method || "GET",
        credentials: "include",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Bypass": "testing",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Handle authentication and authorization errors specifically
        if (response.status === 401) {
          throw new Error(
            `Authentication required. Please log in to access the firewall admin panel.`
          );
        } else if (response.status === 403) {
          throw new Error(
            `Admin access required. This feature is only available to administrator users.`
          );
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("API call failed:", error);
      throw error;
    }
  }, []);

  // Raw API call helper for response objects
  const rawApiCall = useCallback(async (endpoint, options = {}) => {
    const url = endpoint.startsWith("/")
      ? `${getBackendUrl()}${STATIC_CONFIG.api.basePath}${endpoint}`
      : `${getBackendUrl()}${getApiUrl(endpoint)}`;

    return await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Bypass": "testing",
        ...options.headers,
      },
      ...options,
    });
  }, []);

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiCall("stats");
      setStats(data.data);
      setAuthError(false);
    } catch (error) {
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Authentication required") ||
        error.message.includes("Admin access required")
      ) {
        setAuthError(true);
        logger.error("Authentication/authorization error:", error.message);
      } else {
        logger.error("Error fetching stats:", error);
      }
    }
  }, [apiCall]);

  // Dedicated function to get authoritative log count
  const fetchLogCount = useCallback(async () => {
    try {
      const data = await apiCall("/logs/count");
      setLogCount(data.data.count || 0);
      return data.data.count || 0;
    } catch (error) {
      logger.error("Error fetching log count:", error);
      setLogCount(0);
      return 0;
    }
  }, [apiCall]);

  const fetchRules = useCallback(async () => {
    try {
      logger.debug("[fetchRules] Fetching all rules");
      const data = await apiCall("/rules?limit=2500");
      logger.debug(`[fetchRules] Received ${data.data?.length || 0} rules`);

      setRules(data.data || []);
      setRulesVersion((prev) => prev + 1);
      setAuthError(false);
    } catch (error) {
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Authentication required") ||
        error.message.includes("Admin access required")
      ) {
        setAuthError(true);
        logger.error(
          "Authentication/authorization error for rules:",
          error.message
        );
      } else {
        logger.error("Error fetching rules:", error);
        setRules([]);
      }
    }
  }, [apiCall]);

  const fetchLogs = useCallback(async () => {
    try {
      // Fetch up to 10,000 logs for comprehensive log viewing
      // Frontend pagination will handle the display efficiently
      const data = await apiCall("/logs?limit=2500");
      setLogs(data.data || []);
      // Use pagination.total for authoritative count from database
      setLogCount(data.pagination?.total || 0);
      setAuthError(false);
    } catch (error) {
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Authentication required") ||
        error.message.includes("Admin access required")
      ) {
        setAuthError(true);
        logger.error(
          "Authentication/authorization error for logs:",
          error.message
        );
      } else {
        logger.error("Error fetching logs:", error);
        setLogs([]);
        setLogCount(0);
      }
    }
  }, [apiCall]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiCall("settings");
      if (data.success && data.data) {
        setSettings((prevSettings) => ({
          ...prevSettings,
          ...data.data,
        }));
        setAuthError(false);
      }
    } catch (error) {
      if (
        error.message.includes("401") ||
        error.message.includes("403") ||
        error.message.includes("Authentication required") ||
        error.message.includes("Admin access required")
      ) {
        setAuthError(true);
        logger.error(
          "Authentication/authorization error for settings:",
          error.message
        );
      } else {
        logger.error("Error fetching settings:", error);
      }
    }
  }, [apiCall]);

  const fetchConfig = useCallback(async () => {
    try {
      // Back to regular config endpoint now that auth is temporarily bypassed
      const configData = await apiCall("config");
      setConfig(configData.data.dynamic);

      // Extract UI messages from configuration
      const uiConfig = configData.data?.ui || configData.data.dynamic?.ui;
      if (uiConfig?.messages) {
        logger.debug("Loading UI messages from config:", uiConfig.messages);
        setUiMessages({
          title: uiConfig.messages.title || "Firewall Management",
          subtitle:
            uiConfig.messages.subtitle ||
            "Advanced security protection with IP blocking, rate limiting, and threat detection",
          successBlock:
            uiConfig.messages.successBlock ||
            "IP {ip} has been blocked successfully",
          errorBlock:
            uiConfig.messages.errorBlock || "Failed to block IP {ip}: {error}",
        });
      }

      // Extract UI theme from configuration
      if (uiConfig?.theme) {
        logger.debug("Loading UI theme from config:", uiConfig.theme);
        setUiTheme({
          primaryColor: uiConfig.theme.primaryColor || "primary.main",
          icon: uiConfig.theme.icon || "Shield",
        });
      }

      // Extract all features from configuration (both main and additional)
      const features =
        configData.data.dynamic?.features || configData.data?.features;
      if (features) {
        logger.debug("Loading features from config:", features);
        setConfigFeatures({
          // Main firewall features (required for Rules tab)
          ipBlocking: features.ipBlocking ?? true,
          countryBlocking:
            features.countryBlocking ?? features.geoBlocking ?? true,
          rateLimiting: features.rateLimiting ?? true,
          suspiciousPatterns:
            features.suspiciousPatterns ?? features.threatIntelligence ?? true,
          // Additional features
          progressiveDelays: features.progressiveDelays ?? true,
          autoThreatResponse: features.autoThreatResponse ?? true,
          realTimeLogging: features.realTimeLogging ?? true,
          bulkActions: features.bulkActions ?? true,
          logExport: features.logExport ?? true,
        });

        // Only update basic firewall features from config if settings don't exist yet
        setSettings((prevSettings) => {
          if (
            prevSettings.features &&
            Object.keys(prevSettings.features).length > 0
          ) {
            logger.debug(
              "Keeping existing settings.features, not overriding with config"
            );
            return prevSettings;
          }

          // Only use config as fallback if no settings.features exist yet
          if (
            features.ipBlocking !== undefined ||
            features.rateLimiting !== undefined ||
            features.geoBlocking !== undefined ||
            features.threatIntelligence !== undefined
          ) {
            logger.debug("Using config as fallback for basic features");

            return {
              ...prevSettings,
              features: {
                ...prevSettings.features,
                ipBlocking: features.ipBlocking ?? true,
                countryBlocking: features.geoBlocking ?? true,
                rateLimiting: features.rateLimiting ?? true,
                suspiciousPatterns: features.threatIntelligence ?? true,
              },
            };
          }

          return prevSettings;
        });
      }
    } catch (configError) {
      logger.debug("Config not available, using defaults");
    }
  }, [apiCall]);

  // Save functions
  const saveSettings = useCallback(
    async (settingsToSave) => {
      try {
        logger.debug("Saving settings:", settingsToSave);

        const response = await apiCall("settings", {
          method: "PUT",
          body: JSON.stringify(settingsToSave),
        });

        if (response.success) {
          setSettings((prevSettings) => ({
            ...prevSettings,
            ...settingsToSave,
          }));
          return { success: true, message: "Settings saved successfully" };
        } else {
          throw new Error(response.message || "Failed to save settings");
        }
      } catch (error) {
        logger.error("Error saving settings:", error);
        return {
          success: false,
          message: `Failed to save settings: ${error.message}`,
        };
      }
    },
    [apiCall]
  );

  // Load all data
  const loadInitialData = useCallback(async () => {
    // Don't fetch data if shouldFetchData is false
    if (!shouldFetchData) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test the connection first
      const healthData = await apiCall("health");
      logger.debug("Firewall health check:", healthData);

      // Load settings first (source of truth for feature states)
      await fetchSettings();

      // Try to load config
      await fetchConfig();

      // Then load other data in parallel, including dedicated log count
      await Promise.all([
        fetchStats(),
        fetchRules(),
        fetchLogs(),
        fetchLogCount(),
      ]);
    } catch (error) {
      setError(`Failed to connect to firewall: ${error.message}`);
      logger.error("Firewall connection error:", error);
    } finally {
      setLoading(false);
    }
  }, [
    shouldFetchData,
    apiCall,
    fetchSettings,
    fetchConfig,
    fetchStats,
    fetchRules,
    fetchLogs,
    fetchLogCount,
  ]);

  // Auto-refresh functionality
  useEffect(() => {
    if (
      shouldFetchData &&
      dashboardSettings.autoRefresh &&
      dashboardSettings.autoRefreshInterval > 0
    ) {
      const interval = setInterval(async () => {
        // Silent auto-refresh without alerts
        await Promise.all([
          fetchStats(),
          fetchRules(),
          fetchLogs(),
          fetchSettings(),
          fetchLogCount(),
        ]);
      }, dashboardSettings.autoRefreshInterval * 1000);

      setAutoRefreshInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
    }
  }, [
    shouldFetchData,
    dashboardSettings.autoRefresh,
    dashboardSettings.autoRefreshInterval,
    fetchStats,
    fetchRules,
    fetchLogs,
    fetchSettings,
    fetchLogCount,
  ]);

  // Initialize data on mount
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Dashboard settings management
  const handleDashboardSettingChange = useCallback(
    (setting, value) => {
      const newSettings = { ...dashboardSettings, [setting]: value };
      setDashboardSettings(newSettings);
      FirewallLocalStorage.setDashboardSettings(newSettings);
    },
    [dashboardSettings]
  );

  // Feature toggle handler
  const handleFeatureToggle = useCallback(
    async (feature, enabled) => {
      const updatedSettings = {
        ...settings,
        features: {
          ...settings.features,
          [feature]: enabled,
        },
      };

      const result = await saveSettings(updatedSettings);
      return result;
    },
    [settings, saveSettings]
  );

  return {
    // State
    loading,
    error,
    authError,
    stats,
    rules,
    logs,
    logCount,
    settings,
    config,
    configFeatures,
    uiMessages,
    uiTheme,
    rulesVersion,
    dashboardSettings,

    // API functions
    apiCall,
    rawApiCall,

    // Fetch functions
    fetchStats,
    fetchRules,
    fetchLogs,
    fetchSettings,
    fetchConfig,
    fetchLogCount,
    loadInitialData,

    // Save functions
    saveSettings,

    // Event handlers
    handleDashboardSettingChange,
    handleFeatureToggle,

    // Setters (for components that need direct state updates)
    setRules,
    setLogs,
    setStats,
    setSettings,
    setRulesVersion,
  };
};
