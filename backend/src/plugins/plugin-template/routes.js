const express = require("express");
const router = express.Router();
const { STATIC_CONFIG } = require("./config");
const {
  PluginTemplateSettings,
  PluginTemplateData,
  PluginTemplateLog,
  PluginTemplateConfig,
} = require("./models");
const {
  requireAdmin,
  logActivity,
  requestLogger,
  validateFeature,
  errorHandler,
  getCachedSettings,
  invalidateSettingsCache,
} = require("./middleware");

// Apply request logging to all routes
router.use(requestLogger);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Plugin Template is active",
    version: "1.0.0",
    features: [
      "Template structure for new plugins",
      "Basic admin interface",
      "Database models example",
      "API routes example",
      "Middleware example",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Plugin Template is working correctly",
    timestamp: new Date().toISOString(),
  });
});

// Get plugin info (public endpoint)
router.get("/info", async (req, res) => {
  try {
    const settings = await getCachedSettings();

    res.json({
      success: true,
      data: {
        name: STATIC_CONFIG.name,
        version: STATIC_CONFIG.version,
        description: settings.general.description,
        enabled: settings.general.enabled,
        features: Object.keys(settings.features).filter(
          (key) => settings.features[key]
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting plugin info:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving plugin information",
    });
  }
});

// Get dynamic configuration (admin only)
router.get("/config", requireAdmin, async (req, res) => {
  try {
    let config = await PluginTemplateConfig.findOne({
      pluginId: STATIC_CONFIG.pluginId,
    });

    // If no config exists, create default one
    if (!config) {
      config = new PluginTemplateConfig({
        pluginId: STATIC_CONFIG.pluginId,
      });
      await config.save();
    }

    res.json({
      success: true,
      data: {
        static: STATIC_CONFIG,
        dynamic: config,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting config:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving configuration",
    });
  }
});

// Get dashboard statistics (admin only)
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const settings = await getCachedSettings();

    // Get basic statistics
    const totalData = await PluginTemplateData.countDocuments();
    const totalLogs = await PluginTemplateLog.countDocuments();
    const recentLogs = await PluginTemplateLog.countDocuments({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.json({
      success: true,
      data: {
        overview: {
          enabled: settings.general.enabled,
          totalDataEntries: totalData,
          totalLogs: totalLogs,
          recentActivity: recentLogs,
          uptime: process.uptime(),
        },
        features: settings.features,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving statistics",
    });
  }
});

// Get settings (admin only)
router.get("/settings", requireAdmin, async (req, res) => {
  try {
    let settings = await PluginTemplateSettings.findOne({
      settingsId: "default",
    });

    if (!settings) {
      settings = new PluginTemplateSettings({ settingsId: "default" });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving settings",
    });
  }
});

// Update settings (admin only)
router.put("/settings", requireAdmin, async (req, res) => {
  try {
    let settings = await PluginTemplateSettings.findOne({
      settingsId: "default",
    });

    if (!settings) {
      settings = new PluginTemplateSettings({ settingsId: "default" });
    }

    // Deep merge the settings
    function deepMerge(target, source) {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }

    deepMerge(settings, req.body);
    settings.updatedAt = new Date();

    await settings.save();

    // Invalidate cache
    invalidateSettingsCache();

    // Log the settings update
    await logActivity("info", "Plugin Template settings updated", {
      updatedBy: req.user.email,
      changes: req.body,
    });

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating settings",
    });
  }
});

// Reset settings to defaults (admin only)
router.post("/settings/reset", requireAdmin, async (req, res) => {
  try {
    // Delete existing settings
    await PluginTemplateSettings.deleteOne({ settingsId: "default" });

    // Create new settings with defaults
    const defaultSettings = new PluginTemplateSettings({
      settingsId: "default",
    });
    await defaultSettings.save();

    // Invalidate cache
    invalidateSettingsCache();

    // Log the reset
    await logActivity("info", "Plugin Template settings reset to defaults", {
      resetBy: req.user.email,
    });

    res.json({
      success: true,
      message: "Settings reset to defaults successfully",
      data: defaultSettings,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting settings",
    });
  }
});

// Get data entries (admin only)
router.get("/data", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const data = await PluginTemplateData.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PluginTemplateData.countDocuments(filter);

    res.json({
      success: true,
      data: data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting data:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving data",
    });
  }
});

