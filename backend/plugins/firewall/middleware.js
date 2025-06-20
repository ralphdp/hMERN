const geoip = require("geoip-lite");
const { FirewallRule, FirewallLog, BlockedIp, RateLimit } = require("./models");

// Configuration
const RATE_LIMITS = {
  perMinute: 50,
  perHour: 400,
  progressiveDelays: [10000, 60000, 90000, 120000], // 10s, 60s, 90s, 120s
};

// Helper function to get client IP
const getClientIp = (req) => {
  return (
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    "127.0.0.1"
  );
};

// Helper function to get geo information
const getGeoInfo = (ip) => {
  if (
    ip === "127.0.0.1" ||
    ip === "localhost" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.")
  ) {
    return { country: "Local", region: "Local", city: "Local" };
  }

  const geo = geoip.lookup(ip);
  return geo
    ? {
        country: geo.country,
        region: geo.region,
        city: geo.city,
      }
    : { country: "Unknown", region: "Unknown", city: "Unknown" };
};

// Helper function to log firewall events
const logFirewallEvent = async (ip, action, reason, rule, req) => {
  try {
    const geo = getGeoInfo(ip);
    await FirewallLog.create({
      ip,
      userAgent: req.headers["user-agent"],
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      action,
      rule,
      reason,
    });
  } catch (error) {
    console.error("Error logging firewall event:", error);
  }
};

// Check if IP is blocked
const checkBlockedIp = async (ip) => {
  try {
    const blockedIp = await BlockedIp.findOne({
      ip,
      $or: [{ permanent: true }, { expiresAt: { $gt: new Date() } }],
    });
    return blockedIp;
  } catch (error) {
    console.error("Error checking blocked IP:", error);
    return null;
  }
};

// Check firewall rules
const checkFirewallRules = async (ip, req) => {
  try {
    const geo = getGeoInfo(ip);
    const rules = await FirewallRule.find({ enabled: true }).sort({
      priority: 1,
    });

    for (const rule of rules) {
      switch (rule.type) {
        case "ip_block":
          if (ip === rule.value || ip.startsWith(rule.value)) {
            return {
              blocked: true,
              rule: rule.name,
              reason: `IP blocked by rule: ${rule.name}`,
            };
          }
          break;

        case "country_block":
          if (geo.country === rule.value) {
            return {
              blocked: true,
              rule: rule.name,
              reason: `Country ${geo.country} blocked by rule: ${rule.name}`,
            };
          }
          break;

        case "suspicious_pattern":
          const userAgent = req.headers["user-agent"] || "";
          const url = req.originalUrl || "";
          if (userAgent.includes(rule.value) || url.includes(rule.value)) {
            return {
              blocked: true,
              rule: rule.name,
              reason: `Suspicious pattern detected: ${rule.value}`,
            };
          }
          break;
      }
    }

    return { blocked: false };
  } catch (error) {
    console.error("Error checking firewall rules:", error);
    return { blocked: false };
  }
};

