const { z } = require("zod");
const {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObjectId,
} = require("../../utils/sanitizer");

// Common validation schemas
const objectIdSchema = z.string().transform((val) => {
  const sanitized = sanitizeObjectId(val);
  if (!sanitized) {
    throw new Error("Invalid ObjectId format");
  }
  return sanitized;
});

const emailSchema = z.string().transform((val) => {
  const sanitized = sanitizeEmail(val);
  if (!sanitized) {
    throw new Error("Invalid email format");
  }
  return sanitized;
});

const positiveIntSchema = z
  .number()
  .int()
  .positive("Must be a positive integer");

const nonNegativeIntSchema = z.number().int().min(0, "Must be non-negative");

const percentageSchema = z
  .number()
  .min(0)
  .max(100, "Must be between 0 and 100");

const fileSizeSchema = z
  .number()
  .int()
  .min(0, "File size must be non-negative");

// Performance-specific enums
const optimizationTypeSchema = z.enum(
  [
    "css_minification",
    "js_minification",
    "image_optimization",
    "webp_conversion",
    "cache_optimization",
    "compression",
    "lazy_loading",
    "critical_css",
    "preloading",
  ],
  {
    errorMap: () => ({
      message: "Invalid optimization type",
    }),
  }
);

const taskStatusSchema = z.enum(
  ["pending", "processing", "completed", "failed", "cancelled", "retry"],
  {
    errorMap: () => ({
      message: "Invalid task status",
    }),
  }
);

const prioritySchema = z.enum(["low", "normal", "high", "critical"], {
  errorMap: () => ({
    message: "Invalid priority level",
  }),
});

const cacheTypeSchema = z.enum(
  ["database", "fragment", "static_file", "browser", "memory", "redis"],
  {
    errorMap: () => ({
      message: "Invalid cache type",
    }),
  }
);

// Performance Settings Validation Schemas
const performanceGeneralSchema = z.object({
  enabled: z.boolean().default(true),
  masterSwitch: z.boolean().default(true),
  enableAnalytics: z.boolean().default(true),
  enableBackgroundProcessing: z.boolean().default(true),
  maxConcurrentJobs: z.number().int().min(1).max(20).default(5),
  enableDetailedLogging: z.boolean().default(false),
});

const fileOptimizationSchema = z
  .object({
    minification: z
      .object({
        enableCSSMinification: z.boolean().default(true),
        enableJSMinification: z.boolean().default(true),
        enableConcatenation: z.boolean().default(false),
        preserveComments: z.boolean().default(false),
        removeUnusedCSS: z.boolean().default(false),
        maxFileSize: fileSizeSchema.default(5 * 1024 * 1024), // 5MB
        minFileSizeThreshold: fileSizeSchema.default(1024), // 1KB
      })
      .default({}),

    images: z
      .object({
        enableOptimization: z.boolean().default(true),
        enableWebPConversion: z.boolean().default(true),
        jpegQuality: percentageSchema.default(80),
        pngQuality: percentageSchema.default(80),
        webpQuality: percentageSchema.default(80),
        maxWidth: z.number().int().min(100).max(4000).default(1920),
        maxHeight: z.number().int().min(100).max(4000).default(1080),
        maxFileSize: fileSizeSchema.default(10 * 1024 * 1024), // 10MB
        enableProgressiveJPEG: z.boolean().default(true),
      })
      .default({}),

    compression: z
      .object({
        enableGzip: z.boolean().default(true),
        enableBrotli: z.boolean().default(false),
        compressionLevel: z.number().int().min(1).max(9).default(6),
        threshold: fileSizeSchema.default(1024), // Only compress files larger than 1KB
        excludeExtensions: z
          .array(z.string())
          .default([".jpg", ".jpeg", ".png", ".gif", ".zip", ".rar"]),
      })
      .default({}),
  })
  .default({});

