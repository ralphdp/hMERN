// Licensing Plugin - Static Configuration
// These values are set at build-time and should not change during runtime

export const STATIC_CONFIG = {
  // Core plugin identification
  pluginId: "licensing",
  name: "hMERN Licensing",
  version: "1.0.0",
  author: "hMERN Team",
  category: "Core System",

  // API configuration
  api: {
    basePath: "/api/license",
    endpoints: {
      health: "/health",
      test: "/test",
      info: "/info",
      status: "/status",
      validate: "/validate",
      debug: "/debug",
      config: "/config",
      logs: "/logs",
      analytics: "/analytics",
      refresh: "/refresh",
      clear: "/clear",
    },
  },

  // Frontend routing
  frontend: {
    componentPath: "frontend/src/plugins/licensing/LicenseIndicator.jsx",
    adminPath: "/admin/licensing", // For future admin interface
  },

  // Database collections (static names)
  database: {
    collections: {
      logs: "licensinglogs",
      config: "licensingconfig",
      analytics: "licensinganalytics",
    },
    defaultConfigId: "licensing",
  },

  // Static metadata
  metadata: {
    tags: ["licensing", "core", "system", "validation"],
    type: "core",
    dependencies: [], // Core plugin - no dependencies
    isCore: true,
    requiredFor: ["firewall", "web-performance-optimization"],
    databaseCollections: [
      "licensinglogs",
      "licensingconfig",
      "licensinganalytics",
    ],
  },

  // Constants (build-time only)
  constants: {
    DAY_IN_MS: 24 * 60 * 60 * 1000,
    HOUR_IN_MS: 60 * 60 * 1000,
    MINUTE_IN_MS: 60 * 1000,
    DEFAULT_SUCCESS_TIMEOUT: 3000,

    // Licensing-specific constants
    CACHE_DURATION: 60 * 60 * 1000, // 1 hour
    DEFAULT_LICENSE_TIMEOUT: 10000, // 10 seconds
    MAX_VALIDATION_RETRIES: 3,
    DEFAULT_LOG_RETENTION_DAYS: 90,
    OFFLINE_GRACE_PERIOD: 24 * 60 * 60 * 1000, // 24 hours
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