// Enhanced rate limiting
const checkRateLimit = async (ip, req) => {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    const oneHourAgo = new Date(now.getTime() - 3600000);

    // Get or create rate limit record
    let rateLimit = await RateLimit.findOne({ ip });
    if (!rateLimit) {
      rateLimit = new RateLimit({ ip, requests: [] });
    }

    // Clean old requests
    rateLimit.requests = rateLimit.requests.filter(
      (req) => req.timestamp > oneHourAgo
    );

    // Count recent requests
    const requestsLastMinute = rateLimit.requests.filter(
      (req) => req.timestamp > oneMinuteAgo
    ).length;
    const requestsLastHour = rateLimit.requests.length;

    // Check if currently delayed
    if (rateLimit.delayUntil && now < rateLimit.delayUntil) {
      return {
        limited: true,
        reason: `Rate limited until ${rateLimit.delayUntil.toISOString()}`,
        delayUntil: rateLimit.delayUntil,
      };
    }

    // Check rate limits
    if (
      requestsLastMinute >= RATE_LIMITS.perMinute ||
      requestsLastHour >= RATE_LIMITS.perHour
    ) {
      rateLimit.violations += 1;
      rateLimit.lastViolation = now;

      // Progressive delays
      if (rateLimit.violations <= RATE_LIMITS.progressiveDelays.length) {
        const delay = RATE_LIMITS.progressiveDelays[rateLimit.violations - 1];
        rateLimit.delayUntil = new Date(now.getTime() + delay);
        await rateLimit.save();

        return {
          limited: true,
          reason: `Rate limit exceeded. Violation #${
            rateLimit.violations
          }. Delayed for ${delay / 1000}s`,
          delayUntil: rateLimit.delayUntil,
        };
      } else {
        // Block IP permanently after max violations
        const geo = getGeoInfo(ip);
        await BlockedIp.create({
          ip,
          reason: "Rate limit violations exceeded",
          permanent: true,
          attempts: rateLimit.violations,
          country: geo.country,
          region: geo.region,
          city: geo.city,
        });

        return {
          limited: true,
          blocked: true,
          reason: "IP blocked due to excessive rate limit violations",
        };
      }
    }

    // Add current request
    rateLimit.requests.push({
      timestamp: now,
      url: req.originalUrl,
      method: req.method,
    });

    await rateLimit.save();
    return { limited: false };
  } catch (error) {
    console.error("Error checking rate limit:", error);
    return { limited: false };
  }
};

// Main firewall middleware
const firewallMiddleware = async (req, res, next) => {
  const ip = getClientIp(req);

  try {
    // Skip firewall for localhost in development
    if (
      process.env.NODE_ENV === "development" &&
      (ip === "127.0.0.1" || ip === "localhost")
    ) {
      return next();
    }

    // Check if IP is blocked
    const blockedIp = await checkBlockedIp(ip);
    if (blockedIp) {
      await logFirewallEvent(ip, "blocked", blockedIp.reason, "IP Block", req);
      return res.status(403).json({
        success: false,
        error: "Access Denied",
        message: "Your IP address has been blocked",
        code: "IP_BLOCKED",
        timestamp: new Date().toISOString(),
      });
    }

    // Check firewall rules
    const ruleCheck = await checkFirewallRules(ip, req);
    if (ruleCheck.blocked) {
      await logFirewallEvent(
        ip,
        "blocked",
        ruleCheck.reason,
        ruleCheck.rule,
        req
      );
      return res.status(403).json({
        success: false,
        error: "Access Denied",
        message: "Request blocked by firewall rules",
        code: "RULE_BLOCKED",
        timestamp: new Date().toISOString(),
      });
    }

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(ip, req);
    if (rateLimitCheck.limited) {
      await logFirewallEvent(
        ip,
        "rate_limited",
        rateLimitCheck.reason,
        "Rate Limit",
        req
      );

      if (rateLimitCheck.blocked) {
        return res.status(403).json({
          success: false,
          error: "Access Denied",
          message: "IP address has been blocked due to rate limit violations",
          code: "IP_BLOCKED_RATE_LIMIT",
          timestamp: new Date().toISOString(),
        });
      }

      return res.status(429).json({
        success: false,
        error: "Rate Limited",
        message: "Too many requests",
        code: "RATE_LIMITED",
        retryAfter: rateLimitCheck.delayUntil,
        timestamp: new Date().toISOString(),
      });
    }

    // Log allowed request
    await logFirewallEvent(ip, "allowed", "Request allowed", null, req);

    next();
  } catch (error) {
    console.error("Firewall middleware error:", error);
    // In case of error, allow the request to continue
    next();
  }
};

// Admin middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin()) {
    return res.status(403).json({
      success: false,
      error: "Access Denied",
      message: "Admin access required",
      code: "ADMIN_REQUIRED",
    });
  }
  next();
};

module.exports = {
  firewallMiddleware,
  requireAdmin,
  getClientIp,
  getGeoInfo,
  logFirewallEvent,
};
