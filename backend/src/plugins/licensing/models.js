const mongoose = require("mongoose");

// Licensing Logs Schema (for activity logging following plugin-template pattern)
const licensingLogSchema = new mongoose.Schema({
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
  // Licensing-specific fields
  licenseKey: {
    type: String,
    default: null,
  },
  domain: {
    type: String,
    default: null,
  },
  validationResult: {
    type: String,
    enum: ["success", "failure", "error", "cached"],
    default: null,
  },
  responseTime: {
    type: Number,
    default: null, // milliseconds
  },
  errorCode: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Licensing Analytics Schema
const licensingAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  // Daily validation metrics
  validations: {
    total: {
      type: Number,
      default: 0,
    },
    successful: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    cached: {
      type: Number,
      default: 0,
    },
    errors: {
      type: Number,
      default: 0,
    },
  },
  // Performance metrics
  performance: {
    avgResponseTime: {
      type: Number,
      default: 0, // milliseconds
    },
    maxResponseTime: {
      type: Number,
      default: 0,
    },
    minResponseTime: {
      type: Number,
      default: 0,
    },
    timeouts: {
      type: Number,
      default: 0,
    },
  },
  // License server connectivity
  serverStatus: {
    uptime: {
      type: Number,
      default: 0, // percentage
    },
    totalRequests: {
      type: Number,
      default: 0,
    },
    failedRequests: {
      type: Number,
      default: 0,
    },
    lastSuccessfulValidation: {
      type: Date,
      default: null,
    },
  },
  // Error breakdown
  errorBreakdown: [
    {
      errorCode: String,
      count: Number,
      lastOccurrence: Date,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Licensing Dynamic Config Schema - Following plugin-template pattern
const licensingConfigSchema = new mongoose.Schema({
  pluginId: {
    type: String,
    default: "licensing",
    unique: true,
  },
  // UI Configuration (runtime-configurable)
  ui: {
    theme: {
      primaryColor: {
        type: String,
        default: "success.main",
      },
      icon: {
        type: String,
        default: "VerifiedUser",
      },
    },
    timeouts: {
      successMessage: {
        type: Number,
        default: 3000,
      },
      loadingMinHeight: {
        type: String,
        default: "400px",
      },
    },
    messages: {
      title: {
        type: String,
        default: "License Management",
      },
      subtitle: {
        type: String,
        default: "Core licensing system for hMERN plugins",
      },
      validationSuccess: {
        type: String,
        default: "License validation successful",
      },
      validationFailure: {
        type: String,
        default: "License validation failed: {error}",
      },
    },
  },
  // Feature toggles (runtime-configurable)
  features: {
    enableAnalytics: {
      type: Boolean,
      default: true,
    },
    enableDetailedLogging: {
      type: Boolean,
      default: true,
    },
    enableCaching: {
      type: Boolean,
      default: true,
    },
    enableOfflineMode: {
      type: Boolean,
      default: true,
    },
    enableDevelopmentBypass: {
      type: Boolean,
      default: true,
    },
    enablePerformanceMonitoring: {
      type: Boolean,
      default: true,
    },
  },
  // Runtime settings (configurable by admins)
  settings: {
    // Cache settings
    cacheTimeout: {
      type: Number,
      default: 3600000, // 1 hour in milliseconds
      min: 300000, // 5 minutes
      max: 86400000, // 24 hours
    },
    // Validation settings
    validationTimeout: {
      type: Number,
      default: 10000, // 10 seconds
      min: 5000,
      max: 30000,
    },
    maxRetries: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    // Offline mode settings
    offlineGracePeriod: {
      type: Number,
      default: 86400000, // 24 hours
      min: 3600000, // 1 hour
      max: 604800000, // 7 days
    },
    // Log retention
    logRetentionDays: {
      type: Number,
      default: 90,
      min: 30,
      max: 365,
    },
    maxLogEntries: {
      type: Number,
      default: 10000,
      min: 1000,
      max: 100000,
    },
  },
  // License server configuration
  serverConfig: {
    url: {
      type: String,
      default: "",
    },
    backup_urls: {
      type: [String],
      default: [],
    },
    healthCheckInterval: {
      type: Number,
      default: 300000, // 5 minutes
      min: 60000, // 1 minute
      max: 3600000, // 1 hour
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
        default: "License Management",
      },
      description: {
        type: String,
        default: "Manage licensing system",
      },
    },
    card: {
      title: {
        type: String,
        default: "License System",
      },
      description: {
        type: String,
        default:
          "Core licensing system that validates and manages plugin licenses for the hMERN platform.",
      },
      buttonText: {
        type: String,
        default: "Manage Licenses",
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
licensingConfigSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for performance
licensingLogSchema.index({ timestamp: -1 });
licensingLogSchema.index({ level: 1, timestamp: -1 });
licensingLogSchema.index({ validationResult: 1, timestamp: -1 });
licensingLogSchema.index({ licenseKey: 1, timestamp: -1 });
licensingAnalyticsSchema.index({ date: -1 });
licensingAnalyticsSchema.index({ date: 1 }, { unique: true }); // Prevent duplicate daily entries

const LicensingLog = mongoose.model(
  "LicensingLog",
  licensingLogSchema,
  "plugin_licensing_logs"
);
const LicensingAnalytics = mongoose.model(
  "LicensingAnalytics",
  licensingAnalyticsSchema,
  "plugin_licensing_analytics"
);
const LicensingConfig = mongoose.model(
  "LicensingConfig",
  licensingConfigSchema,
  "plugin_licensing_configs"
);

module.exports = {
  LicensingLog,
  LicensingAnalytics,
  LicensingConfig,
};
