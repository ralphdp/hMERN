/**
 * FIREWALL MIDDLEWARE WITH AUTOMATIC IP BANNING
 *
 * This middleware implements a progressive escalation system for repeat offenders:
 *
 * 1. PROGRESSIVE DELAYS:
 *    - Violation 1: 10 second delay
 *    - Violation 2: 60 second delay
 *    - Violation 3: 90 second delay
 *    - Violation 4: 120 second delay
 *    - Violation 5+: AUTOMATIC PERMANENT BAN
 *
 * 2. AUTOMATIC IP BANNING:
 *    - After exceeding progressive delays, IPs are automatically banned
 *    - Creates permanent FirewallRule with source='rate_limit'
 *    - High priority (5) for immediate blocking
 *    - Includes geo location and violation history
 *
 * 3. ENDPOINT-SPECIFIC LIMITS:
 *    - /login, /api/ endpoints get 30% of normal rate limits
 *    - Configurable via FirewallRule type='rate_limit'
 *
 * 4. ADMIN PROTECTIONS:
 *    - Admin users get 10% of normal delays (faster recovery)
 *    - Higher rate limits (500/min vs 120/min)
 *
 * 5. AUTOMATIC CLEANUP:
 *    - Expired rate limit records cleaned every 30 minutes
 *    - Violation counts reset after 24 hours of good behavior
 *
 * 6. MONITORING:
 *    - All violations logged to FirewallLog
 *    - Email alerts for auto-bans (if configured)
 *    - Real-time violation tracking via /rate-limit-status
 */

const {
  FirewallRule,
  FirewallSettings,
  FirewallLog,
  RuleMetrics,
} = require("./models");
const { sendFirewallAlertEmail } = require("./utils");
const geoip = require("geoip-lite");
const { Address4, Address6 } = require("ip-address");

// Use centralized logging system
const { createPluginLogger } = require("../../utils/logger");
const logger = createPluginLogger("firewall");

