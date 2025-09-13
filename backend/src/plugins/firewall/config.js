// Firewall Plugin - Static Configuration (Backend Version)
// CommonJS version for backend consumption

const STATIC_CONFIG = {
  // Core plugin identification
  pluginId: "firewall",
  name: "hMERN Firewall",
  version: "1.0.0",
  author: "hMERN Team",
  category: "Security",

  // API configuration
  api: {
    basePath: "/api/firewall",
    endpoints: {
      health: "/health",
      test: "/test",
      stats: "/stats",
      rules: "/rules",
      blockedIps: "/blocked-ips",
      logs: "/logs",
      settings: "/settings",
      geoSettings: "/geo-settings",
      rateLimitSettings: "/rate-limit-settings",
      threatIntelligence: "/threat-intelligence",
      exportLogs: "/export-logs",
      bulkActions: "/bulk-actions",
      config: "/config",
    },
  },

  // Frontend routing
  frontend: {
    adminPath: "/admin/firewall",
    componentPath: "frontend/src/plugins/firewall/FirewallAdmin.jsx",
  },

  // Database collections (static names)
  database: {
    collections: {
      settings: "plugin_firewall_settings",
      rules: "plugin_firewall_rules",
      blockedIps: "plugin_firewall_blocked_ips",
      logs: "plugin_firewall_logs",
      rateLimits: "plugin_firewall_rate_limits",
      geoBlocks: "plugin_firewall_geo_blocks",
      threatIntel: "plugin_firewall_threat_intel",
      config: "plugin_firewall_configs",
    },
    defaultSettingsId: "default",
    defaultConfigId: "firewall",
  },

  // Static metadata
  metadata: {
    tags: ["security", "firewall", "protection", "admin"],
    dependencies: ["licensing"],
    type: "Security",
    databaseCollections: [
      "plugin_firewall_settings",
      "plugin_firewall_rules",
      "plugin_firewall_blocked_ips",
      "plugin_firewall_logs",
      "plugin_firewall_rate_limits",
      "plugin_firewall_geo_blocks",
      "plugin_firewall_threat_intel",
      "plugin_firewall_configs",
    ],
  },

  // Configurable Defaults (can be overridden by database settings)
  defaults: {
    rateLimits: {
      regular: {
        perMinute: 120,
        perHour: 720,
      },
      admin: {
        perMinute: 500,
        perHour: 4000,
      },
    },
    progressiveDelays: {
      regular: [10, 60, 90, 120],
      admin: [5, 30, 60, 120],
    },
    security: {
      maxPatternLength: 500,
      maxInputLength: 2000,
      regexTimeout: 100,
      emergencyDelayMs: 5000,
      emergencyWindowMs: 30000,
    },
    thresholds: {
      rateLimitPerMinute: 50,
      rateLimitPerHour: 400,
      maxProgressiveDelay: 120000,
      highRiskThreshold: 8,
      mediumRiskThreshold: 5,
      autoBlockThreshold: 10,
      logRetentionDays: 30,
      maxLogEntries: 10000,
    },
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 2500,
      defaultLogLimit: 100,
    },
    timeouts: {
      successMessage: 3000,
      apiTimeout: 30000,
      cacheTimeout: 300,
    },
    caching: {
      rulesTtl: 60,
      settingsTtl: 300,
      maxCacheSize: 5000,
    },
  },
};

/**
 * Get configuration value with fallback to defaults
 * @param {string} path - Dot notation path (e.g., 'rateLimits.regular.perMinute')
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {any} Configuration value
 */
function getConfigValue(path, settings = {}, config = {}) {
  const pathParts = path.split(".");

  // Try to get from settings first
  let settingsValue = settings;
  for (const part of pathParts) {
    if (
      settingsValue &&
      typeof settingsValue === "object" &&
      part in settingsValue
    ) {
      settingsValue = settingsValue[part];
    } else {
      settingsValue = undefined;
      break;
    }
  }

  if (settingsValue !== undefined) {
    return settingsValue;
  }

  // Try to get from config second
  let configValue = config;
  for (const part of pathParts) {
    if (configValue && typeof configValue === "object" && part in configValue) {
      configValue = configValue[part];
    } else {
      configValue = undefined;
      break;
    }
  }

  if (configValue !== undefined) {
    return configValue;
  }

  // Fall back to defaults
  let defaultValue = STATIC_CONFIG.defaults;
  for (const part of pathParts) {
    if (
      defaultValue &&
      typeof defaultValue === "object" &&
      part in defaultValue
    ) {
      defaultValue = defaultValue[part];
    } else {
      return undefined;
    }
  }

  return defaultValue;
}

/**
 * Get all rate limit configuration for a user type
 * @param {boolean} isAdmin - Whether user is admin
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Rate limit configuration
 */
function getRateLimitConfig(isAdmin = false, settings = {}, config = {}) {
  const userType = isAdmin ? "admin" : "regular";

  return {
    perMinute: getConfigValue(
      `rateLimits.${userType}.perMinute`,
      settings,
      config
    ),
    perHour: getConfigValue(`rateLimits.${userType}.perHour`, settings, config),
    progressiveDelays: getConfigValue(
      `progressiveDelays.${userType}`,
      settings,
      config
    ),
  };
}

/**
 * Get security thresholds configuration
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Security configuration
 */
function getSecurityConfig(settings = {}, config = {}) {
  return {
    maxPatternLength: getConfigValue(
      "security.maxPatternLength",
      settings,
      config
    ),
    maxInputLength: getConfigValue("security.maxInputLength", settings, config),
    regexTimeout: getConfigValue("security.regexTimeout", settings, config),
    emergencyDelayMs: getConfigValue(
      "security.emergencyDelayMs",
      settings,
      config
    ),
    emergencyWindowMs: getConfigValue(
      "security.emergencyWindowMs",
      settings,
      config
    ),
  };
}

/**
 * Get pagination configuration
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Pagination configuration
 */
function getPaginationConfig(settings = {}, config = {}) {
  return {
    defaultPageSize: getConfigValue(
      "pagination.defaultPageSize",
      settings,
      config
    ),
    maxPageSize: getConfigValue("pagination.maxPageSize", settings, config),
    defaultLogLimit: getConfigValue(
      "pagination.defaultLogLimit",
      settings,
      config
    ),
  };
}

// Helper function to construct full API URLs
const getApiUrl = (endpoint) => {
  return `${STATIC_CONFIG.api.basePath}${
    STATIC_CONFIG.api.endpoints[endpoint] || endpoint
  }`;
};

// Helper function to get collection name
const getCollectionName = (type) => {
  return STATIC_CONFIG.database.collections[type];
};

module.exports = {
  STATIC_CONFIG,
  getApiUrl,
  getCollectionName,
  getConfigValue,
  getRateLimitConfig,
  getSecurityConfig,
  getPaginationConfig,
};
