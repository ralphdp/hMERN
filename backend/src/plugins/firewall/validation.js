const { z } = require("zod");
const {
  sanitizeString,
  sanitizeIpAddress,
  sanitizeEmail,
  sanitizeRegexPattern,
  sanitizeCountryCode,
  sanitizeRuleName,
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

const ipAddressSchema = z.string().transform((val) => {
  const sanitized = sanitizeIpAddress(val);
  if (!sanitized) {
    throw new Error("Invalid IP address or CIDR format");
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

// Rule validation schemas
const ruleTypeSchema = z.enum(
  ["ip_block", "country_block", "rate_limit", "suspicious_pattern"],
  {
    errorMap: () => ({
      message:
        "Invalid rule type. Must be one of: ip_block, country_block, rate_limit, suspicious_pattern",
    }),
  }
);

const ruleActionSchema = z.enum(["block", "allow", "rate_limit"], {
  errorMap: () => ({
    message: "Invalid action. Must be one of: block, allow, rate_limit",
  }),
});

const createRuleSchema = z.object({
  name: z
    .string()
    .min(1, "Rule name is required")
    .max(100, "Rule name must be less than 100 characters")
    .transform((val) => {
      const sanitized = sanitizeRuleName(val);
      if (!sanitized) {
        throw new Error("Invalid rule name after sanitization");
      }
      return sanitized;
    }),
  type: ruleTypeSchema,
  value: z
    .string()
    .min(1, "Rule value is required")
    .transform((val, ctx) => {
      // Sanitize based on rule type
      const ruleType = ctx.data?.type;

      if (ruleType === "ip_block") {
        const sanitized = sanitizeIpAddress(val);
        if (!sanitized) {
          throw new Error("Invalid IP address or CIDR notation");
        }
        return sanitized;
      } else if (ruleType === "country_block") {
        const sanitized = sanitizeCountryCode(val);
        if (!sanitized) {
          throw new Error("Invalid country code (must be 2 letter ISO code)");
        }
        return sanitized;
      } else if (ruleType === "suspicious_pattern") {
        const sanitized = sanitizeRegexPattern(val);
        if (!sanitized) {
          throw new Error("Invalid or potentially dangerous regex pattern");
        }
        return sanitized;
      } else if (ruleType === "rate_limit") {
        // For rate limit rules, value is a URL pattern
        const sanitized = sanitizeString(val, {
          trim: true,
          maxLength: 200,
          removeControlChars: true,
        });
        if (!sanitized) {
          throw new Error("Invalid URL pattern for rate limiting");
        }
        return sanitized;
      }

      return sanitizeString(val, { trim: true, maxLength: 500 });
    }),
  action: ruleActionSchema.default("block"),
  enabled: z.boolean().default(true),
  priority: z.number().int().min(1).max(1000).default(100),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .default("")
    .transform((val) =>
      sanitizeString(val, {
        trim: true,
        maxLength: 500,
        removeControlChars: true,
        normalizeWhitespace: true,
      })
    ),
});

const updateRuleSchema = createRuleSchema.partial();

const ruleQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default("1"),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .default("20")
    .refine((val) => val >= 1 && val <= 10000, {
      message: "Limit must be between 1 and 10000",
    }),
  type: ruleTypeSchema.optional(),
  enabled: z.enum(["true", "false"]).optional(),
  source: z
    .enum(["manual", "threat_intel", "rate_limit", "common_rules"])
    .optional(),
  search: z.string().max(100).optional(),
});

// Configuration validation schemas
const configThemeSchema = z.object({
  primaryColor: z.string().default("primary.main"),
  icon: z.string().default("Shield"),
});

const configTimeoutsSchema = z.object({
  successMessage: z.number().int().positive().default(3000),
  loadingMinHeight: z.string().default("600px"),
});

const configMessagesSchema = z.object({
  title: z.string().default("Firewall Management"),
  subtitle: z
    .string()
    .default(
      "Advanced security protection with IP blocking, rate limiting, and threat detection"
    ),
  successBlock: z.string().default("IP {ip} has been blocked successfully"),
  errorBlock: z.string().default("Failed to block IP {ip}: {error}"),
});

const configUISchema = z.object({
  theme: configThemeSchema.default({}),
  timeouts: configTimeoutsSchema.default({}),
  messages: configMessagesSchema.default({}),
});

const configFeaturesSchema = z.object({
  ipBlocking: z.boolean().default(true),
  rateLimiting: z.boolean().default(true),
  countryBlocking: z.boolean().default(true),
  suspiciousPatterns: z.boolean().default(true),
  progressiveDelays: z.boolean().default(true),
  autoThreatResponse: z.boolean().default(true),
  realTimeLogging: z.boolean().default(true),
  bulkActions: z.boolean().default(true),
  logExport: z.boolean().default(true),
});

const configThresholdsSchema = z.object({
  rateLimitPerMinute: z.number().int().min(1).max(1000).default(50),
  rateLimitPerHour: z.number().int().min(1).max(10000).default(400),
  maxProgressiveDelay: z.number().int().min(1000).max(300000).default(120000),
  highRiskThreshold: z.number().int().min(1).max(20).default(8),
  mediumRiskThreshold: z.number().int().min(1).max(15).default(5),
  autoBlockThreshold: z.number().int().min(1).max(50).default(10),
  logRetentionDays: z.number().int().min(1).max(365).default(30),
  maxLogEntries: z.number().int().min(100).max(1000000).default(10000),
});

const configAdminPanelSchema = z.object({
  menuItem: z
    .object({
      title: z.string().default("Firewall Management"),
      description: z.string().default("Manage security rules"),
    })
    .default({}),
  card: z
    .object({
      title: z.string().default("Firewall Protection"),
      description: z
        .string()
        .default(
          "Manage IP blocking, rate limiting, geo-blocking, and security rules. Monitor real-time threats and configure protection policies."
        ),
      buttonText: z.string().default("Manage Firewall"),
    })
    .default({}),
  enabled: z.boolean().default(true),
});

const updateConfigSchema = z.object({
  ui: configUISchema.optional(),
  features: configFeaturesSchema.optional(),
  thresholds: configThresholdsSchema.optional(),
  adminPanel: configAdminPanelSchema.optional(),
});

// Settings validation schemas - Match actual database structure
const settingsGeneralSchema = z.object({
  enabled: z.boolean().default(true),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),
  maxRequestsPerSecond: z.number().int().min(1).max(1000).default(100),
});

const settingsRateLimitSchema = z.object({
  perMinute: z.number().int().min(1).max(10000).default(120),
  perHour: z.number().int().min(1).max(100000).default(720),
});

const settingsMonitoringSchema = z.object({
  enableRealTimeAlerts: z.boolean().default(false),
  alertEmail: z.union([z.string().email(), z.literal("")]).optional(),
  alertEmails: z.array(z.string().email()).default([]),
  alertThreshold: z.number().int().min(1).max(100).default(10),
  reportFrequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  enablePerformanceMonitoring: z.boolean().default(false),
  logSlowQueries: z.boolean().default(false),
  slowQueryThreshold: z.number().int().min(100).max(10000).default(1000),
});

const settingsDataRetentionSchema = z.object({
  logRetentionDays: z.number().int().min(1).max(365).default(90),
  metricsRetentionDays: z.number().int().min(1).max(365).default(90),
  blockedIpRetentionDays: z.number().int().min(1).max(365).default(30),
  autoCleanup: z.boolean().default(true),
  cleanupFrequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
});

const settingsThreatIntelligenceSchema = z.object({
  abuseIPDB: z
    .object({
      apiKey: z.string().default(""),
      enabled: z.boolean().default(false),
    })
    .optional()
    .default({ apiKey: "", enabled: false }),
  virusTotal: z
    .object({
      apiKey: z.string().default(""),
      enabled: z.boolean().default(false),
    })
    .optional()
    .default({ apiKey: "", enabled: false }),
  autoImportFeeds: z.boolean().default(false),
  feedUpdateInterval: z.number().int().min(1).max(168).default(24),
});

const settingsFeaturesSchema = z.object({
  ipBlocking: z.boolean().default(true),
  countryBlocking: z.boolean().default(true),
  rateLimiting: z.boolean().default(true),
  suspiciousPatterns: z.boolean().default(true),
});

const settingsDevelopmentModeSchema = z.object({
  enabled: z.boolean().default(false),
});

const updateSettingsSchema = z.object({
  general: settingsGeneralSchema.optional(),
  rateLimit: settingsRateLimitSchema.optional(),
  progressiveDelays: z.array(z.number().int().min(1).max(300)).optional(),
  adminRateLimit: z.any().optional(),
  ruleCache: z.any().optional(),
  trustedProxies: z.any().optional(),
  securityThresholds: z.any().optional(),
  adminSettings: z.any().optional(),
  autoBlocking: z.any().optional(),
  metricsLimits: z.any().optional(),
  localNetworks: z.any().optional(),
  responses: z.any().optional(),
  timeWindows: z.any().optional(),
  rateLimitAdvanced: z.any().optional(),
  cache: z.any().optional(),
  bulkOperations: z.any().optional(),
  requestLimits: z.any().optional(),
  dataRetention: settingsDataRetentionSchema.optional(),
  monitoring: settingsMonitoringSchema.optional(),
  emailReports: z.any().optional(),
  ruleProcessing: z.any().optional(),
  threatIntelligence: settingsThreatIntelligenceSchema.optional(),
  analytics: z.any().optional(),
  preferences: z.any().optional(),
  features: settingsFeaturesSchema.optional(),
  developmentMode: settingsDevelopmentModeSchema.optional(),
});

// Logs and query validation schemas
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
  action: z.enum(["allowed", "blocked", "rate_limited"]).optional(),
  ip: ipAddressSchema.optional(),
  country: z.string().length(2).optional(),
  all: z.enum(["true", "false"]).optional(),
});

