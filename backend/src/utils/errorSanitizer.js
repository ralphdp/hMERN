const { createPluginLogger } = require("./logger");

const logger = createPluginLogger("error-sanitizer");
const securityLogger = logger.getLogger("security");

/**
 * Error Message Sanitizer
 * Prevents sensitive information leakage while maintaining useful debugging information
 */

// Patterns that should be completely removed from public error messages
const SENSITIVE_PATTERNS = [
  // Database connection strings
  /mongodb:\/\/[^\/\s]+/gi,
  /postgres:\/\/[^\/\s]+/gi,
  /mysql:\/\/[^\/\s]+/gi,

  // API keys and tokens
  /[a-zA-Z0-9]{32,}/g, // Long alphanumeric strings (likely tokens)
  /(api[_-]?key|token|secret|password)['":\s]*[a-zA-Z0-9+\/=]{8,}/gi,

  // File paths (may reveal server structure)
  /[\/\\][\w\-\.]+[\/\\][\w\-\.\/\\]+/g,

  // IP addresses in certain contexts
  /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,

  // Session IDs
  /sess[ion]*[_-]?id['":\s]*[a-zA-Z0-9]{16,}/gi,

  // Environment variables
  /process\.env\.[A-Z_]+/g,

  // Stack trace file paths
  /at\s+[^\s]+\s+\([^)]+\)/g,

  // MongoDB ObjectIds
  /ObjectId\(['"][a-f0-9]{24}['"]\)/gi,
];

// Safe error messages for common database/system errors
const SAFE_ERROR_MAPPINGS = {
  // MongoDB errors
  E11000: "A record with this information already exists",
  E11001: "Duplicate key error",
  ValidationError: "The provided data is invalid",
  CastError: "Invalid data format provided",
  MongoServerError: "Database operation failed",
  MongoNetworkError: "Database connection issue",
  MongoTimeoutError: "Request timed out",

  // Validation errors
  ENOENT: "Requested resource not found",
  EACCES: "Access denied",
  EPERM: "Operation not permitted",
  ENOTDIR: "Invalid path specified",

  // Network errors
  ECONNREFUSED: "Service temporarily unavailable",
  ETIMEDOUT: "Request timed out",
  ENOTFOUND: "Resource not found",

  // Authentication errors
  TokenExpiredError: "Authentication token has expired",
  JsonWebTokenError: "Invalid authentication token",
  NotBeforeError: "Authentication token not yet active",

  // Authorization errors
  UnauthorizedError: "Access denied",
  ForbiddenError: "Insufficient permissions",

  // Rate limiting
  TooManyRequestsError: "Too many requests, please try again later",
};

/**
 * Sanitizes error messages to prevent information leakage
 * @param {Error|string} error - The error to sanitize
 * @param {Object} options - Sanitization options
 * @param {boolean} options.isAdmin - Whether the user is an admin (gets more detailed errors)
 * @param {boolean} options.isDevelopment - Whether in development mode
 * @param {string} options.fallbackMessage - Default message if error can't be safely shown
 * @returns {Object} Sanitized error response
 */
function sanitizeError(error, options = {}) {
  const {
    isAdmin = false,
    isDevelopment = process.env.NODE_ENV === "development",
    fallbackMessage = "An unexpected error occurred. Please try again later.",
  } = options;

  // If it's a string, convert to error object
  const errorObj = typeof error === "string" ? new Error(error) : error;

  // Extract basic error information
  const originalMessage = errorObj.message || "Unknown error";
  const errorName = errorObj.name || "Error";
  const errorCode = errorObj.code || errorObj.errno;

  // Log the original error for debugging (with full details)
  securityLogger.warn("Error being sanitized", {
    originalMessage,
    errorName,
    errorCode,
    stack: errorObj.stack,
    isAdmin,
    isDevelopment,
  });

  // For admins in development, show more details but still sanitized
  if (isAdmin && isDevelopment) {
    return {
      success: false,
      message: sanitizeMessage(originalMessage),
      error: {
        name: errorName,
        code: errorCode,
        details: "Check server logs for full error details",
      },
      timestamp: new Date().toISOString(),
    };
  }

  // For admins in production, show mapped safe messages
  if (isAdmin) {
    const safeMessage = getSafeErrorMessage(
      errorName,
      errorCode,
      originalMessage
    );
    return {
      success: false,
      message: safeMessage,
      error: {
        type: errorName,
        code: errorCode,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // For regular users, show minimal safe information
  const publicMessage = getSafeErrorMessage(
    errorName,
    errorCode,
    originalMessage
  );
  return {
    success: false,
    message: publicMessage,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Gets a safe error message based on error type
 */
function getSafeErrorMessage(errorName, errorCode, originalMessage) {
  // Check for specific error codes first
  if (errorCode && SAFE_ERROR_MAPPINGS[errorCode]) {
    return SAFE_ERROR_MAPPINGS[errorCode];
  }

  // Check for error names
  if (errorName && SAFE_ERROR_MAPPINGS[errorName]) {
    return SAFE_ERROR_MAPPINGS[errorName];
  }

  // Check if the original message contains known safe patterns
  if (originalMessage) {
    // Validation errors are usually safe to show (but sanitized)
    if (originalMessage.toLowerCase().includes("validation")) {
      return "The provided data is invalid. Please check your input and try again.";
    }

    // Duplicate key errors
    if (
      originalMessage.toLowerCase().includes("duplicate") ||
      originalMessage.includes("E11000")
    ) {
      return "A record with this information already exists.";
    }

    // Not found errors
    if (
      originalMessage.toLowerCase().includes("not found") ||
      originalMessage.toLowerCase().includes("does not exist")
    ) {
      return "The requested resource was not found.";
    }

    // Permission errors
    if (
      originalMessage.toLowerCase().includes("permission") ||
      originalMessage.toLowerCase().includes("unauthorized") ||
      originalMessage.toLowerCase().includes("forbidden")
    ) {
      return "You don't have permission to perform this action.";
    }
  }

  // Default safe message
  return "An error occurred while processing your request. Please try again later.";
}

/**
 * Sanitizes a message by removing sensitive patterns
 */
function sanitizeMessage(message) {
  if (!message || typeof message !== "string") {
    return "Invalid error message";
  }

  let sanitized = message;

  // Remove sensitive patterns
  SENSITIVE_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  });

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  // Limit message length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 197) + "...";
  }

  return sanitized;
}

/**
 * Middleware to automatically sanitize error responses
 */
function errorSanitizerMiddleware(req, res, next) {
  // Store original json method
  const originalJson = res.json;

  // Override json method to sanitize errors
  res.json = function (data) {
    if (data && !data.success && (data.error || data.message)) {
      const isAdmin = req.user && req.user.role === "admin";
      const sanitizedResponse = sanitizeError(
        data.error || new Error(data.message),
        {
          isAdmin,
          fallbackMessage: data.message || "An error occurred",
        }
      );

      // Preserve other response data
      const finalResponse = {
        ...data,
        ...sanitizedResponse,
      };

      return originalJson.call(this, finalResponse);
    }

    return originalJson.call(this, data);
  };

  next();
}

/**
 * Express error handler with sanitization
 */
function createSanitizedErrorHandler() {
  return (err, req, res, next) => {
    const isAdmin = req.user && req.user.role === "admin";

    // Log the full error
    securityLogger.error("Unhandled error", {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId: req.user?.id,
    });

    // Send sanitized response
    const sanitizedResponse = sanitizeError(err, { isAdmin });

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    res.status(statusCode).json(sanitizedResponse);
  };
}

module.exports = {
  sanitizeError,
  sanitizeMessage,
  errorSanitizerMiddleware,
  createSanitizedErrorHandler,
  SAFE_ERROR_MAPPINGS,
};
