const mongoose = require("mongoose");

const pluginActivitySchema = new mongoose.Schema({
  // Activity Classification
  type: {
    type: String,
    required: true,
    enum: [
      // Plugin Lifecycle
      "plugin_installed",
      "plugin_updated",
      "plugin_removed",
      "plugin_enabled",
      "plugin_disabled",
      "plugin_hot_reloaded",
      "plugin_failed",
      "plugin_recovered",

      // Security & Permissions
      "permission_granted",
      "permission_revoked",
      "signature_verified",
      "signature_failed",
      "checksum_verified",
      "checksum_failed",

      // Database Operations
      "migration_applied",
      "migration_rolled_back",
      "collection_created",
      "collection_dropped",
      "database_operation",

      // API & Network
      "api_call",
      "route_registered",
      "route_unregistered",
      "network_request",
      "email_sent",

      // File System
      "file_read",
      "file_write",
      "file_deleted",
      "directory_created",

      // Admin Actions
      "admin_action",
      "configuration_changed",
      "rate_limit_exceeded",
      "health_check_failed",

      // Security Events
      "permission_violation",
      "suspicious_activity",
      "authentication_failed",
      "unauthorized_access",
    ],
  },

  // Plugin Information
  pluginName: {
    type: String,
    required: true,
    index: true,
  },
  pluginVersion: String,

  // Activity Details
  action: {
    type: String,
    required: true,
  },
  description: String,

  // Result and Status
  status: {
    type: String,
    enum: ["success", "failure", "warning", "info"],
    default: "info",
  },

  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  userEmail: String,
  userRole: String,

  // Request Information
  ipAddress: String,
  userAgent: String,
  sessionId: String,

  // Technical Details
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Error Information (if applicable)
  error: {
    message: String,
    stack: String,
    code: String,
  },

  // Performance Metrics
  duration: Number, // Time taken in milliseconds
  memoryUsage: Number, // Memory usage in MB

  // Request/Response Data (for API calls)
  request: {
    method: String,
    url: String,
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
  },
  response: {
    statusCode: Number,
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,
  },

  // File System Operations
  filesystem: {
    operation: String, // read, write, delete, etc.
    path: String,
    size: Number, // File size in bytes
  },

  // Database Operations
  database: {
    operation: String, // find, insert, update, delete, etc.
    collection: String,
    query: mongoose.Schema.Types.Mixed,
    result: mongoose.Schema.Types.Mixed,
  },

  // Network Operations
  network: {
    destination: String, // URL or IP
    method: String,
    responseTime: Number,
    dataTransferred: Number, // Bytes
  },

  // Tags for categorization and filtering
  tags: [String],

  // Priority/Severity Level
  severity: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low",
  },

  // Metadata
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  environment: {
    type: String,
    default: process.env.NODE_ENV || "development",
  },

  // Retention and Cleanup
  expiresAt: {
    type: Date,
    // Auto-delete after 90 days by default
    default: function () {
      return new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    },
  },
});

// Compound indexes for efficient querying
pluginActivitySchema.index({ pluginName: 1, timestamp: -1 });
pluginActivitySchema.index({ type: 1, timestamp: -1 });
pluginActivitySchema.index({ status: 1, timestamp: -1 });
pluginActivitySchema.index({ userId: 1, timestamp: -1 });
pluginActivitySchema.index({ severity: 1, timestamp: -1 });
pluginActivitySchema.index({ timestamp: -1 }); // For general chronological queries

// TTL index for automatic cleanup
pluginActivitySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Instance Methods
pluginActivitySchema.methods.toSummary = function () {
  return {
    id: this._id,
    type: this.type,
    pluginName: this.pluginName,
    action: this.action,
    status: this.status,
    severity: this.severity,
    timestamp: this.timestamp,
    userEmail: this.userEmail,
    description: this.description,
  };
};

pluginActivitySchema.methods.addTag = function (tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
  }
  return this;
};

pluginActivitySchema.methods.setRetention = function (days) {
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this;
};

// Static Methods for Analytics
pluginActivitySchema.statics.getActivityStats = async function (
  pluginName,
  days = 7
) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        pluginName: pluginName,
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          type: "$type",
          status: "$status",
        },
        count: { $sum: 1 },
        lastActivity: { $max: "$timestamp" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

pluginActivitySchema.statics.getSecurityEvents = async function (days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.find({
    timestamp: { $gte: startDate },
    $or: [
      {
        type: {
          $in: [
            "permission_violation",
            "suspicious_activity",
            "authentication_failed",
            "unauthorized_access",
          ],
        },
      },
      { severity: "critical" },
      { status: "failure", type: { $regex: "security|permission|auth" } },
    ],
  })
    .sort({ timestamp: -1 })
    .limit(100);
};

pluginActivitySchema.statics.getPerformanceMetrics = async function (
  pluginName,
  days = 7
) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  return this.aggregate([
    {
      $match: {
        pluginName: pluginName,
        timestamp: { $gte: startDate },
        duration: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        avgDuration: { $avg: "$duration" },
        maxDuration: { $max: "$duration" },
        minDuration: { $min: "$duration" },
        totalRequests: { $sum: 1 },
        avgMemoryUsage: { $avg: "$memoryUsage" },
        maxMemoryUsage: { $max: "$memoryUsage" },
      },
    },
  ]);
};

pluginActivitySchema.statics.getRecentActivity = async function (
  limit = 50,
  filters = {}
) {
  const query = { ...filters };

  return this.find(query)
    .populate("userId", "email role name")
    .sort({ timestamp: -1 })
    .limit(limit);
};

pluginActivitySchema.statics.logActivity = async function (activityData) {
  try {
    const activity = new this(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error("Failed to log plugin activity:", error);
    // Don't throw error to avoid breaking plugin operations
    return null;
  }
};

// Helper method to log different types of activities
pluginActivitySchema.statics.logPluginAction = async function (
  pluginName,
  action,
  details = {}
) {
  return this.logActivity({
    type: "admin_action",
    pluginName,
    action,
    details,
    status: "success",
  });
};

pluginActivitySchema.statics.logSecurityEvent = async function (
  pluginName,
  eventType,
  details = {}
) {
  return this.logActivity({
    type: eventType,
    pluginName,
    action: `Security event: ${eventType}`,
    details,
    status: "warning",
    severity: "high",
  });
};

pluginActivitySchema.statics.logApiCall = async function (
  pluginName,
  req,
  res,
  duration
) {
  return this.logActivity({
    type: "api_call",
    pluginName,
    action: `API call to ${req.originalUrl}`,
    status: res.statusCode >= 400 ? "failure" : "success",
    duration,
    userId: req.user?._id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
    sessionId: req.sessionID,
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
    },
    response: {
      statusCode: res.statusCode,
    },
  });
};

const PluginActivity = mongoose.model(
  "PluginActivity",
  pluginActivitySchema,
  "core_plugin_activities"
);

module.exports = PluginActivity;