const cleanupSchema = z.object({
  force: z.boolean().default(true),
  range: z
    .enum([
      "all",
      "last7days",
      "last30days",
      "last90days",
      "older6months",
      "older1year",
    ])
    .default("all"),
});

// Test validation schemas
const testRuleSchema = z.object({
  attackPattern: z
    .string()
    .min(1, "Attack pattern is required")
    .max(500, "Attack pattern must be less than 500 characters"),
});

const testAllRulesSchema = z.object({
  testMode: z.enum(["quick", "comprehensive"]).default("quick"),
  skipDisabled: z.boolean().default(true),
});

// Blocked IP validation schemas
const blockIpSchema = z.object({
  ip: ipAddressSchema,
  reason: z
    .string()
    .min(1, "Reason is required")
    .max(200, "Reason must be less than 200 characters"),
  duration: z.number().int().min(60).max(31536000).default(3600), // 1 minute to 1 year
  permanent: z.boolean().default(false),
});

// Threat intelligence validation schemas
const threatIntelImportSchema = z.object({
  source: z.string().min(1, "Source is required").max(100),
  ips: z
    .array(ipAddressSchema)
    .min(1, "At least one IP is required")
    .max(10000, "Maximum 10,000 IPs allowed"),
  category: z.string().max(50).default("malware"),
  confidence: z.number().min(0).max(1).default(0.8),
});

