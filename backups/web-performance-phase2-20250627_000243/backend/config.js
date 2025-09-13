// Web Performance Optimization Plugin - Static Configuration (Backend Version)
// CommonJS version for backend consumption

const STATIC_CONFIG = {
  // Core plugin identification
  pluginId: "web-performance-optimization",
  name: "hMERN Web Performance Optimization",
  version: "1.0.0",
  author: "hMERN Team",
  category: "Performance",

  // API configuration
  api: {
    basePath: "/api/web-performance",
    endpoints: {
      health: "/health",
      test: "/test",
      info: "/info",
      stats: "/stats",
      settings: "/settings",
      config: "/config",
      metrics: "/metrics",
      queue: "/queue",
      optimize: "/optimize",
      cache: "/cache",
      files: "/files",
      cleanup: "/cleanup",
      reset: "/reset",
      export: "/export",
    },
  },

  // Frontend routing
  frontend: {
    adminPath: "/admin/web-performance-optimization",
    componentPath:
      "frontend/src/plugins/web-performance-optimization/WebPerformanceAdmin.jsx",
  },

  // Database collections (static names)
  database: {
    collections: {
      settings: "webperformancesettings",
      metrics: "webperformancemetrics",
      queue: "webperformancequeue",
      logs: "webperformancelogs",
      config: "webperformanceconfig",
    },
    defaultSettingsId: "default",
    defaultConfigId: "web-performance-optimization",
  },

  // Static metadata
  metadata: {
    tags: ["performance", "optimization", "caching", "compression"],
    type: "optimization",
    dependencies: [], // No dependencies
    databaseCollections: [
      "webperformancesettings",
      "webperformancemetrics",
      "webperformancequeue",
      "webperformancelogs",
      "webperformanceconfig",
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

    // Performance-specific constants
    CACHE_TTL: 5 * 60 * 1000, // 5 minutes
    QUEUE_PROCESS_INTERVAL: 30000, // 30 seconds
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    DEFAULT_COMPRESSION_QUALITY: 80,
    MAX_OPTIMIZATION_ATTEMPTS: 3,
  },
};

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
};
