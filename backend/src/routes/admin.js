const express = require("express");
const router = express.Router();
const PluginRegistry = require("../models/PluginRegistry");
const PluginActivity = require("../models/PluginActivity");
const CoreSettings = require("../models/CoreSettings");

// Generic admin middleware
const createAdminMiddleware = () => {
  return (req, res, next) => {
    if (!req.user || !req.user.isAdmin || !req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    next();
  };
};

const requireAdmin = createAdminMiddleware();

// Root admin endpoint - provides basic admin info
router.get("/", requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Admin dashboard access granted",
      user: {
        email: req.user.email,
        role: req.user.role,
        name: req.user.name,
      },
      availablePlugins: Object.keys(req.app.plugins || {}),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting admin info:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving admin information",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ===== ACTIVITY MONITORING =====

// Get recent activity with filtering
router.get("/activity", requireAdmin, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      type,
      pluginName,
      status,
      severity,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build filter query
    const filters = {};

    if (type) filters.type = type;
    if (pluginName) filters.pluginName = pluginName;
    if (status) filters.status = status;
    if (severity) filters.severity = severity;
    if (search) {
      filters.$or = [
        { action: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { pluginName: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.$gte = new Date(startDate);
      if (endDate) filters.timestamp.$lte = new Date(endDate);
    }

    // Get activities with pagination
    const activities = await PluginActivity.find(filters)
      .populate("userId", "email role name")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Get total count for pagination
    const total = await PluginActivity.countDocuments(filters);

    // Get summary statistics
    const stats = await PluginActivity.aggregate([
      { $match: filters },
      {
        $group: {
          _id: {
            type: "$type",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        activities: activities.map((activity) => activity.toSummary()),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit),
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Error getting activity:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get activity statistics and analytics
router.get("/activity/stats", requireAdmin, async (req, res) => {
  try {
    const { days = 7, pluginName } = req.query;

    const startDate = new Date(
      Date.now() - parseInt(days) * 24 * 60 * 60 * 1000
    );

    // Activity by type over time
    const activityTrends = await PluginActivity.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          ...(pluginName && { pluginName }),
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    // Security events
    const securityEvents = await PluginActivity.getSecurityEvents(
      parseInt(days)
    );

    // Plugin performance metrics
    const performanceData = {};
    if (pluginName) {
      performanceData[pluginName] = await PluginActivity.getPerformanceMetrics(
        pluginName,
        parseInt(days)
      );
    } else {
      const activePlugins = await PluginRegistry.getActivePlugins();
      for (const plugin of activePlugins) {
        performanceData[plugin.name] =
          await PluginActivity.getPerformanceMetrics(
            plugin.name,
            parseInt(days)
          );
      }
    }

    // Most active plugins
    const pluginActivity = await PluginActivity.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$pluginName",
          totalActivity: { $sum: 1 },
          errorCount: {
            $sum: { $cond: [{ $eq: ["$status", "failure"] }, 1, 0] },
          },
          lastActivity: { $max: "$timestamp" },
        },
      },
      { $sort: { totalActivity: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        trends: activityTrends,
        security: securityEvents.map((event) => event.toSummary()),
        performance: performanceData,
        pluginActivity,
      },
    });
  } catch (error) {
    console.error("Error getting activity stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get specific activity details
router.get("/activity/:id", requireAdmin, async (req, res) => {
  try {
    const activity = await PluginActivity.findById(req.params.id).populate(
      "userId",
      "email role name createdAt"
    );

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Error getting activity details:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving activity details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ===== PLUGIN MANAGEMENT =====

// Get all plugins with detailed info
router.get("/plugins", requireAdmin, async (req, res) => {
  try {
    const plugins = await PluginRegistry.find({}).sort({
      loadPriority: 1,
      name: 1,
    });

    const pluginsWithStats = await Promise.all(
      plugins.map(async (plugin) => {
        // Get recent activity stats
        const recentStats = await PluginActivity.getActivityStats(
          plugin.name,
          7
        );

        return {
          ...plugin.toObject(),
          recentActivity: recentStats,
        };
      })
    );

    res.json({
      success: true,
      data: pluginsWithStats,
    });
  } catch (error) {
    console.error("Error getting plugins:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving plugins",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get specific plugin details
router.get("/plugins/:name", requireAdmin, async (req, res) => {
  try {
    const plugin = await PluginRegistry.findOne({ name: req.params.name });

    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: "Plugin not found",
      });
    }

    // Get detailed activity for this plugin
    const recentActivity = await PluginActivity.getRecentActivity(20, {
      pluginName: req.params.name,
    });

    // Get performance metrics
    const performance = await PluginActivity.getPerformanceMetrics(
      req.params.name,
      7
    );

    res.json({
      success: true,
      data: {
        ...plugin.toObject(),
        recentActivity: recentActivity.map((activity) => activity.toSummary()),
        performance: performance[0] || null,
      },
    });
  } catch (error) {
    console.error("Error getting plugin details:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving plugin details",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Hot-reload plugin
router.post("/plugins/:name/reload", requireAdmin, async (req, res) => {
  try {
    const pluginName = req.params.name;

    // Get the hot load manager from app
    const hotLoadManager = req.app.hotLoadManager;
    if (!hotLoadManager) {
      return res.status(500).json({
        success: false,
        message: "Hot load manager not available",
      });
    }

    // Reload the plugin
    await hotLoadManager.reloadPlugin(pluginName);

    // Log admin action
    await PluginActivity.logActivity({
      type: "admin_action",
      pluginName,
      action: "Plugin hot-reloaded by admin",
      status: "success",
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Plugin ${pluginName} reloaded successfully`,
    });
  } catch (error) {
    console.error("Error reloading plugin:", error);

    // Log failure
    await PluginActivity.logActivity({
      type: "admin_action",
      pluginName: req.params.name,
      action: "Plugin reload failed",
      status: "failure",
      error: {
        message: error.message,
        stack: error.stack,
      },
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.status(500).json({
      success: false,
      message: "Error reloading plugin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Enable/disable plugin
router.post("/plugins/:name/toggle", requireAdmin, async (req, res) => {
  try {
    const pluginName = req.params.name;
    const { enabled } = req.body;

    const plugin = await PluginRegistry.findOne({ name: pluginName });
    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: "Plugin not found",
      });
    }

    // Update plugin state
    plugin.enabled = enabled;
    plugin.state = enabled ? "loading" : "disabled";
    plugin.updatedBy = req.user._id;
    await plugin.save();

    // Use hot load manager to load/unload
    const hotLoadManager = req.app.hotLoadManager;
    if (hotLoadManager) {
      if (enabled) {
        await hotLoadManager.loadPlugin(pluginName);
      } else {
        await hotLoadManager.unloadPlugin(pluginName);
      }
    }

    // Log admin action
    await PluginActivity.logActivity({
      type: enabled ? "plugin_enabled" : "plugin_disabled",
      pluginName,
      action: `Plugin ${enabled ? "enabled" : "disabled"} by admin`,
      status: "success",
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Plugin ${pluginName} ${
        enabled ? "enabled" : "disabled"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling plugin:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling plugin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update plugin configuration
router.put("/plugins/:name/config", requireAdmin, async (req, res) => {
  try {
    const pluginName = req.params.name;
    const { config } = req.body;

    const plugin = await PluginRegistry.findOne({ name: pluginName });
    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: "Plugin not found",
      });
    }

    // Update configuration
    plugin.config = { ...plugin.config, ...config };
    plugin.updatedBy = req.user._id;
    await plugin.save();

    // Log admin action
    await PluginActivity.logActivity({
      type: "configuration_changed",
      pluginName,
      action: "Plugin configuration updated",
      status: "success",
      details: { configChanges: config },
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Plugin configuration updated successfully",
      data: plugin,
    });
  } catch (error) {
    console.error("Error updating plugin config:", error);
    res.status(500).json({
      success: false,
      message: "Error updating plugin configuration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Update plugin permissions
router.put("/plugins/:name/permissions", requireAdmin, async (req, res) => {
  try {
    const pluginName = req.params.name;
    const { permissions } = req.body;

    const plugin = await PluginRegistry.findOne({ name: pluginName });
    if (!plugin) {
      return res.status(404).json({
        success: false,
        message: "Plugin not found",
      });
    }

    // Update permissions
    plugin.permissions = { ...plugin.permissions, ...permissions };
    plugin.updatedBy = req.user._id;
    await plugin.save();

    // Log security action
    await PluginActivity.logActivity({
      type: "permission_granted",
      pluginName,
      action: "Plugin permissions updated",
      status: "success",
      severity: "high",
      details: { permissionChanges: permissions },
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Plugin permissions updated successfully",
      data: plugin,
    });
  } catch (error) {
    console.error("Error updating plugin permissions:", error);
    res.status(500).json({
      success: false,
      message: "Error updating plugin permissions",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ===== SYSTEM MONITORING =====

// Get system health overview
router.get("/system/health", requireAdmin, async (req, res) => {
  try {
    const activePlugins = await PluginRegistry.getActivePlugins();
    const healthyPlugins = await PluginRegistry.getHealthyPlugins();

    const recentErrors = await PluginActivity.find({
      status: "failure",
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ timestamp: -1 })
      .limit(10);

    const securityEvents = await PluginActivity.getSecurityEvents(1);

    res.json({
      success: true,
      data: {
        plugins: {
          total: activePlugins.length,
          healthy: healthyPlugins.length,
          issues: activePlugins.length - healthyPlugins.length,
        },
        errors: recentErrors.map((error) => error.toSummary()),
        security: securityEvents.map((event) => event.toSummary()),
        systemStatus: "healthy", // This could be calculated based on various metrics
      },
    });
  } catch (error) {
    console.error("Error getting system health:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving system health",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Clear old activity logs
router.delete("/activity/cleanup", requireAdmin, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoffDate = new Date(
      Date.now() - parseInt(days) * 24 * 60 * 60 * 1000
    );

    const result = await PluginActivity.deleteMany({
      timestamp: { $lt: cutoffDate },
    });

    // Log cleanup action
    await PluginActivity.logActivity({
      type: "admin_action",
      pluginName: "system",
      action: `Activity cleanup: removed ${result.deletedCount} old records`,
      status: "success",
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old activity records`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up activity:", error);
    res.status(500).json({
      success: false,
      message: "Error cleaning up activity logs",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ===== CORE SYSTEM SETTINGS =====

// Get core system settings
router.get("/settings", requireAdmin, async (req, res) => {
  try {
    let settings = await CoreSettings.findOne({ settingsId: "default" });

    if (!settings) {
      settings = new CoreSettings({ settingsId: "default" });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting core settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving core settings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Update core system settings
router.put("/settings", requireAdmin, async (req, res) => {
  try {
    let settings = await CoreSettings.findOne({ settingsId: "default" });

    if (!settings) {
      settings = new CoreSettings({ settingsId: "default" });
    }

    // Update settings with provided data
    Object.keys(req.body).forEach((key) => {
      if (key !== "settingsId") {
        settings[key] = { ...settings[key], ...req.body[key] };
      }
    });

    settings.updatedBy = req.user.email;
    await settings.save();

    // Log settings change
    await PluginActivity.logActivity({
      type: "configuration_changed",
      pluginName: "core",
      action: "Core system settings updated",
      status: "success",
      details: { settingsUpdated: Object.keys(req.body) },
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Core settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating core settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating core settings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Get logging settings specifically
router.get("/settings/logging", requireAdmin, async (req, res) => {
  try {
    let settings = await CoreSettings.findOne({ settingsId: "default" });

    if (!settings) {
      settings = new CoreSettings({ settingsId: "default" });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings.logging,
      currentEnvironment: process.env.NODE_ENV,
      recommendations: {
        production: {
          debugMode: false,
          productionSafeMode: true,
          enableConsoleLogging: false,
          developmentOverride: false,
          logLevel: "warn",
        },
        development: {
          debugMode: true,
          productionSafeMode: false,
          enableConsoleLogging: true,
          developmentOverride: false,
          logLevel: "debug",
        },
      },
    });
  } catch (error) {
    console.error("Error getting logging settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving logging settings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Update logging settings specifically
router.put("/settings/logging", requireAdmin, async (req, res) => {
  try {
    let settings = await CoreSettings.findOne({ settingsId: "default" });

    if (!settings) {
      settings = new CoreSettings({ settingsId: "default" });
    }

    // Update only logging settings
    settings.logging = { ...settings.logging, ...req.body };
    settings.updatedBy = req.user.email;
    await settings.save();

    // Log this security-sensitive change
    await PluginActivity.logActivity({
      type: "configuration_changed",
      pluginName: "core",
      action: "Logging settings updated",
      status: "success",
      severity: "medium",
      details: {
        loggingChanges: req.body,
        environment: process.env.NODE_ENV,
        changedBy: req.user.email,
      },
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: "Logging settings updated successfully",
      data: settings.logging,
      warning:
        process.env.NODE_ENV === "production" && req.body.enableConsoleLogging
          ? "Warning: Console logging enabled in production environment"
          : null,
    });
  } catch (error) {
    console.error("Error updating logging settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating logging settings",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

module.exports = router;
