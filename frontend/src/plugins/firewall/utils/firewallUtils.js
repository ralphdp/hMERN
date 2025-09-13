import {
  Shield as ShieldIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
} from "@mui/icons-material";
import { Chip } from "@mui/material";

/**
 * Format date to localized string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

/**
 * Get action chip component based on action type
 */
export const getActionChip = (action) => {
  const actionColors = {
    block: "error",
    allow: "success",
    rate_limit: "warning",
    log: "info",
  };
  return (
    <Chip
      label={action}
      color={actionColors[action] || "default"}
      size="small"
    />
  );
};

/**
 * Get rule type chip component based on rule type
 */
export const getRuleTypeChip = (type) => {
  const typeLabels = {
    ip_block: "IP Block",
    country_block: "Country Block",
    suspicious_pattern: "Pattern",
    rate_limit: "Rate Limit",
    user_agent_block: "User Agent",
  };
  const typeColors = {
    ip_block: "error",
    country_block: "warning",
    suspicious_pattern: "info",
    rate_limit: "secondary",
    user_agent_block: "primary",
  };
  return (
    <Chip
      label={typeLabels[type] || type}
      color={typeColors[type] || "default"}
      size="small"
      variant="outlined"
    />
  );
};

/**
 * Check if a feature is enabled based on configuration only
 */
export const isFeatureEnabled = (featureName, settings, configFeatures) => {
  // Only check configuration features (removed settings.features)
  if (configFeatures?.[featureName] !== undefined) {
    return configFeatures[featureName];
  }

  // Default to false if not found
  return false;
};

/**
 * Get disabled style for components
 */
export const getDisabledStyle = (enabled) => ({
  opacity: enabled ? 1 : 0.5,
  pointerEvents: enabled ? "auto" : "none",
});

/**
 * Get disabled row style for table rows
 */
export const getDisabledRowStyle = (enabled) => ({
  opacity: enabled ? 1 : 0.3,
  backgroundColor: enabled ? "inherit" : "action.hover",
  "& .MuiTableCell-root": {
    color: enabled ? "inherit" : "text.disabled",
  },
});

/**
 * Check if a rule type is enabled based on configuration features
 */
export const getRuleTypeEnabled = (type, settings, configFeatures) => {
  switch (type) {
    case "ip_block":
      return configFeatures?.ipBlocking ?? true;
    case "country_block":
      return configFeatures?.countryBlocking ?? true;
    case "rate_limit":
      return configFeatures?.rateLimiting ?? true;
    case "suspicious_pattern":
      return configFeatures?.suspiciousPatterns ?? true;
    case "user_agent_block":
      return configFeatures?.ipBlocking ?? true; // Use IP blocking setting
    default:
      return true;
  }
};

/**
 * Get feature tooltip text
 */
export const getFeatureTooltip = (featureName, settings, configFeatures) => {
  const isEnabled = isFeatureEnabled(featureName, settings, configFeatures);

  const tooltips = {
    ipBlocking: isEnabled
      ? "IP blocking is enabled - rules will be enforced"
      : "IP blocking is disabled - rules will not be enforced",
    countryBlocking: isEnabled
      ? "Country blocking is enabled - rules will be enforced"
      : "Country blocking is disabled - rules will not be enforced",
    rateLimiting: isEnabled
      ? "Rate limiting is enabled - rules will be enforced"
      : "Rate limiting is disabled - rules will not be enforced",
    suspiciousPatterns: isEnabled
      ? "Pattern detection is enabled - rules will be enforced"
      : "Pattern detection is disabled - rules will not be enforced",
    progressiveDelays: isEnabled
      ? "Progressive delays are enabled for repeat offenders"
      : "Progressive delays are disabled",
    autoThreatResponse: isEnabled
      ? "Automatic threat response is enabled"
      : "Automatic threat response is disabled",
    realTimeLogging: isEnabled
      ? "Real-time logging is enabled"
      : "Real-time logging is disabled",
    bulkActions: isEnabled
      ? "Bulk actions are available in the interface"
      : "Bulk actions are disabled",
    logExport: isEnabled
      ? "Log export functionality is available"
      : "Log export functionality is disabled",
  };

  return tooltips[featureName] || "Feature status unknown";
};

/**
 * Get theme icon based on configuration
 */
export const getThemeIcon = (iconName) => {
  switch (iconName) {
    case "Shield":
      return ShieldIcon;
    case "Security":
      return SecurityIcon;
    case "Admin":
      return AdminIcon;
    default:
      return ShieldIcon;
  }
};

/**
 * Format UI messages with placeholders
 */
export const formatMessage = (template, replacements = {}) => {
  let message = template;
  Object.keys(replacements).forEach((key) => {
    message = message.replace(
      new RegExp(`\\{${key}\\}`, "g"),
      replacements[key]
    );
  });
  return message;
};

/**
 * Calculate active blocked IPs count
 */
export const getActiveBlockedIpsCount = (rules) => {
  return rules.filter(
    (rule) =>
      rule.type === "ip_block" && rule.enabled && rule.action === "block"
  ).length;
};

/**
 * Get feature-based statistics
 */
export const calculateFeatureStats = (rules, settings, configFeatures) => {
  const stats = {
    totalRules: rules.length,
    enabledRules: rules.filter((rule) => rule.enabled).length,
    ipBlockRules: rules.filter((rule) => rule.type === "ip_block").length,
    countryBlockRules: rules.filter((rule) => rule.type === "country_block")
      .length,
    rateLimitRules: rules.filter((rule) => rule.type === "rate_limit").length,
    patternRules: rules.filter((rule) => rule.type === "suspicious_pattern")
      .length,
    activeFeatures: 0,
  };

  // Count active features from configuration only
  if (configFeatures) {
    Object.values(configFeatures).forEach((enabled) => {
      if (enabled) stats.activeFeatures++;
    });
  }

  return stats;
};

/**
 * Validate rule form data
 */
export const validateRuleForm = (formData) => {
  const errors = {};

  if (!formData.name?.trim()) {
    errors.name = "Rule name is required";
  }

  if (!formData.value?.trim()) {
    errors.value = "Rule value is required";
  }

  if (formData.type === "ip_block") {
    const ipRegex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
    if (!ipRegex.test(formData.value)) {
      errors.value = "Invalid IP address or CIDR notation";
    }
  }

  if (formData.type === "country_block") {
    if (formData.value.length !== 2) {
      errors.value = "Country code must be 2 letters (e.g., US, CN)";
    }
  }

  if (formData.priority < 1 || formData.priority > 1000) {
    errors.priority = "Priority must be between 1 and 1000";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Default export object with all utilities
 */
export default {
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
  calculateFeatureStats,
  validateRuleForm,
};