// --- Caching Logic ---
class SettingsCache {
  constructor() {
    this.settings = null;
    this.lastUpdate = 0;
    this.ttl = 300000;
    this.isLoading = false;
    this.defaults = {
      rateLimit: { perMinute: 120, perHour: 720 },
      progressiveDelays: [10, 60, 90, 120],
      adminRateLimit: {
        perMinute: 500,
        perHour: 4000,
        progressiveDelays: [5, 30, 60, 120],
      },
      monitoring: {
        enableRealTimeAlerts: false,
        alertEmail: "",
        alertEmails: [],
      },
      features: {
        ipBlocking: true,
        countryBlocking: true,
        rateLimiting: true,
        suspiciousPatterns: true,
      },
      ruleCache: { ttl: 60, enabled: true },
      trustedProxies: ["127.0.0.1", "::1"],
      securityThresholds: {
        maxPatternLength: 500,
        maxInputLength: 2000,
        regexTimeout: 100,
        enableReDoSProtection: true,
        dangerousPatterns: [
          "\\(\\(.+\\)\\)\\+",
          "\\(\\(.+\\)\\){2,}",
          "\\*\\.\\*\\*",
          "\\+\\.\\*\\+",
        ],
      },
      adminSettings: {
        delayReductionFactor: 0.1,
        emergencyDelayMs: 5000,
        emergencyWindowMs: 30000,
      },
      autoBlocking: { rateLimitPriority: 5, enabled: true },
      metricsLimits: { maxCountries: 10, maxUserAgents: 10 },
      localNetworks: {
        enabled: true,
        ranges: [
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
      responses: {
        blocked: {
          statusCode: 403,
          message: "Request blocked by firewall rules",
          includeDetails: true,
        },
        rateLimited: {
          statusCode: 429,
          message: "Too many requests",
          includeRetryAfter: true,
        },
      },
      timeWindows: { minuteMs: 60000, hourMs: 3600000 },
      developmentMode: { enabled: false },
      logging: {
        excludedPatterns: [
          "/api/firewall/my-rate-limit-usage*",
          "/api/firewall/panel-info*",
          "/api/firewall/health*",
          "/api/firewall/ping*",
        ],
        enableVerboseLogging: false,
        maxLogRetentionDays: 90,
      },
    };
  }

  async getSettings() {
    const now = Date.now();
    if (now - this.lastUpdate < this.ttl && this.settings) {
      return this.settings;
    }
    this.isLoading = true;
    try {
      // Load operational settings from FirewallSettings for runtime behavior
      let settings = await FirewallSettings.findOne({ settingsId: "default" });
      if (!settings) {
        settings = new FirewallSettings({ settingsId: "default" });
        await settings.save();
      }

      // Load configuration settings from FirewallConfig for feature toggles
      const { FirewallConfig } = require("./models");
      const { STATIC_CONFIG } = require("./config");
      let config = await FirewallConfig.findOne({
        pluginId: STATIC_CONFIG.pluginId,
      });

      logger.middleware.debug("Refreshing settings from database", {
        general: settings.general || { enabled: true },
        features: config?.features || this.defaults.features,
        configExists: !!config,
        configFeatures: config?.features,
        defaultFeatures: this.defaults.features,
        finalFeatures: config?.features || this.defaults.features,
      });

      // Merge configuration features with operational settings
      this.settings = {
        general: settings.general || { enabled: true },
        rateLimit: settings.rateLimit,
        // USE CONFIGURATION FEATURES instead of settings features
        features: config?.features || this.defaults.features,
        progressiveDelays: settings.progressiveDelays,
        adminRateLimit: {
          ...settings.adminRateLimit,
          progressiveDelays: settings.adminRateLimit.progressiveDelays,
        },
        ruleCache: {
          ...settings.ruleCache,
          ttl: settings.ruleCache.ttl * 1000,
        },
        trustedProxies: settings.trustedProxies,
        securityThresholds: {
          ...this.defaults.securityThresholds,
          ...settings.securityThresholds,
        },
        adminSettings: settings.adminSettings || this.defaults.adminSettings,
        autoBlocking: settings.autoBlocking || this.defaults.autoBlocking,
        metricsLimits: settings.metricsLimits || this.defaults.metricsLimits,
        localNetworks: settings.localNetworks || this.defaults.localNetworks,
        responses: settings.responses || this.defaults.responses,
        timeWindows: settings.timeWindows || this.defaults.timeWindows,
        monitoring: settings.monitoring || this.defaults.monitoring,
        // Include development mode settings
        developmentMode: settings.developmentMode || { enabled: false },
        // Include advanced rate limiting settings
        rateLimitAdvanced: settings.rateLimitAdvanced || {
          bypassAdminUsers: true,
          bypassAuthenticatedUsers: false,
          whitelistedIPs: [],
          burstAllowance: 10,
          slidingWindow: true,
          gracefulDegradation: true,
        },
        // Also include configuration thresholds that might override settings
        thresholds: {
          ...settings.thresholds,
          ...(config?.thresholds || {}),
        },
        // Include logging configuration settings
        logging: settings.logging || this.defaults.logging,
      };
      this.lastUpdate = now;
      return this.settings;
    } finally {
      this.isLoading = false;
    }
  }

  invalidate() {
    this.lastUpdate = 0;
    this.settings = null;
    logger.middleware.debug("Settings cache invalidated");
  }
}
const settingsCache = new SettingsCache();

class RuleCache {
  constructor() {
    this.rules = new Map();
    this.lastUpdate = 0;
    this.isLoading = false;
  }

  async getRules() {
    const settings = await settingsCache.getSettings();
    const ttl = settings.ruleCache.enabled ? settings.ruleCache.ttl : 0;
    const now = Date.now();
    if (now - this.lastUpdate < ttl && this.rules.size > 0) {
      return Array.from(this.rules.values());
    }
    this.isLoading = true;
    try {
      const rules = await FirewallRule.find({ enabled: true })
        .sort({ priority: 1 })
        .lean();
      this.rules.clear();
      rules.forEach((rule) => this.rules.set(rule._id.toString(), rule));
      this.lastUpdate = now;
      return rules;
    } finally {
      this.isLoading = false;
    }
  }

  invalidate() {
    this.lastUpdate = 0;
    this.rules.clear();
    logger.middleware.debug("Rule cache invalidated");
  }
}
const ruleCache = new RuleCache();

const invalidateRuleCache = () => ruleCache.invalidate();
const invalidateSettingsCache = () => settingsCache.invalidate();

// --- Helper Functions ---
const getClientIp = (req) => {
  // Heroku-specific IP detection
  let ip =
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;

  // Handle comma-separated IPs (take the first one)
  if (ip && ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  // Remove IPv6 prefix if present
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  // Normalize localhost to IPv6 format for consistency
  if (ip === "127.0.0.1") {
    ip = "::1";
  }

  logger.middleware.debug("IP detection", {
    headers: {
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
      "connection.remoteAddress": req.connection.remoteAddress,
    },
    detectedIp: ip,
  });

  return ip || "::1";
};
const isValidIP = (ip) => {
  /* ... */
};
const isIpInCIDR = (ip, cidr) => {
  /* ... */
};
const matchesIPRule = (ip, ruleValue) => {
  // Direct IP match
  if (ip === ruleValue) return true;

  // CIDR range match
  if (ruleValue.includes("/")) {
    try {
      // Handle both IPv4 and IPv6
      if (ip.includes(":") || ruleValue.includes(":")) {
        // IPv6 handling
        const address = new Address6(ip);
        const subnet = new Address6(ruleValue);

        // For IPv6, check if construction was successful (no error property)
        if (address.error || subnet.error) {
          logger.middleware.warn("Invalid IPv6 address in rule matching", {
            ip,
            ruleValue,
            addressError: address.error,
            subnetError: subnet.error,
          });
          return false;
        }

        return address.isInSubnet(subnet);
      } else {
        // IPv4 handling
        const address = new Address4(ip);
        const subnet = new Address4(ruleValue);

        // For IPv4, check if construction was successful (no error property)
        if (address.error || subnet.error) {
          logger.middleware.warn("Invalid IPv4 address in rule matching", {
            ip,
            ruleValue,
            addressError: address.error,
            subnetError: subnet.error,
          });
          return false;
        }

        return address.isInSubnet(subnet);
      }
    } catch (e) {
      logger.middleware.error("Error in IP rule matching", {
        ip,
        ruleValue,
        error: e.message,
        errorStack: e.stack,
      });
      return false;
    }
  }

  // No match
  return false;
};
const getGeoInfo = async (ip) => geoip.lookup(ip);
const checkSuspiciousPattern = async (rule, userAgent, url) => {
  const pattern = rule.value;
  const settings = await settingsCache.getSettings();
  const {
    maxPatternLength,
    maxInputLength,
    enableReDoSProtection,
    dangerousPatterns,
  } = settings.securityThresholds;
  if (pattern.length > maxPatternLength) return false;
  if (
    enableReDoSProtection &&
    dangerousPatterns.some((p) => new RegExp(p).test(pattern))
  )
    return false;
  const regex = new RegExp(pattern, "i");
  const testString = `${userAgent || ""} ${decodeURIComponent(
    url || ""
  )}`.substring(0, maxInputLength);
  return regex.test(testString);
};
const logFirewallEvent = async (ip, action, reason, rule, req) => {
  // Validate required parameters to prevent invalid log entries
  if (!ip || !action || !rule || !req) {
    logger.middleware.warn("Skipping invalid firewall log entry", {
      ip: ip || "missing",
      action: action || "missing",
      rule: rule || "missing",
      hasReq: !!req,
      url: req?.originalUrl || "unknown",
    });
    return; // Don't create invalid log entries
  }

  // Additional validation for request object
  if (!req.originalUrl) {
    logger.middleware.warn("Skipping log entry - missing URL", {
      ip,
      action,
      rule,
    });
    return;
  }

  // Check logging exclusions
  const settings = await settingsCache.getSettings();
  const excludedPatterns = settings.logging?.excludedPatterns || [
    "/api/firewall/my-rate-limit-usage",
    "/api/firewall/panel-info",
    "/api/firewall/health",
    "/api/firewall/ping",
  ];

  const isExcluded = excludedPatterns.some((pattern) => {
    if (pattern.endsWith("*")) {
      // Wildcard pattern matching
      const basePattern = pattern.slice(0, -1);
      return req.originalUrl.startsWith(basePattern);
    } else {
      // Exact pattern matching
      return (
        req.originalUrl === pattern || req.originalUrl.startsWith(pattern + "?")
      );
    }
  });

  if (isExcluded) {
    logger.middleware.debug(
      "Skipping firewall log - URL excluded by logging exclusions",
      {
        url: req.originalUrl,
        excludedPatterns,
      }
    );
    return;
  }

  const geo = await getGeoInfo(ip);
  await FirewallLog.create({
    ip,
    action,
    reason,
    rule,
    userAgent: req.headers?.["user-agent"] || "Unknown",
    url: req.originalUrl,
    method: req.method || "Unknown",
    country: geo?.country,
    region: geo?.region,
    city: geo?.city,
  });
  if (
    settings.monitoring?.enableRealTimeAlerts &&
    (action === "blocked" || action === "rate_limited")
  ) {
    // Get all alert emails (both old single email and new array)
    const alertEmails = [];
    if (settings.monitoring.alertEmail) {
      alertEmails.push(settings.monitoring.alertEmail);
    }
    if (Array.isArray(settings.monitoring.alertEmails)) {
      alertEmails.push(...settings.monitoring.alertEmails);
    }

    // Remove duplicates and send to all emails
    const uniqueEmails = [...new Set(alertEmails)];
    for (const email of uniqueEmails) {
      if (email && email.trim()) {
        try {
          const isTest = req.headers["x-firewall-test"] === "live-attack";
          const alertReason = isTest
            ? `[Live Attack Simulation] ${reason}`
            : reason;
          await sendFirewallAlertEmail({
            to: email,
            ip,
            rule,
            reason: alertReason,
            url: req.originalUrl,
            userAgent: req.headers["user-agent"],
            timestamp: new Date(),
          });
        } catch (emailError) {
          logger.middleware.error("Failed to send firewall alert", {
            email,
            error: emailError.message,
            errorStack: emailError.stack,
          });
        }
      }
    }
  }
};
const updateRuleMetrics = async (
  ruleId,
  ruleName,
  action,
  ip,
  userAgent,
  country
) => {
  /* ... */
};
const checkFirewallRules = async (ip, req) => {
  const geo = await getGeoInfo(ip);
  const rules = await ruleCache.getRules();
  const settings = await settingsCache.getSettings();

  for (const rule of rules) {
    let blocked = false;
    let reason = "";
    switch (rule.type) {
      case "ip_block":
        if (settings.features?.ipBlocking && matchesIPRule(ip, rule.value)) {
          blocked = true;
          reason = `IP blocked by rule: ${rule.name} (${rule.value})`;
        }
        break;
      case "country_block":
        if (settings.features?.countryBlocking && geo?.country === rule.value) {
          blocked = true;
          reason = `Country ${geo.country} blocked by rule: ${rule.name}`;
        }
        break;
      case "suspicious_pattern":
        if (settings.features?.suspiciousPatterns) {
          if (
            await checkSuspiciousPattern(
              rule,
              req.headers["user-agent"],
              req.originalUrl
            )
          ) {
            blocked = true;
            reason = `Suspicious pattern detected by rule: ${rule.name}`;
          }
        }
        break;
    }
    if (blocked) {
      return {
        blocked: true,
        rule: rule.name,
        ruleId: rule._id,
        reason,
        country: geo?.country,
      };
    }
  }
  return { blocked: false };
};

// Create automatic IP block rule for repeat offenders
const createAutoBlockRule = async (ip, rateLimitRecord, settings) => {
  const { FirewallRule } = require("./models");
  const geo = await getGeoInfo(ip);

  try {
    // Check if auto-block rule already exists
    const existingRule = await FirewallRule.findOne({
      type: "ip_block",
      value: ip,
      source: "rate_limit",
      enabled: true,
    });

    if (existingRule) {
      // Update existing rule with new violation info
      existingRule.attempts = rateLimitRecord.violations;
      existingRule.lastAttempt = rateLimitRecord.lastViolation;
      existingRule.description = `Auto-blocked for ${
        rateLimitRecord.violations
      } rate limit violations. Last violation: ${rateLimitRecord.lastViolation.toISOString()}`;
      await existingRule.save();

      logger.middleware.info("Updated existing auto-block rule", {
        ip,
        violations: rateLimitRecord.violations,
      });
      return existingRule;
    }

    // Create new permanent IP block rule
    const blockRule = await FirewallRule.create({
      name: `Auto-Block: ${ip}`,
      type: "ip_block",
      value: ip,
      action: "block",
      priority: settings.autoBlocking.rateLimitPriority, // High priority (default: 5)
      source: "rate_limit", // Mark as auto-created by rate limiting
      enabled: true,
      permanent: true, // Permanent ban
      autoCreated: true, // Auto-created by system
      attempts: rateLimitRecord.violations,
      lastAttempt: rateLimitRecord.lastViolation,
      country: geo?.country,
      region: geo?.region,
      city: geo?.city,
      description: `Auto-blocked for ${
        rateLimitRecord.violations
      } rate limit violations. Created: ${new Date().toISOString()}`,
    });

    // Invalidate rule cache so new rule takes effect immediately
    invalidateRuleCache();

    logger.middleware.info("Created permanent IP block rule", {
      ip,
      violations: rateLimitRecord.violations,
      ruleId: blockRule._id,
    });

    return blockRule;
  } catch (error) {
    logger.middleware.error("Failed to create auto-block rule", {
      ip,
      error: error.message,
      errorStack: error.stack,
    });
    throw error;
  }
};

// Cleanup expired rate limit records
const cleanupExpiredRateLimits = async () => {
  try {
    const { RateLimit } = require("./models");
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Remove records where delayUntil has passed and no recent violations
    const result = await RateLimit.deleteMany({
      $and: [
        { delayUntil: { $lt: new Date() } }, // Delay period has expired
        { lastViolation: { $lt: oneHourAgo } }, // No violations in last hour
      ],
    });

    if (result.deletedCount > 0) {
      logger.middleware.info("Cleaned up expired rate limit records", {
        deletedCount: result.deletedCount,
      });
    }
  } catch (error) {
    logger.middleware.error("Error cleaning up expired records", {
      error: error.message,
      errorStack: error.stack,
    });
  }
};

// Store interval references for cleanup
let cleanupInterval = null;
let resetInterval = null;

// Start cleanup intervals
const startCleanupIntervals = () => {
  if (!cleanupInterval) {
    // Run cleanup every 30 minutes
    cleanupInterval = setInterval(cleanupExpiredRateLimits, 30 * 60 * 1000);
    logger.middleware.debug("Rate limit cleanup interval started");
  }

  if (!resetInterval) {
    // Run violation reset every 6 hours
    resetInterval = setInterval(resetOldViolations, 6 * 60 * 60 * 1000);
    logger.middleware.debug("Violation reset interval started");
  }
};

// Stop cleanup intervals
const stopCleanupIntervals = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.middleware.debug("Rate limit cleanup interval stopped");
  }

  if (resetInterval) {
    clearInterval(resetInterval);
    resetInterval = null;
    logger.middleware.debug("Violation reset interval stopped");
  }
};

// Reset violation counts for IPs that haven't violated in 24 hours
const resetOldViolations = async () => {
  try {
    const { RateLimit } = require("./models");
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await RateLimit.updateMany(
      { lastViolation: { $lt: oneDayAgo } },
      {
        $set: { violations: 0 },
        $unset: { delayUntil: 1, lastViolation: 1 },
      }
    );

    if (result.modifiedCount > 0) {
      logger.middleware.info("Reset violation counts for old IPs", {
        resetCount: result.modifiedCount,
        threshold: "24 hours",
      });
    }
  } catch (error) {
    logger.middleware.error("Error resetting old violations", {
      error: error.message,
      errorStack: error.stack,
    });
  }
};

// Start intervals immediately
startCleanupIntervals();

// --- End Helper Functions ---

const checkRateLimit = async (ip, req) => {
  // PRIORITY: Check for completely bypassed endpoints FIRST (before any tracking)

  // CRITICAL: Bypass specific firewall admin management routes (ONLY for admin users)
  // Use comprehensive admin detection (same as firewallMiddleware)
  const isAdmin =
    req.user &&
    ((req.user.isAdmin && req.user.isAdmin()) ||
      req.user.role === "admin" ||
      req.user.admin === true);

  const firewallAdminRoutes = [
    "/api/firewall/settings",
    "/api/firewall/config",
    "/api/firewall/rules",
    "/api/firewall/logs",
    "/api/firewall/stats",
    "/api/firewall/auth/check",
    "/api/firewall/debug/",
    "/api/firewall/export-logs",
    "/api/firewall/bulk-actions",
    "/api/firewall/threat-intelligence",
    "/api/firewall/force-cache-refresh",
  ];

  const isFirewallAdminRoute = firewallAdminRoutes.some((route) =>
    req.originalUrl.startsWith(route)
  );

  // Only bypass firewall admin routes for actual admin users
  if (isFirewallAdminRoute && isAdmin) {
    logger.middleware.debug(
      "🔥 Firewall admin management route (admin user) - bypassing rate limiting",
      {
        url: req.originalUrl,
        ip,
        reason: "firewall_admin_management",
      }
    );
    return { limited: false, bypassed: true };
  }

  // CRITICAL: Bypass authentication routes (must work for login/logout)
  const authRoutes = [
    "/api/auth/google",
    "/api/auth/github",
    "/api/auth/callback",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/check",
    "/api/auth/register",
    "/api/auth/refresh",
    "/oauth/",
    "/login",
    "/logout",
  ];

  const isAuthRoute = authRoutes.some((route) =>
    req.originalUrl.startsWith(route)
  );

  if (isAuthRoute) {
    logger.middleware.debug(
      "🔐 Authentication route - bypassing rate limiting",
      {
        url: req.originalUrl,
        ip,
        reason: "authentication_flow",
      }
    );
    return { limited: false, bypassed: true };
  }

  // REMOVED: All other bypasses to ensure proper rate limiting
  // This means these endpoints will NOW be rate limited:
  // - /api/system/status
  // - /api/firewall/panel-info
  // - /api/firewall/my-rate-limit-usage
  // - /api/firewall/public-stats
  // - /api/firewall/public-settings
  // - /api/plugins/status
  // - /api/auth/user
  // - All admin routes for non-admin users
  // This ensures homepage refreshes count toward rate limits!

  const settings = await settingsCache.getSettings();

  // DEBUG: Log rate limiting feature status
  logger.middleware.debug("Rate limiting check", {
    ip,
    url: req.originalUrl,
    rateLimitingEnabled: settings.features?.rateLimiting,
    features: settings.features,
  });

  if (!settings.features?.rateLimiting) {
    logger.middleware.warn(
      "Rate limiting feature is DISABLED - skipping rate limit check",
      {
        ip,
        url: req.originalUrl,
        features: settings.features,
      }
    );
    return { limited: false };
  }

  // DEVELOPMENT MODE: Bypass rate limiting if development mode is enabled
  if (settings.developmentMode?.enabled) {
    logger.middleware.debug(
      "Development mode enabled - bypassing rate limiting",
      {
        ip,
        url: req.originalUrl,
      }
    );
    return { limited: false };
  }

  // Check for IP whitelist bypass
  const isWhitelisted =
    settings.rateLimitAdvanced?.whitelistedIPs?.includes(ip);
  if (isWhitelisted) {
    logger.middleware.debug("IP whitelisted - bypassing rate limiting", {
      ip,
      url: req.originalUrl,
    });
    return { limited: false };
  }

  // Check admin user bypass (only if enabled in settings)
  if (isAdmin && settings.rateLimitAdvanced?.bypassAdminUsers) {
    logger.middleware.debug("Admin user rate limit bypass enabled", {
      ip,
      url: req.originalUrl,
      userId: req.user._id,
    });
    return { limited: false };
  }

  // Check authenticated user bypass (only if enabled in settings)
  const isAuthenticated =
    req.user && req.isAuthenticated && req.isAuthenticated();
  if (isAuthenticated && settings.rateLimitAdvanced?.bypassAuthenticatedUsers) {
    logger.middleware.debug("Authenticated user rate limit bypass enabled", {
      ip,
      url: req.originalUrl,
      userId: req.user._id,
    });
    return { limited: false };
  }

  const { RateLimit } = require("./models");
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - settings.timeWindows.minuteMs);
  const hourAgo = new Date(now.getTime() - settings.timeWindows.hourMs);