const cachingLayersSchema = z
  .object({
    databaseCache: z
      .object({
        enabled: z.boolean().default(true),
        defaultTTL: z.number().int().min(60).max(86400).default(300), // 5 minutes to 24 hours
        maxMemory: z.string().default("100mb"),
        enableQueryCaching: z.boolean().default(true),
        enableConnectionPooling: z.boolean().default(true),
      })
      .default({}),

    fragmentCache: z
      .object({
        enabled: z.boolean().default(true),
        defaultTTL: z.number().int().min(60).max(86400).default(600), // 10 minutes
        enableFragmentCaching: z.boolean().default(true),
        enableObjectCaching: z.boolean().default(true),
        maxCacheSize: z.string().default("256mb"),
      })
      .default({}),

    staticFileCache: z
      .object({
        enabled: z.boolean().default(true),
        cacheTTL: z.number().int().min(3600).max(2592000).default(86400), // 1 hour to 30 days
        enableVersioning: z.boolean().default(true),
        enableCDNIntegration: z.boolean().default(false),
        maxFileSize: fileSizeSchema.default(50 * 1024 * 1024), // 50MB
      })
      .default({}),

    browserCache: z
      .object({
        enabled: z.boolean().default(true),
        staticFilesTTL: z
          .number()
          .int()
          .min(86400)
          .max(31536000)
          .default(31536000), // 1 day to 1 year
        dynamicContentTTL: z.number().int().min(0).max(86400).default(0),
        enableETag: z.boolean().default(true),
        enableLastModified: z.boolean().default(true),
        enableServiceWorker: z.boolean().default(false),
      })
      .default({}),
  })
  .default({});

const performanceFeaturesSchema = z
  .object({
    lazyLoading: z
      .object({
        enabled: z.boolean().default(true),
        enableImageLazyLoading: z.boolean().default(true),
        enableIframeLazyLoading: z.boolean().default(true),
        threshold: z.number().int().min(0).max(1000).default(100), // pixels
        enableIntersectionObserver: z.boolean().default(true),
      })
      .default({}),

    criticalCSS: z
      .object({
        enabled: z.boolean().default(false),
        inlineThreshold: fileSizeSchema.default(14000), // 14KB
        enableAutomaticExtraction: z.boolean().default(false),
        enableAboveTheFoldOptimization: z.boolean().default(true),
      })
      .default({}),

    preloading: z
      .object({
        enabled: z.boolean().default(true),
        enableDNSPrefetch: z.boolean().default(true),
        enablePreconnect: z.boolean().default(true),
        enableResourceHints: z.boolean().default(true),
        preloadFonts: z.boolean().default(true),
        preloadCriticalImages: z.boolean().default(true),
        enableModulePreload: z.boolean().default(false),
      })
      .default({}),
  })
  .default({});

const emailReportsSchema = z
  .object({
    enabled: z.boolean().default(false),
    emails: z.array(emailSchema).default([]),
    frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
    time: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .default("09:00"), // 24h format
    includeCharts: z.boolean().default(true),
    includeTrends: z.boolean().default(true),
    includeRecommendations: z.boolean().default(true),
    customSubject: z.string().max(100).optional(),
  })
  .default({});

const alertingSchema = z
  .object({
    enabled: z.boolean().default(true),
    emailAlerts: z.boolean().default(false),
    alertEmails: z.array(emailSchema).default([]),

    // Performance thresholds for alerts
    responseTimeThreshold: z.number().int().min(100).max(10000).default(2000), // milliseconds
    cacheHitRateThreshold: percentageSchema.default(70), // percent
    errorRateThreshold: percentageSchema.default(10), // percent
    storageUsageThreshold: percentageSchema.default(80), // percent

    // Alert frequencies
    immediateAlerts: z.boolean().default(true),
    dailyDigest: z.boolean().default(false),
    weeklyReport: z.boolean().default(true),
  })
  .default({});

const dataRetentionSchema = z
  .object({
    metricsRetentionDays: z.number().int().min(1).max(365).default(90),
    logsRetentionDays: z.number().int().min(1).max(365).default(30),
    queueRetentionDays: z.number().int().min(1).max(90).default(7),
    alertsRetentionDays: z.number().int().min(1).max(180).default(30),
    autoCleanup: z.boolean().default(true),
    cleanupFrequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    maxLogEntries: z.number().int().min(1000).max(1000000).default(50000),
  })
  .default({});

