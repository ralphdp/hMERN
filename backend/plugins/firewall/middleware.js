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
    };
  }

  async getSettings() {
    const now = Date.now();
    if (now - this.lastUpdate < this.ttl && this.settings) {
      return this.settings;
    }
    this.isLoading = true;
    try {
      let settings = await FirewallSettings.findOne({ settingsId: "default" });
      if (!settings) {
        settings = new FirewallSettings({ settingsId: "default" });
        await settings.save();
      }
      this.settings = {
        rateLimit: settings.rateLimit,
        features: settings.features || this.defaults.features,
        progressiveDelays: settings.progressiveDelays.map((d) => d * 1000),
        adminRateLimit: {
          ...settings.adminRateLimit,
          progressiveDelays: settings.adminRateLimit.progressiveDelays.map(
            (d) => d * 1000
          ),
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
    console.log("[Cache] Settings cache invalidated.");
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
    console.log("[Cache] Rule cache invalidated.");
  }
}
const ruleCache = new RuleCache();

const invalidateRuleCache = () => ruleCache.invalidate();
const invalidateSettingsCache = () => settingsCache.invalidate();

// --- Helper Functions ---
const getClientIp = (req) => {
  let ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }
  return ip || "127.0.0.1";
};
const isValidIP = (ip) => {
  /* ... */
};
const isIpInCIDR = (ip, cidr) => {
  /* ... */
};
const matchesIPRule = (ip, ruleValue) => {
  if (ip === ruleValue) return true;
  if (ruleValue.includes("/")) {
    try {
      const address = ip.includes(":") ? new Address6(ip) : new Address4(ip);
      const subnet = ip.includes(":")
        ? new Address6(ruleValue)
        : new Address4(ruleValue);
      return address.isInSubnet(subnet);
    } catch (e) {
      return false;
    }
  }
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
  const geo = await getGeoInfo(ip);
  await FirewallLog.create({
    ip,
    action,
    reason,
    rule,
    userAgent: req.headers["user-agent"],
    url: req.originalUrl,
    method: req.method || "Unknown",
    country: geo?.country,
    region: geo?.region,
    city: geo?.city,
  });
  const settings = await settingsCache.getSettings();
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
          console.error(
            `Failed to send firewall alert to ${email}:`,
            emailError
          );
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

      console.log(
        `[AutoBlock] Updated existing auto-block rule for IP ${ip} (${rateLimitRecord.violations} violations)`
      );
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

    console.log(
      `[AutoBlock] Created permanent IP block rule for ${ip} after ${rateLimitRecord.violations} violations`
    );

    return blockRule;
  } catch (error) {
    console.error(
      `[AutoBlock] Failed to create auto-block rule for ${ip}:`,
      error
    );
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
      console.log(
        `[RateLimit] Cleaned up ${result.deletedCount} expired rate limit records`
      );
    }
  } catch (error) {
    console.error("[RateLimit] Error cleaning up expired records:", error);
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupExpiredRateLimits, 30 * 60 * 1000);

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
      console.log(
        `[RateLimit] Reset violation counts for ${result.modifiedCount} IPs (no violations in 24h)`
      );
    }
  } catch (error) {
    console.error("[RateLimit] Error resetting old violations:", error);
  }
};

// Run violation reset every 6 hours
setInterval(resetOldViolations, 6 * 60 * 60 * 1000);

// --- End Helper Functions ---

