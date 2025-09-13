import { useState, useEffect, useCallback, useReducer } from "react";
import { getBackendUrl } from "../../../utils/config";
import { STATIC_CONFIG, getApiUrl } from "../config";
import createLogger from "../../../utils/logger";

const logger = createLogger("useWebPerformanceData");

// Data reducer for complex state management
const dataReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "SET_AUTH_ERROR":
      return { ...state, authError: action.payload, loading: false };
    case "SET_STATS":
      return { ...state, stats: action.payload };
    case "SET_SETTINGS":
      return { ...state, settings: action.payload };
    case "SET_CONFIG":
      return { ...state, config: action.payload };
    case "SET_METRICS":
      return { ...state, metrics: action.payload };
    case "SET_ALERTS":
      return { ...state, alerts: action.payload };
    case "SET_JOBS":
      return { ...state, jobs: action.payload };
    case "SET_INTELLIGENCE":
      return { ...state, intelligence: action.payload };
    case "RESET_STATE":
      return {
        ...state,
        loading: false,
        error: null,
        authError: false,
        stats: {},
        settings: {},
        config: {},
        metrics: [],
        alerts: [],
        jobs: [],
        intelligence: null,
      };
    default:
      return state;
  }
};

const initialState = {
  loading: true,
  error: null,
  authError: false,
  stats: {},
  settings: {},
  config: {},
  configFeatures: {},
  uiMessages: {},
  uiTheme: {},
  dashboardSettings: {
    autoRefresh: false,
    refreshInterval: 30,
    compactView: false,
    showAdvancedMetrics: false,
  },
  metrics: [],
  alerts: [],
  jobs: [],
  intelligence: null,
};

