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
      // Enhanced endpoints matching firewall architecture
      bulkActions: "/bulk-actions",
      reports: "/reports",
      analysis: "/analysis",
      alerts: "/alerts",
      jobs: "/jobs",
      intelligence: "/intelligence",
      preview: "/preview",
      backup: "/backup",
      restore: "/restore",
      debug: "/debug",
      benchmark: "/benchmark",
      recommendations: "/recommendations",
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
      settings: "plugin_webperformance_settings",
      metrics: "plugin_webperformance_metrics",
      queue: "plugin_webperformance_queue",
      logs: "plugin_webperformance_logs",
      config: "plugin_webperformance_configs",
      cacheMetrics: "plugin_webperformance_cache_metrics",
      optimizationHistory: "plugin_webperformance_optimization_history",
      performanceAlerts: "plugin_webperformance_performance_alerts",
      backgroundJobs: "plugin_webperformance_background_jobs",
      reports: "plugin_webperformance_reports",
      intelligence: "plugin_webperformance_intelligence",
      benchmarks: "plugin_webperformance_benchmarks",
    },
    defaultSettingsId: "default",
    defaultConfigId: "web-performance-optimization",
  },

  // Static metadata
  metadata: {
    tags: [
      "performance",
      "optimization",
      "caching",
      "compression",
      "analytics",
    ],
    type: "Performance",
    dependencies: ["licensing"],
    databaseCollections: [
      "plugin_webperformance_settings",
      "plugin_webperformance_metrics",
      "plugin_webperformance_queue",
      "plugin_webperformance_logs",
      "plugin_webperformance_configs",
      "plugin_webperformance_cache_metrics",
      "plugin_webperformance_optimization_history",
      "plugin_webperformance_performance_alerts",
      "plugin_webperformance_background_jobs",
      "plugin_webperformance_reports",
      "plugin_webperformance_intelligence",
      "plugin_webperformance_benchmarks",
    ],
  },

  // Configurable Defaults (can be overridden by database settings)
  defaults: {
    optimization: {
      imageCompression: {
        quality: 80,
        format: "webp",
        enableProgressive: true,
        stripMetadata: true,
        maxWidth: 1920,
        maxHeight: 1080,
      },
      cssMinification: {
        removeComments: true,
        removeWhitespace: true,
        optimizeSelectors: true,
        mergeDuplicates: true,
      },
      jsMinification: {
        removeComments: true,
        removeWhitespace: true,
        mangle: true,
        compress: true,
      },
      htmlMinification: {
        removeComments: true,
        removeWhitespace: true,
        removeEmptyAttributes: true,
        collapseWhitespace: true,
      },
    },
    caching: {
      browser: {
        staticAssets: 31536000, // 1 year
        dynamicContent: 3600, // 1 hour
        apiResponses: 300, // 5 minutes
      },
      server: {
        memoryLimit: 256, // MB
        diskLimit: 1024, // MB
        ttl: 3600, // seconds
        maxEntries: 10000,
      },
      cdn: {
        enabled: false,
        provider: "cloudflare",
        zoneTtl: 14400, // 4 hours
        purgeTtl: 30, // seconds
      },
    },
    compression: {
      gzip: {
        enabled: true,
        level: 6,
        threshold: 1024,
        chunkSize: 16384,
      },
      brotli: {
        enabled: true,
        quality: 4,
        lgwin: 22,
        lgblock: 0,
      },
    },
    monitoring: {
      metrics: {
        collectInterval: 60000, // 1 minute
        retentionDays: 30,
        maxEntries: 100000,
        alertThresholds: {
          loadTime: 3000, // ms
          firstByte: 500, // ms
          domReady: 2000, // ms
          fullyLoaded: 5000, // ms
        },
      },
      alerts: {
        enabled: true,
        emailNotifications: true,
        slackNotifications: false,
        thresholds: {
          critical: 90, // performance score
          warning: 70,
          info: 50,
        },
      },
    },
    processing: {
      queue: {
        maxConcurrent: 5,
        retryAttempts: 3,
        retryDelay: 5000, // ms
        batchSize: 10,
        timeout: 300000, // 5 minutes
      },
      backgroundJobs: {
        enabled: true,
        scheduleInterval: 3600000, // 1 hour
        cleanupInterval: 86400000, // 24 hours
        maxJobAge: 604800000, // 7 days
      },
    },
    security: {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedFileTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "text/css",
        "application/javascript",
        "text/html",
      ],
      uploadTimeout: 30000, // 30 seconds
      processTimeout: 300000, // 5 minutes
    },
    intelligence: {
      analysis: {
        enablePredictive: true,
        enableRecommendations: true,
        dataPoints: 1000,
        confidenceThreshold: 0.8,
      },
      reporting: {
        autoGenerate: true,
        frequency: "weekly",
        recipients: [],
        includeCharts: true,
      },
    },
    pagination: {
      defaultPageSize: 20,
      maxPageSize: 1000,
      defaultLogLimit: 100,
      maxLogLimit: 5000,
    },
    timeouts: {
      successMessage: 3000,
      apiTimeout: 30000,
      cacheTimeout: 300,
      jobTimeout: 600000, // 10 minutes
    },
  },
};

/**
 * Get configuration value with fallback to defaults
 * @param {string} path - Dot notation path (e.g., 'optimization.imageCompression.quality')
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
 * Get optimization configuration for specific asset type
 * @param {string} assetType - Type of asset (image, css, js, html)
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Optimization configuration
 */
