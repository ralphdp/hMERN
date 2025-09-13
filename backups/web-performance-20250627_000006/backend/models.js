const mongoose = require("mongoose");

// Web Performance Optimization Settings Schema
const webPerformanceSettingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    default: "default",
    unique: true,
  },

  // File Optimization Settings
  fileOptimization: {
    // CSS/JS Minification & Concatenation
    minification: {
      enableCSSMinification: {
        type: Boolean,
        default: false,
      },
      enableJSMinification: {
        type: Boolean,
        default: false,
      },
      enableConcatenation: {
        type: Boolean,
        default: false,
      },
      preserveComments: {
        type: Boolean,
        default: false,
      },
      removeUnusedCSS: {
        type: Boolean,
        default: false,
      },
    },

    // Image Optimization & WebP Conversion
    images: {
      enableOptimization: {
        type: Boolean,
        default: false,
      },
      enableWebPConversion: {
        type: Boolean,
        default: false,
      },
      jpegQuality: {
        type: Number,
        default: 80,
        min: 1,
        max: 100,
      },
      pngQuality: {
        type: Number,
        default: 80,
        min: 1,
        max: 100,
      },
      webpQuality: {
        type: Number,
        default: 80,
        min: 1,
        max: 100,
      },
      maxWidth: {
        type: Number,
        default: 1920,
        min: 100,
        max: 4000,
      },
      maxHeight: {
        type: Number,
        default: 1080,
        min: 100,
        max: 4000,
      },
    },

    // GZIP/Brotli Compression
    compression: {
      enableGzip: {
        type: Boolean,
        default: true,
      },
      enableBrotli: {
        type: Boolean,
        default: false,
      },
      compressionLevel: {
        type: Number,
        default: 6,
        min: 1,
        max: 9,
      },
      threshold: {
        type: Number,
        default: 1024, // Only compress files larger than 1KB
        min: 0,
        max: 10240,
      },
    },
  },

  // Caching Layers Settings
  cachingLayers: {
    // Database Query Caching (Redis)
    databaseCache: {
      enabled: {
        type: Boolean,
        default: false,
      },
      defaultTTL: {
        type: Number,
        default: 300, // 5 minutes
        min: 60,
        max: 86400, // 24 hours max
      },
      maxMemory: {
        type: String,
        default: "100mb",
      },
    },

    // Fragment/Object Caching (Redis)
    fragmentCache: {
      enabled: {
        type: Boolean,
        default: false,
      },
      defaultTTL: {
        type: Number,
        default: 600, // 10 minutes
        min: 60,
        max: 86400,
      },
      enableFragmentCaching: {
        type: Boolean,
        default: false,
      },
      enableObjectCaching: {
        type: Boolean,
        default: false,
      },
    },

    // Static File Caching (Cloudflare R2)
    staticFileCache: {
      enabled: {
        type: Boolean,
        default: false,
      },
      cacheTTL: {
        type: Number,
        default: 86400, // 24 hours
        min: 3600,
        max: 2592000, // 30 days max
      },
      enableVersioning: {
        type: Boolean,
        default: true,
      },
    },

    // Browser Caching (HTTP Headers)
    browserCache: {
      enabled: {
        type: Boolean,
        default: true,
      },
      staticFilesTTL: {
        type: Number,
        default: 31536000, // 1 year
        min: 86400,
        max: 31536000,
      },
      dynamicContentTTL: {
        type: Number,
        default: 0, // No cache
        min: 0,
        max: 86400,
      },
      enableETag: {
        type: Boolean,
        default: true,
      },
      enableLastModified: {
        type: Boolean,
        default: true,
      },
    },
  },

  // Performance Features Settings
  performanceFeatures: {
    // Lazy Loading
    lazyLoading: {
      enabled: {
        type: Boolean,
        default: false,
      },
      enableImageLazyLoading: {
        type: Boolean,
        default: false,
      },
      enableIframeLazyLoading: {
        type: Boolean,
        default: false,
      },
      threshold: {
        type: Number,
        default: 100, // pixels
        min: 0,
        max: 1000,
      },
    },

    // Critical CSS
    criticalCSS: {
      enabled: {
        type: Boolean,
        default: false,
      },
      inlineThreshold: {
        type: Number,
        default: 14000, // 14KB
        min: 1000,
        max: 50000,
      },
      enableAutomaticExtraction: {
        type: Boolean,
        default: false,
      },
    },

    // Preloading
    preloading: {
      enabled: {
        type: Boolean,
        default: false,
      },
      enableDNSPrefetch: {
        type: Boolean,
        default: false,
      },
      enablePreconnect: {
        type: Boolean,
        default: false,
      },
      enableResourceHints: {
        type: Boolean,
        default: false,
      },
      preloadFonts: {
        type: Boolean,
        default: false,
      },
      preloadCriticalImages: {
        type: Boolean,
        default: false,
      },
    },
  },

  // Performance Settings
  general: {
    enabled: {
      type: Boolean,
      default: false,
    },
    enableAnalytics: {
      type: Boolean,
      default: true,
    },
  },

  // Email Reports Settings
  emailReports: {
    enabled: {
      type: Boolean,
      default: false,
    },
    emails: {
      type: [String],
      default: [],
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
    time: {
      type: String,
      default: "09:00", // 24h format
    },
    // Core Performance Metrics
    includeCoreWebVitals: {
      type: Boolean,
      default: true,
    },
    includeFileOptimization: {
      type: Boolean,
      default: true,
    },
    includeCachePerformance: {
      type: Boolean,
      default: true,
    },
    includeProcessingQueue: {
      type: Boolean,
      default: true,
    },
    // Activity & Analysis
    includeRecentActivities: {
      type: Boolean,
      default: true,
    },
    includeFeatureStatus: {
      type: Boolean,
      default: true,
    },
    // Charts & Visualizations
    includePerformanceTrends: {
      type: Boolean,
      default: true,
    },
    includeSparklines: {
      type: Boolean,
      default: true,
    },
    // Executive Summary
    includeExecutiveSummary: {
      type: Boolean,
      default: true,
    },
    includeRecommendations: {
      type: Boolean,
      default: true,
    },
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Performance Metrics Schema
const performanceMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },

  // File Optimization Metrics
  optimization: {
    cssMinified: {
      type: Number,
      default: 0,
    },
    jsMinified: {
      type: Number,
      default: 0,
    },
    imagesOptimized: {
      type: Number,
      default: 0,
    },
    webpConverted: {
      type: Number,
      default: 0,
    },
    totalSizeSaved: {
      type: Number,
      default: 0, // bytes saved
    },
  },

  // Caching Metrics
  caching: {
    cacheHits: {
      type: Number,
      default: 0,
    },
    cacheMisses: {
      type: Number,
      default: 0,
    },
    avgResponseTime: {
      type: Number,
      default: 0, // milliseconds
    },
    bandwidthSaved: {
      type: Number,
      default: 0, // bytes
    },
  },

  // Performance Metrics
  performance: {
    pageLoadTime: {
      type: Number,
      default: 0, // milliseconds
    },
    firstContentfulPaint: {
      type: Number,
      default: 0,
    },
    largestContentfulPaint: {
      type: Number,
      default: 0,
    },
    cumulativeLayoutShift: {
      type: Number,
      default: 0,
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Processing Queue Schema (for background optimization tasks)
const processingQueueSchema = new mongoose.Schema({
  taskType: {
    type: String,
    enum: ["minify_css", "minify_js", "optimize_image", "upload_to_r2"],
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
    index: true,
  },
  priority: {
    type: Number,
    default: 0, // Higher numbers = higher priority
  },
  attempts: {
    type: Number,
    default: 0,
  },
  maxAttempts: {
    type: Number,
    default: 3,
  },
  error: {
    type: String,
  },
  result: {
    originalSize: Number,
    optimizedSize: Number,
    savings: Number,
    outputPath: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
});

// Analytics Data Schema
const analyticsDataSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  hour: {
    type: Number,
    required: true,
    min: 0,
    max: 23,
  },

  // Performance Analytics
  performance: {
    pageViews: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    avgLoadTime: {
      type: Number,
      default: 0, // milliseconds
    },
    bounceRate: {
      type: Number,
      default: 0, // percentage
    },
    coreWebVitals: {
      lcp: {
        type: Number,
        default: 0, // Largest Contentful Paint
      },
      fid: {
        type: Number,
        default: 0, // First Input Delay
      },
      cls: {
        type: Number,
        default: 0, // Cumulative Layout Shift
      },
    },
  },

  // Optimization Analytics
  optimization: {
    filesProcessed: {
      type: Number,
      default: 0,
    },
    bytesOptimized: {
      type: Number,
      default: 0,
    },
    optimizationTime: {
      type: Number,
      default: 0, // milliseconds
    },
    errorRate: {
      type: Number,
      default: 0, // percentage
    },
  },

  // Cache Analytics
  cache: {
    hitRate: {
      type: Number,
      default: 0, // percentage
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    bandwidthSaved: {
      type: Number,
      default: 0, // bytes
    },
    avgResponseTime: {
      type: Number,
      default: 0, // milliseconds
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Web Performance Logs Schema (for activity logging following plugin-template pattern)
const webPerformanceLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ["info", "warn", "error", "debug"],
    default: "info",
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Web Performance Dynamic Config Schema - Following plugin-template pattern
const webPerformanceConfigSchema = new mongoose.Schema({
  pluginId: {
    type: String,
    default: "web-performance-optimization",
    unique: true,
  },
  // UI Configuration (runtime-configurable)
  ui: {
    theme: {
      primaryColor: {
        type: String,
        default: "primary.main",
      },
      icon: {
        type: String,
        default: "Speed",
      },
    },
    timeouts: {
      successMessage: {
        type: Number,
        default: 3000,
      },
      loadingMinHeight: {
        type: String,
        default: "500px",
      },
    },
    messages: {
      title: {
        type: String,
        default: "Web Performance Optimization",
      },
      subtitle: {
        type: String,
        default:
          "Advanced web performance optimization with file optimization, caching layers, and performance features",
      },
      successOptimization: {
        type: String,
        default: "File optimization completed: {type} - {savings} saved",
      },
      errorOptimization: {
        type: String,
        default: "Failed to optimize file: {error}",
      },
    },
  },
  // Feature toggles (runtime-configurable)
  features: {
    fileOptimization: {
      type: Boolean,
      default: true,
    },
    cachingLayers: {
      type: Boolean,
      default: true,
    },
    performanceFeatures: {
      type: Boolean,
      default: true,
    },
    performanceMonitoring: {
      type: Boolean,
      default: true,
    },
    emailReports: {
      type: Boolean,
      default: false,
    },
    debugMode: {
      type: Boolean,
      default: false,
    },
  },
  // Runtime thresholds and limits (configurable by admins)
  thresholds: {
    // File optimization thresholds
    maxFileSize: {
      type: Number,
      default: 10 * 1024 * 1024, // 10MB
      min: 1024 * 1024, // 1MB
      max: 100 * 1024 * 1024, // 100MB
    },
    imageQuality: {
      type: Number,
      default: 80,
      min: 10,
      max: 100,
    },
    // Caching thresholds
    cacheMaxAge: {
      type: Number,
      default: 86400, // 24 hours
      min: 3600,
      max: 2592000,
    },
    // Performance thresholds
    maxResponseTime: {
      type: Number,
      default: 5000, // 5 seconds
      min: 1000,
      max: 30000,
    },
    // Queue processing
    maxQueueSize: {
      type: Number,
      default: 1000,
      min: 100,
      max: 10000,
    },
    queueProcessInterval: {
      type: Number,
      default: 30000, // 30 seconds
      min: 10000,
      max: 300000,
    },
  },
  // Admin panel configuration
  adminPanel: {
    enabled: {
      type: Boolean,
      default: true,
    },
    menuItem: {
      title: {
        type: String,
        default: "Web Performance",
      },
      description: {
        type: String,
        default: "Optimize web performance",
      },
    },
    card: {
      title: {
        type: String,
        default: "Web Performance Optimization",
      },
      description: {
        type: String,
        default:
          "Advanced web performance optimization with file optimization, caching layers, lazy loading, and performance monitoring features.",
      },
      buttonText: {
        type: String,
        default: "Manage Performance",
      },
    },
  },
  // Configuration metadata
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    default: "system",
  },
});

// Update the updatedAt field before saving
webPerformanceConfigSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
performanceMetricsSchema.index({ date: -1 });
processingQueueSchema.index({ status: 1, createdAt: 1 });
processingQueueSchema.index({ taskType: 1, status: 1 });
analyticsDataSchema.index({ date: -1, hour: -1 });
webPerformanceLogSchema.index({ timestamp: -1 });
webPerformanceLogSchema.index({ level: 1, timestamp: -1 });

const WebPerformanceSettings = mongoose.model(
  "WebPerformanceSettings",
  webPerformanceSettingsSchema,
  "plugin_web_performance_settings"
);
const WebPerformanceMetrics = mongoose.model(
  "WebPerformanceMetrics",
  performanceMetricsSchema,
  "plugin_web_performance_metrics"
);
const WebPerformanceQueue = mongoose.model(
  "WebPerformanceQueue",
  processingQueueSchema,
  "plugin_web_performance_queue"
);
const WebPerformanceAnalytics = mongoose.model(
  "WebPerformanceAnalytics",
  analyticsDataSchema,
  "plugin_web_performance_analytics"
);
const WebPerformanceLog = mongoose.model(
  "WebPerformanceLog",
  webPerformanceLogSchema,
  "plugin_web_performance_logs"
);
const WebPerformanceConfig = mongoose.model(
  "WebPerformanceConfig",
  webPerformanceConfigSchema,
  "plugin_web_performance_configs"
);

module.exports = {
  WebPerformanceSettings,
  WebPerformanceMetrics,
  WebPerformanceQueue,
  WebPerformanceAnalytics,
  WebPerformanceLog,
  WebPerformanceConfig,
  // Legacy exports for backward compatibility
  PerformanceMetrics: WebPerformanceMetrics,
  ProcessingQueue: WebPerformanceQueue,
  AnalyticsData: WebPerformanceAnalytics,
};
