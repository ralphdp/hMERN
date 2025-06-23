import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "../../utils/config";
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
} from "@mui/material";
import {
  Shield as ShieldIcon,
  Visibility as EyeIcon,
  Block as BanIcon,
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
  NotInterested as NotInterestedIcon,
  Warning as WarningIcon,
  Tune as TuneIcon,
  Restore as RestoreIcon,
  AdminPanelSettings as AdminIcon,
  Timer as TimerIcon,
  Memory as MemoryIcon,
  ProxyIcon,
} from "@mui/icons-material";
import FirewallLocalStorage from "../../utils/localStorage";

// Import modular components
import FirewallAdminDashboard from "./components/FirewallAdminDashboard";
import FirewallAdminRules from "./components/FirewallAdminRules";
// REMOVED: FirewallAdminBlockedIPs - consolidated into rules system
import FirewallAdminLogs from "./components/FirewallAdminLogs";
import FirewallAdminSettings from "./components/FirewallAdminSettings";

// Import constants
import {
  countryCodes,
  patternExamples,
  rateLimitExamples,
} from "./constants/firewallConstants";

// Import hooks
import { useFirewallRules } from "./hooks/useFirewallRules";
import { useFirewallLogs } from "./hooks/useFirewallLogs";
import { useFirewallSettings } from "./hooks/useFirewallSettings";
import { useFirewallStats } from "./hooks/useFirewallStats";

// Import Dialog Components
import RuleEditorDialog from "./dialogs/RuleEditorDialog";