const checkRateLimit = async (ip, req) => {
  const settings = await settingsCache.getSettings();
  if (!settings.features?.rateLimiting) return { limited: false };

  const { RateLimit } = require("./models");
  const now = new Date();
  const minuteAgo = new Date(now.getTime() - settings.timeWindows.minuteMs);
  const hourAgo = new Date(now.getTime() - settings.timeWindows.hourMs);

  // Check if this is an admin user and apply reduced limits
  const isAdmin = req.user && req.user.isAdmin;
  let rateConfig = isAdmin ? settings.adminRateLimit : settings.rateLimit;

  // Check if current URL matches any specific rate limit rules
  const rules = await ruleCache.getRules();
  const rateLimitRules = rules.filter(
    (rule) => rule.type === "rate_limit" && rule.enabled
  );

  for (const rule of rateLimitRules) {
    if (req.originalUrl && req.originalUrl.includes(rule.value)) {
      // Apply stricter limits for specific endpoints (e.g., /login, /api/)
      rateConfig = {
        perMinute: Math.floor(rateConfig.perMinute * 0.3), // 30% of normal rate for sensitive endpoints
        perHour: Math.floor(rateConfig.perHour * 0.3),
      };
      console.log(
        `[RateLimit] Applied strict rate limit for endpoint ${rule.value}: ${rateConfig.perMinute}/min, ${rateConfig.perHour}/hour`
      );
      break;
    }
  }

  try {
    // Get or create rate limit record for this IP
    let rateLimitRecord = await RateLimit.findOne({ ip });

    if (!rateLimitRecord) {
      rateLimitRecord = new RateLimit({
        ip,
        requests: [],
        violations: 0,
        lastViolation: null,
        delayUntil: null,
      });
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

    if (minuteExceeded || hourExceeded) {
      // Increment violation count
      rateLimitRecord.violations += 1;
      rateLimitRecord.lastViolation = now;

      const violationCount = rateLimitRecord.violations;
      const progressiveDelays = isAdmin
        ? settings.adminRateLimit.progressiveDelays
        : settings.progressiveDelays;

      // Check if we should auto-ban (exceeded all progressive delays)
      if (
        settings.autoBlocking.enabled &&
        violationCount > progressiveDelays.length
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
    console.error("Error in checkRateLimit:", error);
    // On error, allow the request but log the issue
    return { limited: false };
  }
};
const firewallMiddleware = async (req, res, next) => {
  const ip = getClientIp(req);
  const isTest = req.headers["x-firewall-test"] === "live-attack";
  const settings = await settingsCache.getSettings();

  if (!isTest) {
    if (process.env.NODE_ENV === "development") return next();
    if (
      settings.localNetworks.enabled &&
      settings.localNetworks.ranges.some((range) => ip.startsWith(range))
    )
      return next();
    // Simplified admin check for brevity
    if (req.user && req.user.isAdmin) return next();
  }

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
    return res
      .status(403)
      .json({ error: "Access Denied", reason: ruleCheck.reason });
  }

  const rateLimitCheck = await checkRateLimit(ip, req);
  if (rateLimitCheck.limited) {
    if (rateLimitCheck.autoBanned) {
      // IP was automatically banned - log as blocked instead of rate_limited
      await logFirewallEvent(
        ip,
        "blocked",
        rateLimitCheck.reason,
        "Auto-Block (Rate Limit)",
        req
      );
      return res.status(403).json({
        error: "Access Denied",
        reason: rateLimitCheck.reason,
        autoBanned: true,
        violations: rateLimitCheck.violations,
      });
    } else {
      // Regular rate limiting with progressive delay
      await logFirewallEvent(
        ip,
        "rate_limited",
        rateLimitCheck.reason,
        "Rate Limit",
        req
      );

      const response = {
        error: "Too many requests",
        reason: rateLimitCheck.reason,
        violations: rateLimitCheck.violations,
      };

      // Add retry-after header for progressive delays
      if (rateLimitCheck.delayUntil) {
        const retryAfterSeconds = Math.ceil(
          (rateLimitCheck.delayUntil - new Date()) / 1000
        );
        res.set("Retry-After", retryAfterSeconds.toString());
        response.retryAfter = retryAfterSeconds;
      }

      return res.status(429).json(response);
    }
  }

  next();
};
const requireAdmin = async (req, res, next) => {
  console.log("=== Firewall Admin Auth Check ===");
  console.log(
    "User:",
    req.user
      ? { id: req.user._id, email: req.user.email, role: req.user.role }
      : "No user"
  );
  console.log(
    "Is authenticated:",
    req.isAuthenticated ? req.isAuthenticated() : "No isAuthenticated method"
  );
  console.log("Session ID:", req.sessionID);
  console.log("User role:", req.user?.role);
  console.log(
    "User isAdmin method:",
    req.user?.isAdmin ? req.user.isAdmin() : "no method"
  );

  if (!req.isAuthenticated || !req.isAuthenticated()) {
    console.log("User not authenticated - returning 401");
    return res.status(401).json({
      success: false,
      message: "Authentication required",
      error: "User not authenticated",
    });
  }

  if (!req.user) {
    console.log("No user object - returning 401");
    return res.status(401).json({
      success: false,
      message: "User not found in session",
      error: "No user object",
    });
  }

  // Check both role property and isAdmin method for compatibility
  const isAdminByRole = req.user.role === "admin";
  const isAdminByMethod = req.user.isAdmin && req.user.isAdmin();
  const isAdmin = isAdminByRole || isAdminByMethod;

  if (!isAdmin) {
    console.log(`User role '${req.user.role}' is not admin - returning 403`);
    return res.status(403).json({
      success: false,
      message: "Admin access required",
      error: "Insufficient permissions",
    });
  }

  console.log("Admin access granted");
  next();
};

module.exports = {
  firewallMiddleware,
  requireAdmin,
  invalidateRuleCache,
  invalidateSettingsCache,
  checkFirewallRules,
  logFirewallEvent,
};
