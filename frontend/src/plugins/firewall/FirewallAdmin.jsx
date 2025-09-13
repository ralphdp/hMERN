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
  BugReport as BugReportIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import FirewallLocalStorage from "../../utils/localStorage";
import FirewallAdminDashboard from "./components/FirewallAdminDashboard";
import FirewallAdminRules from "./components/FirewallAdminRules";
import FirewallAdminLogs from "./components/FirewallAdminLogs";
import FirewallAdminSettings from "./components/FirewallAdminSettings";
import FirewallAdminConfigurations from "./components/FirewallAdminConfigurations";
import {
  countryCodes,
  patternExamples,
  rateLimitExamples,
} from "./constants/firewallConstants";
import { useFirewallRules } from "./hooks/useFirewallRules";
import { useFirewallLogs } from "./hooks/useFirewallLogs";
import { useFirewallSettings } from "./hooks/useFirewallSettings";
import { useFirewallStats } from "./hooks/useFirewallStats";
import { useFirewallData } from "./hooks/useFirewallData";
import RuleEditorDialog from "./dialogs/RuleEditorDialog";
import ReferenceDialog from "./dialogs/ReferenceDialog";
import BlockIPDialog from "./dialogs/BlockIPDialog";
import ThreatFeedImportDialog from "./dialogs/ThreatFeedImportDialog";
import IPBlockingDisableDialog from "./dialogs/IPBlockingDisableDialog";
import TestResultDialog from "./dialogs/TestResultDialog";
import {
  formatDate,
  getActionChip,
  getRuleTypeChip,
  isFeatureEnabled,
  getDisabledStyle,
  getDisabledRowStyle,
  getRuleTypeEnabled,
  getFeatureTooltip,
  getThemeIcon,
  formatMessage,
  getActiveBlockedIpsCount,
} from "./utils/firewallUtils";
import {
  FirewallSnackbarProvider,
  useFirewallSnackbar,
} from "./components/FirewallSnackbarProvider";

