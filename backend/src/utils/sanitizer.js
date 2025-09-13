const validator = require("validator");

/**
 * Backend Input Sanitization Utilities
 *
 * Provides comprehensive input sanitization for security-critical applications
 */

// Basic string sanitization
const sanitizeString = (input, options = {}) => {
  if (typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // Trim whitespace
  if (options.trim !== false) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Escape HTML if requested
  if (options.escapeHtml) {
    sanitized = validator.escape(sanitized);
  }

  // Remove control characters except newlines and tabs
  if (options.removeControlChars) {
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  // Normalize whitespace
  if (options.normalizeWhitespace) {
    sanitized = sanitized.replace(/\s+/g, " ");
  }

  // Truncate to max length
  if (options.maxLength && typeof options.maxLength === "number") {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
};

// IP address sanitization and validation
const sanitizeIpAddress = (input) => {
  if (typeof input !== "string") {
    return null;
  }

  const sanitized = sanitizeString(input, { trim: true });

  // Check for IPv4
  if (validator.isIP(sanitized, 4)) {
    return sanitized;
  }

  // Check for IPv6
  if (validator.isIP(sanitized, 6)) {
    return sanitized;
  }

  // Check for CIDR notation
  if (sanitized.includes("/")) {
    const [ip, subnet] = sanitized.split("/");
    const subnetNum = parseInt(subnet, 10);

    if (validator.isIP(ip, 4) && subnetNum >= 0 && subnetNum <= 32) {
      return sanitized;
    }

    if (validator.isIP(ip, 6) && subnetNum >= 0 && subnetNum <= 128) {
      return sanitized;
    }
  }

  return null;
};

// Email sanitization
const sanitizeEmail = (input) => {
  if (typeof input !== "string") {
    return null;
  }

  const sanitized = sanitizeString(input, {
    trim: true,
    maxLength: 254, // RFC 5321 limit
  }).toLowerCase();

  return validator.isEmail(sanitized) ? sanitized : null;
};

// URL sanitization
const sanitizeUrl = (input, options = {}) => {
  if (typeof input !== "string") {
    return null;
  }

  const sanitized = sanitizeString(input, { trim: true });

  // Check if it's a valid URL
  if (
    !validator.isURL(sanitized, {
      protocols: options.allowedProtocols || ["http", "https"],
      require_protocol: options.requireProtocol || false,
      allow_underscores: options.allowUnderscores || false,
      allow_trailing_dot: false,
      allow_protocol_relative_urls: false,
    })
  ) {
    return null;
  }

  return sanitized;
};

// Regex pattern sanitization (for firewall rules)
const sanitizeRegexPattern = (input, options = {}) => {
  if (typeof input !== "string") {
    return null;
  }

  const maxLength = options.maxLength || 500;
  const sanitized = sanitizeString(input, {
    trim: true,
    maxLength,
    removeControlChars: true,
  });

  // Check for dangerous patterns (ReDoS prevention)
  const dangerousPatterns = [
    /\(\(.+\)\)\+/, // Nested quantifiers: (a+)+
    /\(\(.+\)\){2,}/, // Multiple groups: (a){10}
    /\*\.\*\*/, // Multiple stars: *.*
    /\+\.\*\+/, // Multiple plus: +.+
    /\(\?\!.*\(\?\!/, // Nested lookaheads
    /\(\?\<.*\(\?\</, // Nested lookbehinds
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      return null;
    }
  }

  // Test if the regex is valid
  try {
    new RegExp(sanitized);
    return sanitized;
  } catch (e) {
    return null;
  }
};

// Country code sanitization
const sanitizeCountryCode = (input) => {
  if (typeof input !== "string") {
    return null;
  }

  const sanitized = sanitizeString(input, {
    trim: true,
    maxLength: 2,
  }).toUpperCase();

  // Must be exactly 2 characters and only letters
  if (!/^[A-Z]{2}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
};

// Firewall rule name sanitization
const sanitizeRuleName = (input) => {
  if (typeof input !== "string") {
    return null;
  }

  let sanitized = sanitizeString(input, {
    trim: true,
    maxLength: 100,
    removeControlChars: true,
    normalizeWhitespace: true,
  });

  // Remove potentially problematic characters
  sanitized = sanitized.replace(/[<>\"'&]/g, "");

  // Must not be empty after sanitization
  if (!sanitized || sanitized.length === 0) {
    return null;
  }

  return sanitized;
};

// Number sanitization with bounds checking
const sanitizeNumber = (input, options = {}) => {
  let num;

  if (typeof input === "number") {
    num = input;
  } else if (typeof input === "string") {
    const sanitized = sanitizeString(input, { trim: true });
    num = parseFloat(sanitized);
  } else {
    return null;
  }

  // Check if it's a valid number
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  // Check bounds
  if (options.min !== undefined && num < options.min) {
    return null;
  }

  if (options.max !== undefined && num > options.max) {
    return null;
  }

  // Check if integer is required
  if (options.integer && !Number.isInteger(num)) {
    return null;
  }

  return num;
};

// Port number sanitization
const sanitizePort = (input) => {
  return sanitizeNumber(input, {
    integer: true,
    min: 1,
    max: 65535,
  });
};

// MongoDB ObjectId sanitization
const sanitizeObjectId = (input) => {
  if (typeof input !== "string") {
    return null;
  }

  const sanitized = sanitizeString(input, { trim: true });

  // Check if it's a valid ObjectId format (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(sanitized)) {
    return null;
  }

  return sanitized;
};

// File path sanitization (for uploads, logs, etc.)
const sanitizeFilePath = (input, options = {}) => {
  if (typeof input !== "string") {
    return null;
  }

  let sanitized = sanitizeString(input, {
    trim: true,
    maxLength: options.maxLength || 260, // Windows MAX_PATH
    removeControlChars: true,
  });

  // Remove path traversal attempts
  sanitized = sanitized.replace(/\.\./g, "");
  sanitized = sanitized.replace(/[\/\\]{2,}/g, "/"); // Normalize slashes

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>:\"|?*]/g, "");

  // Remove leading/trailing slashes if not allowed
  if (!options.allowAbsolute) {
    sanitized = sanitized.replace(/^[\/\\]+/, "");
  }

  return sanitized || null;
};

// User agent sanitization
const sanitizeUserAgent = (input) => {
  if (typeof input !== "string") {
    return "";
  }

  return sanitizeString(input, {
    trim: true,
    maxLength: 1000,
    removeControlChars: true,
    normalizeWhitespace: true,
  });
};

// Rate limit value sanitization
const sanitizeRateLimit = (input) => {
  return sanitizeNumber(input, {
    integer: true,
    min: 1,
    max: 10000,
  });
};

// Time value sanitization (in seconds)
const sanitizeTimeValue = (input, options = {}) => {
  return sanitizeNumber(input, {
    integer: true,
    min: options.min || 1,
    max: options.max || 86400, // 24 hours
  });
};

// Priority value sanitization
const sanitizePriority = (input) => {
  return sanitizeNumber(input, {
    integer: true,
    min: 1,
    max: 1000,
  });
};

// Sanitize an object recursively
const sanitizeObject = (obj, schema) => {
  if (!obj || typeof obj !== "object") {
    return {};
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (schema[key]) {
      const schemaRule = schema[key];

      if (typeof schemaRule === "function") {
        const sanitizedValue = schemaRule(value);
        if (sanitizedValue !== null && sanitizedValue !== undefined) {
          sanitized[key] = sanitizedValue;
        }
      } else if (
        schemaRule.sanitizer &&
        typeof schemaRule.sanitizer === "function"
      ) {
        const sanitizedValue = schemaRule.sanitizer(value);

        // Apply additional validation if provided
        if (sanitizedValue !== null && sanitizedValue !== undefined) {
          if (schemaRule.required === false || sanitizedValue !== "") {
            sanitized[key] = sanitizedValue;
          }
        } else if (schemaRule.required) {
          // Required field is missing or invalid
          throw new Error(`Required field '${key}' is missing or invalid`);
        }
      }
    }
  }

  return sanitized;
};

module.exports = {
  sanitizeString,
  sanitizeIpAddress,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeRegexPattern,
  sanitizeCountryCode,
  sanitizeRuleName,
  sanitizeNumber,
  sanitizePort,
  sanitizeObjectId,
  sanitizeFilePath,
  sanitizeUserAgent,
  sanitizeRateLimit,
  sanitizeTimeValue,
  sanitizePriority,
  sanitizeObject,
};
