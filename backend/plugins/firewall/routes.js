const express = require("express");
const router = express.Router();
const {
  FirewallRule,
  FirewallLog,
  BlockedIp,
  RateLimit,
  FirewallSettings,
  RuleMetrics,
} = require("./models");
const {
  requireAdmin,
  invalidateRuleCache,
  invalidateSettingsCache,
  checkFirewallRules,
  logFirewallEvent,
} = require("./middleware");
const {
  sendFirewallTestResultEmail,
  addCommonFirewallRules,
} = require("./utils");

// Threat Intelligence Integration
const ThreatIntelligence = require("./threat-intelligence");
const threatIntel = new ThreatIntelligence();

// DEBUG: Log ALL requests that reach firewall routes
router.use((req, res, next) => {
  console.log(
    `🔥 [FIREWALL ROUTES] ${req.method} ${
      req.originalUrl
    } - ${new Date().toISOString()}`
  );
  console.log(
    `🔥 [FIREWALL ROUTES] Headers:`,
    JSON.stringify(req.headers, null, 2)
  );
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(
      `🔥 [FIREWALL ROUTES] Body:`,
      JSON.stringify(req.body, null, 2)
    );
  }
  next();
});

// DEBUG: Simple test endpoint
router.get("/debug-test", (req, res) => {
  console.log(`🔥 [DEBUG] Test endpoint hit!`);
  res.json({
    success: true,
    message: "Firewall routes are working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
  });
});

// Add CORS headers and body parsing specifically for firewall routes in development
if (process.env.NODE_ENV === "development") {
  router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie, Set-Cookie, X-Admin-Bypass"
    );

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
}

// Ensure body parsing works for firewall routes
router.use(express.json({ limit: "10mb" }));
router.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Firewall plugin is loaded and working",
    timestamp: new Date().toISOString(),
  });
});

// Simple connectivity test without auth
router.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Firewall API is reachable",
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID,
    hasUser: !!req.user,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
  });
});

