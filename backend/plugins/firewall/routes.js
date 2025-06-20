const express = require("express");
const router = express.Router();
const { FirewallRule, FirewallLog, BlockedIp, RateLimit } = require("./models");
const { requireAdmin, getGeoInfo } = require("./middleware");

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
      permanentBlocks,
      logsLast24h,
      logsLast7d,
      blockedRequestsLast24h,
      allowedRequestsLast24h,
    ] = await Promise.all([
      FirewallRule.countDocuments(),
      FirewallRule.countDocuments({ enabled: true }),
      BlockedIp.countDocuments(),
      BlockedIp.countDocuments({ permanent: true }),
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

    res.json({
      success: true,
      data: {
        rules: {
          total: totalRules,
          active: activeRules,
        },
        blockedIPs: {
          total: totalBlockedIPs,
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
      },
    });
  } catch (error) {
    console.error("Error getting firewall stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving firewall statistics",
    });
  }
});

// Get firewall rules (admin only)
router.get("/rules", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, enabled } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (enabled !== undefined) filter.enabled = enabled === "true";

    const rules = await FirewallRule.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await FirewallRule.countDocuments(filter);

    res.json({
      success: true,
      data: rules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
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
    const { name, type, value, action, enabled, priority, description } =
      req.body;

    if (!name || !type || !value) {
      return res.status(400).json({
        success: false,
        message: "Name, type, and value are required",
      });
    }

    const rule = new FirewallRule({
      name,
      type,
      value,
      action: action || "block",
      enabled: enabled !== false,
      priority: priority || 100,
      description,
    });

    await rule.save();

    res.status(201).json({
      success: true,
      message: "Firewall rule created successfully",
      data: rule,
    });
  } catch (error) {
    console.error("Error creating firewall rule:", error);
    res.status(500).json({
      success: false,
      message: "Error creating firewall rule",
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
    const { id } = req.params;
    const rule = await FirewallRule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        message: "Firewall rule not found",
      });
    }

    res.json({
      success: true,
      message: "Firewall rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting firewall rule:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting firewall rule",
    });
  }
});

// Get blocked IPs (admin only)
router.get("/blocked-ips", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, permanent } = req.query;
    const filter = {};

    if (permanent !== undefined) filter.permanent = permanent === "true";

    const blockedIPs = await BlockedIp.find(filter)
      .sort({ blockedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BlockedIp.countDocuments(filter);

    res.json({
      success: true,
      data: blockedIPs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting blocked IPs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving blocked IPs",
    });
  }
});

// Block IP manually (admin only)
router.post("/blocked-ips", requireAdmin, async (req, res) => {
  try {
    const { ip, reason, permanent = false, expiresIn } = req.body;

    if (!ip || !reason) {
      return res.status(400).json({
        success: false,
        message: "IP address and reason are required",
      });
    }

    const geo = getGeoInfo(ip);
    const blockedIp = new BlockedIp({
      ip,
      reason,
      permanent,
      expiresAt: permanent
        ? null
        : expiresIn
        ? new Date(Date.now() + expiresIn * 1000)
        : null,
      country: geo.country,
      region: geo.region,
      city: geo.city,
    });

    await blockedIp.save();

    res.status(201).json({
      success: true,
      message: "IP address blocked successfully",
      data: blockedIp,
    });
  } catch (error) {
    console.error("Error blocking IP:", error);
    res.status(500).json({
      success: false,
      message: "Error blocking IP address",
    });
  }
});

// Unblock IP (admin only)
router.delete("/blocked-ips/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const blockedIp = await BlockedIp.findByIdAndDelete(id);

    if (!blockedIp) {
      return res.status(404).json({
        success: false,
        message: "Blocked IP not found",
      });
    }

    res.json({
      success: true,
      message: "IP address unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking IP:", error);
    res.status(500).json({
      success: false,
      message: "Error unblocking IP address",
    });
  }
});

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
    // For now, return default settings - in a real app you'd store these in DB
    const defaultSettings = {
      rateLimit: {
        perMinute: 50,
        perHour: 400,
      },
      progressiveDelays: [10, 60, 90, 120], // in seconds
      features: {
        ipBlocking: true,
        countryBlocking: true,
        rateLimiting: true,
        suspiciousPatterns: true,
      },
    };

    res.json({
      success: true,
      data: defaultSettings,
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
    const { rateLimit, progressiveDelays, features } = req.body;

    // Validate settings
    if (rateLimit) {
      if (rateLimit.perMinute < 1 || rateLimit.perMinute > 1000) {
        return res.status(400).json({
          success: false,
          message: "Rate limit per minute must be between 1 and 1000",
        });
      }
      if (rateLimit.perHour < 1 || rateLimit.perHour > 10000) {
        return res.status(400).json({
          success: false,
          message: "Rate limit per hour must be between 1 and 10000",
        });
      }
    }

    if (progressiveDelays) {
      if (!Array.isArray(progressiveDelays) || progressiveDelays.length !== 4) {
        return res.status(400).json({
          success: false,
          message: "Progressive delays must be an array of 4 values",
        });
      }
      for (const delay of progressiveDelays) {
        if (delay < 1 || delay > 3600) {
          return res.status(400).json({
            success: false,
            message: "Progressive delays must be between 1 and 3600 seconds",
          });
        }
      }
    }

    // In a real app, you would save these settings to database
    // For now, just return success
    console.log("Firewall settings updated:", req.body);

    res.json({
      success: true,
      message: "Firewall settings updated successfully",
      data: req.body,
    });
  } catch (error) {
    console.error("Error updating firewall settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating firewall settings",
    });
  }
});

module.exports = router;