const processingLimitsSchema = z
  .object({
    maxConcurrentOptimizations: z.number().int().min(1).max(20).default(5),
    maxQueueSize: z.number().int().min(10).max(10000).default(1000),
    maxRetryAttempts: z.number().int().min(1).max(10).default(3),
    taskTimeout: z.number().int().min(30).max(3600).default(300), // seconds
    batchSize: z.number().int().min(1).max(100).default(10),
    processingInterval: z.number().int().min(5).max(300).default(30), // seconds
  })
  .default({});

// Complete Performance Settings Schema
const updatePerformanceSettingsSchema = z.object({
  general: performanceGeneralSchema.optional(),
  fileOptimization: fileOptimizationSchema.optional(),
  cachingLayers: cachingLayersSchema.optional(),
  performanceFeatures: performanceFeaturesSchema.optional(),
  emailReports: emailReportsSchema.optional(),
  alerting: alertingSchema.optional(),
  dataRetention: dataRetentionSchema.optional(),
  processingLimits: processingLimitsSchema.optional(),
});

// Optimization Task Validation Schemas
const createOptimizationTaskSchema = z.object({
  name: z
    .string()
    .min(1, "Task name is required")
    .max(100, "Task name must be less than 100 characters"),
  type: optimizationTypeSchema,
  filePath: z.string().min(1, "File path is required").max(500),
  priority: prioritySchema.default("normal"),
  options: z
    .object({
      quality: percentageSchema.optional(),
      maxWidth: z.number().int().min(100).max(4000).optional(),
      maxHeight: z.number().int().min(100).max(4000).optional(),
      format: z.enum(["jpeg", "png", "webp", "auto"]).optional(),
      enableProgressive: z.boolean().optional(),
      preserveMetadata: z.boolean().optional(),
    })
    .optional(),
  schedule: z
    .object({
      immediate: z.boolean().default(true),
      scheduledTime: z.date().optional(),
      recurring: z.boolean().default(false),
      interval: z.enum(["hourly", "daily", "weekly"]).optional(),
    })
    .default({ immediate: true }),
});

const updateOptimizationTaskSchema = createOptimizationTaskSchema
  .partial()
  .extend({
    status: taskStatusSchema.optional(),
    error: z.string().max(500).optional(),
    result: z
      .object({
        originalSize: fileSizeSchema.optional(),
        optimizedSize: fileSizeSchema.optional(),
        savings: fileSizeSchema.optional(),
        compressionRatio: z.number().min(0).max(1).optional(),
        processingTime: z.number().int().min(0).optional(), // milliseconds
      })
      .optional(),
  });

// Processing Queue Validation
const queueQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("20")
    .refine((val) => val >= 1 && val <= 1000, {
      message: "Limit must be between 1 and 1000",
    }),
  status: taskStatusSchema.optional(),
  type: optimizationTypeSchema.optional(),
  priority: prioritySchema.optional(),
  search: z.string().max(100).optional(),
});

// Performance Metrics Validation
const metricsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
  metrics: z
    .array(
      z.enum([
        "optimization_count",
        "cache_performance",
        "response_times",
        "storage_usage",
        "error_rates",
        "bandwidth_savings",
      ])
    )
    .default(["optimization_count", "cache_performance"]),
  aggregation: z.enum(["sum", "avg", "min", "max", "count"]).default("sum"),
});

// Cache Management Validation
const cacheOperationSchema = z.object({
  operation: z.enum(["clear", "invalidate", "refresh", "stats"]),
  cacheType: cacheTypeSchema.optional(),
  keys: z.array(z.string()).optional(),
  pattern: z.string().max(200).optional(),
  force: z.boolean().default(false),
});

// Performance Test Validation
const performanceTestSchema = z.object({
  testType: z.enum([
    "load_time",
    "cache_performance",
    "optimization_effectiveness",
    "comprehensive",
  ]),
  urls: z.array(z.string().url()).min(1).max(10),
  options: z
    .object({
      iterations: z.number().int().min(1).max(10).default(3),
      concurrent: z.boolean().default(false),
      includeMetrics: z.boolean().default(true),
      timeout: z.number().int().min(5).max(120).default(30), // seconds
    })
    .default({}),
});