  // Use the isAdmin variable we already declared above
  let rateConfig = isAdmin ? settings.adminRateLimit : settings.rateLimit;

  // REMOVED: Configuration thresholds override - was causing rate limit mismatches

  // REMOVED: Rate limiting rules that applied 30% reduction to /api/ endpoints
  // This was causing massive discrepancies between frontend display and backend enforcement
  // Now using consistent base rate limits (120/720 for regular users, 500/4000 for admins)

  try {
    // Get or create rate limit record for this IP
    let rateLimitRecord = await RateLimit.findOne({ ip });

    // DEBUG: Log database operation
    logger.middleware.debug("Rate limit database operation", {
      ip,
      url: req.originalUrl,
      foundExistingRecord: !!rateLimitRecord,
      existingViolations: rateLimitRecord?.violations || 0,
      existingRequestsCount: rateLimitRecord?.requests?.length || 0,
    });

    if (!rateLimitRecord) {
      rateLimitRecord = new RateLimit({
        ip,
        requests: [],
        violations: 0,
        lastViolation: null,
        delayUntil: null,
      });
      logger.middleware.debug("Created new rate limit record", { ip });
    }

    // Check if IP is currently in a delay period
    if (rateLimitRecord.delayUntil && now < rateLimitRecord.delayUntil) {
      const delayRemaining = Math.ceil(
        (rateLimitRecord.delayUntil - now) / 1000
      );
      return {
        limited: true,
        reason: `Rate limit delay active - ${delayRemaining}s remaining (violation #${rateLimitRecord.violations})`,
        delayUntil: rateLimitRecord.delayUntil,
        violations: rateLimitRecord.violations,
      };
    }

    // Clean old requests (outside time windows)
    rateLimitRecord.requests = rateLimitRecord.requests.filter(
      (req) => req.timestamp > hourAgo
    );

    // Add current request
    rateLimitRecord.requests.push({
      timestamp: now,
      url: req.originalUrl,
      method: req.method,
    });

    // Count requests in time windows
    const requestsLastMinute = rateLimitRecord.requests.filter(
      (req) => req.timestamp > minuteAgo
    ).length;
    const requestsLastHour = rateLimitRecord.requests.length;

    // Check if limits exceeded
    const minuteExceeded = requestsLastMinute > rateConfig.perMinute;
    const hourExceeded = requestsLastHour > rateConfig.perHour;

    // DEBUG: Log rate limiting calculation
    logger.middleware.debug("Rate limiting calculation", {
      ip,
      url: req.originalUrl,
      requestsLastMinute,
      requestsLastHour,
      rateConfig,
      minuteExceeded,
      hourExceeded,
      willTriggerViolation: minuteExceeded || hourExceeded,
    });

    if (minuteExceeded || hourExceeded) {
      // DEBUG: Log violation trigger
      logger.middleware.error("VIOLATION TRIGGERED!", {
        ip,
        url: req.originalUrl,
        requestsLastMinute,
        requestsLastHour,
        rateConfig,
        minuteExceeded,
        hourExceeded,
        currentViolations: rateLimitRecord.violations,
      });

      // Increment violation count
      rateLimitRecord.violations += 1;
      rateLimitRecord.lastViolation = now;

      const violationCount = rateLimitRecord.violations;
      const progressiveDelays = isAdmin
        ? settings.adminRateLimit.progressiveDelays
        : settings.progressiveDelays;

      // Check if we should auto-ban (using configuration threshold or default)
      const autoBlockThreshold =
        settings.thresholds?.autoBlockThreshold || progressiveDelays.length;

      if (settings.thresholds?.autoBlockThreshold) {
        logger.middleware.debug("Using auto-block configuration threshold", {
          autoBlockThreshold,
        });
      }

      if (
        settings.autoBlocking.enabled &&
        violationCount >= autoBlockThreshold
      ) {
        // Create permanent IP block rule
        await createAutoBlockRule(ip, rateLimitRecord, settings);

        return {
          limited: true,
          reason: `IP automatically banned after ${violationCount} rate limit violations`,
          violations: violationCount,
          autoBanned: true,
        };
      }

      // Apply progressive delay
      const delayIndex = Math.min(
        violationCount - 1,
        progressiveDelays.length - 1
      );
      const delaySeconds = progressiveDelays[delayIndex];
      const delayMs = delaySeconds * 1000;

      // Apply admin delay reduction if applicable
      const finalDelayMs = isAdmin
        ? delayMs * settings.adminSettings.delayReductionFactor
        : delayMs;

      rateLimitRecord.delayUntil = new Date(now.getTime() + finalDelayMs);

      // Save the updated record
      await rateLimitRecord.save();

      const reason = minuteExceeded
        ? `Rate limit exceeded: ${requestsLastMinute}/${rateConfig.perMinute} requests per minute`
        : `Rate limit exceeded: ${requestsLastHour}/${rateConfig.perHour} requests per hour`;

      return {
        limited: true,
        reason: `${reason} - Progressive delay: ${Math.ceil(
          finalDelayMs / 1000
        )}s (violation #${violationCount})`,
        delayUntil: rateLimitRecord.delayUntil,
        violations: violationCount,
        isProgressive: true,
      };
    }

    // No limits exceeded - save the record with new request
    await rateLimitRecord.save();
    return { limited: false };
  } catch (error) {
    logger.middleware.error("Error in checkRateLimit", {
      error: error.message,
      errorStack: error.stack,
      ip,
    });

    // On error, allow the request but log the issue
    return { limited: false };
  }
};
const firewallMiddleware = async (req, res, next) => {
  const ip = getClientIp(req);
  const isTest = req.headers["x-firewall-test"] === "live-attack";
  const settings = await settingsCache.getSettings();

  // Enhanced admin detection with multiple fallbacks
  const isAdmin =
    req.user &&
    ((req.user.isAdmin && req.user.isAdmin()) ||
      req.user.role === "admin" ||
      req.user.admin === true);

  const isAuthenticated =
    req.user && req.isAuthenticated && req.isAuthenticated();

  // ENHANCED DEBUG: Log admin detection results
  logger.middleware.debug("🔍 Admin Detection Debug", {
    ip,
    url: req.originalUrl,
    isTest,
    userExists: !!req.user,
    userId: req.user?._id,
    userRole: req.user?.role,
    userAdmin: req.user?.admin,
    isAdminFunction: req.user?.isAdmin ? req.user.isAdmin() : "no function",
    finalIsAdmin: isAdmin,
    isAuthenticated,
    sessionID: req.sessionID,
    bypassSettings: {
      localNetworksEnabled: settings.localNetworks?.enabled,
      localNetworkRanges: settings.localNetworks?.ranges,
      bypassAdminUsers: settings.rateLimitAdvanced?.bypassAdminUsers,
      bypassAuthenticatedUsers:
        settings.rateLimitAdvanced?.bypassAuthenticatedUsers,
      whitelistedIPs: settings.rateLimitAdvanced?.whitelistedIPs,
      developmentModeEnabled: settings.developmentMode?.enabled,
      masterSwitchEnabled: settings.general?.enabled,
    },
  });

  // CRITICAL: Routes that get complete bypass (needed for core functionality)
  const completeBypassRoutes = [
    "/api/auth/google",
    "/api/auth/github",
    "/api/auth/callback",
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/check",
    "/api/auth/register",
    "/api/auth/refresh",
    "/oauth/",
    "/login",
    "/logout",
    "/api/firewall/my-rate-limit-usage", // CRITICAL: Usage checking can't count toward usage!
    "/api/firewall/health",
    "/api/firewall/ping",
    "/api/admin", // CRITICAL: Admin routes need complete bypass for authentication
    "/api/plugins", // CRITICAL: Plugin routes need complete bypass for core functionality
    "/api/system/status", // CRITICAL: System status needs complete bypass
  ];

  const isCompleteBypassRoute = completeBypassRoutes.some((route) =>
    req.originalUrl.startsWith(route)
  );

  if (isCompleteBypassRoute) {
    logger.middleware.debug("🔐 Complete bypass route", {
      url: req.originalUrl,
      ip,
      reason: req.originalUrl.startsWith("/api/auth")
        ? "authentication_flow"
        : req.originalUrl.startsWith("/api/firewall/my-rate-limit-usage")
        ? "usage_monitoring"
        : "health_check",
    });
    return next();
  }

  // REMOVED: All other early returns that bypassed rate limiting
  // Now these routes will go through rate limiting but may skip security rules

  // MASTER SWITCH: Check if firewall is globally disabled
  logger.middleware.debug("Master switch check", {
    enabled: settings.general?.enabled,
    ip,
    url: req.originalUrl,
  });
  if (!settings.general?.enabled) {
    logger.middleware.warn("Master switch OFF - allowing all traffic", { ip });
    return next();
  }
  logger.middleware.debug("Master switch ON - processing firewall rules", {
    ip,
  });

  // DEVELOPMENT MODE: Check if development mode is enabled (bypass all restrictions)
  if (settings.developmentMode?.enabled) {
    logger.middleware.warn(
      "Development mode ENABLED - bypassing all firewall restrictions",
      {
        ip,
        url: req.originalUrl,
        developmentMode: true,
      }
    );
    return next();
  }

  // Local network bypass detection (for use in both test and non-test scenarios)
  const isLocalNetwork =
    settings.localNetworks?.enabled &&
    settings.localNetworks.ranges?.some((range) => ip.startsWith(range));

  if (!isTest) {
    // REMOVED: Hardcoded development mode bypass - now uses database settings only

    // COMPLETE bypass for admin users when bypassAdminUsers is enabled
    if (isAdmin && settings.rateLimitAdvanced?.bypassAdminUsers) {
      logger.middleware.debug("🎯 Admin user complete bypass applied", {
        ip,
        url: req.originalUrl,
        userId: req.user._id,
        bypassAdminUsers: settings.rateLimitAdvanced.bypassAdminUsers,
      });
      return next();
    }

    // COMPLETE bypass for authenticated users when bypassAuthenticatedUsers is enabled
    if (
      isAuthenticated &&
      settings.rateLimitAdvanced?.bypassAuthenticatedUsers
    ) {
      logger.middleware.debug("Authenticated user complete bypass applied", {
        ip,
        url: req.originalUrl,
        userId: req.user._id,
        bypassAuthenticatedUsers:
          settings.rateLimitAdvanced.bypassAuthenticatedUsers,
      });
      return next();
    }
  }

  // Determine which routes should skip security rules (but still apply rate limiting)
  const securityBypassRoutes = [
    "/api/system/status",
    "/api/plugins/status",
    "/api/plugins/activity",
    "/api/auth/user",
    "/api/plugins",
    "/api/firewall/panel-info",
    "/api/firewall/my-rate-limit-usage",
    "/api/firewall/public-stats",
    "/api/firewall/public-settings",
    "/api/admin/",
    "/api/web-performance",
    "/admin",
  ];

  // Also include firewall admin routes for admin users only
  const firewallAdminRoutes = [
    "/api/firewall/settings",
    "/api/firewall/config",
    "/api/firewall/rules",
    "/api/firewall/logs",
    "/api/firewall/stats",
    "/api/firewall/auth/check",
    "/api/firewall/debug/",
    "/api/firewall/export-logs",
    "/api/firewall/bulk-actions",
    "/api/firewall/threat-intelligence",
    "/api/firewall/force-cache-refresh",
  ];

  const shouldSkipSecurityRules =
    securityBypassRoutes.some((route) => req.originalUrl.startsWith(route)) ||
    (isAdmin &&
      firewallAdminRoutes.some((route) => req.originalUrl.startsWith(route)));

  // Security rule checks (skip for certain routes, admin users, or local networks)
  if (!shouldSkipSecurityRules && !isAdmin && !isLocalNetwork) {
    const ruleCheck = await checkFirewallRules(ip, req);
    if (ruleCheck.blocked) {
      await logFirewallEvent(
        ip,
        "blocked",
        ruleCheck.reason,
        ruleCheck.rule,
        req
      );
      await updateRuleMetrics(
        ruleCheck.ruleId,
        ruleCheck.rule,
        "blocked",
        ip,
        req.headers["user-agent"],
        ruleCheck.country
      );

      // Ensure JSON response with proper headers
      res.set("Content-Type", "application/json");
      res.set("X-Content-Type-Options", "nosniff");
      return res.status(403).json({
        success: false,
        error: "Access Denied",
        message: "Request blocked by firewall rules",
        reason: ruleCheck.reason,
        rule: ruleCheck.rule,
        timestamp: new Date().toISOString(),
        ip: ip,
      });
    }
  } else {
    if (shouldSkipSecurityRules) {
      logger.middleware.debug("🛡️ Skipping security rules for API route", {
        ip,
        url: req.originalUrl,
        reason: "api_route_security_bypass",
      });
    }
    if (isAdmin) {
      logger.middleware.debug("🛡️ Admin user bypassing security rules", {
        ip,
        url: req.originalUrl,
        userId: req.user._id,
        userRole: req.user.role,
        reason: "admin_security_bypass",
      });
    }
    if (isLocalNetwork) {
      logger.middleware.debug("🏠 Local network bypassing security rules", {
        ip,
        url: req.originalUrl,
        reason: "local_network_security_bypass",
      });
    }
  }

  // Rate limiting checks - NOW APPLIED TO ALL ROUTES (except auth and complete bypasses)
  // This ensures homepage refreshes and all API calls count toward rate limits!
  const rateLimitCheck = await checkRateLimit(ip, req);
  if (rateLimitCheck.limited) {
    await logFirewallEvent(
      ip,
      "rate_limited",
      rateLimitCheck.reason,
      null,
      req
    );

    // Ensure JSON response with proper headers
    res.set("Content-Type", "application/json");
    res.set("X-Content-Type-Options", "nosniff");
    return res.status(429).json({
      success: false,
      error: "Too many requests",
      message: "Rate limit exceeded",
      reason: rateLimitCheck.reason,
      violations: rateLimitCheck.violations,
      timestamp: new Date().toISOString(),
      ip: ip,
      retryAfter: rateLimitCheck.retryAfter || 60,
      retryAfterSeconds: rateLimitCheck.retryAfter || 60,
    });
  }

  // If we get here, allow the request
  next();
};
const requireAdmin = async (req, res, next) => {
  console.log("🔥 FIREWALL ADMIN AUTH CHECK:", {
    user: req.user
      ? { id: req.user._id, email: req.user.email, role: req.user.role }
      : "No user",
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    sessionId: req.sessionID,
    url: req.originalUrl,
    headers: {
      cookie: req.headers.cookie ? "present" : "missing",
      authorization: req.headers.authorization ? "present" : "missing",
    },
  });

  logger.middleware.debug("Firewall admin auth check", {
    user: req.user
      ? { id: req.user._id, email: req.user.email, role: req.user.role }
      : "No user",
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    sessionId: req.sessionID,
    headers: {
      cookie: req.headers.cookie ? "present" : "missing",
      authorization: req.headers.authorization ? "present" : "missing",
    },
  });

  // Enhanced authentication check with better error handling
  const isAuthenticated = req.isAuthenticated && req.isAuthenticated();

  if (!isAuthenticated) {
    console.log("🔥 FIREWALL AUTH FAILED: User not authenticated");
    logger.middleware.warn("User not authenticated", {
      sessionId: req.sessionID,
      hasSession: !!req.session,
      hasCookies: !!req.headers.cookie,
      userAgent: req.headers["user-agent"],
    });
    return res.status(401).json({
      success: false,
      message:
        "Authentication required. Please log in to access the firewall admin panel.",
      error: "User not authenticated",
      details: {
        sessionId: req.sessionID,
        requiresLogin: true,
        loginUrl: "/login",
        isAuthenticated: isAuthenticated,
        hasIsAuthenticated: !!req.isAuthenticated,
      },
    });
  }

  if (!req.user) {
    console.log("🔥 FIREWALL AUTH FAILED: No user object");
    logger.middleware.warn("No user object in session", {
      sessionId: req.sessionID,
      sessionData: req.session,
    });
    return res.status(401).json({
      success: false,
      message: "User session is invalid. Please log in again.",
      error: "No user object in session",
      details: {
        sessionId: req.sessionID,
        requiresLogin: true,
        loginUrl: "/login",
        hasSession: !!req.session,
      },
    });
  }

  // Check both role property and isAdmin method for compatibility
  const isAdminByRole = req.user.role === "admin";
  const isAdminByMethod = req.user.isAdmin && req.user.isAdmin();
  const isAdmin = isAdminByRole || isAdminByMethod;

  console.log("🔥 FIREWALL ADMIN CHECK:", {
    role: req.user.role,
    isAdminByRole,
    isAdminByMethod,
    isAdmin,
    hasIsAdminMethod: !!req.user.isAdmin,
  });

  if (!isAdmin) {
    console.log("🔥 FIREWALL AUTH FAILED: Not admin");
    logger.middleware.warn("Non-admin user attempted firewall access", {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      isAdminByRole,
      isAdminByMethod,
    });
    return res.status(403).json({
      success: false,
      message:
        "Admin access required. This feature is only available to administrator users.",
      error: "Insufficient permissions",
      details: {
        currentRole: req.user.role,
        requiredRole: "admin",
        userId: req.user._id,
        userEmail: req.user.email,
        isAdminByRole,
        isAdminByMethod,
      },
    });
  }

  console.log("🔥 FIREWALL AUTH SUCCESS: Admin access granted");
  logger.middleware.debug("Admin access granted for firewall", {
    userId: req.user._id,
    email: req.user.email,
    role: req.user.role,
  });
  next();
};