// Email validation schemas
const previewReportSchema = z.object({
  email: emailSchema,
  reportType: z.enum(["security", "performance", "summary"]).default("summary"),
  timeRange: z.enum(["24h", "7d", "30d"]).default("24h"),
});

// Metrics validation schemas
const metricsQuerySchema = z.object({
  days: z.string().regex(/^\d+$/).transform(Number).default("30"),
  granularity: z.enum(["hour", "day", "week"]).default("day"),
});

const trafficTrendsQuerySchema = z.object({
  timeRange: z
    .enum(["1min", "1h", "12h", "24h", "1w", "1m", "1y"])
    .default("12h"),
  granularity: z
    .enum(["second", "minute", "hour", "day", "week", "month"])
    .default("minute"),
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

      // Replace the original data with the validated and transformed data
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

// IP parameter validation middleware
const validateIpParam = validate(z.object({ ip: ipAddressSchema }), "params");

module.exports = {
  // Schemas
  createRuleSchema,
  updateRuleSchema,
  ruleQuerySchema,
  updateConfigSchema,
  updateSettingsSchema,
  logsQuerySchema,
  cleanupSchema,
  testRuleSchema,
  testAllRulesSchema,
  blockIpSchema,
  threatIntelImportSchema,
  previewReportSchema,
  metricsQuerySchema,
  trafficTrendsQuerySchema,

  // Validation middleware
  validate,
  validateId,
  validateIpParam,

  // Pre-configured validation middleware
  validateCreateRule: validate(createRuleSchema),
  validateUpdateRule: validate(updateRuleSchema),
  validateRuleQuery: validate(ruleQuerySchema, "query"),
  validateUpdateConfig: validate(updateConfigSchema),
  validateUpdateSettings: validate(updateSettingsSchema),
  validateLogsQuery: validate(logsQuerySchema, "query"),
  validateCleanup: validate(cleanupSchema),
  validateTestRule: validate(testRuleSchema),
  validateTestAllRules: validate(testAllRulesSchema),
  validateBlockIp: validate(blockIpSchema),
  validateThreatIntelImport: validate(threatIntelImportSchema),
  validatePreviewReport: validate(previewReportSchema),
  validateMetricsQuery: validate(metricsQuerySchema, "query"),
  validateTrafficTrendsQuery: validate(trafficTrendsQuerySchema, "query"),
};