// Create data entry (admin only)
router.post(
  "/data",
  requireAdmin,
  validateFeature("exampleFeature"),
  async (req, res) => {
    try {
      const { name, value, type, description } = req.body;

      if (!name || value === undefined) {
        return res.status(400).json({
          success: false,
          message: "Name and value are required",
        });
      }

      const dataEntry = new PluginTemplateData({
        name,
        value,
        type: type || "string",
        description: description || "",
      });

      await dataEntry.save();

      // Log the creation
      await logActivity("info", `Data entry created: ${name}`, {
        createdBy: req.user.email,
        dataId: dataEntry._id,
        type: dataEntry.type,
      });

      res.status(201).json({
        success: true,
        message: "Data entry created successfully",
        data: dataEntry,
      });
    } catch (error) {
      console.error("Error creating data entry:", error);
      res.status(500).json({
        success: false,
        message: "Error creating data entry",
      });
    }
  }
);

// Get logs (admin only)
router.get("/logs", requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, level } = req.query;
    const filter = {};

    if (level) filter.level = level;

    const logs = await PluginTemplateLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PluginTemplateLog.countDocuments(filter);

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
    console.error("Error getting logs:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving logs",
    });
  }
});

// Clear logs (admin only)
router.delete("/logs", requireAdmin, async (req, res) => {
  try {
    const { olderThan } = req.query;
    const filter = {};

    if (olderThan) {
      const cutoffDate = new Date(
        Date.now() - parseInt(olderThan) * 24 * 60 * 60 * 1000
      );
      filter.timestamp = { $lt: cutoffDate };
    }

    const result = await PluginTemplateLog.deleteMany(filter);

    // Log the cleanup
    await logActivity("info", `Logs cleared: ${result.deletedCount} entries`, {
      clearedBy: req.user.email,
      filter: olderThan ? `Older than ${olderThan} days` : "All logs",
    });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} log entries`,
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

// Example feature endpoint (admin only, feature-gated)
router.post(
  "/example-action",
  requireAdmin,
  validateFeature("exampleFeature"),
  async (req, res) => {
    try {
      const { action, data } = req.body;

      // Log the action
      await logActivity("info", `Example action performed: ${action}`, {
        performedBy: req.user.email,
        actionData: data,
      });

      res.json({
        success: true,
        message: `Example action '${action}' performed successfully`,
        result: {
          action,
          timestamp: new Date().toISOString(),
          performedBy: req.user.email,
          data,
        },
      });
    } catch (error) {
      console.error("Error performing example action:", error);
      res.status(500).json({
        success: false,
        message: "Error performing example action",
      });
    }
  }
);

// Update dynamic configuration (admin only)
router.put("/config", requireAdmin, async (req, res) => {
  try {
    let config = await PluginTemplateConfig.findOne({
      pluginId: STATIC_CONFIG.pluginId,
    });

    if (!config) {
      config = new PluginTemplateConfig({
        pluginId: STATIC_CONFIG.pluginId,
      });
    }

    // Deep merge the config updates
    function deepMerge(target, source) {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }

    // Only allow updating dynamic config sections
    const allowedSections = ["ui", "features", "adminPanel"];
    const updates = {};

    allowedSections.forEach((section) => {
      if (req.body[section]) {
        updates[section] = req.body[section];
      }
    });

    deepMerge(config, updates);
    config.updatedAt = new Date();
    config.updatedBy = req.user.email;

    await config.save();

    // Log the config update
    await logActivity("info", "Plugin Template configuration updated", {
      updatedBy: req.user.email,
      sections: Object.keys(updates),
      changes: updates,
    });

    res.json({
      success: true,
      message: "Configuration updated successfully",
      data: config,
    });
  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({
      success: false,
      message: "Error updating configuration",
    });
  }
});

// Reset dynamic configuration to defaults (admin only)
router.post("/config/reset", requireAdmin, async (req, res) => {
  try {
    // Delete existing config
    await PluginTemplateConfig.deleteOne({
      pluginId: STATIC_CONFIG.pluginId,
    });

    // Create new config with defaults
    const defaultConfig = new PluginTemplateConfig({
      pluginId: STATIC_CONFIG.pluginId,
      updatedBy: req.user.email,
    });
    await defaultConfig.save();

    // Log the reset
    await logActivity(
      "info",
      "Plugin Template configuration reset to defaults",
      {
        resetBy: req.user.email,
      }
    );

    res.json({
      success: true,
      message: "Configuration reset to defaults successfully",
      data: defaultConfig,
    });
  } catch (error) {
    console.error("Error resetting config:", error);
    res.status(500).json({
      success: false,
      message: "Error resetting configuration",
    });
  }
});

// Apply error handler to all routes
router.use(errorHandler);

module.exports = router;