// Initialize logger for firewall admin
const logger = createLogger("FirewallAdmin");

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
  developmentMode: {
    enabled: false,
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

const FirewallAdminContent = () => {
  const navigate = useNavigate();

  // Use the centralized data management hook
  const {
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
    apiCall,
    rawApiCall,
    fetchStats,
    fetchRules,
    fetchLogs,
    fetchLogCount,
    fetchSettings,
    loadInitialData,
    saveSettings,
    handleDashboardSettingChange,
    setRules,
    setLogs,
    setStats,
    setSettings,
    setRulesVersion,
  } = useFirewallData();

  // Initialize states from localStorage
  const [activeTab, setActiveTab] = useState(() =>
    FirewallLocalStorage.getLastActiveTab()
  );

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

  const [addingCommonRules, setAddingCommonRules] = useState(false);
  const [importingThreats, setImportingThreats] = useState(false);
  const [advancedTesting, setAdvancedTesting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Advanced Rule Testing Results Modal (for Rules tab)
  const [advancedTestResults, setAdvancedTestResults] = useState(null);
  const [showAdvancedTestResultsModal, setShowAdvancedTestResultsModal] =
    useState(false);

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

  // Save active tab to localStorage when it changes
  React.useEffect(() => {
    FirewallLocalStorage.setLastActiveTab(activeTab);
  }, [activeTab]);

  // Save dashboard settings to localStorage when they change
  React.useEffect(() => {
    FirewallLocalStorage.setDashboardSettings(dashboardSettings);
  }, [dashboardSettings]);

  // Load initial data on mount - the hook handles this internally

  // Function to reload configuration features (but not override settings)
  const reloadConfiguration = async () => {
    try {
      logger.debug("Reloading configuration...");
      const configData = await apiCall("config");

      // Extract additional features from configuration (not basic firewall features)
      const features =
        configData.data.dynamic?.features || configData.data?.features;
      if (features) {
        logger.debug("Reloaded features from config", { features });
        // The hook will handle config features, no need to set them here
      }
    } catch (error) {
      logger.error("Error reloading configuration", { error: error.message });
    }
  };

  // Handle toggle changes with optimistic updates
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
            ipBlocking: "IP Blocking",
            countryBlocking: "Country Blocking",
            rateLimiting: "Rate Limiting",
            suspiciousPatterns: "Pattern Detection",
          };

          showSnackbar(
            `${featureNames[featureName]} ${
              newValue ? "enabled" : "disabled"
            } successfully!`
          );

          // Refresh other data if needed
          if (featureName === "ipBlocking" || featureName === "rateLimiting") {
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
    [settings, rawApiCall, fetchStats]
  );

  // Handle tab change with persistence and configuration reload
  const handleTabChange = async (event, newValue) => {
    const previousTab = activeTab;
    setActiveTab(newValue);

    // If switching away from Configuration tab (index 4), reload configuration
    if (previousTab === 4 && newValue !== 4) {
      logger.debug(
        "Switching away from Configuration tab, reloading config..."
      );
      await reloadConfiguration();
    }
  };

  useEffect(() => {
    // Check authentication status first
    const checkAuth = async () => {
      try {
        logger.debug("Checking authentication status");

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
        logger.debug("Firewall ping successful", { status: pingData.status });

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
  const { showSnackbar } = useFirewallSnackbar();

  // Temporary alias for compatibility
  const showAlert = showSnackbar;

  // Rule management
  const handleSaveRule = async (formData, existingRule) => {
    try {
      logger.debug("Saving rule", {
        ruleName: formData.name,
        ruleType: formData.type,
        isUpdate: !!existingRule,
      });

      const url = existingRule
        ? `${getBackendUrl()}/api/firewall/rules/${existingRule._id}`
        : `${getBackendUrl()}/api/firewall/rules`;
      const method = existingRule ? "PUT" : "POST";

      logger.debug("Making API call", {
        method,
        endpoint: url.replace(getBackendUrl(), ""),
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

      logger.debug("Rule save request sent", {
        method,
        endpoint: url.replace(getBackendUrl(), ""),
        ruleName: formData.name,
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
    logger.debug("Deleting rule", { ruleId });

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

    logger.debug("Delete response received", {
      status: response.status,
      ok: response.ok,
      ruleId,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const error = await response.json();
        errorMessage =
          error.message || `HTTP ${response.status}: ${response.statusText}`;
        logger.warn("Delete rule failed", { error, ruleId });
      } catch (parseError) {
        logger.warn("Failed to parse delete error response", {
          parseError,
          ruleId,
        });
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    logger.debug("Rule deleted successfully", { result, ruleId });
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
        const successMessage = formatMessage(uiMessages.successBlock, {
          ip: blockForm.ip,
        });
        showAlert(successMessage);
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
        const errorMessage = formatMessage(uiMessages.errorBlock, {
          ip: blockForm.ip,
          error: error.message || "Unknown error",
        });
        showAlert(errorMessage, "error");
      }
    } catch (error) {
      const errorMessage = formatMessage(uiMessages.errorBlock, {
        ip: blockForm.ip,
        error: error.message || "Network error",
      });
      showAlert(errorMessage, "error");
    }
  };

  // Add common firewall rules for quick setup
  const handleAddCommonRules = async () => {
    logger.debug("Starting common rules addition");
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
        logger.debug("Common rules added successfully", {
          count: result.count,
        });
        showAlert(result.message, "success");
        // Refresh rules list to show new rules
        await fetchRules();
        // Refresh dashboard stats to show updated counts
        await fetchStats();
        setRulesVersion((v) => v + 1); // Force re-render
      } else {
        logger.warn("Failed to add common rules", { message: result.message });
        showAlert(result.message || "Failed to add common rules.", "error");
      }
    } catch (error) {
      logger.error("Error adding common rules", { error: error.message });
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

        // Debug logging
        logger.debug("Threat import response received", {
          success: result.success,
          hasData: !!result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          message: result.message,
        });

        if (result.success) {
          try {
            const { imported, duplicatesSkipped, feeds, summary } =
              result.data || {};

            // Create detailed success message with smart duplicate feedback
            let message = `✅ Threat intelligence import completed! `;

            if (imported > 0) {
              message += `${imported} new rules imported`;
            } else {
              message += `No new rules imported`;
            }

            // Show duplicate information prominently
            if (duplicatesSkipped > 0) {
              message += `, ${duplicatesSkipped} duplicates automatically skipped`;
            }

            // Add efficiency note
            if (summary && summary.totalProcessed) {
              const efficiency = (
                (imported / summary.totalProcessed) *
                100
              ).toFixed(1);
              message += ` (${efficiency}% new from ${summary.totalProcessed} processed)`;
            }

            if (feeds && feeds.length > 0) {
              const feedDetails = feeds
                .map((feed) => `${feed.name}: ${feed.count || 0} IPs`)
                .join(", ");
              message += ` | Sources: ${feedDetails}`;
            }

            message +=
              " | Services used: Spamhaus DROP (unlimited), Emerging Threats (unlimited)";

            if (result.data?.details) {
              message += ` | Details: ${result.data.details.join(", ")}`;
            }

            // Show current total threat rules
            if (summary?.existingThreatRules !== undefined) {
              const totalThreatRules = summary.existingThreatRules + imported;
              message += ` | Total threat intel rules: ${totalThreatRules}`;
            }

            // Add smart duplicate detection note
            if (duplicatesSkipped > 0) {
              message += " | ✨ Smart duplicate detection prevented conflicts";
            }

            const alertType =
              imported > 0
                ? "success"
                : duplicatesSkipped > 0
                ? "info"
                : "warning";
            showAlert(message, alertType);

            // Refresh rules list to show new threat intelligence rules
            await fetchRules();
            // Refresh dashboard stats to show updated counts
            await fetchStats();
          } catch (dataError) {
            logger.error("Error processing threat import success data", {
              dataError: dataError.message,
              resultData: result.data,
            });
            showAlert(
              `Import successful but failed to process response data: ${dataError.message}`,
              "warning"
            );
          }
        } else {
          // Handle failed import with safe property access
          const hintText = result.data?.hint
            ? ` | Hint: ${result.data.hint}`
            : "";
          showAlert(
            `Import completed with warnings: ${result.message}${hintText}`,
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
      logger.error("Error importing threat feeds", { error: error.message });
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
    // Check if there are existing threat intelligence rules
    const existingThreatRules = rules.filter(
      (rule) =>
        rule.source === "threat_intel" ||
        rule.name?.toLowerCase().includes("threat feed") ||
        rule.name?.toLowerCase().includes("threat intelligence")
    );

    const totalExistingRules = rules.length;

    // If no existing rules at all, skip the warning and import directly
    if (totalExistingRules === 0) {
      logger.debug("No existing rules found - skipping warning dialog");
      showAlert(
        "No existing rules detected. Importing threat feeds directly...",
        "info"
      );
      await performThreatFeedImport();
      return;
    }

    // If no existing threat rules but other rules exist, skip warning but inform user
    if (existingThreatRules.length === 0) {
      logger.debug("No existing threat rules found - skipping warning dialog");
      showAlert(
        `Found ${totalExistingRules} existing firewall rules. Importing threat feeds with smart duplicate detection...`,
        "info"
      );
      await performThreatFeedImport();
      return;
    }

    // Show warning dialog only when threat intelligence rules already exist
    logger.debug("Existing threat rules found - showing warning dialog", {
      existingThreatRules: existingThreatRules.length,
      totalRules: totalExistingRules,
    });

    const threatsImportConfirm = {
      title: "Import Threat Intelligence Feeds",
      existingCount: existingThreatRules.length,
      message: (
        <Box>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will import threat intelligence data from multiple sources:
          </Typography>
          <Typography variant="body2" component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Spamhaus DROP (Don't Route Or Peer) list</li>
            <li>Emerging Threats known bad IPs</li>
            <li>Additional curated threat feeds</li>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These are free feeds that don't require API keys. The import may
            take a few minutes to complete.
          </Typography>
          <Typography
            variant="body2"
            color="primary.main"
            sx={{ fontWeight: "bold" }}
          >
            ✅ Smart duplicate detection is enabled - existing rules will be
            preserved.
          </Typography>
        </Box>
      ),
    };

    setThreatFeedDialogData(threatsImportConfirm);
    setShowThreatFeedDialog(true);
  };

  const handleAdvancedRuleTesting = async () => {
    setAdvancedTesting(true);
    try {
      logger.debug("Starting advanced rule testing");

      const response = await fetch(
        `${getBackendUrl()}/api/firewall/test-all-rules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        logger.debug("Advanced testing completed", {
          success: data.success,
          summary: data.summary,
        });

        // Store results and show modal
        setAdvancedTestResults(data);
        setShowAdvancedTestResultsModal(true);

        // Show summary alert
        if (data.success) {
          const { passed, failed, total } = data.summary;
          const message = `Advanced testing completed! ${passed}/${total} rules passed (${data.summary.successRate}% success rate)`;
          showAlert(message, passed === total ? "success" : "warning");
        } else {
          showAlert(data.message || "Advanced testing failed", "error");
        }
      } else {
        showAlert(data.message || "Failed to run advanced testing", "error");
      }
    } catch (error) {
      logger.error("Error running advanced test", { error: error.message });
      showAlert("Network error while running advanced test", "error");
    } finally {
      setAdvancedTesting(false);
    }
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
      logger.debug(
        "Refreshing dashboard, logs, and rules after live attack test"
      );
      await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
      logger.debug(
        "All components refreshed successfully after live attack test"
      );
    } catch (error) {
      setTestResult({
        success: false,
        title: "Live Attack Test Failed",
        message:
          "A network error occurred. Please check the server connection and try again.",
      });
      logger.error("Live attack test error", { error: error.message });

      // Still refresh components even if the test failed, in case logs were generated
      try {
        await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
      } catch (refreshError) {
        logger.error("Error refreshing components after failed test", {
          refreshError: refreshError.message,
        });
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
      logger.debug("Refreshing components after rule test", {
        ruleName: rule.name,
      });
      await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
    } catch (error) {
      showAlert(
        `Rule Test FAILED: An unexpected error occurred. It's possible the firewall blocked the request, but the response was not a standard 403. Check the browser console and firewall logs for more details.`,
        "warning"
      );
      logger.error("Rule test error", {
        error: error.message,
        ruleName: rule.name,
      });

      // Still refresh components even if the test failed, in case logs were generated
      try {
        await Promise.all([fetchStats(), fetchLogs(), fetchRules()]);
      } catch (refreshError) {
        logger.error("Error refreshing components after failed rule test", {
          refreshError: refreshError.message,
          ruleName: rule.name,
        });
      }
    }
  };

  // Memoized expensive computations to prevent animation interruption
  const hasAnyFeatureEnabled = useMemo(() => {
    if (!configFeatures || typeof configFeatures !== "object") {
      return true; // Default to true if features object doesn't exist
    }
    return Object.values(configFeatures).some((f) => f);
  }, [configFeatures]);

  const activeBlockedIpsCount = useMemo(() => {
    return getActiveBlockedIpsCount(rules);
  }, [rules]);

  // Early returns for loading and error states (following plugin-template pattern)
  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Firewall...</Typography>
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
            Make sure the firewall plugin is enabled and the backend is running.
          </Typography>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
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
          <Typography variant="h4">{uiMessages.title}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {uiMessages.subtitle}
          </Typography>
        </Box>
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
            You need to be logged in as an admin user to access the firewall
            administration panel. Please log in with an admin account
            (ralphdp21@gmail.com) using regular login, Google, or GitHub
            authentication.
          </Typography>
        </Alert>
      )}

      {/* Development Mode Warning - Always visible when active */}
      {settings.developmentMode?.enabled && (
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            border: "2px solid",
            borderColor: "warning.main",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255, 152, 0, 0.1)"
                : "rgba(255, 152, 0, 0.05)",
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setActiveTab(3)}
            >
              Disable
            </Button>
          }
        >
          <Typography
            variant="h6"
            sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <BugReportIcon />
            Development Mode Active
          </Typography>
          <Typography variant="body2">
            🚨 <strong>All firewall protection is bypassed!</strong> Rate
            limiting, IP blocking, and security rules are disabled. Traffic will
            not receive 429 errors or be blocked. This should only be used
            during development and testing.
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
            icon={React.createElement(getThemeIcon(uiTheme.icon))}
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
          <Tab
            icon={<TuneIcon />}
            label="Configurations"
            id="firewall-tab-4"
            aria-controls="firewall-tabpanel-4"
          />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
        <ErrorBoundary
          componentName="FirewallAdminDashboard"
          showDetails={process.env.NODE_ENV === "development"}
        >
          <FirewallAdminDashboard
            stats={stats}
            rules={rules}
            config={config}
            isFeatureEnabled={(feature) =>
              isFeatureEnabled(feature, settings, configFeatures)
            }
            getFeatureTooltip={(feature) =>
              getFeatureTooltip(feature, settings, configFeatures)
            }
            getDisabledStyle={getDisabledStyle}
            getRuleTypeEnabled={(type) =>
              getRuleTypeEnabled(type, settings, configFeatures)
            }
            dashboardSettings={dashboardSettings}
            onSettingsChange={handleDashboardSettingChange}
          />
        </ErrorBoundary>
      </TabPanel>

      {/* Rules Tab */}
      <TabPanel value={activeTab} index={1}>
        <ErrorBoundary
          componentName="FirewallAdminRules"
          showDetails={process.env.NODE_ENV === "development"}
        >
          <FirewallAdminRules
            key={rulesVersion}
            rules={rules}
            hasAnyFeatureEnabled={hasAnyFeatureEnabled}
            isFeatureEnabled={(feature) =>
              isFeatureEnabled(feature, settings, configFeatures)
            }
            getFeatureTooltip={(feature) =>
              getFeatureTooltip(feature, settings, configFeatures)
            }
            getDisabledStyle={getDisabledStyle}
            getDisabledRowStyle={getDisabledRowStyle}
            getRuleTypeEnabled={(type) =>
              getRuleTypeEnabled(type, settings, configFeatures)
            }
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
            handleAdvancedRuleTesting={handleAdvancedRuleTesting}
            advancedTesting={advancedTesting}
            advancedTestResults={advancedTestResults}
            onViewTestResults={() => setShowAdvancedTestResultsModal(true)}
          />
        </ErrorBoundary>
      </TabPanel>

      {/* Logs Tab */}
      <TabPanel value={activeTab} index={2}>
        <ErrorBoundary
          componentName="FirewallAdminLogs"
          showDetails={process.env.NODE_ENV === "development"}
        >
          <FirewallAdminLogs
            logs={logs}
            formatDate={formatDate}
            getActionChip={getActionChip}
            fetchLogs={fetchLogs}
            isFeatureEnabled={(feature) =>
              isFeatureEnabled(feature, settings, configFeatures)
            }
            getDisabledStyle={getDisabledStyle}
          />
        </ErrorBoundary>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={3}>
        {activeTab === 3 && (
          <ErrorBoundary
            componentName="FirewallAdminSettings"
            showDetails={process.env.NODE_ENV === "development"}
          >
            <FirewallAdminSettings
              initialSettings={settings}
              savingSettings={savingSettings}
              saveSettings={saveSettings}
              showAlert={showSnackbar}
              defaultSettings={defaultSettings}
              rules={rules}
              onTestBypass={handleTestBypass}
              onTestRule={handleLiveAttackTest}
              testing={testing}
              fetchRules={fetchRules}
              fetchLogs={fetchLogs}
              logCount={logCount}
              isFeatureEnabled={(feature) =>
                isFeatureEnabled(feature, settings, configFeatures)
              }
              getDisabledStyle={getDisabledStyle}
            />
          </ErrorBoundary>
        )}
      </TabPanel>

      {/* Configurations Tab */}
      <TabPanel value={activeTab} index={4}>
        {activeTab === 4 && (
          <ErrorBoundary
            componentName="FirewallAdminConfigurations"
            showDetails={process.env.NODE_ENV === "development"}
          >
            <FirewallAdminConfigurations
              showAlert={showSnackbar}
              fetchLogs={fetchLogs}
              fetchStats={fetchStats}
              fetchLogCount={fetchLogCount}
              logCount={logCount}
            />
          </ErrorBoundary>
        )}
      </TabPanel>

      {/* Rule Modal */}
      <ErrorBoundary
        componentName="RuleEditorDialog"
        showDetails={process.env.NODE_ENV === "development"}
      >
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
          isFeatureEnabled={(feature) =>
            isFeatureEnabled(feature, settings, configFeatures)
          }
          getRuleTypeEnabled={(type) =>
            getRuleTypeEnabled(type, settings, configFeatures)
          }
        />
      </ErrorBoundary>

      {/* Block IP Modal */}
      <BlockIPDialog
        open={showBlockModal}
        onClose={() => {
          setShowBlockModal(false);
          setBlockForm({
            ip: "",
            reason: "",
            permanent: false,
            expiresIn: 3600,
          });
        }}
        blockForm={blockForm}
        setBlockForm={setBlockForm}
        onSubmit={handleBlockIP}
      />

      {/* Reference Modal */}
      <ReferenceDialog
        open={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
        onRuleCreate={(rule) => {
          setSelectedRule(null);
          setRuleForm({
            name: rule.name,
            type: rule.type,
            value: rule.value,
            action: rule.action,
            enabled: rule.enabled,
            priority: rule.priority,
            description: rule.description || "",
          });
          setShowReferenceModal(false);
          setShowRuleModal(true);
        }}
      />

      {/* IP Blocking Disable Confirmation Dialog */}
      <IPBlockingDisableDialog
        open={showIPBlockingDisableDialog}
        onClose={() => {
          setShowIPBlockingDisableDialog(false);
          setPendingSettings(null);
        }}
        onConfirm={() => {
          if (pendingSettings) {
            setSettings(pendingSettings);
          }
          setShowIPBlockingDisableDialog(false);
          setPendingSettings(null);
        }}
        activeBlockedIpsCount={activeBlockedIpsCount}
      />

      {/* Threat Feed Import Confirmation Dialog */}
      <ThreatFeedImportDialog
        open={showThreatFeedDialog}
        onClose={handleCancelThreatFeedImport}
        onConfirm={handleConfirmThreatFeedImport}
        existingCount={threatFeedDialogData?.existingCount || 0}
      />

      <TestResultDialog
        open={showTestResultModal}
        onClose={() => setShowTestResultModal(false)}
        result={testResult}
      />

      {/* Advanced Rule Testing Results Modal (for Rules tab) */}
      <Dialog
        open={showAdvancedTestResultsModal}
        onClose={() => setShowAdvancedTestResultsModal(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="advanced-test-results-dialog-title"
      >
        <DialogTitle id="advanced-test-results-dialog-title">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BugReportIcon />
            Advanced Rule Testing Results
            <IconButton
              onClick={() => setShowAdvancedTestResultsModal(false)}
              sx={{ ml: "auto" }}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {advancedTestResults && (
            <>
              {/* Summary Section */}
              <Box sx={{ mb: 3 }}>
                <Alert
                  severity={
                    advancedTestResults.summary?.successRate === 100
                      ? "success"
                      : advancedTestResults.summary?.successRate >= 80
                      ? "warning"
                      : "error"
                  }
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">
                    Test Summary: {advancedTestResults.summary?.passed}/
                    {advancedTestResults.summary?.total} rules passed (
                    {advancedTestResults.summary?.successRate}% success rate)
                  </Typography>
                  <Typography variant="body2">
                    {advancedTestResults.message}
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: "success.light",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="h4" color="success.dark">
                        {advancedTestResults.summary?.passed || 0}
                      </Typography>
                      <Typography variant="body2" color="success.dark">
                        Passed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: "error.light",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="h4" color="error.dark">
                        {advancedTestResults.summary?.failed || 0}
                      </Typography>
                      <Typography variant="body2" color="error.dark">
                        Failed
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box
                      sx={{
                        textAlign: "center",
                        p: 2,
                        bgcolor: "info.light",
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="h4" color="info.dark">
                        {advancedTestResults.summary?.total || 0}
                      </Typography>
                      <Typography variant="body2" color="info.dark">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Detailed Results */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Detailed Results:
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: "auto" }}>
                {advancedTestResults.results?.map((result, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        {result.passed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold" }}
                        >
                          {result.ruleName}
                        </Typography>
                        <Chip
                          label={result.ruleType}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`Priority: ${result.priority}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        <strong>Rule Value:</strong> {result.ruleValue}
                      </Typography>

                      {result.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          <strong>Description:</strong> {result.description}
                        </Typography>
                      )}

                      <Typography
                        variant="body2"
                        color={result.passed ? "success.main" : "error.main"}
                        sx={{ mb: 1 }}
                      >
                        <strong>Result:</strong> {result.message}
                      </Typography>

                      {result.testPayload && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          <strong>Test Payload:</strong> {result.testPayload}
                        </Typography>
                      )}

                      {result.blockedReason && (
                        <Typography variant="body2" color="success.main">
                          <strong>Block Reason:</strong> {result.blockedReason}
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        Tested: {new Date(result.timestamp).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowAdvancedTestResultsModal(false)}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// Wrapper component that provides the snackbar context
const FirewallAdmin = () => {
  return (
    <FirewallSnackbarProvider>
      <FirewallAdminContent />
    </FirewallSnackbarProvider>
  );
};

export default FirewallAdmin;