const defaultSettings = {
  rateLimit: { perMinute: 120, perHour: 720 },
  progressiveDelays: [10, 60, 90, 120],
  adminRateLimit: { perMinute: 500, perHour: 4000 },
  ruleCache: { enabled: true, ttl: 60 },
  trustedProxies: ["127.0.0.1", "::1"],
  securityThresholds: {
    maxPatternLength: 500,
    maxInputLength: 2000,
    regexTimeout: 100,
  },
  cache: { enabled: true, ttl: 300, maxSize: 1000, strategy: "lru" },
  responses: {
    blocked: {
      statusCode: 403,
      message: "Request blocked by firewall rules",
    },
    rateLimited: { statusCode: 429, message: "Too many requests" },
  },
  monitoring: {
    enableRealTimeAlerts: false,
    alertEmail: "",
  },
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`firewall-tabpanel-${index}`}
      aria-labelledby={`firewall-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const FirewallAdmin = () => {
  const navigate = useNavigate();

  // Initialize states from localStorage
  const [activeTab, setActiveTab] = useState(() =>
    FirewallLocalStorage.getLastActiveTab()
  );

  const [loading, setLoading] = useState(true);

  const [authError, setAuthError] = useState(false);
  const [stats, setStats] = useState({});
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [showThreatFeedDialog, setShowThreatFeedDialog] = useState(false);
  const [threatFeedDialogData, setThreatFeedDialogData] = useState(null);
  const [showIPBlockingDisableDialog, setShowIPBlockingDisableDialog] =
    useState(false);
  const [showTestResultModal, setShowTestResultModal] = useState(false);
  const [testResult, setTestResult] = useState({
    success: false,
    title: "",
    message: "",
  });
  const [pendingSettings, setPendingSettings] = useState(null);
  const [testing, setTesting] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [rulesVersion, setRulesVersion] = useState(0);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "success",
  });
  const [referenceTab, setReferenceTab] = useState(0);
  const [countrySearch, setCountrySearch] = useState("");
  const [addingCommonRules, setAddingCommonRules] = useState(false);
  const [importingThreats, setImportingThreats] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    rateLimit: {
      perMinute: 120,
      perHour: 720,
    },
    progressiveDelays: [10, 60, 90, 120], // in seconds
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

  // Form states
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "ip_block",
    value: "",
    action: "block",
    enabled: true,
    priority: 100,
    description: "",
  });

  const [blockForm, setBlockForm] = useState({
    ip: "",
    reason: "",
    permanent: false,
    expiresIn: 3600,
  });

  // Dashboard settings from localStorage
  const [dashboardSettings, setDashboardSettings] = useState(() =>
    FirewallLocalStorage.getDashboardSettings()
  );

  // Auto-refresh functionality
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(null);

  // Save active tab to localStorage when it changes
  React.useEffect(() => {
    FirewallLocalStorage.setLastActiveTab(activeTab);
  }, [activeTab]);

  // Save dashboard settings to localStorage when they change
  React.useEffect(() => {
    FirewallLocalStorage.setDashboardSettings(dashboardSettings);
  }, [dashboardSettings]);

  // Auto-refresh setup
  React.useEffect(() => {
    if (
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
  }, [dashboardSettings.autoRefresh, dashboardSettings.autoRefreshInterval]);

  // Fetch data functions
  const fetchStats = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/stats`, {
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });
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

  const fetchRules = async () => {
    try {
      console.log(
        `[fetchRules] Fetching all rules from: ${getBackendUrl()}/api/firewall/rules`
      );
      // Fetch all rules by setting a high limit to avoid pagination issues
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/rules?limit=10000`,
        {
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );
      console.log(`[fetchRules] Response status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[fetchRules] Received ${data.data?.length || 0} rules`);
        console.log(
          `[fetchRules] Total rules from server: ${
            data.pagination?.total || "unknown"
          }`
        );
        console.log(
          `[fetchRules] Current rules count before update: ${rules.length}`
        );
        // Debug: Log first rule structure
        if (data.data?.length > 0) {
          console.log(
            `[fetchRules] First rule structure:`,
            Object.keys(data.data[0])
          );
          console.log(`[fetchRules] First rule data:`, data.data[0]);
        }
        setRules(data.data);
        setRulesVersion((v) => v + 1); // Force re-render of rules component
        console.log(`[fetchRules] Rules state updated`);
      } else {
        console.error(
          "[fetchRules] Failed to fetch rules:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("[fetchRules] Error fetching rules:", error);
    }
  };

  // REMOVED: fetchBlockedIPs - now handled through rules with source filtering

  const fetchLogs = async () => {
    try {
      // Fetch all logs by setting a high limit to avoid pagination issues
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/logs?limit=10000`,
        {
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log(`[fetchLogs] Received ${data.data?.length || 0} logs`);
        console.log(
          `[fetchLogs] Total logs from server: ${
            data.pagination?.total || "unknown"
          }`
        );
        // Debug: Log first log structure
        if (data.data?.length > 0) {
          console.log(
            `[fetchLogs] First log structure:`,
            Object.keys(data.data[0])
          );
          console.log(`[fetchLogs] First log data:`, data.data[0]);
        }
        setLogs(data.data);
      } else {
        console.error(
          "Failed to fetch logs:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/settings`, {
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
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

  const [savingSettings, setSavingSettings] = useState(false);

  // Handle toggle changes with optimistic updates (exact same pattern as AdminPlugins)
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
        // Handle special case for IP blocking with confirmation dialog
        // Note: IP blocking is now handled through firewall rules
        // No need to check for active blocked IPs since everything is in rules

        const updatedSettings = {
          ...settings,
          features: {
            ...settings.features,
            [featureName]: newValue,
          },
        };

        const response = await fetch(
          `${getBackendUrl()}/api/firewall/settings`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              "X-Admin-Bypass": "testing",
            },
            credentials: "include",
            body: JSON.stringify(updatedSettings),
          }
        );

        const data = await response.json();

        if (response.ok) {
          const featureNames = {
            ipBlocking: "IP Blocking",
            countryBlocking: "Country Blocking",
            rateLimiting: "Rate Limiting",
            suspiciousPatterns: "Pattern Detection",
          };

          showAlert(
            `${featureNames[featureName]} ${
              newValue ? "enabled" : "disabled"
            } successfully!`
          );

          // Refresh other data if needed (but don't refetch settings - optimistic update already worked)
          if (featureName === "ipBlocking" || featureName === "rateLimiting") {
            fetchStats();
          }
        } else {
          showAlert(data.message || "Error toggling feature", "error");
          // Revert the optimistic update on error (same pattern as AdminPlugins)
          setSettings((prevSettings) => ({
            ...prevSettings,
            features: {
              ...prevSettings.features,
              [featureName]: !newValue, // Revert back
            },
          }));
        }
      } catch (error) {
        showAlert("Error toggling feature", "error");
        console.error("Error:", error);
        // Revert the optimistic update on error (same pattern as AdminPlugins)
        setSettings((prevSettings) => ({
          ...prevSettings,
          features: {
            ...prevSettings.features,
            [featureName]: !newValue, // Revert back
          },
        }));
      }
    },
    [settings]
  );

  const saveSettings = async (settingsToSave) => {
    setSavingSettings(true);

    // Combine settings from the form with the existing feature toggles
    const finalSettings = {
      ...settings, // Contains the latest feature toggles
      ...settingsToSave, // Contains settings from the form
    };

    try {
      // Check if IP blocking is being disabled
      const currentSettings = await fetch(
        `${getBackendUrl()}/api/firewall/settings`,
        {
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );

      let shouldUnblockAllIPs = false;
      if (currentSettings.ok) {
        const currentData = await currentSettings.json();
        const wasIPBlockingEnabled = currentData.data?.features?.ipBlocking;
        const isIPBlockingBeingDisabled =
          wasIPBlockingEnabled && !finalSettings.features.ipBlocking;
        shouldUnblockAllIPs = isIPBlockingBeingDisabled;
      }

      const response = await fetch(`${getBackendUrl()}/api/firewall/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Admin-Bypass": "testing",
        },
        credentials: "include",
        body: JSON.stringify(finalSettings),
      });

      if (response.ok) {
        let message = "Settings saved successfully!";

        // If IP blocking was disabled, unblock all IPs
        if (shouldUnblockAllIPs) {
          try {
            const unblockResponse = await fetch(
              `${getBackendUrl()}/api/firewall/blocked-ips/unblock-all`,
              {
                method: "POST",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  "X-Admin-Bypass": "testing",
                },
              }
            );

            if (unblockResponse.ok) {
              const unblockData = await unblockResponse.json();
              message = `Settings saved successfully! ${
                unblockData.message || "All blocked IPs have been unblocked."
              }`;
              // Note: Blocked IPs are now handled through firewall rules
              await fetchRules();
            } else {
              message =
                "Settings saved, but failed to unblock all IPs. Please manually review blocked IPs.";
            }
          } catch (unblockError) {
            console.error("Error unblocking all IPs:", unblockError);
            message =
              "Settings saved, but failed to unblock all IPs. Please manually review blocked IPs.";
          }
        }

        showAlert(message, "success");
        // Refresh settings from server to ensure consistency
        await fetchSettings();
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

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRules(),
      fetchLogs(),
      fetchSettings(),
    ]);
    setLoading(false);
  }, []);

  // Handle dashboard settings changes
  const handleDashboardSettingChange = (setting, value) => {
    setDashboardSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  // Handle tab change with persistence
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    // Check authentication status first
    const checkAuth = async () => {
      try {
        console.log("=== CHECKING AUTHENTICATION ===");

        // Test firewall ping (no auth required)
        const pingResponse = await fetch(
          `${getBackendUrl()}/api/firewall/ping`,
          {
            credentials: "include",
            headers: {
              "X-Admin-Bypass": "testing",
            },
          }
        );
        const pingData = await pingResponse.json();
        console.log("Firewall ping:", pingData);

        // Test main auth endpoint
        const authResponse = await fetch(`${getBackendUrl()}/api/auth/status`, {
          credentials: "include",
        });
        const authData = await authResponse.json();
        console.log("Auth status:", authData);

        // Test admin endpoint
        const adminResponse = await fetch(`${getBackendUrl()}/api/admin/user`, {
          credentials: "include",
        });
        console.log("Admin endpoint status:", adminResponse.status);
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          console.log("Admin data:", adminData);
        } else {
          const adminError = await adminResponse.json();
          console.log("Admin error:", adminError);
        }

        // Test firewall debug endpoint
        const firewallResponse = await fetch(
          `${getBackendUrl()}/api/firewall/debug/session`,
          {
            credentials: "include",
            headers: {
              "X-Admin-Bypass": "testing",
            },
          }
        );
        const firewallData = await firewallResponse.json();
        console.log("Firewall session debug:", firewallData);

        console.log("=== END AUTH CHECK ===");
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth().then(() => {
      loadData();
    });
    // Auto-refresh removed - data will only load on initial mount
  }, [loadData]);

  // Alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });
    setTimeout(
      () => setAlert({ show: false, message: "", severity: "success" }),
      5000
    );
  };

  // Rule management
  const handleSaveRule = async (formData, existingRule) => {
    try {
      console.log("handleSaveRule called with:", { formData, existingRule });

      const url = existingRule
        ? `${getBackendUrl()}/api/firewall/rules/${existingRule._id}`
        : `${getBackendUrl()}/api/firewall/rules`;
      const method = existingRule ? "PUT" : "POST";

      console.log("API call details:", {
        url,
        method,
        isUpdate: !!existingRule,
      });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Admin-Bypass": "testing",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      console.log("Rule save request sent:", {
        url,
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Admin-Bypass": "testing",
        },
        body: formData,
      });

      if (response.ok) {
        showAlert(`Rule ${existingRule ? "updated" : "created"} successfully!`);
        setShowRuleModal(false);
        setSelectedRule(null);
        setRuleForm({
          name: "",
          type: "ip_block",
          value: "",
          action: "block",
          enabled: true,
          priority: 100,
          description: "",
        });
        await fetchRules();
        // Refresh dashboard stats to show updated counts
        await fetchStats();
        setRulesVersion((v) => v + 1); // Force re-render
        return true; // Indicate success to dialog
      } else {
        const error = await response.json();
        showAlert(error.message || "Error saving rule", "error");
        return false; // Indicate failure to dialog
      }
    } catch (error) {
      showAlert("Error saving rule", "error");
      return false; // Indicate failure to dialog
    }
  };

  const handleDeleteRule = async (ruleId) => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/rules/${ruleId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );

      if (response.ok) {
        showAlert("Rule deleted successfully!");
        await fetchRules();
        // Refresh dashboard stats to show updated counts
        await fetchStats();
      } else {
        showAlert("Error deleting rule", "error");
      }
    } catch (error) {
      showAlert("Error deleting rule", "error");
    }
  };

  // Delete rule without refreshing (for bulk operations)
  const deleteRuleWithoutRefresh = async (ruleId) => {
    console.log(`[Frontend] Deleting rule ID: ${ruleId}`);
    console.log(
      `[Frontend] DELETE URL: ${getBackendUrl()}/api/firewall/rules/${ruleId}`
    );

    const response = await fetch(
      `${getBackendUrl()}/api/firewall/rules/${ruleId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`[Frontend] DELETE response status: ${response.status}`);
    console.log(`[Frontend] DELETE response ok: ${response.ok}`);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage =
          error.message || `HTTP ${response.status}: ${response.statusText}`;
        console.log(`[Frontend] DELETE error details:`, error);
      } catch (parseError) {
        console.log(`[Frontend] Failed to parse error response:`, parseError);
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log(`[Frontend] DELETE success:`, result);
    return result;
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setRuleForm({
      name: rule.name,
      type: rule.type,
      value: rule.value,
      action: rule.action,
      enabled: rule.enabled,
      priority: rule.priority,
      description: rule.description || "",
    });
    setShowRuleModal(true);
  };

  const handleAddNewRule = () => {
    setSelectedRule(null);
    setRuleForm({
      name: "",
      type: "ip_block",
      value: "",
      action: "block",
      enabled: true,
      priority: 100,
      description: "",
    });
    setShowRuleModal(true);
  };

  // IP blocking
  const handleBlockIP = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/blocked-ips`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
          body: JSON.stringify(blockForm),
        }
      );

      if (response.ok) {
        showAlert("IP blocked successfully!");
        setShowBlockModal(false);
        setBlockForm({
          ip: "",
          reason: "",
          permanent: false,
          expiresIn: 3600,
        });
        fetchRules(); // Refresh rules to show new IP block rule
      } else {
        const error = await response.json();
        showAlert(error.message || "Error blocking IP", "error");
      }
    } catch (error) {
      showAlert("Error blocking IP", "error");
    }
  };

  // Add common firewall rules for quick setup
  const handleAddCommonRules = async () => {
    console.log(
      "[FirewallAdmin] handleAddCommonRules triggered. Sending request to backend..."
    );
    setAddingCommonRules(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/rules/add-common`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showAlert(result.message, "success");
        // Refresh rules list to show new rules
        await fetchRules();
        // Refresh dashboard stats to show updated counts
        await fetchStats();
        setRulesVersion((v) => v + 1); // Force re-render
      } else {
        showAlert(result.message || "Failed to add common rules.", "error");
      }
    } catch (error) {
      console.error("Error adding common rules:", error);
      showAlert("A network error occurred while adding common rules.", "error");
    } finally {
      setAddingCommonRules(false);
    }
  };

  // Confirm and proceed with threat feed import
  const handleConfirmThreatFeedImport = async () => {
    setShowThreatFeedDialog(false);
    setThreatFeedDialogData(null);
    // Proceed with the import without the check
    await performThreatFeedImport();
  };

  // Cancel threat feed import
  const handleCancelThreatFeedImport = () => {
    setShowThreatFeedDialog(false);
    setThreatFeedDialogData(null);
    showAlert("Threat feed import cancelled by user.", "info");
  };

  // Actual threat feed import logic (extracted for reuse)
  const performThreatFeedImport = async () => {
    setImportingThreats(true);

    try {
      showAlert(
        "Importing threat feeds from Spamhaus DROP and Emerging Threats (as documented in README)...",
        "info"
      );

      const response = await fetch(
        `${getBackendUrl()}/api/firewall/threat-intel/import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
        }
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          const { imported, feeds } = result.data;

          // Create detailed success message showing which services were used
          let message = `Successfully imported ${imported} threat intelligence rules! `;

          if (feeds && feeds.length > 0) {
            const feedDetails = feeds
              .map((feed) => `${feed.name}: ${feed.count || 0} IPs`)
              .join(", ");
            message += `Sources: ${feedDetails}`;
          }

          message +=
            " | Services used: Spamhaus DROP (unlimited), Emerging Threats (unlimited)";

          if (result.data.details) {
            message += ` | Details: ${result.data.details.join(", ")}`;
          }

          // Add note about automatic duplicate handling
          message +=
            " | Note: Duplicates are automatically skipped to prevent conflicts.";

          const existingThreatRules = rules.filter(
            (rule) =>
              rule.source === "threat_intel" ||
              rule.name?.toLowerCase().includes("threat feed")
          );

          if (existingThreatRules.length > 0) {
            message += ` You now have ${
              existingThreatRules.length + imported
            } total threat intel rules.`;
          }

          showAlert(message, "success");

          // Refresh rules list to show new threat intelligence rules
          await fetchRules();
          // Refresh dashboard stats to show updated counts
          await fetchStats();
        } else {
          showAlert(
            `Import completed with warnings: ${result.message}${
              result.data?.hint ? ` | Hint: ${result.data.hint}` : ""
            }`,
            "warning"
          );
        }
      } else {
        const error = await response.json();
        showAlert(
          `Failed to import threat feeds: ${
            error.message || "Unknown error"
          }. Check README.md for supported services (Spamhaus, Emerging Threats, AbuseIPDB, VirusTotal).`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error importing threat feeds:", error);
      showAlert(
        "Network error while importing threat feeds. Verify internet connection and that the documented services (Spamhaus DROP, Emerging Threats) are accessible.",
        "error"
      );
    } finally {
      setImportingThreats(false);
    }
  };

  // Import threat intelligence feeds as firewall rules
  const handleImportThreatFeeds = async () => {
    // Check for existing threat intelligence rules before starting
    const existingThreatRules = rules.filter(
      (rule) =>
        rule.source === "threat_intel" ||
        rule.name?.toLowerCase().includes("threat feed") ||
        rule.description?.toLowerCase().includes("spamhaus") ||
        rule.description?.toLowerCase().includes("emerging threats")
    );

    if (existingThreatRules.length > 50) {
      setThreatFeedDialogData({
        existingCount: existingThreatRules.length,
      });
      setShowThreatFeedDialog(true);
      return;
    }

    // Proceed directly if not too many existing rules
    await performThreatFeedImport();
  };

  const handleTestBypass = async () => {
    setTesting(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/test-bypass`,
        {
          credentials: "include",
          headers: { "X-Admin-Bypass": "testing" },
        }
      );
      const data = await response.json();
      setTestResult({
        success: response.ok,
        title: "Localhost Bypass Test Result",
        message: data.message,
        ip: data.ip,
      });
    } catch (error) {
      setTestResult({
        success: false,
        title: "Localhost Bypass Test Failed",
        message:
          "The test could not be completed due to a network error. Ensure the server is running.",
      });
    }
    setShowTestResultModal(true);
    setTesting(false);
  };

  const handleLiveAttackTest = async () => {
    setTesting(true);
    const attackPattern = "<script>alert('xss')</script>";
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/test-rule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
          body: JSON.stringify({ attackPattern }),
        }
      );

      const data = await response.json();

      setTestResult({
        success: data.success,
        title: data.success
          ? "Live Attack Test Successful"
          : "Live Attack Test Failed",
        message: data.message,
      });

      // Refresh all components after the test - this will update logs, stats, and rules
      console.log(
        "[Live Attack Test] Refreshing dashboard, logs, and rules..."
      );
      await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
      console.log("[Live Attack Test] All components refreshed successfully");
    } catch (error) {
      setTestResult({
        success: false,
        title: "Live Attack Test Failed",
        message:
          "A network error occurred. Please check the server connection and try again.",
      });
      console.error("Rule test error:", error);

      // Still refresh components even if the test failed, in case logs were generated
      try {
        await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
      } catch (refreshError) {
        console.error(
          "Error refreshing components after failed test:",
          refreshError
        );
      }
    }
    setShowTestResultModal(true);
    setTesting(false);
  };

  const handleTestRule = async (ruleId) => {
    const rule = rules.find((r) => r._id === ruleId);
    if (!rule) {
      showAlert("Could not find the selected rule.", "error");
      return;
    }

    try {
      const attackUrl = `${getBackendUrl()}/api/firewall/test-rule?attack=${encodeURIComponent(
        rule.value
      )}`;
      const response = await fetch(attackUrl, {
        credentials: "include",
        headers: {
          "User-Agent": rule.value, // Also include in User-Agent for pattern matching
        },
      });

      if (response.status === 403) {
        showAlert(
          `Rule Test SUCCESS: The firewall correctly blocked the request for rule "${rule.name}".`,
          "success"
        );
      } else {
        const data = await response.json();
        showAlert(
          data.message ||
            `Rule Test FAILED: The firewall did not block the request for rule "${rule.name}".`,
          "error"
        );
      }

      // Refresh all components after the rule test to show updated logs and stats
      console.log(
        `[Rule Test] Refreshing components after testing rule "${rule.name}"...`
      );
      await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
    } catch (error) {
      showAlert(
        `Rule Test FAILED: An unexpected error occurred. It's possible the firewall blocked the request, but the response was not a standard 403. Check the browser console and firewall logs for more details.`,
        "warning"
      );
      console.error("Rule test error:", error);

      // Still refresh components even if the test failed, in case logs were generated
      try {
        await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
      } catch (refreshError) {
        console.error(
          "Error refreshing components after failed rule test:",
          refreshError
        );
      }
    }
  };

  // Utility functions
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getActionChip = (action) => {
    const colors = {
      allowed: "success",
      blocked: "error",
      rate_limited: "warning",
      suspicious: "warning",
    };
    return (
      <Chip label={action} color={colors[action] || "default"} size="small" />
    );
  };

  const getRuleTypeChip = (type) => {
    const colors = {
      ip_block: "error",
      country_block: "warning",
      asn_block: "primary",
      rate_limit: "info",
      suspicious_pattern: "secondary",
    };
    return (
      <Chip
        label={type.replace("_", " ")}
        color={colors[type] || "default"}
        size="small"
      />
    );
  };

  // Helper functions for feature states
  const isFeatureEnabled = (featureName) => {
    return (settings.features && settings.features[featureName]) || false;
  };

  const getDisabledStyle = (enabled) => ({
    opacity: enabled ? 1 : 0.5,
    pointerEvents: enabled ? "auto" : "none",
    filter: enabled ? "none" : "grayscale(50%)",
  });

  const getDisabledRowStyle = (enabled) => ({
    opacity: enabled ? 1 : 0.6,
    backgroundColor: enabled ? "inherit" : "action.hover",
    "& *": {
      color: enabled ? "inherit" : "text.disabled",
    },
  });

  const getRuleTypeEnabled = (type) => {
    switch (type) {
      case "ip_block":
        return isFeatureEnabled("ipBlocking");
      case "country_block":
        return isFeatureEnabled("countryBlocking");
      case "asn_block":
        return isFeatureEnabled("ipBlocking"); // ASN blocking follows IP blocking feature
      case "rate_limit":
        return isFeatureEnabled("rateLimiting");
      case "suspicious_pattern":
        return isFeatureEnabled("suspiciousPatterns");
      default:
        return true;
    }
  };

  const getFeatureTooltip = (featureName) => {
    const tooltips = {
      ipBlocking: "IP blocking is currently disabled in Feature Controls",
      countryBlocking:
        "Country blocking is currently disabled in Feature Controls",
      rateLimiting: "Rate limiting is currently disabled in Feature Controls",
      suspiciousPatterns:
        "Pattern detection is currently disabled in Feature Controls",
    };
    return tooltips[featureName] || "This feature is disabled";
  };

  // Memoized expensive computations to prevent animation interruption
  const hasAnyFeatureEnabled = useMemo(() => {
    if (!settings.features || typeof settings.features !== "object") {
      return true; // Default to true if features object doesn't exist
    }
    return Object.values(settings.features).some((f) => f);
  }, [settings.features]);

  const activeBlockedIpsCount = useMemo(() => {
    // Calculate from rules with source "manual" and type "ip_block" (enabled)
    if (!Array.isArray(rules)) return 0;
    return rules.filter(
      (rule) =>
        rule.source === "manual" &&
        rule.type === "ip_block" &&
        rule.enabled !== false
    ).length;
  }, [rules]);

  // Show loading screen only during initial load
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
    <Container maxWidth="xxlg" sx={{ my: 4 }}>
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
        <Typography variant="h4">Firewall Administration</Typography>
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
            You need to be logged in as an admin user to access the firewall
            administration panel. Please log in with an admin account
            (ralphdp21@gmail.com) using regular login, Google, or GitHub
            authentication.
          </Typography>
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Firewall navigation tabs"
        >
          <Tab
            icon={<ChartIcon />}
            label="Dashboard"
            id="firewall-tab-0"
            aria-controls="firewall-tabpanel-0"
          />
          <Tab
            icon={<ShieldIcon />}
            label={`Firewall Rules (${
              Array.isArray(rules) ? rules.length : 0
            })`}
            id="firewall-tab-1"
            aria-controls="firewall-tabpanel-1"
          />
          <Tab
            icon={<EyeIcon />}
            label={`Logs (${Array.isArray(logs) ? logs.length : 0})`}
            id="firewall-tab-2"
            aria-controls="firewall-tabpanel-2"
          />
          <Tab
            icon={<SettingsIcon />}
            label="Settings"
            id="firewall-tab-3"
            aria-controls="firewall-tabpanel-3"
          />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
        <FirewallAdminDashboard
          stats={stats}
          isFeatureEnabled={isFeatureEnabled}
          getFeatureTooltip={getFeatureTooltip}
          getDisabledStyle={getDisabledStyle}
          dashboardSettings={dashboardSettings}
          onSettingsChange={handleDashboardSettingChange}
        />
      </TabPanel>

      {/* Rules Tab */}
      <TabPanel value={activeTab} index={1}>
        <FirewallAdminRules
          key={rulesVersion}
          rules={rules}
          hasAnyFeatureEnabled={hasAnyFeatureEnabled}
          isFeatureEnabled={isFeatureEnabled}
          getFeatureTooltip={getFeatureTooltip}
          getDisabledStyle={getDisabledStyle}
          getDisabledRowStyle={getDisabledRowStyle}
          getRuleTypeEnabled={getRuleTypeEnabled}
          getRuleTypeChip={getRuleTypeChip}
          formatDate={formatDate}
          handleEditRule={handleEditRule}
          handleAddNewRule={handleAddNewRule}
          handleDeleteRule={handleDeleteRule}
          deleteRuleWithoutRefresh={deleteRuleWithoutRefresh}
          fetchRules={fetchRules}
          fetchStats={fetchStats}
          setShowRuleModal={setShowRuleModal}
          setShowReferenceModal={setShowReferenceModal}
          handleAddCommonRules={handleAddCommonRules}
          addingCommonRules={addingCommonRules}
          handleImportThreatFeeds={handleImportThreatFeeds}
          importingThreats={importingThreats}
        />
      </TabPanel>

      {/* Logs Tab */}
      <TabPanel value={activeTab} index={2}>
        <FirewallAdminLogs
          logs={logs}
          formatDate={formatDate}
          getActionChip={getActionChip}
          fetchLogs={fetchLogs}
        />
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={3}>
        <FirewallAdminSettings
          initialSettings={settings}
          savingSettings={savingSettings}
          saveSettings={saveSettings}
          showAlert={showAlert}
          defaultSettings={defaultSettings}
          rules={rules}
          onTestBypass={handleTestBypass}
          onTestRule={handleLiveAttackTest}
          testing={testing}
          fetchRules={fetchRules}
        />
      </TabPanel>

      {/* Rule Modal */}
      <RuleEditorDialog
        open={showRuleModal}
        onClose={() => {
          setShowRuleModal(false);
          setRuleForm({
            name: "",
            type: "ip_block",
            value: "",
            action: "block",
            enabled: true,
            priority: 100,
            description: "",
          });
        }}
        onSave={handleSaveRule}
        rule={selectedRule || ruleForm}
      />

      {/* Block IP Modal */}
      <Dialog
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Block IP Address</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IP Address"
                id="ip-address"
                name="ip-address"
                value={blockForm.ip}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, ip: e.target.value })
                }
                placeholder="192.168.1.1"
                required
                error={!blockForm.ip}
                helperText={!blockForm.ip ? "IP address is required" : ""}
                autoFocus
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Blocking"
                id="reason"
                name="reason"
                value={blockForm.reason}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, reason: e.target.value })
                }
                placeholder="Reason for blocking"
                required
                error={!blockForm.reason}
                helperText="A brief, clear reason for the block"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    id="permanent-block"
                    name="permanent-block"
                    checked={blockForm.permanent}
                    onChange={(e) =>
                      setBlockForm({
                        ...blockForm,
                        permanent: e.target.checked,
                      })
                    }
                  />
                }
                label="Permanent Block"
              />
            </Grid>
            {!blockForm.permanent && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expires In (seconds)"
                  id="expires-in"
                  name="expires-in"
                  value={blockForm.expiresIn}
                  onChange={(e) =>
                    setBlockForm({
                      ...blockForm,
                      expiresIn: parseInt(e.target.value),
                    })
                  }
                  inputProps={{ min: 60 }}
                  helperText="Default: 3600 seconds (1 hour)"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBlockModal(false)}>Cancel</Button>
          <Button
            onClick={handleBlockIP}
            variant="contained"
            color="error"
            disabled={!blockForm.ip || !blockForm.reason}
          >
            Block IP
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reference Modal */}
      <Dialog
        open={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: "90vh" },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon />
            <Typography variant="h6">Firewall Reference Guide</Typography>
          </Box>
        </DialogTitle>
        <DialogContent
          sx={{
            // Dark mode friendly scrollbars
            "&::-webkit-scrollbar": {
              width: "8px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "action.hover",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "text.secondary",
              borderRadius: "4px",
              "&:hover": {
                backgroundColor: "text.primary",
              },
            },
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={referenceTab}
              onChange={(e, newValue) => setReferenceTab(newValue)}
            >
              <Tab
                icon={<FlagIcon />}
                label={`Country Codes (${countryCodes.length})`}
              />
              <Tab icon={<ChartIcon />} label="Rate Limiting" />
              <Tab
                icon={<CodeIcon />}
                label={`Pattern Examples (${patternExamples.length})`}
              />
            </Tabs>
          </Box>

          {/* Country Codes Tab */}
          {referenceTab === 0 && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  id="country-search"
                  name="country-search"
                  placeholder="Search by country name or code..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Use these 2-letter country codes in your firewall rules. For
                example, to block all traffic from China, create a rule with
                type "Country Block" and value "CN".
              </Typography>

              <Paper
                sx={{
                  maxHeight: "100%",
                  overflow: "auto",
                  // Dark mode friendly scrollbars
                  "&::-webkit-scrollbar": {
                    width: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "action.hover",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "text.secondary",
                    borderRadius: "4px",
                    "&:hover": {
                      backgroundColor: "text.primary",
                    },
                  },
                }}
              >
                <List
                  dense
                  sx={{ maxHeight: "calc(90vh - 200px)", overflow: "auto" }}
                >
                  {countryCodes.map((country, index) => (
                    <React.Fragment key={country.code}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <FlagIcon />
                              <Typography variant="body1">
                                {country.name}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip
                            title={
                              <Typography variant="body2">
                                Use this country code
                              </Typography>
                            }
                            arrow
                          >
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedRule(null);
                                setRuleForm({
                                  name: `Block ${country.name}`,
                                  type: "country_block",
                                  value: country.code,
                                  action: "block",
                                  enabled: true,
                                  priority: 100,
                                  description: `Block all traffic from ${country.name}`,
                                });
                                setShowReferenceModal(false);
                                setShowRuleModal(true);
                              }}
                              startIcon={<FlagIcon />}
                            >
                              Use Code
                            </Button>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < countryCodes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>

              {countryCodes.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 4 }}
                >
                  No countries found matching "{countrySearch}"
                </Typography>
              )}
            </Box>
          )}

          {/* Rate Limiting Tab */}
          {referenceTab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                These are common rate limiting scenarios to protect your
                application from abuse. Rate limiting rules control how many
                requests can be made to specific endpoints within a given time
                period.{" "}
                <strong>
                  Individual rate limit rules OVERRIDE the global rate limiting
                  settings
                </strong>{" "}
                from the Settings tab for their specific URL patterns, allowing
                you to set custom limits per endpoint.
              </Typography>

              <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
                {rateLimitExamples.map((category, categoryIndex) => (
                  <Grid
                    item
                    xs={12}
                    md={6}
                    key={categoryIndex}
                    sx={{ display: "flex" }}
                  >
                    <Card
                      sx={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardHeader
                        title={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <ChartIcon color="primary" />
                            <Typography variant="h6">
                              {category.category}
                            </Typography>
                            <Chip
                              label={category.scenarios.length}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        }
                      />
                      <CardContent sx={{ flexGrow: 1, pt: 1 }}>
                        <List dense>
                          {category.scenarios.map((scenario, scenarioIndex) => (
                            <ListItem
                              key={scenarioIndex}
                              divider={
                                scenarioIndex < category.scenarios.length - 1
                              }
                              sx={{
                                flexDirection: "column",
                                alignItems: "flex-start",
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    {scenario.name}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {scenario.description}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      component="code"
                                      sx={{
                                        p: 0.5,
                                        borderRadius: 1,
                                        fontSize: "0.8rem",
                                        bgcolor: "action.hover",
                                        display: "block",
                                        mb: 1,
                                      }}
                                    >
                                      Path: {scenario.value}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        gap: 1,
                                        flexWrap: "wrap",
                                      }}
                                    >
                                      <Chip
                                        label={`${scenario.requestsPerMinute}/min`}
                                        size="small"
                                        color="warning"
                                      />
                                      <Chip
                                        label={`${scenario.requestsPerHour}/hour`}
                                        size="small"
                                        color="info"
                                      />
                                    </Box>
                                  </Box>
                                }
                              />
                              <Box
                                sx={{
                                  alignSelf: "flex-start",
                                  mt: 1,
                                  mb: 3,
                                }}
                              >
                                <Tooltip
                                  title={
                                    <Typography variant="body2">
                                      Use this rate limiting rule
                                    </Typography>
                                  }
                                  arrow
                                >
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => {
                                      setSelectedRule(null);
                                      setRuleForm({
                                        name: scenario.name,
                                        type: "rate_limit",
                                        value: scenario.value,
                                        action: "rate_limit",
                                        enabled: true,
                                        priority: 50,
                                        description: `${scenario.description} - ${scenario.requestsPerMinute} requests/min, ${scenario.requestsPerHour} requests/hour - OVERRIDES global rate limits for this pattern`,
                                      });
                                      setShowReferenceModal(false);
                                      setShowRuleModal(true);
                                    }}
                                    startIcon={<ChartIcon />}
                                  >
                                    Use Rule
                                  </Button>
                                </Tooltip>
                              </Box>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box
                sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <HelpIcon />
                  Rate Limiting Tips
                </Typography>
                <Typography variant="body2" component="div">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>
                      <strong>Rule Priority:</strong> Individual rate limit
                      rules override the global settings (50/min, 400/hour) for
                      their specific patterns
                    </li>
                    <li>
                      Use wildcard patterns like <code>*/api/*</code> to match
                      multiple endpoints
                    </li>
                    <li>
                      Set stricter limits for sensitive endpoints (auth, admin,
                      etc.) - they'll override the global defaults
                    </li>
                    <li>
                      Consider different limits for authenticated vs anonymous
                      users
                    </li>
                    <li>
                      Monitor your application's normal traffic patterns before
                      setting limits
                    </li>
                    <li>Rate limits are applied per IP address</li>
                    <li>
                      Higher priority rules (lower number) are processed first
                    </li>
                    <li>
                      Lower values provide stronger protection but may affect
                      legitimate users
                    </li>
                    <li>
                      Test your rate limits thoroughly before enabling in
                      production
                    </li>
                  </ul>
                </Typography>
              </Box>
            </Box>
          )}

          {/* Pattern Examples Tab */}
          {referenceTab === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                These are common patterns used to detect suspicious requests.
                You can use these regex patterns in "Suspicious Pattern" rules
                to block malicious traffic.
              </Typography>

              <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
                {patternExamples.map((category, categoryIndex) => (
                  <Grid
                    item
                    xs={12}
                    md={6}
                    key={categoryIndex}
                    sx={{ display: "flex" }}
                  >
                    <Card
                      sx={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <CardHeader
                        title={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <SecurityIcon color="primary" />
                            <Typography variant="h6">
                              {category.category}
                            </Typography>
                            <Chip
                              label={category.patterns.length}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        }
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <List dense>
                          {category.patterns.map((pattern, patternIndex) => (
                            <ListItem
                              key={patternIndex}
                              divider={
                                patternIndex < category.patterns.length - 1
                              }
                            >
                              <ListItemText
                                primary={
                                  <Typography
                                    variant="body2"
                                    component="code"
                                    sx={{
                                      bgcolor: "action.hover",
                                      p: 0.5,
                                      borderRadius: 1,
                                      fontSize: "0.8rem",
                                    }}
                                  >
                                    {pattern}
                                  </Typography>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Tooltip
                                  title={
                                    <Typography variant="body2">
                                      Use this pattern
                                    </Typography>
                                  }
                                  arrow
                                >
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedRule(null);
                                      setRuleForm({
                                        name: `Block ${
                                          category.category
                                        } - ${pattern.substring(0, 20)}...`,
                                        type: "suspicious_pattern",
                                        value: pattern,
                                        action: "block",
                                        enabled: true,
                                        priority: 75,
                                        description: `Blocks requests matching ${category.category.toLowerCase()} pattern`,
                                      });
                                      setShowReferenceModal(false);
                                      setShowRuleModal(true);
                                    }}
                                  >
                                    <PlusIcon />
                                  </IconButton>
                                </Tooltip>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box
                sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <HelpIcon />
                  Pattern Tips
                </Typography>
                <Typography variant="body2" component="div">
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>Patterns are case-insensitive by default</li>
                    <li>
                      Use <code>.*</code> to match any characters
                    </li>
                    <li>
                      Use <code>\\.</code> to match literal dots
                    </li>
                    <li>
                      Use <code>^</code> to match start of string
                    </li>
                    <li>
                      Use <code>$</code> to match end of string
                    </li>
                    <li>Test your patterns carefully before enabling</li>
                  </ul>
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReferenceModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* IP Blocking Disable Confirmation Dialog */}
      <Dialog
        open={showIPBlockingDisableDialog}
        onClose={() => {
          setShowIPBlockingDisableDialog(false);
          setPendingSettings(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <NotInterestedIcon color="warning" />
            <Typography variant="h6">Disable IP Blocking</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              You are about to disable IP blocking. This will automatically
              unblock all currently blocked IP addresses.
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>
                  {activeBlockedIpsCount} IP address
                  {activeBlockedIpsCount !== 1 ? "es" : ""}
                  will be deactivated
                </strong>{" "}
                when you proceed. The IPs will remain visible in the table but
                marked as inactive.
              </Typography>
            </Alert>
            <Typography variant="body2" color="text.secondary">
              This ensures that when IP blocking is re-enabled, no legitimate
              traffic is inadvertently blocked by outdated rules.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowIPBlockingDisableDialog(false);
              setPendingSettings(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (pendingSettings) {
                setSettings(pendingSettings);
              }
              setShowIPBlockingDisableDialog(false);
              setPendingSettings(null);
            }}
            variant="contained"
            color="warning"
            startIcon={<NotInterestedIcon />}
          >
            Disable & Unblock All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Threat Feed Import Confirmation Dialog */}
      <Dialog
        open={showThreatFeedDialog}
        onClose={handleCancelThreatFeedImport}
        maxWidth="sm"
        fullWidth
        aria-labelledby="threat-feed-dialog-title"
        aria-describedby="threat-feed-dialog-description"
      >
        <DialogTitle
          id="threat-feed-dialog-title"
          sx={{
            backgroundColor: "warning.main",
            color: "warning.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningIcon />
          High Volume Import Warning
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText
            id="threat-feed-dialog-description"
            component="div"
            sx={{ mt: 2 }}
          >
            <Typography
              variant="body1"
              gutterBottom
              sx={{ fontWeight: "bold", color: "warning.main" }}
            >
              You already have {threatFeedDialogData?.existingCount || 0} threat
              intelligence rules installed!
            </Typography>
            <Typography variant="body2" paragraph>
              Importing additional threat feeds may:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                Add duplicate entries to your database
              </Typography>
              <Typography component="li" variant="body2">
                Exceed database storage limits
              </Typography>
              <Typography component="li" variant="body2">
                Slow down rule processing performance
              </Typography>
              <Typography component="li" variant="body2">
                Create maintenance overhead
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[800]
                    : theme.palette.info.light,
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.info.light
                    : theme.palette.info.dark,
                borderRadius: 1,
                border: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[700]
                      : theme.palette.info.main
                  }`,
              }}
            >
              <strong>Recommendation:</strong> Consider reviewing and cleaning
              up existing threat intelligence rules before importing more feeds.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCancelThreatFeedImport}
            variant="outlined"
            color="primary"
            size="large"
          >
            Cancel Import
          </Button>
          <Button
            onClick={handleConfirmThreatFeedImport}
            variant="contained"
            color="warning"
            size="large"
            startIcon={<WarningIcon />}
            autoFocus
          >
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showTestResultModal}
        onClose={() => setShowTestResultModal(false)}
      >
        <DialogTitle
          sx={{
            backgroundColor: testResult.success ? "success.main" : "error.main",
            color: "common.white",
          }}
        >
          {testResult.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText sx={{ mt: 2 }}>
            {testResult.message}
          </DialogContentText>
          {testResult.ip && (
            <DialogContentText sx={{ mt: 2 }}>
              <strong>Detected IP:</strong> {testResult.ip}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTestResultModal(false)} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FirewallAdmin;
