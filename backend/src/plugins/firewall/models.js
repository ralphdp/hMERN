const mongoose = require("mongoose");

// Enhanced Firewall Rules Schema (Consolidates BlockedIp functionality)
const firewallRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "ip_block",
      "country_block",
      "asn_block",
      "rate_limit",
      "suspicious_pattern",
    ],
    required: true,
  },
  value: {
    type: String,
    required: true, // IP address, CIDR, country code, pattern, etc.
  },
  action: {
    type: String,
    enum: ["block", "allow", "rate_limit"],
    default: "block",
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 100,
  },

  // NEW FIELDS for full consolidation
  source: {
    type: String,
    enum: ["manual", "threat_intel", "rate_limit", "admin", "common_rules"],
    default: "manual",
    index: true,
  },
  expiresAt: {
    type: Date,
    index: true, // For automatic cleanup
  },
  permanent: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 0, // Attack attempt counter
  },
  lastAttempt: {
    type: Date,
  },
  autoCreated: {
    type: Boolean,
    default: false, // If created automatically by rate limiting
  },

  // Geographic info for IP blocks
  country: String,
  region: String,
  city: String,

  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Firewall Logs Schema
const firewallLogSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    index: true, // For tracking user sessions
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true, // For authenticated user tracking
  },
  userAgent: String,
  method: String,
  url: String,
  headers: Object,
  country: String,
  region: String,
  city: String,
  action: {
    type: String,
    enum: ["allowed", "blocked", "rate_limited", "suspicious", "system"],
    required: true,
  },
  rule: String, // Rule name that triggered the action
  reason: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Blocked IPs Schema
const blockedIpSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  reason: {
    type: String,
    required: true,
  },
  blockedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
  permanent: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  attempts: {
    type: Number,
    default: 1,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  country: String,
  region: String,
  city: String,
});

// Rate Limit Tracking Schema
const rateLimitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  requests: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      url: String,
      method: String,
    },
  ],
  violations: {
    type: Number,
    default: 0,
  },
  lastViolation: Date,
  delayUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    // expires: 86400, // Temporarily disabled TTL to test rate limiting
  },
});