function getOptimizationConfig(assetType, settings = {}, config = {}) {
  const validTypes = ["image", "css", "js", "html"];
  if (!validTypes.includes(assetType)) {
    throw new Error(`Invalid asset type: ${assetType}`);
  }

  const configKey =
    assetType === "image"
      ? "imageCompression"
      : assetType === "css"
      ? "cssMinification"
      : assetType === "js"
      ? "jsMinification"
      : "htmlMinification";

  return {
    ...getConfigValue(`optimization.${configKey}`, settings, config),
    assetType,
  };
}

/**
 * Get caching configuration for specific cache type
 * @param {string} cacheType - Type of cache (browser, server, cdn)
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Caching configuration
 */
function getCachingConfig(cacheType = "browser", settings = {}, config = {}) {
  const validTypes = ["browser", "server", "cdn"];
  if (!validTypes.includes(cacheType)) {
    throw new Error(`Invalid cache type: ${cacheType}`);
  }

  return {
    ...getConfigValue(`caching.${cacheType}`, settings, config),
    type: cacheType,
  };
}

/**
 * Get compression configuration
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Compression configuration
 */
function getCompressionConfig(settings = {}, config = {}) {
  return {
    gzip: getConfigValue("compression.gzip", settings, config),
    brotli: getConfigValue("compression.brotli", settings, config),
  };
}

/**
 * Get monitoring configuration
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Monitoring configuration
 */
function getMonitoringConfig(settings = {}, config = {}) {
  return {
    metrics: getConfigValue("monitoring.metrics", settings, config),
    alerts: getConfigValue("monitoring.alerts", settings, config),
  };
}

/**
 * Get processing configuration
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Processing configuration
 */
function getProcessingConfig(settings = {}, config = {}) {
  return {
    queue: getConfigValue("processing.queue", settings, config),
    backgroundJobs: getConfigValue(
      "processing.backgroundJobs",
      settings,
      config
    ),
  };
}

/**
 * Get security configuration
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Security configuration
 */
function getSecurityConfig(settings = {}, config = {}) {
  return {
    maxFileSize: getConfigValue("security.maxFileSize", settings, config),
    allowedFileTypes: getConfigValue(
      "security.allowedFileTypes",
      settings,
      config
    ),
    uploadTimeout: getConfigValue("security.uploadTimeout", settings, config),
    processTimeout: getConfigValue("security.processTimeout", settings, config),
  };
}

/**
 * Get intelligence configuration
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Intelligence configuration
 */
function getIntelligenceConfig(settings = {}, config = {}) {
  return {
    analysis: getConfigValue("intelligence.analysis", settings, config),
    reporting: getConfigValue("intelligence.reporting", settings, config),
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
    maxLogLimit: getConfigValue("pagination.maxLogLimit", settings, config),
  };
}

/**
 * Get alert thresholds for performance metrics
 * @param {object} settings - Current settings from database
 * @param {object} config - Current config from database
 * @returns {object} Alert thresholds
 */
function getAlertThresholds(settings = {}, config = {}) {
  return {
    performance: getConfigValue(
      "monitoring.alerts.thresholds",
      settings,
      config
    ),
    metrics: getConfigValue(
      "monitoring.metrics.alertThresholds",
      settings,
      config
    ),
  };
}

/**
 * Validate configuration values
 * @param {object} configObj - Configuration object to validate
 * @param {string} section - Configuration section name
 * @returns {object} Validation result with errors if any
 */
function validateConfig(configObj, section) {
  const errors = [];

  if (!configObj || typeof configObj !== "object") {
    errors.push(`${section} configuration must be an object`);
    return { isValid: false, errors };
  }

  // Section-specific validation
  switch (section) {
    case "optimization":
      if (configObj.imageCompression && configObj.imageCompression.quality) {
        const quality = configObj.imageCompression.quality;
        if (quality < 1 || quality > 100) {
          errors.push("Image compression quality must be between 1 and 100");
        }
      }
      break;

    case "caching":
      if (configObj.browser && configObj.browser.staticAssets) {
        const ttl = configObj.browser.staticAssets;
        if (ttl < 0 || ttl > 31536000) {
          // Max 1 year
          errors.push(
            "Browser cache TTL must be between 0 and 31536000 seconds"
          );
        }
      }
      break;

    case "security":
      if (configObj.maxFileSize && configObj.maxFileSize > 100 * 1024 * 1024) {
        errors.push("Maximum file size cannot exceed 100MB");
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
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

// Helper function to get default settings for a specific section
const getDefaultSettings = (section) => {
  return STATIC_CONFIG.defaults[section] || {};
};

// Helper function to merge settings with defaults
const mergeWithDefaults = (userSettings = {}, section = null) => {
  if (section) {
    return {
      ...STATIC_CONFIG.defaults[section],
      ...userSettings,
    };
  }

  return {
    ...STATIC_CONFIG.defaults,
    ...userSettings,
  };
};

module.exports = {
  STATIC_CONFIG,
  getApiUrl,
  getCollectionName,
  getConfigValue,
  getOptimizationConfig,
  getCachingConfig,
  getCompressionConfig,
  getMonitoringConfig,
  getProcessingConfig,
  getSecurityConfig,
  getIntelligenceConfig,
  getPaginationConfig,
  getAlertThresholds,
  validateConfig,
  getDefaultSettings,
  mergeWithDefaults,
};
