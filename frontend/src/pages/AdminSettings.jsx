import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Chip,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Visibility,
  VisibilityOff,
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Biotech as BiotechIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Science as ScienceIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { getBackendUrl } from "../utils/config";

// Import TestResultDialog from web performance plugin
const TestResultDialog = React.lazy(() =>
  import("../plugins/web-performance-optimization/dialogs/TestResultDialog")
);

const AdminSettings = () => {
  const [credentials, setCredentials] = useState({
    redis: {
      endpoint: "",
      hasPassword: false,
    },
    cloudflareR2: {
      bucket: "",
      token: "",
      accessKeyId: "",
      secretAccessKey: "",
      endpointS3: "",
      hasToken: false,
      hasAccessKeyId: false,
      hasSecretAccessKey: false,
    },
  });

  const [formData, setFormData] = useState({
    redis: {
      endpoint: "",
      password: "",
    },
    cloudflareR2: {
      bucket: "",
      token: "",
      accessKeyId: "",
      secretAccessKey: "",
      endpointS3: "",
    },
  });

  // Core settings state
  const [coreSettings, setCoreSettings] = useState({
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      skipAdminRoutes: true,
      skipPluginRoutes: true,
      enabled: true,
      message: "Too many requests from this IP, please try again later.",
    },
    security: {
      trustProxy: true,
      helmetEnabled: true,
      corsEnabled: true,
    },
  });

  const [coreFormData, setCoreFormData] = useState({
    rateLimiting: {
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
      skipAdminRoutes: true,
      skipPluginRoutes: true,
      enabled: true,
      message: "Too many requests from this IP, please try again later.",
    },
    security: {
      trustProxy: true,
      helmetEnabled: true,
      corsEnabled: true,
    },
  });

  const [loading, setLoading] = useState(true);
  const [refreshingFirewall, setRefreshingFirewall] = useState(false);
  const [firewallLastRefresh, setFirewallLastRefresh] = useState(null);
  const [firewallApiUnavailable, setFirewallApiUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firewallInstalled, setFirewallInstalled] = useState(false);
  const [firewallEnabled, setFirewallEnabled] = useState(false);
  const [firewallMasterSwitchEnabled, setFirewallMasterSwitchEnabled] =
    useState(false);
  const [firewallRateLimitingEnabled, setFirewallRateLimitingEnabled] =
    useState(false);
  const [testing, setTesting] = useState({
    redis: false,
    r2: false,
    rateLimit: false,
  });
  const [showPasswords, setShowPasswords] = useState({
    redisPassword: false,
    r2Token: false,
    r2AccessKey: false,
    r2SecretKey: false,
  });
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "info",
  });
  const [showTestResultModal, setShowTestResultModal] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [validationErrors, setValidationErrors] = useState({
    redis: { endpoint: "", password: "" },
    cloudflareR2: {
      bucket: "",
      token: "",
      accessKeyId: "",
      secretAccessKey: "",
      endpointS3: "",
    },
  });

  // Load current credentials and core settings
  useEffect(() => {
    const fetchAllSettings = async () => {
      await fetchCredentialsAndCoreSettings();
      await fetchFirewallStatus();
    };

    fetchAllSettings();
  }, []);

  // Separate function to fetch credentials and core settings
  const fetchCredentialsAndCoreSettings = async () => {
    try {
      // Fetch credentials
      const credentialsResponse = await fetch(
        `${getBackendUrl()}/api/auth/settings/credentials`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (credentialsResponse.ok) {
        const credentialsResult = await credentialsResponse.json();
        setCredentials(credentialsResult.data);

        // Pre-populate form with existing values
        setFormData({
          redis: {
            endpoint: credentialsResult.data.redis.endpoint || "",
            password: "", // Never pre-populate passwords
          },
          cloudflareR2: {
            bucket: credentialsResult.data.cloudflareR2.bucket || "",
            token: credentialsResult.data.cloudflareR2.token || "",
            accessKeyId: credentialsResult.data.cloudflareR2.accessKeyId || "",
            secretAccessKey:
              credentialsResult.data.cloudflareR2.secretAccessKey || "",
            endpointS3: credentialsResult.data.cloudflareR2.endpointS3 || "",
          },
        });

        // Validate existing values
        validateField(
          "redis",
          "endpoint",
          credentialsResult.data.redis.endpoint || ""
        );
        validateField(
          "cloudflareR2",
          "bucket",
          credentialsResult.data.cloudflareR2.bucket || ""
        );
        validateField(
          "cloudflareR2",
          "token",
          credentialsResult.data.cloudflareR2.token || ""
        );
        validateField(
          "cloudflareR2",
          "accessKeyId",
          credentialsResult.data.cloudflareR2.accessKeyId || ""
        );
        validateField(
          "cloudflareR2",
          "secretAccessKey",
          credentialsResult.data.cloudflareR2.secretAccessKey || ""
        );
        validateField(
          "cloudflareR2",
          "endpointS3",
          credentialsResult.data.cloudflareR2.endpointS3 || ""
        );
      } else {
        showAlert("Failed to load credentials", "error");
      }

      // Fetch core settings
      const coreResponse = await fetch(
        `${getBackendUrl()}/api/auth/settings/core`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (coreResponse.ok) {
        const coreResult = await coreResponse.json();
        setCoreSettings(coreResult.data);
        setCoreFormData({
          rateLimiting: { ...coreResult.data.rateLimiting },
          security: { ...coreResult.data.security },
        });
      } else {
        showAlert("Failed to load core settings", "error");
      }
    } catch (error) {
      console.error("Error fetching credentials and core settings:", error);
      showAlert("Error loading settings", "error");
    }
  };

  // Separate function to fetch firewall status (can be called on demand)
  const fetchFirewallStatus = async (showRefreshFeedback = false) => {
    if (showRefreshFeedback) {
      setRefreshingFirewall(true);
    }

    try {
      console.log("🔥 FIREWALL DEBUG: === REFRESH FIREWALL STATUS ===");
      console.log("🔥 FIREWALL DEBUG: Timestamp:", new Date().toISOString());

      // Check if firewall plugin is installed, enabled, AND has rate limiting active
      const pluginsResponse = await fetch(
        `${getBackendUrl()}/api/system/status`,
        {
          method: "GET",
          // Minimal headers to avoid CORS complications
        }
      );

      if (pluginsResponse.ok) {
        const pluginsResult = await pluginsResponse.json();
        console.log(
          "🔥 FIREWALL DEBUG: Fresh plugins response:",
          pluginsResult
        );

        // Handle the simplified plugin status response format
        let firewallPlugin = null;

        if (pluginsResult && pluginsResult.data) {
          // New format: { data: { firewall: { enabled: true, type: "Security" } } }
          firewallPlugin = pluginsResult.data.firewall;
        }

        console.log(
          "🔥 FIREWALL DEBUG: Fresh firewall plugin found:",
          firewallPlugin
        );

        // Set installation status
        const isInstalled = !!firewallPlugin;
        setFirewallInstalled(isInstalled);

        // Set enabled status - check for enabled property in new format
        const isEnabled = isInstalled && firewallPlugin?.enabled === true;
        setFirewallEnabled(isEnabled);

        console.log("🔥 FIREWALL DEBUG: Fresh installation/enable status:", {
          installed: isInstalled,
          enabled: isEnabled,
          pluginData: firewallPlugin,
        });

        // If firewall plugin is installed and enabled, use configuration from status response
        if (isInstalled && isEnabled) {
          // Use the configuration data included in the status response
          const masterSwitchEnabled =
            firewallPlugin?.masterSwitchEnabled ?? true;
          const rateLimitingFeatureEnabled =
            firewallPlugin?.rateLimitingEnabled ?? true;

          console.log(
            "🔥 FIREWALL DEBUG: Configuration from status response:",
            {
              masterSwitchEnabled,
              rateLimitingFeatureEnabled,
              developmentModeEnabled: firewallPlugin?.developmentModeEnabled,
            }
          );

          setFirewallMasterSwitchEnabled(masterSwitchEnabled);
          setFirewallRateLimitingEnabled(rateLimitingFeatureEnabled);
          setFirewallApiUnavailable(false); // APIs are working since we got valid status
        } else {
          console.log(
            "🔥 FIREWALL DEBUG: Firewall not installed/enabled, setting statuses to false"
          );
          setFirewallMasterSwitchEnabled(false);
          setFirewallRateLimitingEnabled(false);
          setFirewallApiUnavailable(false); // Plugin just not installed/enabled, not an API issue
        }
      }

      if (showRefreshFeedback) {
        showAlert("Firewall status refreshed", "success");
        setFirewallLastRefresh(new Date());
      }
    } catch (error) {
      console.error(
        "🔥 FIREWALL DEBUG: Error fetching fresh firewall status:",
        error
      );

      // Check if this is a network error due to firewall APIs not being available
      if (
        error.name === "TypeError" &&
        error.message.includes("Failed to fetch")
      ) {
        console.log(
          "🔥 FIREWALL DEBUG: Network fetch failed - likely firewall APIs unavailable, treating as disabled"
        );
        // Don't show error to user - this is expected when firewall is disabled
        setFirewallInstalled(false);
        setFirewallEnabled(false);
        setFirewallMasterSwitchEnabled(false);
        setFirewallRateLimitingEnabled(false);
        setFirewallApiUnavailable(true);

        if (showRefreshFeedback) {
          showAlert(
            "Firewall status refreshed (firewall appears to be disabled)",
            "info"
          );
          setFirewallLastRefresh(new Date());
        }
      } else {
        // Actual unexpected error
        setFirewallInstalled(false);
        setFirewallEnabled(false);
        setFirewallMasterSwitchEnabled(false);
        setFirewallRateLimitingEnabled(false);
        setFirewallApiUnavailable(true);

        if (showRefreshFeedback) {
          showAlert(
            "Error refreshing firewall status: " + error.message,
            "error"
          );
        }
      }
    } finally {
      setLoading(false);
      if (showRefreshFeedback) {
        setRefreshingFirewall(false);
      }
    }
  };

  // Manual refresh function
  const handleRefreshFirewallStatus = async () => {
    await fetchFirewallStatus(true);
  };

  const showAlert = (message, severity = "info") => {
    setAlert({ show: true, message, severity });
    setTimeout(
      () => setAlert({ show: false, message: "", severity: "info" }),
      5000
    );
  };

  const handleInputChange = (service, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value,
      },
    }));

    // Validate the field
    validateField(service, field, value);
  };

  const handleCoreInputChange = (section, field, value) => {
    setCoreFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const hasValidationErrors = () => {
    const allErrors = [
      ...Object.values(validationErrors.redis),
      ...Object.values(validationErrors.cloudflareR2),
    ];
    return allErrors.some((error) => error !== "");
  };

  // Combined save function for both external services and core settings
  const handleSaveAllSettings = async () => {
    // Check for validation errors before saving
    if (hasValidationErrors()) {
      showAlert("Please fix validation errors before saving", "error");
      return;
    }

    setSaving(true);
    let externalServicesSuccess = false;
    let coreSettingsSuccess = false;

    try {
      // First, save external services (Redis, Cloudflare R2)
      try {
        const externalDataToSend = {
          redis: {
            endpoint: formData.redis.endpoint || "",
            password: formData.redis.password || "",
          },
          cloudflareR2: {
            bucket: formData.cloudflareR2.bucket || "",
            token: formData.cloudflareR2.token || "",
            accessKeyId: formData.cloudflareR2.accessKeyId || "",
            secretAccessKey: formData.cloudflareR2.secretAccessKey || "",
            endpointS3: formData.cloudflareR2.endpointS3 || "",
          },
        };

        const externalResponse = await fetch(
          `${getBackendUrl()}/api/auth/settings/credentials`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(externalDataToSend),
          }
        );

        const externalResult = await externalResponse.json();

        if (externalResponse.ok) {
          setCredentials(externalResult.data);

          // Update form fields with saved values
          setFormData((prev) => ({
            redis: {
              endpoint: externalResult.data.redis.endpoint || "",
              password: "",
            },
            cloudflareR2: {
              bucket: externalResult.data.cloudflareR2.bucket || "",
              token: externalResult.data.cloudflareR2.token || "",
              accessKeyId: externalResult.data.cloudflareR2.accessKeyId || "",
              secretAccessKey:
                externalResult.data.cloudflareR2.secretAccessKey || "",
              endpointS3: externalResult.data.cloudflareR2.endpointS3 || "",
            },
          }));

          externalServicesSuccess = true;
        } else {
          throw new Error(
            externalResult.message || "Failed to save external services"
          );
        }
      } catch (externalError) {
        console.error("Error saving external services:", externalError);
        showAlert(
          `Error saving external services: ${externalError.message}`,
          "error"
        );
        return;
      }

      // Second, save core settings (if not disabled)
      if (!coreRateLimitingDisabled) {
        try {
          const firewallRequiresSecuritySettings =
            firewallInstalled && firewallEnabled && firewallMasterSwitchEnabled;

          const coreDataToSend = {
            rateLimiting: { ...coreFormData.rateLimiting },
            security: {
              ...coreFormData.security,
              // Force these to true when firewall is active for proper functionality
              trustProxy: firewallRequiresSecuritySettings
                ? true
                : coreFormData.security?.trustProxy ?? true,
              corsEnabled: firewallRequiresSecuritySettings
                ? true
                : coreFormData.security?.corsEnabled ?? true,
            },
          };

          console.log("🔥 CORE SETTINGS SAVE DEBUG:", {
            firewallInstalled,
            firewallEnabled,
            firewallMasterSwitchEnabled,
            firewallRequiresSecuritySettings,
            originalSecurity: coreFormData.security,
            finalSecurity: coreDataToSend.security,
          });

          const coreResponse = await fetch(
            `${getBackendUrl()}/api/auth/settings/core`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify(coreDataToSend),
            }
          );

          const coreResult = await coreResponse.json();

          if (coreResponse.ok) {
            setCoreSettings(coreResult.data);
            setCoreFormData({
              rateLimiting: { ...coreResult.data.rateLimiting },
              security: { ...coreResult.data.security },
            });
            coreSettingsSuccess = true;
          } else {
            throw new Error(
              coreResult.message || "Failed to save core settings"
            );
          }
        } catch (coreError) {
          console.error("Error saving core settings:", coreError);
          showAlert(
            `Error saving core settings: ${coreError.message}`,
            "error"
          );
          return;
        }
      } else {
        // Core settings are managed by firewall, mark as "success"
        coreSettingsSuccess = true;
      }

      // Show success message
      if (externalServicesSuccess && coreSettingsSuccess) {
        if (coreRateLimitingDisabled) {
          showAlert(
            "External services saved successfully. Core settings are managed by firewall.",
            "success"
          );
        } else {
          showAlert("All settings saved successfully", "success");
        }
      }
    } catch (error) {
      console.error("Unexpected error saving settings:", error);
      showAlert("Unexpected error saving settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestRedis = async () => {
    setTesting((prev) => ({ ...prev, redis: true }));
    try {
      const testEndpoint =
        formData.redis.endpoint || credentials.redis.endpoint;

      const response = await fetch(
        `${getBackendUrl()}/api/auth/settings/test-redis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ endpoint: testEndpoint }),
        }
      );

      const result = await response.json();

      if (result.data?.testResult) {
        setTestResult(result.data.testResult);
        setShowTestResultModal(true);
      } else {
        // Fallback to structured result if no testResult object
        const testResult = {
          title: response.ok
            ? "Redis Connection Test Successful"
            : "Redis Connection Test Failed",
          message:
            result.message ||
            (response.ok
              ? "Successfully connected to Redis"
              : "Failed to connect to Redis"),
          severity: response.ok ? "success" : "error",
          details: { endpoint: testEndpoint },
          testResults: {
            connectivity: response.ok,
            connectivityError: response.ok ? undefined : result.message,
          },
        };
        setTestResult(testResult);
        setShowTestResultModal(true);
      }
    } catch (error) {
      console.error("Error testing Redis:", error);
      setTestResult({
        title: "Redis Connection Test Failed",
        message: "A network error occurred while testing Redis connection",
        severity: "error",
        details: {
          endpoint: formData.redis.endpoint || credentials.redis.endpoint,
        },
        testResults: {
          connectivity: false,
          connectivityError: error.message,
        },
      });
      setShowTestResultModal(true);
    } finally {
      setTesting((prev) => ({ ...prev, redis: false }));
    }
  };

  const handleTestR2 = async () => {
    setTesting((prev) => ({ ...prev, r2: true }));
    try {
      const testData = {
        bucket: formData.cloudflareR2.bucket || credentials.cloudflareR2.bucket,
        token: formData.cloudflareR2.token || credentials.cloudflareR2.token,
        accessKeyId:
          formData.cloudflareR2.accessKeyId ||
          credentials.cloudflareR2.accessKeyId,
        secretAccessKey:
          formData.cloudflareR2.secretAccessKey ||
          credentials.cloudflareR2.secretAccessKey,
        endpointS3:
          formData.cloudflareR2.endpointS3 ||
          credentials.cloudflareR2.endpointS3,
      };

      const response = await fetch(
        `${getBackendUrl()}/api/auth/settings/test-r2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(testData),
        }
      );

      const result = await response.json();

      if (result.data?.testResult) {
        setTestResult(result.data.testResult);
        setShowTestResultModal(true);
      } else {
        // Fallback to structured result if no testResult object
        const testResult = {
          title: response.ok
            ? "Cloudflare R2 Connection Test Successful"
            : "Cloudflare R2 Connection Test Failed",
          message:
            result.message ||
            (response.ok
              ? "Successfully connected to Cloudflare R2"
              : "Failed to connect to Cloudflare R2"),
          severity: response.ok ? "success" : "error",
          details: {
            bucketName: testData.bucket,
            accessKeyId: testData.accessKeyId,
            endpoint: testData.endpointS3,
          },
          testResults: {
            connectivity: response.ok,
            connectivityError: response.ok ? undefined : result.message,
          },
        };
        setTestResult(testResult);
        setShowTestResultModal(true);
      }
    } catch (error) {
      console.error("Error testing R2:", error);
      setTestResult({
        title: "Cloudflare R2 Connection Test Failed",
        message:
          "A network error occurred while testing Cloudflare R2 connection",
        severity: "error",
        details: {
          bucketName:
            formData.cloudflareR2.bucket || credentials.cloudflareR2.bucket,
          accessKeyId:
            formData.cloudflareR2.accessKeyId ||
            credentials.cloudflareR2.accessKeyId,
          endpoint:
            formData.cloudflareR2.endpointS3 ||
            credentials.cloudflareR2.endpointS3,
        },
        testResults: {
          connectivity: false,
          connectivityError: error.message,
        },
      });
      setShowTestResultModal(true);
    } finally {
      setTesting((prev) => ({ ...prev, r2: false }));
    }
  };

  const handleTestRateLimit = async () => {
    setTesting((prev) => ({ ...prev, rateLimit: true }));
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/auth/settings/test-rate-limit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();

      if (result.data?.testResult) {
        setTestResult(result.data.testResult);
        setShowTestResultModal(true);
      } else {
        const testResult = {
          title: response.ok
            ? "Rate Limiting Test Successful"
            : "Rate Limiting Test Failed",
          message:
            result.message ||
            (response.ok
              ? "Rate limiting configuration is valid"
              : "Rate limiting configuration test failed"),
          severity: response.ok ? "info" : "error",
          details: coreFormData.rateLimiting,
          testResults: {
            configurationValid: response.ok,
          },
        };
        setTestResult(testResult);
        setShowTestResultModal(true);
      }
    } catch (error) {
      console.error("Error testing rate limiting:", error);
      setTestResult({
        title: "Rate Limiting Test Failed",
        message:
          "A network error occurred while testing rate limiting configuration",
        severity: "error",
        details: coreFormData.rateLimiting,
        testResults: {
          configurationValid: false,
          error: error.message,
        },
      });
      setShowTestResultModal(true);
    } finally {
      setTesting((prev) => ({ ...prev, rateLimit: false }));
    }
  };

  // Validation functions
  const validateRedisUrl = (url) => {
    if (!url) return ""; // Allow empty
    const redisUrlPattern =
      /^redis:\/\/(?:[^:]*:[^@]*@)?[^:\/\s]+(?::\d+)?(?:\/\d+)?$/;
    if (!redisUrlPattern.test(url)) {
      return "Invalid Redis URL format. Expected: redis://[user:pass@]host[:port][/db]";
    }
    return "";
  };

  const validateBucketName = (name) => {
    if (!name) return ""; // Allow empty
    if (name.length < 3 || name.length > 63) {
      return "Bucket name must be between 3 and 63 characters";
    }
    if (!/^[a-z0-9-]+$/.test(name)) {
      return "Bucket name can only contain lowercase letters, numbers, and hyphens";
    }
    if (name.startsWith("-") || name.endsWith("-")) {
      return "Bucket name cannot start or end with a hyphen";
    }
    if (name.includes("--")) {
      return "Bucket name cannot contain consecutive hyphens";
    }
    return "";
  };

  const validateApiToken = (token) => {
    if (!token) return ""; // Allow empty
    if (token.length < 20) {
      return "API token appears too short";
    }
    if (!/^[A-Za-z0-9_-]+$/.test(token)) {
      return "API token contains invalid characters";
    }
    return "";
  };

  const validateAccessKey = (key, fieldName) => {
    if (!key) return ""; // Allow empty
    if (key.length < 16) {
      return `${fieldName} appears too short`;
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(key)) {
      return `${fieldName} contains invalid characters`;
    }
    return "";
  };

  const validateS3Endpoint = (endpoint) => {
    if (!endpoint) return ""; // Allow empty
    const s3EndpointPattern =
      /^https:\/\/[a-f0-9]{32}\.r2\.cloudflarestorage\.com$/;
    if (!s3EndpointPattern.test(endpoint)) {
      return "Invalid S3 endpoint format. Expected: https://account-id.r2.cloudflarestorage.com";
    }
    return "";
  };

  const validateField = (service, field, value) => {
    let error = "";

    if (service === "redis") {
      if (field === "endpoint") {
        error = validateRedisUrl(value);
      }
      // Redis password doesn't need specific validation
    } else if (service === "cloudflareR2") {
      switch (field) {
        case "bucket":
          error = validateBucketName(value);
          break;
        case "token":
          error = validateApiToken(value);
          break;
        case "accessKeyId":
          error = validateAccessKey(value, "Access Key ID");
          break;
        case "secretAccessKey":
          error = validateAccessKey(value, "Secret Access Key");
          break;
        case "endpointS3":
          error = validateS3Endpoint(value);
          break;
      }
    }

    setValidationErrors((prev) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: error,
      },
    }));

    return error === "";
  };

  // Compute when Core Rate Limiting should be disabled (Updated Logic with Master Switch)
  // Only disable when firewall is INSTALLED, ENABLED, AND master switch is ON
  const coreRateLimitingDisabled =
    firewallInstalled && firewallEnabled && firewallMasterSwitchEnabled;

  // Debug logging
  console.log("🔥 CORE RATE LIMITING DEBUG:", {
    firewallInstalled,
    firewallEnabled,
    firewallMasterSwitchEnabled,
    firewallRateLimitingEnabled,
    firewallApiUnavailable,
    coreRateLimitingDisabled,
    timestamp: new Date().toISOString(),
  });

  // Get descriptive status for UI messaging
  const getFirewallRateLimitingStatus = () => {
    if (firewallApiUnavailable) {
      return {
        type: "info",
        message:
          "Firewall APIs are currently unavailable. This typically means the firewall is disabled or uninstalled. Core rate limiting is active.",
      };
    }
    if (!firewallInstalled) {
      return { type: "normal", message: null };
    }
    if (firewallInstalled && !firewallEnabled) {
      return {
        type: "info",
        message:
          "Firewall plugin is installed but disabled. Core rate limiting is active.",
      };
    }
    if (firewallInstalled && firewallEnabled && !firewallMasterSwitchEnabled) {
      return {
        type: "info",
        message:
          "Firewall plugin is enabled but master switch is disabled. Core rate limiting is active.",
      };
    }
    if (
      firewallInstalled &&
      firewallEnabled &&
      firewallMasterSwitchEnabled &&
      !firewallRateLimitingEnabled
    ) {
      return {
        type: "warning",
        message:
          "Firewall is active but rate limiting feature is disabled. Core rate limiting is bypassed in production but you should enable firewall rate limiting.",
      };
    }
    if (
      firewallInstalled &&
      firewallEnabled &&
      firewallMasterSwitchEnabled &&
      firewallRateLimitingEnabled
    ) {
      return {
        type: "bypass",
        message:
          "Firewall is active with rate limiting enabled. Core rate limiting is bypassed in production.",
      };
    }
    return { type: "normal", message: null };
  };

  const firewallStatus = getFirewallRateLimitingStatus();
  console.log("🔥 FIREWALL STATUS DEBUG:", firewallStatus);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}
        >
          <SettingsIcon />
          Admin Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage external service credentials and core application settings
        </Typography>
      </Box>

      {alert.show && (
        <Alert severity={alert.severity} sx={{ mb: 3 }}>
          {alert.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Redis Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <StorageIcon color="primary" />
                <Typography variant="h6">Redis Configuration</Typography>
                {credentials.redis.endpoint && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Configured"
                    color="success"
                    size="small"
                  />
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Redis Endpoint"
                    value={formData.redis.endpoint}
                    onChange={(e) =>
                      handleInputChange("redis", "endpoint", e.target.value)
                    }
                    placeholder="redis://user:pass@host:port"
                    helperText={
                      validationErrors.redis.endpoint ||
                      "Complete Redis connection URL including credentials"
                    }
                    error={!!validationErrors.redis.endpoint}
                    autoComplete="off"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Redis Password (Optional)"
                    type={showPasswords.redisPassword ? "text" : "password"}
                    value={formData.redis.password}
                    onChange={(e) =>
                      handleInputChange("redis", "password", e.target.value)
                    }
                    placeholder="Leave blank to use endpoint credentials"
                    helperText={
                      validationErrors.redis.password ||
                      "Optional: separate password if not included in endpoint"
                    }
                    error={!!validationErrors.redis.password}
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              togglePasswordVisibility("redisPassword")
                            }
                            edge="end"
                          >
                            {showPasswords.redisPassword ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleTestRedis}
                    disabled={
                      testing.redis ||
                      (!formData.redis.endpoint &&
                        !credentials.redis.endpoint) ||
                      !!validationErrors.redis.endpoint
                    }
                    startIcon={
                      testing.redis ? (
                        <CircularProgress size={20} />
                      ) : (
                        <ScienceIcon />
                      )
                    }
                    fullWidth
                  >
                    {testing.redis ? "Testing..." : "Test Redis Connection"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Cloudflare R2 Configuration */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <CloudIcon color="primary" />
                <Typography variant="h6">
                  Cloudflare R2 Configuration
                </Typography>
                {credentials.cloudflareR2.bucket &&
                  credentials.cloudflareR2.hasToken && (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="Configured"
                      color="success"
                      size="small"
                    />
                  )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bucket Name"
                    value={formData.cloudflareR2.bucket}
                    onChange={(e) =>
                      handleInputChange(
                        "cloudflareR2",
                        "bucket",
                        e.target.value
                      )
                    }
                    placeholder="my-r2-bucket"
                    helperText={
                      validationErrors.cloudflareR2.bucket ||
                      "Cloudflare R2 bucket name (lowercase letters, numbers, hyphens only)"
                    }
                    error={!!validationErrors.cloudflareR2.bucket}
                    autoComplete="off"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Token"
                    type={showPasswords.r2Token ? "text" : "password"}
                    value={formData.cloudflareR2.token}
                    onChange={(e) =>
                      handleInputChange("cloudflareR2", "token", e.target.value)
                    }
                    placeholder="API token with R2 permissions"
                    helperText={
                      validationErrors.cloudflareR2.token ||
                      "Cloudflare API token with R2 read/write permissions"
                    }
                    error={!!validationErrors.cloudflareR2.token}
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility("r2Token")}
                            edge="end"
                          >
                            {showPasswords.r2Token ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Access Key ID"
                    type={showPasswords.r2AccessKey ? "text" : "password"}
                    value={formData.cloudflareR2.accessKeyId}
                    onChange={(e) =>
                      handleInputChange(
                        "cloudflareR2",
                        "accessKeyId",
                        e.target.value
                      )
                    }
                    placeholder="S3-compatible access key ID"
                    helperText={
                      validationErrors.cloudflareR2.accessKeyId ||
                      "R2 S3-compatible access key ID"
                    }
                    error={!!validationErrors.cloudflareR2.accessKeyId}
                    autoComplete="username"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              togglePasswordVisibility("r2AccessKey")
                            }
                            edge="end"
                          >
                            {showPasswords.r2AccessKey ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Secret Access Key"
                    type={showPasswords.r2SecretKey ? "text" : "password"}
                    value={formData.cloudflareR2.secretAccessKey}
                    onChange={(e) =>
                      handleInputChange(
                        "cloudflareR2",
                        "secretAccessKey",
                        e.target.value
                      )
                    }
                    placeholder="S3-compatible secret access key"
                    helperText={
                      validationErrors.cloudflareR2.secretAccessKey ||
                      "R2 S3-compatible secret access key"
                    }
                    error={!!validationErrors.cloudflareR2.secretAccessKey}
                    autoComplete="new-password"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              togglePasswordVisibility("r2SecretKey")
                            }
                            edge="end"
                          >
                            {showPasswords.r2SecretKey ? (
                              <VisibilityOff />
                            ) : (
                              <Visibility />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="S3 Endpoint"
                    value={formData.cloudflareR2.endpointS3}
                    onChange={(e) =>
                      handleInputChange(
                        "cloudflareR2",
                        "endpointS3",
                        e.target.value
                      )
                    }
                    placeholder="https://your-account-id.r2.cloudflarestorage.com"
                    helperText={
                      validationErrors.cloudflareR2.endpointS3 ||
                      "R2 S3-compatible endpoint URL"
                    }
                    error={!!validationErrors.cloudflareR2.endpointS3}
                    autoComplete="url"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleTestR2}
                    disabled={
                      testing.r2 ||
                      (!formData.cloudflareR2.bucket &&
                        !credentials.cloudflareR2.bucket) ||
                      !!validationErrors.cloudflareR2.bucket ||
                      !!validationErrors.cloudflareR2.token ||
                      !!validationErrors.cloudflareR2.accessKeyId ||
                      !!validationErrors.cloudflareR2.secretAccessKey ||
                      !!validationErrors.cloudflareR2.endpointS3
                    }
                    startIcon={
                      testing.r2 ? (
                        <CircularProgress size={20} />
                      ) : (
                        <ScienceIcon />
                      )
                    }
                    fullWidth
                  >
                    {testing.r2
                      ? "Testing..."
                      : "Test Cloudflare R2 Connection"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Core Rate Limiting Configuration */}
        <Grid item xs={12}>
          <Card sx={{ opacity: coreRateLimitingDisabled ? 0.6 : 1 }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <SpeedIcon
                  color={coreRateLimitingDisabled ? "disabled" : "primary"}
                />
                <Typography variant="h6">Core Rate Limiting</Typography>

                {/* Refresh Button */}
                <IconButton
                  size="small"
                  onClick={handleRefreshFirewallStatus}
                  disabled={refreshingFirewall}
                  title="Refresh firewall status"
                  sx={{ ml: 1 }}
                >
                  {refreshingFirewall ? (
                    <CircularProgress size={16} />
                  ) : (
                    <RefreshIcon fontSize="small" />
                  )}
                </IconButton>

                {/* Status Chips */}
                {firewallInstalled &&
                  firewallEnabled &&
                  firewallMasterSwitchEnabled &&
                  firewallRateLimitingEnabled && (
                    <Chip
                      icon={<ShieldIcon />}
                      label="Firewall Active"
                      color="warning"
                      size="small"
                    />
                  )}
                {firewallInstalled &&
                  firewallEnabled &&
                  firewallMasterSwitchEnabled &&
                  !firewallRateLimitingEnabled && (
                    <Chip
                      icon={<ShieldIcon />}
                      label="Firewall (Rate Limiting Off)"
                      color="error"
                      size="small"
                    />
                  )}
                {firewallInstalled &&
                  firewallEnabled &&
                  !firewallMasterSwitchEnabled && (
                    <Chip
                      icon={<ShieldIcon />}
                      label="Firewall (Master Switch Off)"
                      color="default"
                      size="small"
                    />
                  )}
                {firewallInstalled && !firewallEnabled && (
                  <Chip
                    icon={<ShieldIcon />}
                    label="Firewall Disabled"
                    color="default"
                    size="small"
                  />
                )}
                {!firewallInstalled && coreSettings.rateLimiting?.enabled && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="Enabled"
                    color="success"
                    size="small"
                  />
                )}
                {firewallApiUnavailable && (
                  <Chip
                    icon={<ShieldIcon />}
                    label="Firewall APIs Unavailable"
                    color="default"
                    size="small"
                  />
                )}
              </Box>

              {firewallLastRefresh && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 2, display: "block" }}
                >
                  Last refreshed: {firewallLastRefresh.toLocaleTimeString()}
                </Typography>
              )}

              {firewallStatus.type === "bypass" && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Firewall Rate Limiting Active:</strong>{" "}
                    {firewallStatus.message}{" "}
                    <Link
                      to="/admin/firewall"
                      style={{
                        color: "inherit",
                        fontWeight: "bold",
                        textDecoration: "underline",
                      }}
                    >
                      Manage in Firewall Admin Panel
                    </Link>
                    .
                  </Typography>
                </Alert>
              )}

              {firewallStatus.type === "warning" && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Configuration Issue:</strong>{" "}
                    {firewallStatus.message}{" "}
                    <Link
                      to="/admin/firewall"
                      style={{
                        color: "inherit",
                        fontWeight: "bold",
                        textDecoration: "underline",
                      }}
                    >
                      Enable Firewall Rate Limiting
                    </Link>
                    .
                  </Typography>
                </Alert>
              )}

              {firewallStatus.type === "info" && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    {firewallStatus.message}{" "}
                    <Link
                      to="/admin/firewall"
                      style={{
                        color: "inherit",
                        fontWeight: "bold",
                        textDecoration: "underline",
                      }}
                    >
                      Enable Firewall
                    </Link>{" "}
                    for enhanced protection.
                  </Typography>
                </Alert>
              )}

              {firewallStatus.type === "normal" && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Global rate limiting settings for the entire application.
                  Admin routes and plugin APIs can be automatically excluded.
                  {!firewallInstalled && (
                    <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                      {" "}
                      Consider installing the Firewall plugin for enhanced rate
                      limiting and security features.
                    </span>
                  )}
                </Typography>
              )}

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={coreFormData.rateLimiting?.enabled ?? true}
                        onChange={(e) =>
                          handleCoreInputChange(
                            "rateLimiting",
                            "enabled",
                            e.target.checked
                          )
                        }
                        disabled={coreRateLimitingDisabled}
                      />
                    }
                    label="Enable Rate Limiting"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={coreRateLimitingDisabled}>
                    <InputLabel>Time Window</InputLabel>
                    <Select
                      value={coreFormData.rateLimiting?.windowMs || 900000}
                      onChange={(e) =>
                        handleCoreInputChange(
                          "rateLimiting",
                          "windowMs",
                          e.target.value
                        )
                      }
                      label="Time Window"
                    >
                      <MenuItem value={60000}>1 minute</MenuItem>
                      <MenuItem value={300000}>5 minutes</MenuItem>
                      <MenuItem value={600000}>10 minutes</MenuItem>
                      <MenuItem value={900000}>15 minutes</MenuItem>
                      <MenuItem value={1800000}>30 minutes</MenuItem>
                      <MenuItem value={3600000}>1 hour</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max Requests"
                    value={coreFormData.rateLimiting?.maxRequests || 100}
                    onChange={(e) =>
                      handleCoreInputChange(
                        "rateLimiting",
                        "maxRequests",
                        parseInt(e.target.value) || 0
                      )
                    }
                    helperText="Maximum requests allowed per time window"
                    inputProps={{ min: 10, max: 10000 }}
                    disabled={coreRateLimitingDisabled}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rate Limit Message"
                    value={coreFormData.rateLimiting?.message || ""}
                    onChange={(e) =>
                      handleCoreInputChange(
                        "rateLimiting",
                        "message",
                        e.target.value
                      )
                    }
                    helperText="Message shown when rate limit is exceeded"
                    multiline
                    rows={2}
                    disabled={coreRateLimitingDisabled}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          coreFormData.rateLimiting?.skipAdminRoutes ?? true
                        }
                        onChange={(e) =>
                          handleCoreInputChange(
                            "rateLimiting",
                            "skipAdminRoutes",
                            e.target.checked
                          )
                        }
                        disabled={coreRateLimitingDisabled}
                      />
                    }
                    label="Skip Admin Routes"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Exclude /api/admin/* and /admin/* routes from rate limiting
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          coreFormData.rateLimiting?.skipPluginRoutes ?? true
                        }
                        onChange={(e) =>
                          handleCoreInputChange(
                            "rateLimiting",
                            "skipPluginRoutes",
                            e.target.checked
                          )
                        }
                        disabled={coreRateLimitingDisabled}
                      />
                    }
                    label="Skip Plugin Routes"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Exclude plugin API routes from rate limiting
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleTestRateLimit}
                    disabled={testing.rateLimit || coreRateLimitingDisabled}
                    startIcon={
                      testing.rateLimit ? (
                        <CircularProgress size={20} />
                      ) : (
                        <ScienceIcon />
                      )
                    }
                    fullWidth
                  >
                    {coreRateLimitingDisabled
                      ? "Rate Limiting Managed by Firewall"
                      : testing.rateLimit
                      ? "Testing..."
                      : "Test Rate Limiting Configuration"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <SecurityIcon color="primary" />
                <Typography variant="h6">Core Security Settings</Typography>
                {firewallInstalled &&
                  firewallEnabled &&
                  firewallMasterSwitchEnabled && (
                    <Chip
                      icon={<ShieldIcon />}
                      label="Firewall Protected"
                      color="info"
                      size="small"
                    />
                  )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Core security configuration for the application.
              </Typography>

              {firewallInstalled &&
                firewallEnabled &&
                firewallMasterSwitchEnabled && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Firewall Protection Active:</strong> Trust Proxy
                      and CORS are automatically managed to ensure proper
                      firewall functionality. Trust Proxy is required for
                      accurate IP detection, and CORS is needed for admin panel
                      operation.
                    </Typography>
                  </Alert>
                )}

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          firewallInstalled &&
                          firewallEnabled &&
                          firewallMasterSwitchEnabled
                            ? true
                            : coreFormData.security?.trustProxy ?? true
                        }
                        onChange={(e) =>
                          handleCoreInputChange(
                            "security",
                            "trustProxy",
                            e.target.checked
                          )
                        }
                        disabled={
                          firewallInstalled &&
                          firewallEnabled &&
                          firewallMasterSwitchEnabled
                        }
                      />
                    }
                    label="Trust Proxy"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Trust X-Forwarded-For headers from proxies
                    {firewallInstalled &&
                      firewallEnabled &&
                      firewallMasterSwitchEnabled && (
                        <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                          {" "}
                          (Required for firewall IP detection)
                        </span>
                      )}
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={coreFormData.security?.helmetEnabled ?? true}
                        onChange={(e) =>
                          handleCoreInputChange(
                            "security",
                            "helmetEnabled",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Helmet Security"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Enable Helmet.js security headers
                  </Typography>
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          firewallInstalled &&
                          firewallEnabled &&
                          firewallMasterSwitchEnabled
                            ? true
                            : coreFormData.security?.corsEnabled ?? true
                        }
                        onChange={(e) =>
                          handleCoreInputChange(
                            "security",
                            "corsEnabled",
                            e.target.checked
                          )
                        }
                        disabled={
                          firewallInstalled &&
                          firewallEnabled &&
                          firewallMasterSwitchEnabled
                        }
                      />
                    }
                    label="CORS Enabled"
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Enable Cross-Origin Resource Sharing
                    {firewallInstalled &&
                      firewallEnabled &&
                      firewallMasterSwitchEnabled && (
                        <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                          {" "}
                          (Required for admin panel API access)
                        </span>
                      )}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSaveAllSettings}
              disabled={saving || hasValidationErrors()}
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              color={hasValidationErrors() ? "error" : "primary"}
            >
              {saving
                ? "Saving..."
                : hasValidationErrors()
                ? "Fix Errors to Save"
                : "Save Settings"}
            </Button>
          </Box>
          {coreRateLimitingDisabled && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1, textAlign: "right" }}
            >
              Note: Core rate limiting and some security settings are managed by
              the active firewall
            </Typography>
          )}
        </Grid>
      </Grid>

      {/* Test Result Modal */}
      <React.Suspense fallback={<div>Loading...</div>}>
        <TestResultDialog
          open={showTestResultModal}
          onClose={() => setShowTestResultModal(false)}
          testResult={testResult}
        />
      </React.Suspense>
    </Container>
  );
};

export default AdminSettings;