// Firewall Settings Schema
const firewallSettingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    default: "default",
    unique: true,
  },
  // General Configuration
  general: {
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  rateLimit: {
    perMinute: {
      type: Number,
      default: 120,
      min: 1,
      max: 1000,
    },
    perHour: {
      type: Number,
      default: 720,
      min: 1,
      max: 10000,
    },
  },
  progressiveDelays: {
    type: [Number],
    default: [10, 60, 90, 120],
    validate: {
      validator: function (v) {
        return (
          v.length === 4 && v.every((delay) => delay >= 1 && delay <= 3600)
        );
      },
      message:
        "Progressive delays must be an array of 4 values between 1 and 3600 seconds",
    },
  },

  // Admin Rate Limiting (Higher limits for admin users)
  adminRateLimit: {
    perMinute: {
      type: Number,
      default: 500,
      min: 100,
      max: 2000,
    },
    perHour: {
      type: Number,
      default: 4000,
      min: 1000,
      max: 20000,
    },
    progressiveDelays: {
      type: [Number],
      default: [5, 30, 60, 120], // Shorter delays for admin users (seconds)
      validate: {
        validator: function (v) {
          return (
            v.length === 4 && v.every((delay) => delay >= 1 && delay <= 3600)
          );
        },
        message:
          "Admin progressive delays must be an array of 4 values between 1 and 3600 seconds",
      },
    },
  },

  // Rule Cache Configuration (separate from general cache)
  ruleCache: {
    ttl: {
      type: Number,
      default: 60, // seconds (1 minute)
      min: 30,
      max: 1800, // 30 minutes max
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },

  // Trusted Proxies Configuration
  trustedProxies: {
    type: [String],
    default: ["127.0.0.1", "::1"],
    validate: {
      validator: function (v) {
        // Basic IP validation - can be enhanced
        return v.every((ip) => typeof ip === "string" && ip.trim().length > 0);
      },
      message: "All trusted proxy entries must be valid IP addresses",
    },
  },

  // Security Thresholds (ReDoS protection)
  securityThresholds: {
    maxPatternLength: {
      type: Number,
      default: 500,
      min: 100,
      max: 2000,
    },
    maxInputLength: {
      type: Number,
      default: 2000,
      min: 500,
      max: 10000,
    },
    regexTimeout: {
      type: Number,
      default: 100, // milliseconds
      min: 50,
      max: 1000,
    },
    enableReDoSProtection: {
      type: Boolean,
      default: true,
    },
    dangerousPatterns: {
      type: [String],
      default: [
        "\\(\\(.+\\)\\)\\+", // Nested quantifiers: (a+)+
        "\\(\\(.+\\)\\){2,}", // Multiple groups: (a){10}
        "\\*\\.\\*\\*", // Multiple stars: *.*
        "\\+\\.\\*\\+", // Multiple plus: +.+
      ],
    },
  },

  // Admin-specific Settings
  adminSettings: {
    delayReductionFactor: {
      type: Number,
      default: 0.1, // 10% of normal delay
      min: 0.05,
      max: 1.0,
    },
    emergencyDelayMs: {
      type: Number,
      default: 5000, // 5 seconds emergency delay
      min: 1000,
      max: 30000,
    },
    emergencyWindowMs: {
      type: Number,
      default: 30000, // 30 seconds window to apply emergency delay
      min: 5000,
      max: 120000,
    },
  },

  // Auto-blocking Settings
  autoBlocking: {
    rateLimitPriority: {
      type: Number,
      default: 5, // High priority for auto-created rules
      min: 1,
      max: 100,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },

  // Analytics & Metrics Settings
  metricsLimits: {
    maxCountries: {
      type: Number,
      default: 10,
      min: 5,
      max: 50,
    },
    maxUserAgents: {
      type: Number,
      default: 10,
      min: 5,
      max: 50,
    },
  },

  // Local Network Configuration
  localNetworks: {
    enabled: {
      type: Boolean,
      default: true,
    },
    ranges: {
      type: [String],
      default: [
        "127.0.0.1",
        "::1",
        "localhost",
        "192.168.",
        "10.",
        "172.16.",
        "172.17.",
        "172.18.",
        "172.19.",
        "172.2",
        "172.30.",
        "172.31.",
      ],
    },
  },

  // Response Configuration
  responses: {
    blocked: {
      statusCode: {
        type: Number,
        default: 403,
        min: 400,
        max: 599,
      },
      message: {
        type: String,
        default: "Request blocked by firewall rules",
      },
      includeDetails: {
        type: Boolean,
        default: true,
      },
    },
    rateLimited: {
      statusCode: {
        type: Number,
        default: 429,
        min: 400,
        max: 599,
      },
      message: {
        type: String,
        default: "Too many requests",
      },
      includeRetryAfter: {
        type: Boolean,
        default: true,
      },
    },
  },

  // Time Windows Configuration
  timeWindows: {
    minuteMs: {
      type: Number,
      default: 60000, // 1 minute in milliseconds
      min: 30000,
      max: 300000,
    },
    hourMs: {
      type: Number,
      default: 3600000, // 1 hour in milliseconds
      min: 1800000,
      max: 7200000,
    },
  },

  // NEW: Threat Intelligence API Keys
  threatIntelligence: {
    abuseIPDB: {
      apiKey: {
        type: String,
        default: "",
      },
      enabled: {
        type: Boolean,
        default: false,
      },
    },
    virusTotal: {
      apiKey: {
        type: String,
        default: "",
      },
      enabled: {
        type: Boolean,
        default: false,
      },
    },
    autoImportFeeds: {
      type: Boolean,
      default: false,
    },
    feedUpdateInterval: {
      type: Number,
      default: 24, // hours
      min: 1,
      max: 168, // 1 week max
    },
  },

  // NEW: Logging Configuration
  logging: {
    excludedPatterns: {
      type: [String],
      default: [
        "/api/firewall/my-rate-limit-usage*",
        "/api/firewall/panel-info*",
        "/api/firewall/health*",
        "/api/firewall/ping*",
      ],
      validate: {
        validator: function (v) {
          return v.every(
            (pattern) =>
              typeof pattern === "string" && pattern.trim().length > 0
          );
        },
        message: "All logging exclusion patterns must be non-empty strings",
      },
    },
    enableVerboseLogging: {
      type: Boolean,
      default: false,
    },
    maxLogRetentionDays: {
      type: Number,
      default: 90,
      min: 1,
      max: 365,
    },
  },

  // NEW: Sparkline and Analytics Settings
  analytics: {
    sparklineTimeRange: {
      type: Number,
      default: 30, // days
      min: 7,
      max: 90,
    },
    updateFrequency: {
      type: String,
      enum: ["real-time", "periodic"],
      default: "periodic",
    },
    periodicInterval: {
      type: Number,
      default: 300, // seconds (5 minutes)
      min: 60,
      max: 3600,
    },
    enableSparklines: {
      type: Boolean,
      default: true,
    },
    retentionDays: {
      type: Number,
      default: 90, // Keep metrics for 90 days
      min: 30,
      max: 365,
    },
  },

  // HIGH PRIORITY: Rate Limiting Advanced Settings
  rateLimitAdvanced: {
    bypassAdminUsers: {
      type: Boolean,
      default: true,
    },
    bypassAuthenticatedUsers: {
      type: Boolean,
      default: false,
    },
    whitelistedIPs: [
      {
        type: String,
      },
    ],
    burstAllowance: {
      type: Number,
      default: 10, // Allow burst requests
      min: 0,
      max: 100,
    },
    slidingWindow: {
      type: Boolean,
      default: true, // Use sliding window vs fixed window
    },
    gracefulDegradation: {
      type: Boolean,
      default: true, // Gradually increase delays
    },
  },

  // HIGH PRIORITY: Cache Configuration
  cache: {
    enabled: {
      type: Boolean,
      default: true,
    },
    ttl: {
      type: Number,
      default: 300, // seconds (5 minutes)
      min: 60,
      max: 3600,
    },
    maxSize: {
      type: Number,
      default: 1000, // max cached entries
      min: 100,
      max: 10000,
    },
    strategy: {
      type: String,
      enum: ["lru", "lfu", "fifo"],
      default: "lru",
    },
    cacheGeoData: {
      type: Boolean,
      default: true,
    },
    cacheRuleMatches: {
      type: Boolean,
      default: true,
    },
  },

  // HIGH PRIORITY: Bulk Operation Limits
  bulkOperations: {
    maxBatchSize: {
      type: Number,
      default: 100,
      min: 10,
      max: 1000,
    },
    batchTimeout: {
      type: Number,
      default: 30, // seconds
      min: 10,
      max: 300,
    },
    concurrentOperations: {
      type: Number,
      default: 5,
      min: 1,
      max: 20,
    },
    enableBulkDelete: {
      type: Boolean,
      default: true,
    },
    enableBulkEdit: {
      type: Boolean,
      default: true,
    },
  },

  // MEDIUM PRIORITY: Request/Response Limits
  requestLimits: {
    maxHeaderSize: {
      type: Number,
      default: 8192, // bytes
      min: 1024,
      max: 32768,
    },
    maxBodySize: {
      type: Number,
      default: 1048576, // 1MB in bytes
      min: 1024,
      max: 10485760, // 10MB max
    },
    maxUrlLength: {
      type: Number,
      default: 2048,
      min: 256,
      max: 8192,
    },
    blockLargeRequests: {
      type: Boolean,
      default: true,
    },
  },

  // MEDIUM PRIORITY: Data Retention
  dataRetention: {
    logRetentionDays: {
      type: Number,
      default: 90,
      min: 7,
      max: 365,
    },
    metricsRetentionDays: {
      type: Number,
      default: 90,
      min: 30,
      max: 365,
    },
    blockedIpRetentionDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
    autoCleanup: {
      type: Boolean,
      default: true,
    },
    cleanupFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
  },

  // LOW PRIORITY: Firewall Monitoring
  monitoring: {
    enableRealTimeAlerts: {
      type: Boolean,
      default: false,
    },
    alertThreshold: {
      type: Number,
      default: 100, // alerts when blocks > threshold per hour
      min: 10,
      max: 1000,
    },
    alertEmail: {
      type: String,
      default: "",
    },
    alertEmails: {
      type: [String],
      default: [],
    },
    enablePerformanceMonitoring: {
      type: Boolean,
      default: false,
    },
    logSlowQueries: {
      type: Boolean,
      default: false,
    },
    slowQueryThreshold: {
      type: Number,
      default: 1000, // milliseconds
      min: 100,
      max: 5000,
    },
  },

  // Email Reports Configuration
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
    includeAttackSummary: {
      type: Boolean,
      default: true,
    },
    includeTopThreats: {
      type: Boolean,
      default: true,
    },
    includeTrafficStats: {
      type: Boolean,
      default: true,
    },
    includeRulePerformance: {
      type: Boolean,
      default: true,
    },
    includeCharts: {
      type: Boolean,
      default: true,
    },
  },

  // LOW PRIORITY: Rule Processing
  ruleProcessing: {
    parallelProcessing: {
      type: Boolean,
      default: true,
    },
    maxConcurrentChecks: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
    priorityQueue: {
      type: Boolean,
      default: true,
    },
    earlyExit: {
      type: Boolean,
      default: true, // Stop processing on first match
    },
    ruleOptimization: {
      type: Boolean,
      default: true,
    },
    cacheCompiledRegex: {
      type: Boolean,
      default: true,
    },
  },

  // Development Mode Configuration
  developmentMode: {
    enabled: {
      type: Boolean,
      default: false,
    },
  },

  // MEDIUM PRIORITY: UI & Display Settings (Enhanced)
  preferences: {
    autoRefresh: {
      type: Boolean,
      default: false,
    },
    autoRefreshInterval: {
      type: Number,
      default: 30, // seconds
      min: 10,
      max: 300,
    },
    defaultPageSize: {
      type: Number,
      default: 10,
      min: 5,
      max: 100,
    },
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },
    compactMode: {
      type: Boolean,
      default: false,
    },
    showAdvancedOptions: {
      type: Boolean,
      default: false,
    },
    defaultSortColumn: {
      type: String,
      default: "createdAt",
    },
    defaultSortDirection: {
      type: String,
      enum: ["asc", "desc"],
      default: "desc",
    },
    enableAnimations: {
      type: Boolean,
      default: true,
    },
    showNotifications: {
      type: Boolean,
      default: true,
    },
    statusPanelVisibility: {
      type: String,
      enum: ["admin_only", "authenticated_users", "everyone"],
      default: "admin_only",
    },
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for performance
firewallRuleSchema.index({ type: 1, enabled: 1 });
firewallRuleSchema.index({ priority: 1 });
firewallRuleSchema.index({ enabled: 1, priority: 1 }); // Compound index for cache queries

// NEW INDEXES for consolidated functionality
// Note: source and expiresAt already have index: true in schema definition
firewallRuleSchema.index({ type: 1, source: 1 }); // Filter by type and source
firewallRuleSchema.index({ autoCreated: 1, expiresAt: 1 }); // Cleanup auto-created rules
firewallRuleSchema.index({ lastAttempt: -1 }); // Sort by recent attacks
firewallLogSchema.index({ timestamp: -1 });
firewallLogSchema.index({ ip: 1, timestamp: -1 });
firewallLogSchema.index({ action: 1, timestamp: -1 }); // For action-based queries
firewallLogSchema.index({ country: 1, timestamp: -1 }); // For geo-based queries
firewallLogSchema.index({ sessionId: 1, timestamp: -1 }); // For session-based queries
firewallLogSchema.index({ userId: 1, timestamp: -1 }); // For user-based queries
firewallLogSchema.index({ timestamp: 1, action: 1 }); // For time-series chart queries
// Note: expiresAt already has index: true in schema definition with expireAfterSeconds option
blockedIpSchema.index({ active: 1, permanent: 1 }); // For active/permanent queries
// Note: ip already has index: true in schema definition
rateLimitSchema.index({ delayUntil: 1 }); // For delay-based queries

// Rule Metrics Schema for sparklines and analytics
const ruleMetricsSchema = new mongoose.Schema({
  ruleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FirewallRule",
    required: true,
    index: true,
  },
  ruleName: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  // Daily metrics
  totalRequests: {
    type: Number,
    default: 0,
  },
  blockedRequests: {
    type: Number,
    default: 0,
  },
  allowedRequests: {
    type: Number,
    default: 0,
  },
  rateLimitedRequests: {
    type: Number,
    default: 0,
  },
  // Unique IPs affected
  uniqueIPs: {
    type: Number,
    default: 0,
  },
  // Countries affected
  countries: [
    {
      code: String,
      count: Number,
    },
  ],
  // Top user agents
  topUserAgents: [
    {
      agent: String,
      count: Number,
    },
  ],
  // Hourly breakdown for detailed analysis
  hourlyBreakdown: [
    {
      hour: {
        type: Number,
        min: 0,
        max: 23,
      },
      requests: {
        type: Number,
        default: 0,
      },
      blocked: {
        type: Number,
        default: 0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Composite indexes for rule metrics
ruleMetricsSchema.index({ ruleId: 1, date: -1 }); // Rule-specific time series
ruleMetricsSchema.index({ date: -1 }); // Date-based queries
ruleMetricsSchema.index({ ruleName: 1, date: -1 }); // Rule name queries
ruleMetricsSchema.index({ ruleId: 1, date: 1 }, { unique: true }); // Prevent duplicate daily entries

const FirewallRule = mongoose.model(
  "FirewallRule",
  firewallRuleSchema,
  "plugin_firewall_rules"
);
const FirewallLog = mongoose.model(
  "FirewallLog",
  firewallLogSchema,
  "plugin_firewall_logs"
);
const BlockedIp = mongoose.model(
  "BlockedIp",
  blockedIpSchema,
  "plugin_firewall_blocked_ips"
);
const RateLimit = mongoose.model(
  "RateLimit",
  rateLimitSchema,
  "plugin_firewall_rate_limits"
);
const FirewallSettings = mongoose.model(
  "FirewallSettings",
  firewallSettingsSchema,
  "plugin_firewall_settings"
);
const RuleMetrics = mongoose.model(
  "RuleMetrics",
  ruleMetricsSchema,
  "plugin_firewall_rule_metrics"
);

// Firewall Dynamic Config Schema - Following plugin-template pattern
const firewallConfigSchema = new mongoose.Schema({
  pluginId: {
    type: String,
    default: "firewall",
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
        default: "Shield",
      },
    },
    timeouts: {
      successMessage: {
        type: Number,
        default: 3000,
      },
      loadingMinHeight: {
        type: String,
        default: "600px",
      },
    },
    messages: {
      title: {
        type: String,
        default: "Firewall Management",
      },
      subtitle: {
        type: String,
        default:
          "Advanced security protection with IP blocking, rate limiting, and threat detection",
      },
      successBlock: {
        type: String,
        default: "IP {ip} has been blocked successfully",
      },
      errorBlock: {
        type: String,
        default: "Failed to block IP {ip}: {error}",
      },
    },
  },
  // Feature toggles (runtime-configurable)
  features: {
    ipBlocking: {
      type: Boolean,
      default: true,
    },
    rateLimiting: {
      type: Boolean,
      default: true,
    },
    countryBlocking: {
      type: Boolean,
      default: true,
    },
    suspiciousPatterns: {
      type: Boolean,
      default: true,
    },
    progressiveDelays: {
      type: Boolean,
      default: true,
    },
    autoThreatResponse: {
      type: Boolean,
      default: true,
    },
    realTimeLogging: {
      type: Boolean,
      default: true,
    },
    bulkActions: {
      type: Boolean,
      default: true,
    },
    logExport: {
      type: Boolean,
      default: true,
    },
  },
  // Logging configuration
  logging: {
    excludedPatterns: {
      type: [String],
      default: [
        "/api/firewall/my-rate-limit-usage*",
        "/api/firewall/panel-info*",
        "/api/firewall/health*",
        "/api/firewall/ping*",
      ],
      validate: {
        validator: function (v) {
          return v.every(
            (pattern) =>
              typeof pattern === "string" && pattern.trim().length > 0
          );
        },
        message: "All logging exclusion patterns must be non-empty strings",
      },
    },
    enableVerboseLogging: {
      type: Boolean,
      default: false,
    },
    maxLogRetentionDays: {
      type: Number,
      default: 90,
      min: 1,
      max: 365,
    },
  },
  // Runtime thresholds and limits (configurable by admins)
  thresholds: {
    // Rate limiting defaults
    rateLimitPerMinute: {
      type: Number,
      default: 50,
      min: 1,
      max: 1000,
    },
    rateLimitPerHour: {
      type: Number,
      default: 400,
      min: 1,
      max: 10000,
    },
    maxProgressiveDelay: {
      type: Number,
      default: 120000, // 2 minutes
      min: 10000,
      max: 600000,
    },
    // Security thresholds
    highRiskThreshold: {
      type: Number,
      default: 8,
      min: 1,
      max: 20,
    },
    mediumRiskThreshold: {
      type: Number,
      default: 5,
      min: 1,
      max: 15,
    },
    autoBlockThreshold: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
    // Log retention
    logRetentionDays: {
      type: Number,
      default: 30,
      min: 7,
      max: 365,
    },
    maxLogEntries: {
      type: Number,
      default: 10000,
      min: 1000,
      max: 100000,
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
        default: "Firewall Management",
      },
      description: {
        type: String,
        default: "Manage security rules",
      },
    },
    card: {
      title: {
        type: String,
        default: "Firewall Protection",
      },
      description: {
        type: String,
        default:
          "Manage IP blocking, rate limiting, geo-blocking, and security rules. Monitor real-time threats and configure protection policies.",
      },
      buttonText: {
        type: String,
        default: "Manage Firewall",
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
firewallConfigSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const FirewallConfig = mongoose.model(
  "FirewallConfig",
  firewallConfigSchema,
  "plugin_firewall_configs"
);

module.exports = {
  FirewallRule,
  FirewallLog,
  BlockedIp,
  RateLimit,
  FirewallSettings,
  RuleMetrics,
  FirewallConfig,
};
