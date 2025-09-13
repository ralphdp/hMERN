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

// Cache Metrics Schema (dedicated cache performance tracking)
const cacheMetricsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  cacheType: {
    type: String,
    enum: ["database", "fragment", "static_file", "browser", "memory", "redis"],
    required: true,
    index: true,
  },

  // Cache Performance Metrics
  metrics: {
    hitRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // percentage
    },
    missRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100, // percentage
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    avgResponseTime: {
      type: Number,
      default: 0, // milliseconds
    },
    dataTransferred: {
      type: Number,
      default: 0, // bytes
    },
    bandwidthSaved: {
      type: Number,
      default: 0, // bytes saved due to caching
    },
  },

  // Cache Storage Metrics
  storage: {
    totalSize: {
      type: Number,
      default: 0, // bytes
    },
    usedSize: {
      type: Number,
      default: 0, // bytes
    },
    keyCount: {
      type: Number,
      default: 0,
    },
    evictions: {
      type: Number,
      default: 0,
    },
  },

  // Cache Health Metrics
  health: {
    uptime: {
      type: Number,
      default: 0, // seconds
    },
    memoryUsage: {
      type: Number,
      default: 0, // percentage
    },
    connectionCount: {
      type: Number,
      default: 0,
    },
    errorRate: {
      type: Number,
      default: 0, // percentage
    },
  },

  // Metadata
  metadata: {
    region: String,
    server: String,
    version: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimization History Schema (detailed history of optimization operations)
const optimizationHistorySchema = new mongoose.Schema({
  operationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Operation Details
  operation: {
    type: {
      type: String,
      enum: [
        "css_minification",
        "js_minification",
        "image_optimization",
        "webp_conversion",
        "cache_optimization",
        "compression",
        "lazy_loading",
        "critical_css",
        "preloading",
        "bulk_optimization",
      ],
      required: true,
    },
    subtype: String, // e.g., "png_to_webp", "gzip_compression"
    scope: {
      type: String,
      enum: [
        "single_file",
        "bulk_operation",
        "scheduled_task",
        "manual_trigger",
      ],
      default: "single_file",
    },
  },

  // File/Resource Information
  resources: [
    {
      filePath: {
        type: String,
        required: true,
      },
      fileType: String,
      originalSize: {
        type: Number,
        required: true,
      },
      optimizedSize: {
        type: Number,
        required: true,
      },
      savings: {
        type: Number,
        required: true,
      },
      compressionRatio: {
        type: Number,
        min: 0,
        max: 1,
      },
      quality: Number, // for image optimization
      processingTime: Number, // milliseconds
    },
  ],

  // Operation Results
  results: {
    status: {
      type: String,
      enum: ["success", "partial_success", "failed"],
      required: true,
    },
    totalFiles: {
      type: Number,
      default: 0,
    },
    successfulFiles: {
      type: Number,
      default: 0,
    },
    failedFiles: {
      type: Number,
      default: 0,
    },
    totalSizeBefore: {
      type: Number,
      default: 0,
    },
    totalSizeAfter: {
      type: Number,
      default: 0,
    },
    totalSavings: {
      type: Number,
      default: 0,
    },
    averageCompressionRatio: {
      type: Number,
      min: 0,
      max: 1,
    },
    processingTime: {
      type: Number,
      default: 0, // total milliseconds
    },
  },

  // Context Information
  context: {
    triggeredBy: {
      type: String,
      enum: ["user", "system", "scheduler", "api"],
      default: "user",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userAgent: String,
    ipAddress: String,
    sessionId: String,
  },

  // Error Information
  errors: [
    {
      filePath: String,
      errorCode: String,
      errorMessage: String,
      stackTrace: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // Performance Metrics
  performance: {
    cpuUsage: Number, // percentage
    memoryUsage: Number, // bytes
    diskUsage: Number, // bytes
    networkUsage: Number, // bytes
    queueWaitTime: Number, // milliseconds
  },

  // Timestamps
  startedAt: {
    type: Date,
    required: true,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Performance Alerts Schema (alert management system)
const performanceAlertsSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Alert Classification
  type: {
    type: String,
    enum: [
      "performance",
      "error",
      "storage",
      "optimization",
      "cache",
      "system",
    ],
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: [
      "response_time",
      "cache_hit_rate",
      "error_rate",
      "storage_usage",
      "optimization_failure",
      "queue_overflow",
      "memory_usage",
      "disk_space",
      "connection_timeout",
      "ssl_expiry",
      "security_breach",
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ["info", "warning", "error", "critical"],
    required: true,
    index: true,
  },

  // Alert Content
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  description: String,

  // Trigger Information
  trigger: {
    threshold: {
      value: Number,
      operator: {
        type: String,
        enum: [">=", "<=", "==", "!=", ">", "<"],
      },
      unit: String,
    },
    actualValue: Number,
    metric: String,
    source: String,
  },

  // Alert Context
  context: {
    component: String, // e.g., "cache_layer", "image_optimization"
    resource: String, // e.g., file path, URL, service name
    environment: {
      type: String,
      enum: ["production", "staging", "development"],
      default: "production",
    },
    tags: [String],
  },

  // Alert Lifecycle
  status: {
    type: String,
    enum: ["active", "acknowledged", "resolved", "suppressed"],
    default: "active",
    index: true,
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  acknowledgedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedAt: Date,
  resolution: {
    method: {
      type: String,
      enum: ["manual", "automatic", "external"],
    },
    description: String,
    actions: [String],
  },

  // Notification Settings
  notifications: {
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: Date,
    recipients: [String],
    escalationLevel: {
      type: Number,
      default: 0,
    },
    lastEscalationAt: Date,
    suppressUntil: Date,
  },

  // Alert Analytics
  analytics: {
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    firstOccurrence: {
      type: Date,
      default: Date.now,
    },
    lastOccurrence: {
      type: Date,
      default: Date.now,
    },
    meanTimeToAcknowledge: Number, // milliseconds
    meanTimeToResolve: Number, // milliseconds
    similarAlerts: [String], // array of similar alert IDs
  },

  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Background Jobs Schema (background job tracking and management)
const backgroundJobsSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Job Classification
  type: {
    type: String,
    enum: [
      "data_cleanup",
      "metrics_aggregation",
      "cache_warming",
      "optimization_batch",
      "report_generation",
      "alert_processing",
      "backup_creation",
      "log_rotation",
      "performance_analysis",
      "health_check",
      "maintenance_task",
    ],
    required: true,
    index: true,
  },
  category: {
    type: String,
    enum: ["maintenance", "optimization", "reporting", "monitoring", "cleanup"],
    required: true,
  },
  priority: {
    type: String,
    enum: ["low", "normal", "high", "critical"],
    default: "normal",
    index: true,
  },

  // Job Details
  name: {
    type: String,
    required: true,
  },
  description: String,

  // Job Configuration
  config: {
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    schedule: {
      type: {
        type: String,
        enum: ["immediate", "scheduled", "recurring", "conditional"],
        default: "immediate",
      },
      cron: String, // for recurring jobs
      scheduledFor: Date,
      timezone: String,
    },
    retries: {
      maxAttempts: {
        type: Number,
        default: 3,
      },
      backoffStrategy: {
        type: String,
        enum: ["fixed", "exponential", "linear"],
        default: "exponential",
      },
      backoffDelay: {
        type: Number,
        default: 5000, // milliseconds
      },
    },
    timeout: {
      type: Number,
      default: 300000, // 5 minutes in milliseconds
    },
  },

  // Job Status
  status: {
    type: String,
    enum: ["pending", "running", "completed", "failed", "cancelled", "timeout"],
    default: "pending",
    index: true,
  },
  progress: {
    current: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 100,
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    message: String,
    estimatedTimeRemaining: Number, // milliseconds
  },

  // Execution Details
  execution: {
    attempts: {
      type: Number,
      default: 0,
    },
    startedAt: Date,
    completedAt: Date,
    duration: Number, // milliseconds

    // Resource Usage
    resources: {
      cpuUsage: Number, // percentage
      memoryUsage: Number, // bytes
      diskUsage: Number, // bytes
      networkUsage: Number, // bytes
    },

    // Worker Information
    worker: {
      id: String,
      hostname: String,
      pid: Number,
      version: String,
    },
  },

  // Results and Output
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  output: {
    logs: [String],
    warnings: [String],
    errors: [String],
    artifacts: [String], // file paths, URLs, etc.
  },

  // Error Information
  error: {
    code: String,
    message: String,
    stack: String,
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },

  // Dependencies
  dependencies: {
    parentJobId: String,
    childJobIds: [String],
    prerequisiteJobIds: [String],
    blockedBy: [String],
  },

  // Monitoring
  monitoring: {
    healthChecks: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["healthy", "warning", "unhealthy"],
        },
        message: String,
        metrics: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],
    alerts: [String], // alert IDs related to this job
  },

  // Metadata
  metadata: {
    tags: [String],
    labels: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdBy: {
      type: String,
      enum: ["system", "user", "scheduler", "api"],
      default: "system",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to update timestamps
performanceAlertsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

backgroundJobsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  // Update progress percentage
  if (this.progress.total > 0) {
    this.progress.percentage = Math.round(
      (this.progress.current / this.progress.total) * 100
    );
  }
  next();
});

// Additional Indexes for performance
cacheMetricsSchema.index({ timestamp: -1, cacheType: 1 });
cacheMetricsSchema.index({ cacheType: 1, "metrics.hitRate": -1 });

optimizationHistorySchema.index({ "operation.type": 1, startedAt: -1 });
optimizationHistorySchema.index({ "results.status": 1, completedAt: -1 });
optimizationHistorySchema.index({ "context.userId": 1, createdAt: -1 });

performanceAlertsSchema.index({ type: 1, severity: 1, status: 1 });
performanceAlertsSchema.index({ status: 1, createdAt: -1 });
performanceAlertsSchema.index({ "analytics.lastOccurrence": -1 });

backgroundJobsSchema.index({ type: 1, status: 1, priority: -1 });
backgroundJobsSchema.index({ status: 1, "config.schedule.scheduledFor": 1 });
backgroundJobsSchema.index({ "metadata.createdBy": 1, createdAt: -1 });

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

// New comprehensive models
const WebPerformanceCacheMetrics = mongoose.model(
  "WebPerformanceCacheMetrics",
  cacheMetricsSchema,
  "plugin_web_performance_cache_metrics"
);
const WebPerformanceOptimizationHistory = mongoose.model(
  "WebPerformanceOptimizationHistory",
  optimizationHistorySchema,
  "plugin_web_performance_optimization_history"
);
const WebPerformanceAlerts = mongoose.model(
  "WebPerformanceAlerts",
  performanceAlertsSchema,
  "plugin_web_performance_alerts"
);
const WebPerformanceBackgroundJobs = mongoose.model(
  "WebPerformanceBackgroundJobs",
  backgroundJobsSchema,
  "plugin_web_performance_background_jobs"
);

module.exports = {
  // Main models
  WebPerformanceSettings,
  WebPerformanceMetrics,
  WebPerformanceQueue,
  WebPerformanceAnalytics,
  WebPerformanceLog,
  WebPerformanceConfig,

  // New comprehensive models
  WebPerformanceCacheMetrics,
  WebPerformanceOptimizationHistory,
  WebPerformanceAlerts,
  WebPerformanceBackgroundJobs,

  // Legacy exports for backward compatibility
  PerformanceMetrics: WebPerformanceMetrics,
  ProcessingQueue: WebPerformanceQueue,
  AnalyticsData: WebPerformanceAnalytics,
  PerformanceLogs: WebPerformanceLog,

  // Additional convenient aliases
  CacheMetrics: WebPerformanceCacheMetrics,
  OptimizationHistory: WebPerformanceOptimizationHistory,
  PerformanceAlerts: WebPerformanceAlerts,
  BackgroundJobs: WebPerformanceBackgroundJobs,
};
