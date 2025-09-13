const mongoose = require("mongoose");

const coreSettingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    default: "default",
    unique: true,
  },
  // Logging Configuration
  logging: {
    debugMode: {
      type: Boolean,
      default: false,
      description: "Enable debug logging (console.log statements)",
    },
    productionSafeMode: {
      type: Boolean,
      default: true,
      description: "Disable all debug logging in production environment",
    },
    logLevel: {
      type: String,
      enum: ["debug", "info", "warn", "error"],
      default: "info",
      description: "Minimum log level to output",
    },
    enableConsoleLogging: {
      type: Boolean,
      default: false,
      description: "Allow console.log statements (development only)",
    },
    developmentOverride: {
      type: Boolean,
      default: false,
      description: "Force enable logging even in production (use with caution)",
    },
  },
  rateLimiting: {
    windowMs: {
      type: Number,
      default: 15 * 60 * 1000, // 15 minutes in milliseconds
      min: 60000, // 1 minute
      max: 3600000, // 1 hour
    },
    maxRequests: {
      type: Number,
      default: 100,
      min: 10,
      max: 10000,
    },
    // Admin-specific rate limiting settings
    adminWindowMs: {
      type: Number,
      default: 15 * 60 * 1000, // 15 minutes
      min: 60000, // 1 minute
      max: 3600000, // 1 hour
    },
    adminMaxRequests: {
      type: Number,
      default: 150,
      min: 10,
      max: 10000,
    },
    // Critical operations rate limiting
    criticalWindowMs: {
      type: Number,
      default: 15 * 60 * 1000, // 15 minutes
      min: 60000, // 1 minute
      max: 3600000, // 1 hour
    },
    criticalMaxRequests: {
      type: Number,
      default: 30,
      min: 5,
      max: 1000,
    },
    // Firewall-specific rate limiting
    firewallWindowMs: {
      type: Number,
      default: 10 * 60 * 1000, // 10 minutes
      min: 60000, // 1 minute
      max: 3600000, // 1 hour
    },
    firewallMaxRequests: {
      type: Number,
      default: 15,
      min: 5,
      max: 500,
    },
    skipAdminRoutes: {
      type: Boolean,
      default: false, // Changed default to false to properly respect admin hierarchy
    },
    skipPluginRoutes: {
      type: Boolean,
      default: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    message: {
      type: String,
      default: "Too many requests from this IP, please try again later.",
    },
    // License-aware rate limiting
    licenseAwareRateLimiting: {
      type: Boolean,
      default: true,
    },
  },
  // License-based rate limiting tiers (for database override of license defaults)
  rateLimitingTiers: {
    free: {
      core: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 100 },
      },
      admin: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 150 },
      },
      critical: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 30 },
      },
      firewall: {
        windowMs: { type: Number, default: 10 * 60 * 1000 },
        max: { type: Number, default: 15 },
      },
    },
    basic: {
      core: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 200 },
      },
      admin: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 300 },
      },
      critical: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 50 },
      },
      firewall: {
        windowMs: { type: Number, default: 10 * 60 * 1000 },
        max: { type: Number, default: 25 },
      },
    },
    pro: {
      core: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 500 },
      },
      admin: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 500 },
      },
      critical: {
        windowMs: { type: Number, default: 15 * 60 * 1000 },
        max: { type: Number, default: 100 },
      },
      firewall: {
        windowMs: { type: Number, default: 10 * 60 * 1000 },
        max: { type: Number, default: 50 },
      },
    },
  },
  security: {
    trustProxy: {
      type: Boolean,
      default: true,
    },
    helmetEnabled: {
      type: Boolean,
      default: true,
    },
    corsEnabled: {
      type: Boolean,
      default: true,
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
  updatedBy: {
    type: String,
    default: "system",
  },
});

// Update the updatedAt field before saving
coreSettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for quick retrieval
coreSettingsSchema.index({ settingsId: 1 });

const CoreSettings = mongoose.model(
  "CoreSettings",
  coreSettingsSchema,
  "core_settings"
);

module.exports = CoreSettings;
