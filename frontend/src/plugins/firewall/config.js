// Firewall Plugin - Static Configuration
// These values are set at build-time and should not change during runtime

export const STATIC_CONFIG = {
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

  // Constants (build-time only)
  constants: {
    DAY_IN_MS: 24 * 60 * 60 * 1000,
    HOUR_IN_MS: 60 * 60 * 1000,
    MINUTE_IN_MS: 60 * 1000,
    DEFAULT_PAGE_SIZE: 20,
    DEFAULT_LOG_LIMIT: 100,
    DEFAULT_SUCCESS_TIMEOUT: 3000,
  },
};

// Helper function to construct full API URLs
export const getApiUrl = (endpoint) => {
  return `${STATIC_CONFIG.api.basePath}${
    STATIC_CONFIG.api.endpoints[endpoint] || endpoint
  }`;
};

// Helper function to get collection name
export const getCollectionName = (type) => {
  return STATIC_CONFIG.database.collections[type];
};

export default STATIC_CONFIG;