// General logging function (following plugin-template pattern)
// NOTE: This is for system activity logging only, NOT security events
const logActivity = async (level, message, metadata = {}) => {
  try {
    // Use centralized logger for structured logging (no database log for system activity)
    await logger.logActivity(level, message, metadata);
  } catch (error) {
    logger.middleware.error("Error logging firewall activity", {
      error: error.message,
      errorStack: error.stack,
    });
  }
};

// Request logging middleware (following plugin-template pattern)
const requestLogger = (req, res, next) => {
  const settings = settingsCache.settings;

  if (settings?.features?.debugMode) {
    logger.routes.debug(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
      userId: req.user?.id,
      sessionId: req.sessionID,
    });

    // Log to database asynchronously
    setImmediate(() => {
      logActivity("debug", `API Request: ${req.method} ${req.originalUrl}`, {
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers["user-agent"],
        ip: req.ip,
        user: req.user ? req.user.email : "Anonymous",
      });
    });
  }

  next();
};

// Feature validation middleware (following plugin-template pattern)
const validateFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const settings = await settingsCache.getSettings();

      if (!settings.features[featureName]) {
        return res.status(503).json({
          success: false,
          message: `Feature '${featureName}' is currently disabled`,
        });
      }

      next();
    } catch (error) {
      logger.middleware.error("Error validating feature", {
        featureName,
        error: error.message,
        errorStack: error.stack,
      });
      res.status(500).json({
        success: false,
        message: "Error validating feature availability",
      });
    }
  };
};

// Error handling middleware (following plugin-template pattern)
const errorHandler = (err, req, res, next) => {
  logger.middleware.error(`Firewall Error: ${err.message}`, {
    error: err.message,
    errorStack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    sessionId: req.sessionID,
  });

  // Log error to database
  setImmediate(() => {
    logActivity("error", `Firewall Error: ${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.email : "Anonymous",
    });
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    message: "Internal server error in Firewall",
    error: isDevelopment ? err.message : "An error occurred",
    ...(isDevelopment && { stack: err.stack }),
  });
};

// Get cached settings helper (following plugin-template pattern)
const getCachedSettings = async () => {
  return await settingsCache.getSettings();
};

module.exports = {
  firewallMiddleware,
  requireAdmin,
  logActivity,
  requestLogger,
  validateFeature,
  errorHandler,
  getCachedSettings,
  invalidateRuleCache,
  invalidateSettingsCache,
  checkFirewallRules,
  checkRateLimit,
  logFirewallEvent,
  startCleanupIntervals,
  stopCleanupIntervals,
  getClientIp,
  matchesIPRule,
};