// Bulk Operations Validation
const bulkOptimizationSchema = z.object({
  operation: z.enum([
    "optimize_images",
    "minify_css",
    "minify_js",
    "clear_cache",
    "regenerate_cache",
  ]),
  filters: z
    .object({
      fileTypes: z.array(z.string()).optional(),
      minSize: fileSizeSchema.optional(),
      maxSize: fileSizeSchema.optional(),
      olderThan: z.date().optional(),
      pathPattern: z.string().max(200).optional(),
    })
    .optional(),
  options: z
    .object({
      quality: percentageSchema.optional(),
      batchSize: z.number().int().min(1).max(100).default(10),
      maxParallel: z.number().int().min(1).max(10).default(3),
      skipErrors: z.boolean().default(true),
    })
    .default({}),
});

// Alert Management Validation
const createAlertSchema = z.object({
  type: z.enum(["performance", "error", "storage", "optimization"]),
  severity: z.enum(["info", "warning", "error", "critical"]),
  message: z.string().min(1).max(500),
  details: z.record(z.any()).optional(),
  acknowledgedBy: objectIdSchema.optional(),
  resolvedAt: z.date().optional(),
});

// Export and Reporting Validation
const exportDataSchema = z.object({
  dataType: z.enum(["metrics", "logs", "queue", "alerts", "settings"]),
  format: z.enum(["json", "csv", "xlsx"]).default("json"),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  filters: z.record(z.any()).optional(),
  includeHeaders: z.boolean().default(true),
  compression: z.boolean().default(false),
});

// Query validation schemas
const logsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("100")
    .refine((val) => val >= 1 && val <= 10000, {
      message: "Limit must be between 1 and 10000",
    }),
  level: z.enum(["debug", "info", "warn", "error"]).optional(),
  operation: z.enum(["optimization", "cache", "alert", "system"]).optional(),
  search: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Cleanup validation
const cleanupSchema = z.object({
  dataType: z.enum([
    "metrics",
    "logs",
    "queue",
    "alerts",
    "cache",
    "temp_files",
    "all",
  ]),
  range: z
    .enum([
      "last_hour",
      "last_day",
      "last_week",
      "last_month",
      "last_3_months",
      "last_6_months",
      "last_year",
      "all",
    ])
    .default("last_month"),
  force: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

// Validation middleware factory
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const data =
        source === "body"
          ? req.body
          : source === "query"
          ? req.query
          : source === "params"
          ? req.params
          : req[source];

      const result = schema.safeParse(data);

      if (!result.success) {
        const errors = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors,
        });
      }

      // Replace the original data with validated and transformed data
      if (source === "body") req.body = result.data;
      else if (source === "query") req.query = result.data;
      else if (source === "params") req.params = result.data;
      else req[source] = result.data;

      next();
    } catch (error) {
      console.error("Validation middleware error:", error);
      res.status(500).json({
        success: false,
        message: "Internal validation error",
      });
    }
  };
};

// ID parameter validation middleware
const validateId = validate(z.object({ id: objectIdSchema }), "params");

// File validation middleware
const validateFilePath = validate(
  z.object({
    filePath: z.string().min(1).max(500),
  }),
  "params"
);

module.exports = {
  // Core schemas
  updatePerformanceSettingsSchema,
  createOptimizationTaskSchema,
  updateOptimizationTaskSchema,

  // Query schemas
  queueQuerySchema,
  metricsQuerySchema,
  logsQuerySchema,

  // Operation schemas
  cacheOperationSchema,
  performanceTestSchema,
  bulkOptimizationSchema,
  createAlertSchema,
  exportDataSchema,
  cleanupSchema,

  // Validation middleware
  validate,
  validateId,
  validateFilePath,

  // Pre-configured validation middleware
  validateUpdateSettings: validate(updatePerformanceSettingsSchema),
  validateCreateTask: validate(createOptimizationTaskSchema),
  validateUpdateTask: validate(updateOptimizationTaskSchema),
  validateQueueQuery: validate(queueQuerySchema, "query"),
  validateMetricsQuery: validate(metricsQuerySchema, "query"),
  validateLogsQuery: validate(logsQuerySchema, "query"),
  validateCacheOperation: validate(cacheOperationSchema),
  validatePerformanceTest: validate(performanceTestSchema),
  validateBulkOperation: validate(bulkOptimizationSchema),
  validateCreateAlert: validate(createAlertSchema),
  validateExportData: validate(exportDataSchema),
  validateCleanup: validate(cleanupSchema),
};
