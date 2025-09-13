const mongoose = require("mongoose");

// Log levels
const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  SILENT: 4,
};

// App log level based on environment
const APP_LOG_LEVEL =
  process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;

// Generic log schema for all plugins
const createLogSchema = (pluginName) => {
  const logSchema = new mongoose.Schema({
    level: {
      type: String,
      enum: ["debug", "info", "warn", "error"],
      required: true,
      index: true,
    },
    context: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    pluginName: {
      type: String,
      default: pluginName,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Common metadata fields
    ip: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userAgent: String,
    url: String,
    method: String,
    sessionId: String,
    errorStack: String,
    environment: {
      type: String,
      default: process.env.NODE_ENV || "development",
    },
  });

  // TTL index for automatic cleanup (optional)
  logSchema.index(
    { timestamp: 1 },
    {
      expireAfterSeconds: process.env.LOG_RETENTION_SECONDS || 2592000, // 30 days default
    }
  );

  return logSchema;
};

// Cache for log models to avoid re-creating them
const logModels = new Map();

// Get or create log model for a plugin
const getLogModel = (pluginName) => {
  // Use new naming pattern with core_ prefix
  const collectionName = `core_${pluginName.replace(/-/g, "_")}_logs`;

  if (logModels.has(collectionName)) {
    return logModels.get(collectionName);
  }

  const schema = createLogSchema(pluginName);
  const model = mongoose.model(collectionName, schema, collectionName);
  logModels.set(collectionName, model);

  return model;
};

// Main logging function
const log = async (level, context, pluginName, message, metadata = {}) => {
  // Check log level
  if (level < APP_LOG_LEVEL) {
    return;
  }

  const timestamp = new Date();
  const levelNames = ["debug", "info", "warn", "error"];
  const levelName = levelNames[level] || "info";

  // Console logging with colors (similar to frontend)
  const colors = {
    debug: "\x1b[90m", // gray
    info: "\x1b[34m", // blue
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
  };
  const reset = "\x1b[0m";

  const consoleMessage = `${
    colors[levelName]
  }[${levelName.toUpperCase()}] [${timestamp.toISOString()}] [${pluginName}:${context}]: ${message}${reset}`;

  // Log to console
  console.log(consoleMessage);
  if (metadata && Object.keys(metadata).length > 0) {
    console.log(`${colors[levelName]}  Metadata:${reset}`, metadata);
  }

  // Log to database (async, don't wait)
  setImmediate(async () => {
    try {
      const LogModel = getLogModel(pluginName);

      const logEntry = new LogModel({
        level: levelName,
        context,
        message,
        metadata,
        pluginName,
        timestamp,
        // Extract common fields from metadata
        ip: metadata.ip,
        userId: metadata.userId,
        userAgent: metadata.userAgent,
        url: metadata.url,
        method: metadata.method,
        sessionId: metadata.sessionId,
        errorStack: metadata.errorStack || metadata.stack,
      });

      await logEntry.save();
    } catch (error) {
      // Fallback to console if database logging fails
      console.error(
        `Failed to log to database for ${pluginName}:`,
        error.message
      );
    }
  });
};

// Create logger for a specific plugin and context
const createLogger = (pluginName, context = "general") => ({
  debug: (message, metadata = {}) =>
    log(LogLevel.DEBUG, context, pluginName, message, metadata),
  info: (message, metadata = {}) =>
    log(LogLevel.INFO, context, pluginName, message, metadata),
  warn: (message, metadata = {}) =>
    log(LogLevel.WARN, context, pluginName, message, metadata),
  error: (message, metadata = {}) =>
    log(LogLevel.ERROR, context, pluginName, message, metadata),
});

// Plugin-specific logger factory
const createPluginLogger = (pluginName) => {
  return {
    // Context-specific loggers
    getLogger: (context = "general") => createLogger(pluginName, context),

    // Convenience methods for common contexts
    middleware: createLogger(pluginName, "middleware"),
    routes: createLogger(pluginName, "routes"),
    models: createLogger(pluginName, "models"),
    utils: createLogger(pluginName, "utils"),
    config: createLogger(pluginName, "config"),
    validation: createLogger(pluginName, "validation"),

    // Activity logging (compatible with existing logActivity functions)
    logActivity: async (level, message, metadata = {}) => {
      const levelMap = {
        debug: LogLevel.DEBUG,
        info: LogLevel.INFO,
        warn: LogLevel.WARN,
        error: LogLevel.ERROR,
      };

      await log(
        levelMap[level] || LogLevel.INFO,
        "activity",
        pluginName,
        message,
        metadata
      );
    },
  };
};

// Express middleware for request logging
const createRequestLogger = (pluginName, options = {}) => {
  const logger = createLogger(pluginName, "requests");

  return (req, res, next) => {
    const startTime = Date.now();

    // Log request
    if (options.logRequests !== false) {
      logger.info(`${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        sessionId: req.sessionID,
        userId: req.user?.id,
        headers: options.logHeaders ? req.headers : undefined,
        body: options.logBody ? req.body : undefined,
      });
    }

    // Log response when finished
    if (options.logResponses !== false) {
      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;
        logger.info(
          `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`,
          {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userId: req.user?.id,
            responseSize: data ? data.length : 0,
          }
        );

        return originalSend.call(this, data);
      };
    }

    next();
  };
};

// Error logging middleware
const createErrorLogger = (pluginName) => {
  const logger = createLogger(pluginName, "errors");

  return (err, req, res, next) => {
    logger.error(`Error in ${req.method} ${req.originalUrl}: ${err.message}`, {
      error: err.message,
      errorStack: err.stack,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId: req.user?.id,
      sessionId: req.sessionID,
    });

    next(err);
  };
};

// Cleanup function for old logs
const cleanupOldLogs = async (pluginName, retentionDays = 30) => {
  try {
    const LogModel = getLogModel(pluginName);
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000
    );

    const result = await LogModel.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    const logger = createLogger(pluginName, "cleanup");
    logger.info(`Cleaned up ${result.deletedCount} old log entries`, {
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      deletedCount: result.deletedCount,
    });

    return result.deletedCount;
  } catch (error) {
    console.error(`Failed to cleanup logs for ${pluginName}:`, error);
    return 0;
  }
};

module.exports = {
  LogLevel,
  createLogger,
  createPluginLogger,
  createRequestLogger,
  createErrorLogger,
  cleanupOldLogs,
  getLogModel,
};