// Test endpoint for local network bypass
router.get("/test-bypass", async (req, res) => {
  try {
    const ip =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const isLocal = ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
    const result = {
      title: "Localhost Bypass Test",
      success: isLocal,
      message: isLocal
        ? "Bypass test successful: Request was received from a local IP."
        : `Bypass test failed: Request was received from a non-local IP (${ip}).`,
      ip: ip,
    };

    // Send email notification if enabled
    const settings = await FirewallSettings.findOne({ settingsId: "default" });
    if (settings?.monitoring?.enableRealTimeAlerts) {
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
            await sendFirewallTestResultEmail({
              to: email,
              ...result,
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${email}:`, emailError);
          }
        }
      }
    }

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        ip: result.ip,
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        ip: result.ip,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during bypass test.",
      error: error.message,
    });
  }
});

// Test rate limiting and automatic escalation
router.get("/test-rate-limit", (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  res.json({
    success: true,
    message: "Rate limit test endpoint hit",
    ip: ip,
    timestamp: new Date().toISOString(),
    note: "Hit this endpoint repeatedly to test progressive delays and auto-banning",
  });
});

// Test endpoint for live rule testing - NEW POST version
router.post("/test-rule", requireAdmin, async (req, res) => {
  try {
    const { attackPattern } = req.body;
    if (!attackPattern) {
      return res
        .status(400)
        .json({ success: false, message: "attackPattern is required." });
    }

    // Create a mock request object for the firewall checker
    const mockReq = {
      headers: {
        "user-agent": `malicious-bot/1.0 trying to use ${attackPattern}`,
      },
      originalUrl: `/test-rule?attack=${encodeURIComponent(attackPattern)}`,
      ip: req.ip, // Use the real IP of the admin making the test request
      sessionID: req.sessionID,
      user: req.user,
    };

    const ruleCheck = await checkFirewallRules(mockReq.ip, mockReq);

    if (ruleCheck.blocked) {
      // Log the event, which will trigger the email
      await logFirewallEvent(
        mockReq.ip,
        "blocked",
        ruleCheck.reason,
        ruleCheck.rule,
        mockReq // Pass the mock request
      );
      return res.json({
        success: true,
        message: `The firewall correctly blocked the simulated attack. Reason: ${ruleCheck.reason}. An email notification has been sent.`,
      });
    } else {
      return res.json({
        success: false,
        message:
          "Rule test FAILED: The firewall did not block the simulated attack.",
      });
    }
  } catch (error) {
    console.error("Error during live rule test:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected server error occurred during the test.",
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Firewall plugin is active",
    features: [
      "IP Blocking",
      "Enhanced Rate Limiting",
      "Geo-blocking",
      "Suspicious Request Detection",
      "Real-time Logging",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Dashboard statistics (admin only)
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalRules,
      activeRules,
      totalBlockedIPs,
      activeBlockedIPs,
      permanentBlocks,
      logsLast24h,
      logsLast7d,
      blockedRequestsLast24h,
      allowedRequestsLast24h,
    ] = await Promise.all([
      FirewallRule.countDocuments(),
      FirewallRule.countDocuments({ enabled: true }),
      // Count IP blocking rules instead of old BlockedIp collection
      FirewallRule.countDocuments({ type: "ip_block" }),
      FirewallRule.countDocuments({ type: "ip_block", enabled: true }),
      FirewallRule.countDocuments({
        type: "ip_block",
        enabled: true,
        permanent: true,
      }),
      FirewallLog.countDocuments({ timestamp: { $gte: last24Hours } }),
      FirewallLog.countDocuments({ timestamp: { $gte: last7Days } }),
      FirewallLog.countDocuments({
        timestamp: { $gte: last24Hours },
        action: { $in: ["blocked", "rate_limited"] },
      }),
      FirewallLog.countDocuments({
        timestamp: { $gte: last24Hours },
        action: "allowed",
      }),
    ]);

    // Top blocked countries
    const topBlockedCountries = await FirewallLog.aggregate([
      {
        $match: {
          timestamp: { $gte: last7Days },
          action: { $in: ["blocked", "rate_limited"] },
        },
      },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Top blocked IPs
    const topBlockedIPs = await FirewallLog.aggregate([
      {
        $match: {
          timestamp: { $gte: last7Days },
          action: { $in: ["blocked", "rate_limited"] },
        },
      },
      { $group: { _id: "$ip", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const statsData = {
      rules: {
        total: totalRules,
        active: activeRules,
      },
      blockedIPs: {
        total: totalBlockedIPs,
        active: activeBlockedIPs,
        permanent: permanentBlocks,
      },
      requests: {
        last24h: {
          total: logsLast24h,
          blocked: blockedRequestsLast24h,
          allowed: allowedRequestsLast24h,
        },
        last7d: logsLast7d,
      },
      topBlockedCountries,
      topBlockedIPs,
    };

    res.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error("Error getting firewall stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving firewall statistics",
    });
  }
});

// Get firewall rules (admin only) - Enhanced with source filtering
router.get("/rules", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, enabled, source, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (enabled !== undefined) filter.enabled = enabled === "true";
    if (source) filter.source = source;

    // Search in name, value, or description
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { value: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const rules = await FirewallRule.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FirewallRule.countDocuments(filter);

    // Get statistics by source for the response
    const stats = await FirewallRule.aggregate([
      {
        $group: {
          _id: { source: "$source", type: "$type" },
          count: { $sum: 1 },
          enabled: { $sum: { $cond: ["$enabled", 1, 0] } },
        },
      },
      { $sort: { "_id.source": 1, "_id.type": 1 } },
    ]);

    res.json({
      success: true,
      data: rules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      stats: stats.reduce((acc, stat) => {
        const key = `${stat._id.source}_${stat._id.type}`;
        acc[key] = {
          total: stat.count,
          enabled: stat.enabled,
          disabled: stat.count - stat.enabled,
        };
        return acc;
      }, {}),
      filters: {
        availableSources: [
          "manual",
          "threat_intel",
          "rate_limit",
          "common_rules",
        ],
        availableTypes: [
          "ip_block",
          "country_block",
          "rate_limit",
          "suspicious_pattern",
        ],
      },
    });
  } catch (error) {
    console.error("Error getting firewall rules:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving firewall rules",
    });
  }
});

// Create firewall rule (admin only)
router.post("/rules", requireAdmin, async (req, res) => {
  try {
    console.log("=== Creating Firewall Rule ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Request body type:", typeof req.body);
    console.log("Request content-type:", req.headers["content-type"]);
    console.log(
      "User:",
      req.user ? { email: req.user.email, role: req.user.role } : "No user"
    );

    // Check if req.body exists and is an object
    if (!req.body || typeof req.body !== "object") {
      console.log("Request body is missing or invalid");
      return res.status(400).json({
        success: false,
        message:
          "Request body is missing or invalid. Please ensure you're sending JSON data with Content-Type: application/json",
        received: {
          body: req.body,
          bodyType: typeof req.body,
          contentType: req.headers["content-type"],
        },
      });
    }

    const { name, type, value, action, enabled, priority, description } =
      req.body;

    // Enhanced validation with better error messages
    const validationErrors = [];

    if (!name || typeof name !== "string" || name.trim() === "") {
      validationErrors.push("Rule name is required and cannot be empty");
    }

    if (!type || typeof type !== "string" || type.trim() === "") {
      validationErrors.push("Rule type is required and cannot be empty");
    }

    if (!value || typeof value !== "string" || value.trim() === "") {
      validationErrors.push("Rule value is required and cannot be empty");
    }

    if (validationErrors.length > 0) {
      console.log("Validation failed - detailed errors:", validationErrors);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
        received: {
          name: name
            ? `"${name}" (${typeof name})`
            : `${name} (${typeof name})`,
          type: type
            ? `"${type}" (${typeof type})`
            : `${type} (${typeof type})`,
          value: value
            ? `"${value}" (${typeof value})`
            : `${value} (${typeof value})`,
        },
      });
    }

    // Validate type
    const validTypes = [
      "ip_block",
      "country_block",
      "rate_limit",
      "suspicious_pattern",
    ];
    if (!validTypes.includes(type)) {
      console.log("Invalid type:", type);
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        received: type,
      });
    }

    // Validate action
    const validActions = ["block", "allow", "rate_limit"];
    if (action && !validActions.includes(action)) {
      console.log("Invalid action:", action);
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(", ")}`,
        received: action,
      });
    }

    const ruleData = {
      name,
      type,
      value,
      action: action || "block",
      enabled: enabled !== false,
      priority: priority || 100,
      description: description || "",
    };

    console.log("Creating rule with data:", JSON.stringify(ruleData, null, 2));

    const rule = new FirewallRule(ruleData);
    await rule.save();

    // Invalidate rule cache after creating new rule
    invalidateRuleCache();

    console.log("Rule created successfully:", rule._id);

    res.status(201).json({
      success: true,
      message: "Firewall rule created successfully",
      data: rule,
    });
  } catch (error) {
    console.error("=== Error creating firewall rule ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.name === "ValidationError") {
      console.error("Validation errors:", error.errors);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }

    if (error.code === 11000) {
      console.error("Duplicate key error:", error.keyPattern);
      return res.status(409).json({
        success: false,
        message: "A rule with similar parameters already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating firewall rule",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Install common firewall rules (admin only)
router.post("/rules/add-common", requireAdmin, async (req, res) => {
  console.log(
    "[Firewall Routes] POST /rules/add-common endpoint hit. Beginning process..."
  );
  try {
    const result = await addCommonFirewallRules(invalidateRuleCache);
    if (result.success) {
      return res.json({
        success: true,
        message:
          result.added > 0
            ? `Successfully installed ${result.added} new common rules.`
            : "All common rules are already installed.",
        data: result,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "An error occurred while installing common rules.",
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error handling /rules/add-common:", error);
    res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
});

// Update firewall rule (admin only)
router.put("/rules/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    updates.updatedAt = new Date();

    const rule = await FirewallRule.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Firewall rule not found",
      });
    }

    // Invalidate rule cache after updating rule
    invalidateRuleCache();

    res.json({
      success: true,
      message: "Firewall rule updated successfully",
      data: rule,
    });
  } catch (error) {
    console.error("Error updating firewall rule:", error);
    res.status(500).json({
      success: false,
      message: "Error updating firewall rule",
    });
  }
});

// Delete firewall rule (admin only)
router.delete("/rules/:id", requireAdmin, async (req, res) => {
  try {
    console.log(`=== DELETE FIREWALL RULE ===`);
    console.log(`Rule ID: ${req.params.id}`);
    console.log(`User: ${req.user?.email || "No user"}`);
    console.log(`Headers:`, req.headers);

    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log(`Invalid ObjectId format: ${id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid rule ID format",
      });
    }

    console.log(`Attempting to delete rule with ID: ${id}`);
    const rule = await FirewallRule.findByIdAndDelete(id);

    console.log(`Rule found and deleted:`, rule ? "YES" : "NO");
    if (rule) {
      console.log(`Deleted rule:`, {
        name: rule.name,
        type: rule.type,
        value: rule.value,
      });
    }

    if (!rule) {
      console.log(`Rule not found in database`);
      return res.status(404).json({
        success: false,
        message: "Firewall rule not found",
      });
    }

    // Invalidate rule cache after deleting rule
    invalidateRuleCache();
    console.log(`Rule cache invalidated`);

    console.log(`=== DELETE SUCCESSFUL ===`);
    res.json({
      success: true,
      message: "Firewall rule deleted successfully",
    });
  } catch (error) {
    console.error("=== DELETE ERROR ===");
    console.error("Error deleting firewall rule:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error deleting firewall rule",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get rule metrics for sparklines (admin only)
router.get("/rules/:id/metrics", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // First, get the rule to find its name
    let rule;
    try {
      rule = await FirewallRule.findById(id);
      if (!rule) {
        return res.status(404).json({
          success: false,
          message: "Rule not found",
        });
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid rule ID format",
      });
    }

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0); // Start of day

    // Query firewall logs for this rule
    const logs = await FirewallLog.aggregate([
      {
        $match: {
          rule: rule.name, // Match by rule name
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $addFields: {
          dateKey: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
        },
      },
      {
        $group: {
          _id: "$dateKey",
          totalRequests: { $sum: 1 },
          blockedRequests: {
            $sum: {
              $cond: [{ $in: ["$action", ["blocked", "rate_limited"]] }, 1, 0],
            },
          },
          allowedRequests: {
            $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
          },
          rateLimitedRequests: {
            $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
          },
          uniqueIPs: { $addToSet: "$ip" },
        },
      },
      {
        $addFields: {
          uniqueIPs: { $size: "$uniqueIPs" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Create a complete date series (fill in missing days with zeros)
    const dateMap = new Map();
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateKey = new Date(d).toISOString().split("T")[0];
      dateMap.set(dateKey, {
        date: dateKey,
        totalRequests: 0,
        blockedRequests: 0,
        allowedRequests: 0,
        rateLimitedRequests: 0,
        uniqueIPs: 0,
      });
    }

    // Fill in actual data
    logs.forEach((log) => {
      if (dateMap.has(log._id)) {
        dateMap.set(log._id, {
          date: log._id,
          totalRequests: log.totalRequests,
          blockedRequests: log.blockedRequests,
          allowedRequests: log.allowedRequests,
          rateLimitedRequests: log.rateLimitedRequests,
          uniqueIPs: log.uniqueIPs,
        });
      }
    });

    const timeSeriesData = Array.from(dateMap.values());

    res.json({
      success: true,
      data: {
        timeSeriesData,
        summary: {
          totalDays: parseInt(days),
          totalRequests: timeSeriesData.reduce(
            (sum, day) => sum + day.totalRequests,
            0
          ),
          totalBlocked: timeSeriesData.reduce(
            (sum, day) => sum + day.blockedRequests,
            0
          ),
          avgRequestsPerDay:
            timeSeriesData.reduce((sum, day) => sum + day.totalRequests, 0) /
            parseInt(days),
          peakDay: timeSeriesData.reduce(
            (max, day) => (day.totalRequests > max.totalRequests ? day : max),
            { totalRequests: 0, date: null }
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching rule metrics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching rule metrics",
    });
  }
});

// Get metrics for all rules (admin only)
router.get("/rules/metrics/summary", requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Get all rules
    const rules = await FirewallRule.find({ enabled: true });

    // Get metrics for all rules
    const allMetrics = await RuleMetrics.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: "$ruleId",
          ruleName: { $first: "$ruleName" },
          totalRequests: { $sum: "$totalRequests" },
          blockedRequests: { $sum: "$blockedRequests" },
          allowedRequests: { $sum: "$allowedRequests" },
          rateLimitedRequests: { $sum: "$rateLimitedRequests" },
          avgRequestsPerDay: { $avg: "$totalRequests" },
          lastActivity: { $max: "$date" },
        },
      },
      {
        $sort: { totalRequests: -1 },
      },
    ]);

    // Map metrics to rules
    const rulesWithMetrics = rules.map((rule) => {
      const metrics = allMetrics.find(
        (m) => m._id?.toString() === rule._id.toString()
      );
      return {
        ruleId: rule._id,
        ruleName: rule.name,
        ruleType: rule.type,
        enabled: rule.enabled,
        priority: rule.priority,
        metrics: metrics || {
          totalRequests: 0,
          blockedRequests: 0,
          allowedRequests: 0,
          rateLimitedRequests: 0,
          avgRequestsPerDay: 0,
          lastActivity: null,
        },
      };
    });

    res.json({
      success: true,
      data: rulesWithMetrics,
    });
  } catch (error) {
    console.error("Error fetching rules metrics summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching rules metrics summary",
    });
  }
});

// Get auto-blocked IPs (admin only)
router.get("/auto-blocked", requireAdmin, async (req, res) => {
  try {
    const autoBlockedRules = await FirewallRule.find({
      type: "ip_block",
      source: "rate_limit",
      enabled: true,
    }).sort({ createdAt: -1 });

    const autoBlockedData = autoBlockedRules.map((rule) => ({
      id: rule._id,
      ip: rule.value,
      name: rule.name,
      violations: rule.attempts,
      lastAttempt: rule.lastAttempt,
      createdAt: rule.createdAt,
      country: rule.country,
      region: rule.region,
      city: rule.city,
      description: rule.description,
      permanent: rule.permanent,
    }));

    res.json({
      success: true,
      data: autoBlockedData,
      count: autoBlockedData.length,
    });
  } catch (error) {
    console.error("Error getting auto-blocked IPs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving auto-blocked IPs",
    });
  }
});

// Get rate limit violations for all IPs (admin only)
router.get("/rate-limit-status", requireAdmin, async (req, res) => {
  try {
    const { RateLimit } = require("./models");

    const activeViolations = await RateLimit.find({
      violations: { $gt: 0 },
    }).sort({ violations: -1, lastViolation: -1 });

    const violationData = activeViolations.map((record) => ({
      ip: record.ip,
      violations: record.violations,
      lastViolation: record.lastViolation,
      delayUntil: record.delayUntil,
      isDelayed: record.delayUntil && new Date() < record.delayUntil,
      recentRequests: record.requests.length,
    }));

    res.json({
      success: true,
      data: violationData,
      count: violationData.length,
    });
  } catch (error) {
    console.error("Error getting rate limit status:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving rate limit status",
    });
  }
});

// Reset rate limit violations for specific IP (admin only)
router.post("/reset-violations/:ip", requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params;
    const { RateLimit } = require("./models");

    const result = await RateLimit.updateOne(
      { ip },
      {
        $set: { violations: 0 },
        $unset: { delayUntil: 1, lastViolation: 1 },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `No rate limit record found for IP ${ip}`,
      });
    }

    res.json({
      success: true,
      message: `Rate limit violations reset for IP ${ip}`,
      data: { ip, violationsReset: true },
    });
  } catch (error) {
    console.error(`Error resetting violations for IP ${req.params.ip}:`, error);
    res.status(500).json({
      success: false,
      message: "Error resetting rate limit violations",
    });
  }
});

// Send preview security report to specified emails (admin only)
router.post("/send-preview-report", requireAdmin, async (req, res) => {
  try {
    const { emails, reportSettings } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one email address is required",
      });
    }

    // Import firewall-specific email service
    const { sendFirewallReportEmail } = require("./emailService");

    // Determine timeframes based on frequency setting
    const frequency = reportSettings?.frequency || "weekly";
    const now = new Date();

    let attackSummaryPeriod, threatsPeriod;
    let attackSummaryLabel, threatsLabel;

    switch (frequency) {
      case "daily":
        attackSummaryPeriod = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        threatsPeriod = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        attackSummaryLabel = "24 Hours";
        threatsLabel = "7 Days";
        break;
      case "weekly":
        attackSummaryPeriod = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        threatsPeriod = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        attackSummaryLabel = "7 Days";
        threatsLabel = "30 Days";
        break;
      case "monthly":
        attackSummaryPeriod = new Date(
          now.getTime() - 30 * 24 * 60 * 60 * 1000
        ); // Last 30 days
        threatsPeriod = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // Last 90 days
        attackSummaryLabel = "30 Days";
        threatsLabel = "90 Days";
        break;
      default:
        // Default to weekly
        attackSummaryPeriod = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        threatsPeriod = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        attackSummaryLabel = "7 Days";
        threatsLabel = "30 Days";
    }

    const [
      totalRules,
      activeRules,
      totalBlockedIPs,
      activeBlockedIPs,
      permanentBlocks,
      logsAttackPeriod,
      logsThreatsPeriod,
      blockedRequestsAttackPeriod,
      allowedRequestsAttackPeriod,
    ] = await Promise.all([
      FirewallRule.countDocuments(),
      FirewallRule.countDocuments({ enabled: true }),
      FirewallRule.countDocuments({ type: "ip_block" }),
      FirewallRule.countDocuments({ type: "ip_block", enabled: true }),
      FirewallRule.countDocuments({
        type: "ip_block",
        enabled: true,
        permanent: true,
      }),
      FirewallLog.countDocuments({ timestamp: { $gte: attackSummaryPeriod } }),
      FirewallLog.countDocuments({ timestamp: { $gte: threatsPeriod } }),
      FirewallLog.countDocuments({
        timestamp: { $gte: attackSummaryPeriod },
        action: { $in: ["blocked", "rate_limited"] },
      }),
      FirewallLog.countDocuments({
        timestamp: { $gte: attackSummaryPeriod },
        action: "allowed",
      }),
    ]);

    // Get top blocked countries
    const topBlockedCountries = await FirewallLog.aggregate([
      {
        $match: {
          timestamp: { $gte: threatsPeriod },
          action: { $in: ["blocked", "rate_limited"] },
        },
      },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get top blocked IPs
    const topBlockedIPs = await FirewallLog.aggregate([
      {
        $match: {
          timestamp: { $gte: threatsPeriod },
          action: { $in: ["blocked", "rate_limited"] },
        },
      },
      { $group: { _id: "$ip", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get rule performance data
    const rulePerformance = await FirewallLog.aggregate([
      {
        $match: {
          timestamp: { $gte: threatsPeriod },
          action: { $in: ["blocked", "rate_limited"] },
          rule: { $ne: null },
        },
      },
      { $group: { _id: "$rule", triggers: { $sum: 1 } } },
      { $sort: { triggers: -1 } },
      { $limit: 10 },
      { $project: { name: "$_id", triggers: 1, _id: 0 } },
    ]);

    const stats = {
      rules: {
        total: totalRules,
        active: activeRules,
      },
      blockedIPs: {
        total: totalBlockedIPs,
        active: activeBlockedIPs,
        permanent: permanentBlocks,
      },
      requests: {
        attackPeriod: {
          total: logsAttackPeriod,
          blocked: blockedRequestsAttackPeriod,
          allowed: allowedRequestsAttackPeriod,
        },
        threatsPeriod: logsThreatsPeriod,
      },
    };

    // Prepare report data
    const reportData = {
      reportType: "Preview Report",
      frequency: frequency,
      attackSummaryLabel: attackSummaryLabel,
      threatsLabel: threatsLabel,
      stats,
      topBlockedCountries,
      topBlockedIPs,
      rulePerformance,
      includeAttackSummary: reportSettings?.includeAttackSummary ?? true,
      includeTopThreats: reportSettings?.includeTopThreats ?? true,
      includeTrafficStats: reportSettings?.includeTrafficStats ?? true,
      includeRulePerformance: reportSettings?.includeRulePerformance ?? true,
      includeCharts: reportSettings?.includeCharts ?? true,
    };

    // Send email to each recipient
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const email of emails) {
      try {
        console.log(`[Preview Report] Sending to ${email}...`);
        await sendFirewallReportEmail(email, reportData);
        results.push({ email, success: true });
        successCount++;
      } catch (error) {
        console.error(`[Preview Report] Failed to send to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Preview report sent to ${successCount} recipient(s)${
        errorCount > 0 ? ` (${errorCount} failed)` : ""
      }`,
      data: {
        totalEmails: emails.length,
        successCount,
        errorCount,
        results,
      },
    });
  } catch (error) {
    console.error("Error sending preview report:", error);
    res.status(500).json({
      success: false,
      message: "Error sending preview report",
    });
  }
});

// REMOVED: Get blocked IPs endpoint - now handled by /rules with source filter
// Use: GET /rules?source=manual&type=ip_block for manual IP blocks
// Use: GET /rules?source=rate_limit&type=ip_block for rate limit blocks

// Block IP manually (admin only) - Creates a FirewallRule
router.post("/blocked-ips", requireAdmin, async (req, res) => {
  try {
    console.log("=== Creating Manual IP Block Rule ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    // Check if req.body exists and is an object
    if (!req.body || typeof req.body !== "object") {
      console.log("Request body is missing or invalid");
      return res.status(400).json({
        success: false,
        message:
          "Request body is missing or invalid. Please ensure you're sending JSON data with Content-Type: application/json",
        received: {
          body: req.body,
          bodyType: typeof req.body,
          contentType: req.headers["content-type"],
        },
      });
    }

    const { ip, reason, permanent = false, expiresIn } = req.body;

    if (!ip || !reason) {
      return res.status(400).json({
        success: false,
        message: "IP address and reason are required",
      });
    }

    // Check if rule already exists for this IP
    const existingRule = await FirewallRule.findOne({
      type: "ip_block",
      value: ip,
      enabled: true,
    });

    if (existingRule) {
      return res.status(409).json({
        success: false,
        message: `A firewall rule already exists for IP ${ip}: ${existingRule.name}`,
        existingRule: {
          id: existingRule._id,
          name: existingRule.name,
          source: existingRule.source,
        },
      });
    }

    const geo = getGeoInfo(ip);
    const firewallRule = await FirewallRule.create({
      name: `Manual Block: ${ip}`,
      type: "ip_block",
      value: ip,
      action: "block",
      priority: 10, // High priority for manual blocks
      source: "manual",
      enabled: true,
      permanent: permanent,
      expiresAt: permanent
        ? null
        : expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null,
      attempts: 0,
      autoCreated: false,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      description: `Manual IP block: ${reason}`,
    });

    // Invalidate rule cache so new rule takes effect immediately
    invalidateRuleCache();

    res.status(201).json({
      success: true,
      message: "IP address blocked successfully (created as firewall rule)",
      data: {
        id: firewallRule._id,
        name: firewallRule.name,
        type: firewallRule.type,
        value: firewallRule.value,
        source: firewallRule.source,
        permanent: firewallRule.permanent,
        expiresAt: firewallRule.expiresAt,
        description: firewallRule.description,
      },
    });
  } catch (error) {
    console.error("Error creating IP block rule:", error);
    res.status(500).json({
      success: false,
      message: "Error creating IP block rule",
    });
  }
});

// REMOVED: Unblock IP and Unblock All endpoints
// Use the regular firewall rules endpoints instead:
// - DELETE /rules/:id to delete/disable a rule
// - PUT /rules/:id with enabled: false to disable a rule
// - PUT /rules (bulk update) to disable multiple rules

// Get firewall logs (admin only)
router.get("/logs", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action, ip, country } = req.query;
    const filter = {};

    if (action) filter.action = action;
    if (ip) filter.ip = ip;
    if (country) filter.country = country;

    const logs = await FirewallLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FirewallLog.countDocuments(filter);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting firewall logs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving firewall logs",
    });
  }
});

// Clear old logs (admin only)
router.delete("/logs", requireAdmin, async (req, res) => {
  try {
    const { olderThan = 30 } = req.query; // Default: older than 30 days
    const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1000);

    const result = await FirewallLog.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} log entries older than ${olderThan} days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing logs:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing logs",
    });
  }
});

// Auth check endpoint
router.get("/auth/check", (req, res) => {
  const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : false;
  const isAdmin = req.user && req.user.isAdmin ? req.user.isAdmin() : false;

  res.json({
    success: true,
    authenticated: isAuthenticated,
    isAdmin: isAdmin,
    user: req.user
      ? {
          email: req.user.email,
          role: req.user.role,
        }
      : null,
    sessionId: req.sessionID,
  });
});

// Debug endpoint for authentication
router.get("/debug/session", (req, res) => {
  res.json({
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user
      ? {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
          isAdmin: req.user.isAdmin(),
        }
      : null,
    session: req.session,
    cookies: req.headers.cookie,
    userAgent: req.headers["user-agent"],
  });
});

// Debug endpoint to check admin users in database
router.get("/debug/admins", async (req, res) => {
  try {
    const User = require("../../models/User");
    const adminUsers = await User.find({ role: "admin" }).select(
      "email role createdAt"
    );
    const allUsers = await User.find().select("email role createdAt");

    res.json({
      success: true,
      debug: {
        adminUsers,
        totalUsers: allUsers.length,
        allUsers: allUsers.map((u) => ({ email: u.email, role: u.role })),
        adminEmails: ["ralphdp21@gmail.com"], // from config
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get firewall settings (admin only)
router.get("/settings", requireAdmin, async (req, res) => {
  try {
    let settings = await FirewallSettings.findOne({ settingsId: "default" });

    if (!settings) {
      // Create default settings if they don't exist
      settings = new FirewallSettings({
        settingsId: "default",
        rateLimit: {
          perMinute: 120,
          perHour: 720,
        },
        progressiveDelays: [10, 60, 90, 120],
        analytics: {
          sparklineTimeRange: 30,
          updateFrequency: "periodic",
          periodicInterval: 300,
          enableSparklines: true,
          retentionDays: 90,
        },
        preferences: {
          autoRefresh: false,
          autoRefreshInterval: 30,
          defaultPageSize: 10,
          theme: "auto",
        },
      });
      await settings.save();
    }

    res.json({
      success: true,
      data: {
        rateLimit: settings.rateLimit,
        progressiveDelays: settings.progressiveDelays,
        adminRateLimit: settings.adminRateLimit,
        ruleCache: settings.ruleCache,
        trustedProxies: settings.trustedProxies,
        securityThresholds: settings.securityThresholds,
        adminSettings: settings.adminSettings,
        autoBlocking: settings.autoBlocking,
        metricsLimits: settings.metricsLimits,
        localNetworks: settings.localNetworks,
        responses: settings.responses,
        timeWindows: settings.timeWindows,
        rateLimitAdvanced: settings.rateLimitAdvanced || {
          bypassAdminUsers: true,
          bypassAuthenticatedUsers: false,
          whitelistedIPs: [],
          burstAllowance: 10,
          slidingWindow: true,
          gracefulDegradation: true,
        },
        cache: settings.cache || {
          enabled: true,
          ttl: 300,
          maxSize: 1000,
          strategy: "lru",
          cacheGeoData: true,
          cacheRuleMatches: true,
        },
        bulkOperations: settings.bulkOperations || {
          maxBatchSize: 100,
          batchTimeout: 30,
          concurrentOperations: 5,
          enableBulkDelete: true,
          enableBulkEdit: true,
        },
        requestLimits: settings.requestLimits || {
          maxHeaderSize: 8192,
          maxBodySize: 1048576,
          maxUrlLength: 2048,
          blockLargeRequests: true,
        },
        dataRetention: settings.dataRetention || {
          logRetentionDays: 90,
          metricsRetentionDays: 90,
          blockedIpRetentionDays: 30,
          autoCleanup: true,
          cleanupFrequency: "daily",
        },
        monitoring: settings.monitoring || {
          enableRealTimeAlerts: false,
          alertThreshold: 100,
          alertEmail: "",
          alertEmails: [],
          enablePerformanceMonitoring: false,
          logSlowQueries: false,
          slowQueryThreshold: 1000,
        },
        emailReports: settings.emailReports || {
          enabled: false,
          emails: [],
          frequency: "weekly",
          time: "09:00",
          includeAttackSummary: true,
          includeTopThreats: true,
          includeTrafficStats: true,
          includeRulePerformance: true,
          includeCharts: true,
        },
        ruleProcessing: settings.ruleProcessing || {
          parallelProcessing: true,
          maxConcurrentChecks: 10,
          priorityQueue: true,
          earlyExit: true,
          ruleOptimization: true,
          cacheCompiledRegex: true,
        },
        threatIntelligence: settings.threatIntelligence || {
          abuseIPDB: { apiKey: "", enabled: false },
          virusTotal: { apiKey: "", enabled: false },
          autoImportFeeds: false,
          feedUpdateInterval: 24,
        },
        analytics: settings.analytics || {
          sparklineTimeRange: 30,
          updateFrequency: "periodic",
          periodicInterval: 300,
          enableSparklines: true,
          retentionDays: 90,
        },
        preferences: settings.preferences || {
          autoRefresh: false,
          autoRefreshInterval: 30,
          defaultPageSize: 10,
          theme: "auto",
          compactMode: false,
          showAdvancedOptions: false,
          defaultSortColumn: "createdAt",
          defaultSortDirection: "desc",
          enableAnimations: true,
          showNotifications: true,
        },
      },
    });
  } catch (error) {
    console.error("Error getting firewall settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving firewall settings",
    });
  }
});

// Update firewall settings (admin only)
router.put("/settings", requireAdmin, async (req, res) => {
  try {
    const updatedSettings = await FirewallSettings.findOneAndUpdate(
      { settingsId: "default" },
      { $set: req.body, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    // Invalidate the settings cache so the middleware picks up the changes
    invalidateSettingsCache();

    res.json({
      success: true,
      message: "Firewall settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating firewall settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating firewall settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ===== THREAT INTELLIGENCE ENDPOINTS =====

// Check IP reputation using threat intelligence services
router.get("/threat-intel/check/:ip", requireAdmin, async (req, res) => {
  try {
    const { ip } = req.params;
    console.log(`[ThreatIntel] Checking reputation for IP: ${ip}`);

    const result = await threatIntel.queryAbuseIPDB(ip);

    res.json({
      success: true,
      data: result,
      message: result.error ? "Query failed" : "IP reputation check completed",
    });
  } catch (error) {
    console.error("Error checking IP reputation:", error);
    res.status(500).json({
      success: false,
      message: "Error checking IP reputation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Import threat feeds as firewall rules
router.post("/threat-intel/import", requireAdmin, async (req, res) => {
  try {
    console.log("[ThreatIntel] Starting threat feed import...");

    const result = await threatIntel.importThreatFeeds();

    // Invalidate rule cache after importing new rules
    if (result.success && result.imported > 0) {
      invalidateRuleCache();
    }

    const message = result.success
      ? `Successfully imported ${
          result.imported
        } threat intelligence rules from ${result.feeds?.length || 0} feeds`
      : `Failed to import threat feeds: ${result.error}`;

    res.json({
      success: result.success,
      message,
      data: {
        imported: result.imported || 0,
        errors: result.errors || 0,
        details: result.details || [],
        feeds: result.feeds || [],
        hint: result.hint,
      },
    });
  } catch (error) {
    console.error("Error importing threat feeds:", error);
    res.status(500).json({
      success: false,
      message: "Error importing threat feeds",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      hint: "Check network connectivity and ensure threat feed URLs are accessible",
    });
  }
});

// Get threat intelligence statistics and API usage
router.get("/threat-intel/stats", requireAdmin, async (req, res) => {
  try {
    const stats = await threatIntel.getStats();

    res.json({
      success: true,
      data: stats,
      message: "Threat intelligence statistics retrieved",
      limitations: {
        abuseIPDB: "Free tier: 1,000 queries/day. Upgrade for higher limits.",
        virusTotal: "Free tier: 4 requests/minute, 500/day. Consider paid API.",
        threatFeeds: "Spamhaus & Emerging Threats: Unlimited (public feeds)",
      },
    });
  } catch (error) {
    console.error("Error getting threat intel stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving threat intelligence statistics",
    });
  }
});

// Get traffic trends data for charts
router.get("/traffic-trends", requireAdmin, async (req, res) => {
  try {
    const { timeRange = "12h", granularity = "minute" } = req.query;

    // Calculate time range
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case "1min":
        startTime = new Date(now.getTime() - 60 * 1000);
        break;
      case "1h":
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "12h":
        startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "1w":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1m":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    }

    // Determine aggregation grouping based on granularity and time range
    let groupStage;

    switch (granularity) {
      case "second":
        groupStage = {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
              hour: { $hour: "$timestamp" },
              minute: { $minute: "$timestamp" },
              second: { $second: "$timestamp" },
            },
            total: { $sum: 1 },
            allowed: {
              $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] },
            },
            rateLimited: {
              $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
            },
            suspicious: {
              $sum: { $cond: [{ $eq: ["$action", "suspicious"] }, 1, 0] },
            },
            uniqueIPs: { $addToSet: "$ip" },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        };
        break;
      case "minute":
        groupStage = {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
              hour: { $hour: "$timestamp" },
              minute: { $minute: "$timestamp" },
            },
            total: { $sum: 1 },
            allowed: {
              $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] },
            },
            rateLimited: {
              $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
            },
            suspicious: {
              $sum: { $cond: [{ $eq: ["$action", "suspicious"] }, 1, 0] },
            },
            uniqueIPs: { $addToSet: "$ip" },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        };
        break;
      case "hour":
        groupStage = {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
              hour: { $hour: "$timestamp" },
            },
            total: { $sum: 1 },
            allowed: {
              $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] },
            },
            rateLimited: {
              $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
            },
            suspicious: {
              $sum: { $cond: [{ $eq: ["$action", "suspicious"] }, 1, 0] },
            },
            uniqueIPs: { $addToSet: "$ip" },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        };
        break;
      case "day":
        groupStage = {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
            },
            total: { $sum: 1 },
            allowed: {
              $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] },
            },
            rateLimited: {
              $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
            },
            suspicious: {
              $sum: { $cond: [{ $eq: ["$action", "suspicious"] }, 1, 0] },
            },
            uniqueIPs: { $addToSet: "$ip" },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        };
        break;
      case "week":
        groupStage = {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              week: { $week: "$timestamp" },
            },
            total: { $sum: 1 },
            allowed: {
              $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] },
            },
            rateLimited: {
              $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
            },
            suspicious: {
              $sum: { $cond: [{ $eq: ["$action", "suspicious"] }, 1, 0] },
            },
            uniqueIPs: { $addToSet: "$ip" },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        };
        break;
      case "month":
        groupStage = {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
            },
            total: { $sum: 1 },
            allowed: {
              $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] },
            },
            rateLimited: {
              $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
            },
            suspicious: {
              $sum: { $cond: [{ $eq: ["$action", "suspicious"] }, 1, 0] },
            },
            uniqueIPs: { $addToSet: "$ip" },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        };
        break;
      default:
        // Default to hour-based aggregation
        groupStage = {
          $group: {
            _id: {
              year: { $year: "$timestamp" },
              month: { $month: "$timestamp" },
              day: { $dayOfMonth: "$timestamp" },
              hour: { $hour: "$timestamp" },
            },
            total: { $sum: 1 },
            allowed: {
              $sum: { $cond: [{ $eq: ["$action", "allowed"] }, 1, 0] },
            },
            blocked: {
              $sum: { $cond: [{ $eq: ["$action", "blocked"] }, 1, 0] },
            },
            rateLimited: {
              $sum: { $cond: [{ $eq: ["$action", "rate_limited"] }, 1, 0] },
            },
            suspicious: {
              $sum: { $cond: [{ $eq: ["$action", "suspicious"] }, 1, 0] },
            },
            uniqueIPs: { $addToSet: "$ip" },
            uniqueSessions: { $addToSet: "$sessionId" },
          },
        };
    }

    const pipeline = [
      { $match: { timestamp: { $gte: startTime } } },
      groupStage,
      {
        $project: {
          _id: 1,
          total: 1,
          allowed: 1,
          blocked: 1,
          rateLimited: 1,
          suspicious: 1,
          uniqueIPCount: { $size: { $ifNull: ["$uniqueIPs", []] } },
          uniqueSessionCount: { $size: { $ifNull: ["$uniqueSessions", []] } },
        },
      },
      {
        $sort: (() => {
          switch (granularity) {
            case "second":
              return {
                "_id.year": 1,
                "_id.month": 1,
                "_id.day": 1,
                "_id.hour": 1,
                "_id.minute": 1,
                "_id.second": 1,
              };
            case "minute":
              return {
                "_id.year": 1,
                "_id.month": 1,
                "_id.day": 1,
                "_id.hour": 1,
                "_id.minute": 1,
              };
            case "hour":
              return {
                "_id.year": 1,
                "_id.month": 1,
                "_id.day": 1,
                "_id.hour": 1,
              };
            case "day":
              return {
                "_id.year": 1,
                "_id.month": 1,
                "_id.day": 1,
              };
            case "week":
              return {
                "_id.year": 1,
                "_id.week": 1,
              };
            case "month":
              return {
                "_id.year": 1,
                "_id.month": 1,
              };
            default:
              return {
                "_id.year": 1,
                "_id.month": 1,
                "_id.day": 1,
                "_id.hour": 1,
              };
          }
        })(),
      },
    ];

    const results = await FirewallLog.aggregate(pipeline);

    // Transform results into chart-friendly format
    const chartData = results.map((item) => {
      let timestamp;

      switch (granularity) {
        case "second":
          timestamp = new Date(
            item._id.year,
            item._id.month - 1,
            item._id.day,
            item._id.hour,
            item._id.minute,
            item._id.second
          );
          break;
        case "minute":
          timestamp = new Date(
            item._id.year,
            item._id.month - 1,
            item._id.day,
            item._id.hour,
            item._id.minute
          );
          break;
        case "hour":
          timestamp = new Date(
            item._id.year,
            item._id.month - 1,
            item._id.day,
            item._id.hour
          );
          break;
        case "day":
          timestamp = new Date(item._id.year, item._id.month - 1, item._id.day);
          break;
        case "week":
          // For weekly data, create timestamp for start of week
          // MongoDB $week returns week number (0-53)
          const jan1 = new Date(item._id.year, 0, 1);
          const weekStart = new Date(
            jan1.getTime() + item._id.week * 7 * 24 * 60 * 60 * 1000
          );
          timestamp = weekStart;
          break;
        case "month":
          timestamp = new Date(item._id.year, item._id.month - 1, 1);
          break;
        default:
          timestamp = new Date(
            item._id.year,
            item._id.month - 1,
            item._id.day,
            item._id.hour
          );
      }

      return {
        timestamp: timestamp.toISOString(),
        time: timestamp.getTime(),
        total: item.total,
        allowed: item.allowed,
        blocked: item.blocked,
        rateLimited: item.rateLimited,
        suspicious: item.suspicious,
        uniqueIPs: item.uniqueIPCount,
        uniqueSessions: item.uniqueSessionCount,
      };
    });

    // Fill in missing time slots with zero values
    const filledData = fillMissingTimeSlots(
      chartData,
      startTime,
      now,
      granularity
    );

    res.json({
      success: true,
      data: {
        timeRange,
        granularity,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        dataPoints: filledData.length,
        chartData: filledData,
      },
    });
  } catch (error) {
    console.error("Error fetching traffic trends:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching traffic trends data",
    });
  }
});

// Helper function to fill missing time slots
function fillMissingTimeSlots(data, startTime, endTime, granularity) {
  const filled = [];
  const dataMap = new Map();

  // Create a map of existing data points
  data.forEach((point) => {
    dataMap.set(point.time, point);
  });

  // Calculate increment based on granularity
  let increment;
  switch (granularity) {
    case "second":
      increment = 1000; // 1 second
      break;
    case "minute":
      increment = 60 * 1000; // 1 minute
      break;
    case "hour":
      increment = 60 * 60 * 1000; // 1 hour
      break;
    case "day":
      increment = 24 * 60 * 60 * 1000; // 1 day
      break;
    case "week":
      increment = 7 * 24 * 60 * 60 * 1000; // 1 week
      break;
    case "month":
      increment = 30 * 24 * 60 * 60 * 1000; // Approximate 1 month (30 days)
      break;
    default:
      increment = 60 * 60 * 1000; // Default to 1 hour
  }

  // Fill all time slots from start to end
  let currentTime = new Date(startTime);

  // Round down to appropriate granularity
  switch (granularity) {
    case "second":
      currentTime.setMilliseconds(0);
      break;
    case "minute":
      currentTime.setSeconds(0, 0);
      break;
    case "hour":
      currentTime.setMinutes(0, 0, 0);
      break;
    case "day":
      currentTime.setHours(0, 0, 0, 0);
      break;
    case "week":
      // Round down to start of week (Sunday)
      const dayOfWeek = currentTime.getDay();
      currentTime.setDate(currentTime.getDate() - dayOfWeek);
      currentTime.setHours(0, 0, 0, 0);
      break;
    case "month":
      // Round down to start of month
      currentTime.setDate(1);
      currentTime.setHours(0, 0, 0, 0);
      break;
    default:
      currentTime.setMinutes(0, 0, 0);
  }

  while (currentTime <= endTime) {
    const timeKey = currentTime.getTime();

    if (dataMap.has(timeKey)) {
      filled.push(dataMap.get(timeKey));
    } else {
      // Fill with zero values
      filled.push({
        timestamp: currentTime.toISOString(),
        time: timeKey,
        total: 0,
        allowed: 0,
        blocked: 0,
        rateLimited: 0,
        suspicious: 0,
        uniqueIPs: 0,
        uniqueSessions: 0,
      });
    }

    // Handle month increment differently to account for varying month lengths
    if (granularity === "month") {
      currentTime.setMonth(currentTime.getMonth() + 1);
    } else {
      currentTime = new Date(currentTime.getTime() + increment);
    }
  }

  return filled;
}

module.exports = {
  router,
  addCommonFirewallRules,
};