const useWebPerformanceData = () => {
  const [state, dispatch] = useReducer(dataReducer, initialState);
  const [refreshing, setRefreshing] = useState(false);

  // API helper function using static config
  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      const url = endpoint.startsWith("/")
        ? `${getBackendUrl()}${STATIC_CONFIG.api.basePath}${endpoint}`
        : `${getBackendUrl()}${getApiUrl(endpoint)}`;

      const response = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          dispatch({ type: "SET_AUTH_ERROR", payload: true });
          throw new Error(`Authentication required`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error("API call failed:", error);
      throw error;
    }
  }, []);

  // Raw API call helper for when we need the response object
  const rawApiCall = useCallback(async (endpoint, options = {}) => {
    const url = endpoint.startsWith("/")
      ? `${getBackendUrl()}${STATIC_CONFIG.api.basePath}${endpoint}`
      : `${getBackendUrl()}${getApiUrl(endpoint)}`;

    return await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  }, []);

  // Fetch functions
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiCall("stats");
      dispatch({ type: "SET_STATS", payload: data.data });
      dispatch({ type: "SET_AUTH_ERROR", payload: false });
    } catch (error) {
      if (error.message.includes("Authentication")) {
        dispatch({ type: "SET_AUTH_ERROR", payload: true });
        logger.error("Admin access required - please log in as an admin user");
      } else {
        logger.error("Error fetching stats:", error);
        dispatch({ type: "SET_ERROR", payload: error.message });
      }
    }
  }, [apiCall]);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await apiCall("settings");
      dispatch({ type: "SET_SETTINGS", payload: data.data });
    } catch (error) {
      logger.error("Error fetching settings:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, [apiCall]);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await apiCall("config");
      dispatch({ type: "SET_CONFIG", payload: data.data });

      // Extract configuration features and UI settings
      const configData = data.data.dynamic || data.data;
      const features = configData.features || {};
      const uiMessages = configData.ui?.messages || {};
      const uiTheme = configData.ui?.theme || {};

      dispatch({
        type: "SET_CONFIG",
        payload: {
          ...data.data,
          configFeatures: features,
          uiMessages,
          uiTheme,
        },
      });
    } catch (error) {
      logger.error("Error fetching config:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    }
  }, [apiCall]);

  const fetchMetrics = useCallback(async () => {
    try {
      const data = await apiCall("metrics");
      dispatch({ type: "SET_METRICS", payload: data.data.metrics || [] });
    } catch (error) {
      logger.error("Error fetching metrics:", error);
    }
  }, [apiCall]);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await apiCall("alerts");
      dispatch({ type: "SET_ALERTS", payload: data.data.alerts || [] });
    } catch (error) {
      logger.error("Error fetching alerts:", error);
    }
  }, [apiCall]);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await apiCall("jobs");
      dispatch({ type: "SET_JOBS", payload: data.data.jobs || [] });
    } catch (error) {
      logger.error("Error fetching jobs:", error);
    }
  }, [apiCall]);

  const fetchIntelligence = useCallback(async () => {
    try {
      const data = await apiCall("intelligence");
      dispatch({ type: "SET_INTELLIGENCE", payload: data.data });
    } catch (error) {
      logger.error("Error fetching intelligence:", error);
    }
  }, [apiCall]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      await Promise.all([
        fetchStats(),
        fetchSettings(),
        fetchConfig(),
        fetchMetrics(),
        fetchAlerts(),
        fetchJobs(),
        fetchIntelligence(),
      ]);
    } catch (error) {
      logger.error("Error loading initial data:", error);
      dispatch({ type: "SET_ERROR", payload: error.message });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    fetchStats,
    fetchSettings,
    fetchConfig,
    fetchMetrics,
    fetchAlerts,
    fetchJobs,
    fetchIntelligence,
  ]);

  // Settings management
  const saveSettings = useCallback(
    async (settingsToSave) => {
      try {
        const finalSettings = {
          ...state.settings,
          ...settingsToSave,
        };

        const response = await rawApiCall("/settings", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(finalSettings),
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({ type: "SET_SETTINGS", payload: data.data });
          return { success: true };
        } else {
          const error = await response.json();
          return {
            success: false,
            message: error.message || "Error saving settings",
          };
        }
      } catch (error) {
        logger.error("Settings save error:", error);
        return { success: false, message: "Error saving settings" };
      }
    },
    [rawApiCall, state.settings]
  );

  // Dashboard settings management
  const handleDashboardSettingChange = useCallback(
    (setting, value) => {
      dispatch({
        type: "SET_CONFIG",
        payload: {
          ...state.config,
          dashboardSettings: {
            ...state.dashboardSettings,
            [setting]: value,
          },
        },
      });
    },
    [state.config, state.dashboardSettings]
  );

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } catch (error) {
      logger.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitialData]);

  // Direct state setters for external updates
  const setStats = useCallback((stats) => {
    dispatch({ type: "SET_STATS", payload: stats });
  }, []);

  const setSettings = useCallback((settings) => {
    dispatch({ type: "SET_SETTINGS", payload: settings });
  }, []);

  const setMetrics = useCallback((metrics) => {
    dispatch({ type: "SET_METRICS", payload: metrics });
  }, []);

  const setAlerts = useCallback((alerts) => {
    dispatch({ type: "SET_ALERTS", payload: alerts });
  }, []);

  const setJobs = useCallback((jobs) => {
    dispatch({ type: "SET_JOBS", payload: jobs });
  }, []);

  const setIntelligence = useCallback((intelligence) => {
    dispatch({ type: "SET_INTELLIGENCE", payload: intelligence });
  }, []);

  return {
    // State
    loading: state.loading,
    error: state.error,
    authError: state.authError,
    refreshing,

    // Data
    stats: state.stats,
    settings: state.settings,
    config: state.config,
    configFeatures: state.configFeatures,
    uiMessages: state.uiMessages,
    uiTheme: state.uiTheme,
    dashboardSettings: state.dashboardSettings,
    metrics: state.metrics,
    alerts: state.alerts,
    jobs: state.jobs,
    intelligence: state.intelligence,

    // API functions
    apiCall,
    rawApiCall,

    // Fetch functions
    fetchStats,
    fetchSettings,
    fetchConfig,
    fetchMetrics,
    fetchAlerts,
    fetchJobs,
    fetchIntelligence,
    loadInitialData,

    // Settings management
    saveSettings,
    handleDashboardSettingChange,

    // Utilities
    refreshAllData,

    // Direct setters
    setStats,
    setSettings,
    setMetrics,
    setAlerts,
    setJobs,
    setIntelligence,
  };
};

export default useWebPerformanceData;
