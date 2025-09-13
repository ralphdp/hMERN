const mongoose = require("mongoose");
const crypto = require("crypto");

const pluginRegistrySchema = new mongoose.Schema({
  // Basic Plugin Information
  name: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9-_]+$/, // Valid plugin name format
  },
  displayName: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
    match: /^\d+\.\d+\.\d+$/, // Semantic versioning
  },
  description: {
    type: String,
    default: "",
  },
  author: {
    type: String,
    default: "Unknown",
  },

  // Plugin Lifecycle State
  state: {
    type: String,
    enum: [
      "loading",
      "active",
      "disabled",
      "failed",
      "updating",
      "maintenance",
    ],
    default: "loading",
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  // Dependencies and Loading Order
  dependencies: [
    {
      name: String,
      version: String, // Minimum version required
    },
  ],
  loadPriority: {
    type: Number,
    default: 100, // Lower numbers load first (licensing = 0)
  },

  // File System Information
  backendPath: String, // Path to backend files
  frontendPath: String, // Path to frontend files
  hasBackend: {
    type: Boolean,
    default: false,
  },
  hasFrontend: {
    type: Boolean,
    default: false,
  },

  // Security and Integrity
  checksum: {
    type: String, // SHA-256 hash of plugin files
  },
  signature: {
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: String,
    verifiedAt: Date,
  },

  // Permissions
  permissions: {
    filesystem: [
      {
        type: String,
        enum: ["read_own", "write_own", "read_shared", "write_shared"],
      },
    ],
    database: [
      {
        type: String,
        enum: ["read_own", "write_own", "read_core", "write_core"],
      },
    ],
    network: [
      {
        type: String,
        enum: ["http_requests", "websockets", "email_sending"],
      },
    ],
    ui: [
      {
        type: String,
        enum: ["admin_panel", "user_overlay", "route_registration"],
      },
    ],
    system: [
      {
        type: String,
        enum: ["user_authentication", "rate_limiting", "logging"],
      },
    ],
  },

  // Rate Limiting Configuration
  rateLimits: {
    apiCalls: {
      windowMs: {
        type: Number,
        default: 60000, // 1 minute
      },
      maxRequests: {
        type: Number,
        default: 100,
      },
    },
    databaseOps: {
      windowMs: {
        type: Number,
        default: 60000,
      },
      maxRequests: {
        type: Number,
        default: 50,
      },
    },
    networkRequests: {
      windowMs: {
        type: Number,
        default: 60000,
      },
      maxRequests: {
        type: Number,
        default: 20,
      },
    },
  },

  // Runtime Information
  loadedAt: Date,
  lastActivity: Date,
  errorCount: {
    type: Number,
    default: 0,
  },
  lastError: {
    message: String,
    stack: String,
    timestamp: Date,
  },

  // Health Monitoring
  healthStatus: {
    status: {
      type: String,
      enum: ["healthy", "warning", "critical", "unknown"],
      default: "unknown",
    },
    lastCheck: Date,
    metrics: {
      memoryUsage: Number, // In MB
      cpuUsage: Number, // Percentage
      responseTime: Number, // In ms
    },
  },

  // Migration Information
  currentMigrationVersion: {
    type: String,
    default: "0.0.0",
  },
  pendingMigrations: [String],
  migrationHistory: [
    {
      version: String,
      appliedAt: Date,
      success: Boolean,
      error: String,
    },
  ],

  // Database Collections Created by Plugin
  collections: [String],

  // API Routes Registered by Plugin
  routes: [
    {
      method: String,
      path: String,
      registeredAt: Date,
    },
  ],

  // Configuration and Settings
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

// Indexes for performance
pluginRegistrySchema.index({ name: 1 });
pluginRegistrySchema.index({ state: 1 });
pluginRegistrySchema.index({ enabled: 1 });
pluginRegistrySchema.index({ loadPriority: 1 });
pluginRegistrySchema.index({ lastActivity: 1 });

// Update timestamp on save
pluginRegistrySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Instance Methods
pluginRegistrySchema.methods.calculateChecksum = function (filePaths) {
  // Calculate SHA-256 checksum of plugin files
  const hash = crypto.createHash("sha256");

  // This would be implemented to hash the actual plugin files
  // For now, return a placeholder
  hash.update(this.name + this.version + Date.now());
  return hash.digest("hex");
};

pluginRegistrySchema.methods.updateHealthStatus = function (metrics) {
  this.healthStatus.lastCheck = new Date();
  this.healthStatus.metrics = metrics;

  // Determine health status based on metrics
  if (metrics.memoryUsage > 500 || metrics.cpuUsage > 80) {
    this.healthStatus.status = "critical";
  } else if (metrics.memoryUsage > 200 || metrics.cpuUsage > 50) {
    this.healthStatus.status = "warning";
  } else {
    this.healthStatus.status = "healthy";
  }

  return this.save();
};

pluginRegistrySchema.methods.recordError = function (error) {
  this.errorCount += 1;
  this.lastError = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date(),
  };

  // Auto-disable plugin after too many errors
  if (this.errorCount >= 5 && this.state === "active") {
    this.state = "failed";
    this.enabled = false;
  }

  return this.save();
};

pluginRegistrySchema.methods.hasPermission = function (category, permission) {
  return (
    this.permissions[category] &&
    this.permissions[category].includes(permission)
  );
};

// Static Methods
pluginRegistrySchema.statics.getLoadOrder = async function () {
  return this.find({ enabled: true })
    .sort({ loadPriority: 1, createdAt: 1 })
    .select("name dependencies loadPriority state");
};

pluginRegistrySchema.statics.getActivePlugins = async function () {
  return this.find({ state: "active", enabled: true });
};

pluginRegistrySchema.statics.getHealthyPlugins = async function () {
  return this.find({
    state: "active",
    enabled: true,
    "healthStatus.status": { $in: ["healthy", "warning"] },
  });
};

const PluginRegistry = mongoose.model(
  "PluginRegistry",
  pluginRegistrySchema,
  "core_plugin_registries"
);

module.exports = PluginRegistry;
