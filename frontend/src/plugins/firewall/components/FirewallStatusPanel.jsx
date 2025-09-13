import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Tooltip,
  Divider,
  Badge,
  LinearProgress,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Security,
  Close,
  ExpandLess,
  ExpandMore,
  Shield,
  Speed,
  Public,
  Block,
  Analytics,
  AdminPanelSettings,
  Timer,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../contexts/AuthContext";
import { useFirewallData } from "../hooks/useFirewallData";
import { getBackendUrl } from "../../../utils/config";
import { useLocation } from "react-router-dom";

const FirewallStatusPanel = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Use ref to track interval and prevent multiple intervals
  const intervalRef = useRef(null);

  // Debug: Log component render
  console.log("🔍 FirewallStatusPanel rendered", {
    userRole: user?.role || "not-logged-in",
    isAdmin: user?.role === "admin",
    userId: user?._id,
    pathname: location.pathname,
  });

  // Check if user is admin - MUST BE DECLARED FIRST
  const isAdmin = user?.role === "admin";

  // Initialize visibility state from localStorage immediately
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem("firewallStatusPanelVisible");
    // Default to true for admin users if no saved state
    const defaultVisible = user?.role === "admin";
    return saved !== null ? JSON.parse(saved) : defaultVisible;
  });

  // Initialize expansion state from localStorage immediately
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem("firewallStatusPanelExpanded");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [systemStatus, setSystemStatus] = useState({});
  const [rateLimitCounters, setRateLimitCounters] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [panelInfo, setPanelInfo] = useState(null);
  const [panelInfoLoaded, setPanelInfoLoaded] = useState(false);

  // Cache management states
  const [cacheRefreshing, setCacheRefreshing] = useState(false);

  // Add smooth counter animation states
  const [displayCounters, setDisplayCounters] = useState(null);
  const animationRef = useRef(null);

  // Initialize display counters when real counters change
  useEffect(() => {
    if (rateLimitCounters && !displayCounters) {
      setDisplayCounters(rateLimitCounters);
    }
  }, [rateLimitCounters, displayCounters]);

  // Memoized panel visibility check to prevent unnecessary re-renders
  const shouldShowPanel = useMemo(() => {
    // Use panel info if available, otherwise fall back to admin settings
    const visibility = panelInfo?.panelVisibility;

    console.log("🔍 Panel visibility check:", {
      panelInfoLoaded,
      visibility,
      userRole: user?.role,
      isAdmin,
      userId: user?._id,
    });

    if (!visibility) {
      // Default behavior - admin only
      const shouldShow = user && isAdmin;
      console.log(
        "🔍 No visibility setting, defaulting to admin-only:",
        shouldShow
      );
      return shouldShow;
    }

    let shouldShow = false;
    if (visibility === "everyone") {
      shouldShow = true; // Show to everyone including logged out users
    } else if (visibility === "authenticated_users") {
      shouldShow = user && user._id; // Show to any authenticated user
    } else if (visibility === "admin_only") {
      shouldShow = user && isAdmin; // Show only to admin users
    }

    console.log("🔍 Panel visibility result:", {
      visibility,
      shouldShow,
      reason:
        visibility === "everyone"
          ? "everyone"
          : visibility === "authenticated_users"
          ? `authenticated: ${!!(user && user._id)}`
          : visibility === "admin_only"
          ? `admin: ${!!(user && isAdmin)}`
          : "unknown",
    });

    return shouldShow;
  }, [panelInfo?.panelVisibility, panelInfoLoaded, user, isAdmin]);

  // Always call useFirewallData hook to avoid conditional hook calls
  // But only fetch data when user is admin and panel should be visible
  const shouldUseAdminData = isAdmin && shouldShowPanel;
  const firewallData = useFirewallData(shouldUseAdminData);

  // Use admin data if admin and should use admin data, otherwise use public panel info
  const settings =
    shouldUseAdminData && firewallData.settings
      ? firewallData.settings
      : panelInfo?.rateLimits
      ? {
          rateLimit: panelInfo.rateLimits.regular,
          adminRateLimit: panelInfo.rateLimits.admin,
          features: panelInfo.systemStatus?.features || {},
        }
      : {};
  const stats = shouldUseAdminData ? firewallData.stats : {};
  const loading = shouldUseAdminData ? firewallData.loading : false;
  const error = shouldUseAdminData ? firewallData.error : null;
  const fetchStats = shouldUseAdminData ? firewallData.fetchStats : () => {};
  const fetchSettings = shouldUseAdminData
    ? firewallData.fetchSettings
    : () => {};

  // Public data states for non-admin users
  const [publicStats, setPublicStats] = useState({});
  const [publicSettings, setPublicSettings] = useState({});
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicError, setPublicError] = useState(null);

  // Fetch public data for non-admin users
  const fetchPublicStats = useCallback(async () => {
    if (shouldUseAdminData) return; // Skip if admin user

    setPublicLoading(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/public-stats`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPublicStats(data.data);
        setPublicError(null);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching public stats:", error);
      setPublicError(error.message);
    } finally {
      setPublicLoading(false);
    }
  }, [shouldUseAdminData]);

  const fetchPublicSettings = useCallback(async () => {
    if (shouldUseAdminData) return; // Skip if admin user

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/public-settings`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPublicSettings(data.data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching public settings:", error);
    }
  }, [shouldUseAdminData]);

  // Use appropriate data based on user role
  const finalStats = shouldUseAdminData ? stats : publicStats;
  const finalSettings = shouldUseAdminData
    ? settings
    : publicSettings.rateLimits
    ? {
        rateLimit: publicSettings.rateLimits.regular,
        adminRateLimit: publicSettings.rateLimits.admin,
        features: publicSettings.features || {},
      }
    : {};
  const finalLoading = shouldUseAdminData ? loading : publicLoading;
  const finalError = shouldUseAdminData ? error : publicError;
  const finalFetchStats = shouldUseAdminData ? fetchStats : fetchPublicStats;
  const finalFetchSettings = shouldUseAdminData
    ? fetchSettings
    : fetchPublicSettings;

  // Fetch public panel info (no auth required)
  const fetchPanelInfo = useCallback(async () => {
    try {
      console.log("🔍 Fetching panel info...", {
        userRole: user?.role || "not-logged-in",
        isAdmin,
        userId: user?._id,
      });

      const response = await fetch(
        `${getBackendUrl()}/api/firewall/panel-info`,
        {
          credentials: "include", // Include in case user is logged in
        }
      );

      console.log("🔍 Panel info response:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const data = await response.json();
        setPanelInfo(data.data);
        setPanelInfoLoaded(true);

        // Also update system status from panel info
        if (data.data.systemStatus) {
          setSystemStatus(data.data.systemStatus);
        }

        console.log("🔍 Panel info loaded:", {
          panelVisibility: data.data.panelVisibility,
          systemStatus: data.data.systemStatus,
          userRole: user?.role || "not-logged-in",
          shouldShow:
            data.data.panelVisibility === "everyone" ||
            (data.data.panelVisibility === "authenticated_users" && user) ||
            (data.data.panelVisibility === "admin_only" && isAdmin),
          rawData: data.data,
        });
      } else {
        console.error(
          "🔍 Panel info fetch failed:",
          response.status,
          response.statusText
        );
        setPanelInfoLoaded(true); // Still mark as loaded to avoid infinite loading
      }
    } catch (error) {
      console.error("Error fetching panel info:", error);
      setPanelInfoLoaded(true); // Still mark as loaded to avoid infinite loading
    }
  }, [user?.role, isAdmin, user?._id]);

  // Determine if we're on an admin route
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Get the appropriate rate limits based on current context
  const getCurrentRateLimits = () => {
    if (isAdminRoute && finalSettings?.adminRateLimit) {
      return {
        perMinute: finalSettings.adminRateLimit.perMinute,
        perHour: finalSettings.adminRateLimit.perHour,
        context: "Admin",
        icon: (
          <AdminPanelSettings
            fontSize="small"
            sx={{ mr: 1, verticalAlign: "middle" }}
          />
        ),
      };
    } else if (finalSettings?.rateLimit) {
      return {
        perMinute: finalSettings.rateLimit.perMinute,
        perHour: finalSettings.rateLimit.perHour,
        context: "Frontend",
        icon: (
          <Speed fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />
        ),
      };
    }
    return {
      perMinute: "N/A",
      perHour: "N/A",
      context: "Unknown",
      icon: <Speed fontSize="small" sx={{ mr: 1, verticalAlign: "middle" }} />,
    };
  };

  // Animate counter updates for smoother visual transitions
  const animateCounterUpdate = useCallback(
    (newData) => {
      if (!rateLimitCounters || !newData?.currentUser) {
        setDisplayCounters(newData);
        return;
      }

      const oldUsage = rateLimitCounters.currentUser.usage.regular;
      const newUsage = newData.currentUser.usage.regular;

      // Only animate if values actually changed
      if (
        oldUsage.perMinute.current === newUsage.perMinute.current &&
        oldUsage.perHour.current === newUsage.perHour.current
      ) {
        setDisplayCounters(newData);
        return;
      }

      // Clear any existing animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Animate from old to new values over 300ms for smooth transition
      const startTime = Date.now();
      const duration = 300; // ms
      const startMinute = oldUsage.perMinute.current;
      const startHour = oldUsage.perHour.current;
      const deltaMinute = newUsage.perMinute.current - startMinute;
      const deltaHour = newUsage.perHour.current - startHour;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Use easeOutCubic for natural deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const currentMinute = Math.round(
          startMinute + deltaMinute * easeProgress
        );
        const currentHour = Math.round(startHour + deltaHour * easeProgress);

        // Create animated display data
        const animatedData = {
          ...newData,
          currentUser: {
            ...newData.currentUser,
            usage: {
              ...newData.currentUser.usage,
              regular: {
                ...newUsage,
                perMinute: {
                  ...newUsage.perMinute,
                  current: currentMinute,
                  percentage: Math.round(
                    (currentMinute / newUsage.perMinute.limit) * 100
                  ),
                },
                perHour: {
                  ...newUsage.perHour,
                  current: currentHour,
                  percentage: Math.round(
                    (currentHour / newUsage.perHour.limit) * 100
                  ),
                },
              },
            },
          },
        };

        setDisplayCounters(animatedData);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animate();
    },
    [rateLimitCounters]
  );

  // Fetch real-time rate limit counters (for all users using public endpoint)
  const fetchRateLimitCounters = useCallback(async () => {
    try {
      // Add cache-busting to ensure real-time data
      const cacheBuster = Date.now();
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/my-rate-limit-usage?_=${cacheBuster}`,
        {
          credentials: "include", // Include in case user is logged in
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();

        // Animate counter changes for smooth display
        animateCounterUpdate(data.data);
        setRateLimitCounters(data.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching rate limit counters:", error);
    }
  }, [user?.role]); // Add user role to dependencies for debugging

  // Save panel states to localStorage when they change
  useEffect(() => {
    localStorage.setItem(
      "firewallStatusPanelVisible",
      JSON.stringify(isVisible)
    );
  }, [isVisible]);

  useEffect(() => {
    localStorage.setItem(
      "firewallStatusPanelExpanded",
      JSON.stringify(isExpanded)
    );
  }, [isExpanded]);

  // Fetch panel info on component mount (always, regardless of user status)
  useEffect(() => {
    fetchPanelInfo();
  }, [fetchPanelInfo]);

  // Fetch system status for firewall
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const response = await fetch(`${getBackendUrl()}/api/system/status`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setSystemStatus(data.data?.firewall || {});
        }
      } catch (error) {
        console.error("Error fetching system status:", error);
      }
    };

    // Only proceed once panel info is loaded and panel should be visible
    if (panelInfoLoaded && shouldShowPanel && isVisible) {
      // Immediately refresh rate limit counters on navigation
      if (fetchRateLimitCountersRef.current) {
        fetchRateLimitCountersRef.current();
      }

      // For non-admin users, system status comes from panel info, so only fetch additional data if shouldUseAdminData
      if (shouldUseAdminData) {
        fetchSystemStatus();
        finalFetchStats();
        finalFetchSettings();
      } else {
        // For non-admin users, fetch public data
        finalFetchStats();
        finalFetchSettings();
      }
    }
  }, [
    panelInfoLoaded,
    shouldShowPanel,
    shouldUseAdminData,
    isVisible,
    location.pathname,
    finalFetchStats,
    finalFetchSettings,
    user?.role, // Add user role to trigger refresh when login status changes
  ]);

  // Store the latest fetchRateLimitCounters function in a ref to avoid interval restarts
  const fetchRateLimitCountersRef = useRef(fetchRateLimitCounters);
  useEffect(() => {
    fetchRateLimitCountersRef.current = fetchRateLimitCounters;
  }, [fetchRateLimitCounters]);

  // Auto-refresh rate limit counters every 2 seconds when panel is visible (for all users)
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (panelInfoLoaded && shouldShowPanel && isVisible) {
      console.log("🔄 Setting up rate limit counter refresh interval", {
        userRole: user?.role || "not-logged-in",
        panelInfoLoaded,
        shouldShowPanel,
        isVisible,
      });

      // Initial fetch
      fetchRateLimitCountersRef.current();

      // Set up interval for real-time updates
      intervalRef.current = setInterval(() => {
        fetchRateLimitCountersRef.current();
      }, 30000); // Update every 30 seconds (much more reasonable)
    }

    return () => {
      if (intervalRef.current) {
        console.log("🛑 Clearing rate limit counter refresh interval");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [panelInfoLoaded, isVisible, shouldShowPanel]); // Removed fetchRateLimitCounters from deps

  // Cleanup interval and animations on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        console.log("🛑 Component unmounting - clearing interval");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (animationRef.current) {
        console.log("🛑 Component unmounting - clearing animation");
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  // Don't render if panel info hasn't loaded yet or panel shouldn't be visible
  if (!panelInfoLoaded || !shouldShowPanel) {
    console.log("🔍 Panel not rendering:", {
      panelInfoLoaded,
      shouldShowPanel,
      panelInfo: panelInfo
        ? {
            panelVisibility: panelInfo.panelVisibility,
            systemStatus: panelInfo.systemStatus,
          }
        : null,
      userRole: user?.role || "not-logged-in",
      isAdmin,
      userId: user?._id,
      reason: !panelInfoLoaded
        ? "panel info not loaded"
        : "panel should not show",
    });
    return null;
  }

  console.log("🔍 Panel rendering with state:", {
    panelInfoLoaded,
    shouldShowPanel,
    isVisible,
    isExpanded,
    shouldUseAdminData,
    userRole: user?.role || "not-logged-in",
    isAdmin,
    panelVisibility: panelInfo?.panelVisibility,
  });

  // Toggle panel visibility
  const togglePanel = () => {
    setIsVisible(!isVisible);
  };

  // Toggle panel expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  // Get status color based on value
  const getStatusColor = (enabled) => {
    return enabled ? "success" : "error";
  };

  // Get status text
  const getStatusText = (enabled) => {
    return enabled ? "Active" : "Inactive";
  };

  // Cache refresh functionality
  const handleRefreshCache = async () => {
    setCacheRefreshing(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/force-cache-refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Cache refresh successful:", result.message);

        // Refresh status data after cache refresh (without page reload)
        setTimeout(async () => {
          // Refresh system status
          try {
            const statusResponse = await fetch(
              `${getBackendUrl()}/api/system/status`,
              {
                credentials: "include",
              }
            );
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              setSystemStatus(statusData.data?.firewall || {});
            }
          } catch (error) {
            console.error("Error refreshing system status:", error);
          }

          // Refresh panel info
          fetchPanelInfo();

          // Refresh rate limit counters
          if (fetchRateLimitCountersRef.current) {
            fetchRateLimitCountersRef.current();
          }
        }, 500);
      } else {
        const error = await response.json();
        console.error("❌ Cache refresh failed:", error.message);
      }
    } catch (error) {
      console.error("❌ Cache refresh error:", error.message);
    } finally {
      setCacheRefreshing(false);
    }
  };

  // Get progress bar color based on usage percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 90) return "error";
    if (percentage >= 70) return "warning";
    return "success";
  };

  // Format time since last update
  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return "Never";
    const seconds = Math.floor((new Date() - lastUpdated) / 1000);
    if (seconds < 10) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <>
      {/* Toggle Button - Always visible for admins */}
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 2000,
        }}
      >
        <Tooltip
          title={isVisible ? "Hide Firewall Status" : "Show Firewall Status"}
        >
          <IconButton
            onClick={togglePanel}
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
              boxShadow: 3,
            }}
          >
            <Badge
              color="success"
              variant="dot"
              invisible={!systemStatus?.enabled}
              sx={{
                "& .MuiBadge-dot": {
                  border: "1px solid white",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
                },
              }}
            >
              <Security />
            </Badge>
          </IconButton>
        </Tooltip>
      </Box>

      {/* Status Panel */}
      <Collapse in={isVisible}>
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            top: 80,
            right: 20,
            width: 320,
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 1900,
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              backgroundColor: "primary.main",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Shield fontSize="small" />
              <Typography variant="h6" sx={{ fontSize: "1rem" }}>
                Firewall Status
              </Typography>
              <Chip
                size="small"
                label={isAdminRoute ? "Admin" : "Frontend"}
                color={isAdminRoute ? "warning" : "info"}
                variant="filled"
                sx={{
                  color: "white",
                  fontSize: "0.7rem",
                  height: "18px",
                }}
              />
            </Box>
            <Box>
              <IconButton
                size="small"
                onClick={toggleExpansion}
                sx={{ color: "white", mr: 1 }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
              <IconButton
                size="small"
                onClick={togglePanel}
                sx={{ color: "white" }}
              >
                <Close />
              </IconButton>
            </Box>
          </Box>

          {/* Content */}
          <Collapse in={isExpanded}>
            <Box sx={{ p: 2 }}>
              {finalLoading && (
                <Typography variant="body2" color="text.secondary">
                  Loading...
                </Typography>
              )}

              {finalError && (
                <Typography variant="body2" color="error">
                  Error: {finalError}
                </Typography>
              )}

              {!finalLoading && !finalError && (
                <Grid container spacing={2}>
                  {/* System Status */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      <Security
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      System Status
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      <Chip
                        size="small"
                        label={`Plugin: ${getStatusText(
                          systemStatus?.enabled
                        )}`}
                        color={getStatusColor(systemStatus?.enabled)}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`Master: ${getStatusText(
                          systemStatus?.masterSwitchEnabled
                        )}`}
                        color={getStatusColor(
                          systemStatus?.masterSwitchEnabled
                        )}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  {/* Current Context */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      <Public
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      Current Context
                    </Typography>
                    <Typography variant="caption" display="block">
                      Route: {location.pathname}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Protection Level:{" "}
                      {isAdminRoute ? "Admin (Enhanced)" : "Standard"}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  {/* Features Status */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      <Shield
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      Features
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      <Chip
                        size="small"
                        label={`IP Block: ${getStatusText(
                          finalSettings?.features?.ipBlocking
                        )}`}
                        color={getStatusColor(
                          finalSettings?.features?.ipBlocking
                        )}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`Rate Limit: ${getStatusText(
                          finalSettings?.features?.rateLimiting
                        )}`}
                        color={getStatusColor(
                          finalSettings?.features?.rateLimiting
                        )}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`Country: ${getStatusText(
                          finalSettings?.features?.countryBlocking
                        )}`}
                        color={getStatusColor(
                          finalSettings?.features?.countryBlocking
                        )}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={`Patterns: ${getStatusText(
                          finalSettings?.features?.suspiciousPatterns
                        )}`}
                        color={getStatusColor(
                          finalSettings?.features?.suspiciousPatterns
                        )}
                        variant="outlined"
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  {/* Rate Limiting Counters - Available for all users */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      <Timer
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      Live Rate Limit Usage
                    </Typography>

                    {displayCounters ? (
                      (() => {
                        // Choose the appropriate usage data based on firewall status and route:
                        // - If firewall is disabled: Use core (regular) limits everywhere
                        // - If firewall is enabled on admin route: Use firewall admin limits
                        // - If firewall is enabled on regular route: Use firewall regular limits
                        const isFirewallActive =
                          systemStatus?.enabled &&
                          systemStatus?.masterSwitchEnabled;

                        let usageData;
                        if (!isFirewallActive) {
                          // Firewall disabled - use core limits
                          usageData = displayCounters.currentUser.usage.regular;
                        } else {
                          // Firewall enabled - use firewall limits (admin or regular based on backend determination)
                          usageData = displayCounters.currentUser.usage.regular;
                        }

                        return (
                          <>
                            {/* Current User Stats */}
                            <Box sx={{ mb: 2 }}>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  Your Usage ({displayCounters.currentUser.ip})
                                </Typography>
                                <Box sx={{ display: "flex", gap: 0.5 }}>
                                  <Chip
                                    size="small"
                                    label={
                                      isFirewallActive ? "Firewall" : "Core"
                                    }
                                    color={
                                      isFirewallActive ? "success" : "default"
                                    }
                                    variant="outlined"
                                  />
                                  {isFirewallActive &&
                                    displayCounters.currentUser.isAdmin && (
                                      <Chip
                                        size="small"
                                        label="Admin Rates"
                                        color="warning"
                                        variant="filled"
                                        sx={{ fontSize: "0.6rem" }}
                                      />
                                    )}
                                </Box>
                              </Box>

                              {/* Per Minute Usage */}
                              <Box sx={{ mb: 1.5 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography variant="caption">
                                    Per Minute:
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    {usageData.perMinute.current}/
                                    {usageData.perMinute.limit} (
                                    {usageData.perMinute.percentage}%)
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(
                                    usageData.perMinute.percentage,
                                    100
                                  )}
                                  color={getProgressColor(
                                    usageData.perMinute.percentage
                                  )}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>

                              {/* Per Hour Usage */}
                              <Box sx={{ mb: 1.5 }}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography variant="caption">
                                    Per Hour:
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    {usageData.perHour.current}/
                                    {usageData.perHour.limit} (
                                    {usageData.perHour.percentage}%)
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(
                                    usageData.perHour.percentage,
                                    100
                                  )}
                                  color={getProgressColor(
                                    usageData.perHour.percentage
                                  )}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>

                              {/* Violations */}
                              {displayCounters.currentUser.violations > 0 && (
                                <Typography
                                  variant="caption"
                                  color="error.main"
                                  display="block"
                                >
                                  Violations:{" "}
                                  {displayCounters.currentUser.violations}
                                </Typography>
                              )}
                            </Box>

                            {/* Update Info */}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.7rem" }}
                            >
                              Updated: {getTimeSinceUpdate()} • Auto-refresh
                              every 2s
                            </Typography>
                          </>
                        );
                      })()
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Loading rate limit data...
                      </Typography>
                    )}
                  </Grid>

                  {/* Divider after rate limiting section */}
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  {/* Rules Statistics */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      <Analytics
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      Rules
                    </Typography>
                    <Typography variant="caption" display="block">
                      Total: {finalStats?.rules?.total || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Active: {finalStats?.rules?.active || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Blocked IPs: {finalStats?.blockedIPs?.active || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider />
                  </Grid>
                  {/* Activity Statistics */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      <Block
                        fontSize="small"
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      Last 24h Activity
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="error.main"
                    >
                      Blocked: {finalStats?.requests?.last24h?.blocked || 0}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="success.main"
                    >
                      Allowed: {finalStats?.requests?.last24h?.allowed || 0}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Total: {finalStats?.requests?.last24h?.total || 0}
                    </Typography>
                  </Grid>
                  {/* Dev Mode indicator */}
                  {systemStatus?.developmentModeEnabled && (
                    <>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Chip
                          size="small"
                          label="Development Mode"
                          color="warning"
                          variant="filled"
                          sx={{ width: "100%" }}
                        />
                      </Grid>
                    </>
                  )}

                  {/* Cache Management - Admin Only */}
                  {isAdmin && (
                    <>
                      <Grid item xs={12}>
                        <Divider />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom>
                          <RefreshIcon
                            fontSize="small"
                            sx={{ mr: 1, verticalAlign: "middle" }}
                          />
                          Cache Management
                        </Typography>
                        <Alert
                          severity="info"
                          sx={{ mb: 1, fontSize: "0.75rem" }}
                        >
                          <Typography variant="caption">
                            Refresh cache to fix status display issues
                          </Typography>
                        </Alert>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={handleRefreshCache}
                          disabled={cacheRefreshing}
                          startIcon={
                            cacheRefreshing ? (
                              <CircularProgress size={16} />
                            ) : (
                              <RefreshIcon />
                            )
                          }
                          fullWidth
                          sx={{ fontSize: "0.75rem", py: 0.5 }}
                        >
                          {cacheRefreshing ? "Refreshing..." : "Refresh Cache"}
                        </Button>
                      </Grid>
                    </>
                  )}
                </Grid>
              )}
            </Box>
          </Collapse>
        </Paper>
      </Collapse>
    </>
  );
};

export default FirewallStatusPanel;
