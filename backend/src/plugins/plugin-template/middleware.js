const { PluginTemplateSettings, PluginTemplateLog } = require("./models");

// Settings cache to avoid database hits
class SettingsCache {
  constructor() {
    this.settings = null;
    this.lastUpdate = 0;
    this.ttl = 300000; // 5 minutes
    this.isLoading = false;
    this.defaults = {
      general: {
        enabled: false,
        title: "Plugin Template",
        description: "A template plugin for creating new plugins",
      },
      features: {
        exampleFeature: true,
        debugMode: false,
      },
    };
  }

  async getSettings() {
    const now = Date.now();
    if (now - this.lastUpdate < this.ttl && this.settings) {
      return this.settings;
    }

    if (this.isLoading) {
      // Wait for ongoing load
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.settings;
    }

    this.isLoading = true;
    try {
      let settings = await PluginTemplateSettings.findOne({
        settingsId: "default",
      });

      if (!settings) {
        settings = new PluginTemplateSettings({ settingsId: "default" });
        await settings.save();
      }

      this.settings = {
        general: { ...this.defaults.general, ...settings.general },
        features: { ...this.defaults.features, ...settings.features },
      };

      this.lastUpdate = now;
      return this.settings;
    } catch (error) {
      console.error("Error loading plugin template settings:", error);
      return this.defaults;
    } finally {
      this.isLoading = false;
    }
  }

  invalidate() {
    this.settings = null;
    this.lastUpdate = 0;
  }
}

const settingsCache = new SettingsCache();

// Invalidate settings cache function
const invalidateSettingsCache = () => {
  settingsCache.invalidate();
};

// Get cached settings function
const getCachedSettings = async () => {
  return await settingsCache.getSettings();
};

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  console.log("=== Plugin Template Admin Auth Check ===");
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

  console.log("Admin access granted for plugin template");
  next();
};

// Logging middleware
const logActivity = async (level, message, metadata = {}) => {
  try {
    const log = new PluginTemplateLog({
      level,
      message,
      metadata,
    });
    await log.save();
  } catch (error) {
    console.error("Error logging plugin template activity:", error);
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const settings = settingsCache.settings;

  if (settings?.features?.debugMode) {
    console.log(
      `🔧 [PLUGIN TEMPLATE] ${req.method} ${
        req.originalUrl
      } - ${new Date().toISOString()}`
    );

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

// Feature validation middleware
const validateFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const settings = await getCachedSettings();

      if (!settings.general.enabled) {
        return res.status(503).json({
          success: false,
          message: "Plugin Template is currently disabled",
        });
      }

      if (featureName && !settings.features[featureName]) {
        return res.status(503).json({
          success: false,
          message: `Feature '${featureName}' is currently disabled`,
        });
      }

      next();
    } catch (error) {
      console.error("Error validating feature:", error);
      res.status(500).json({
        success: false,
        message: "Error validating feature availability",
      });
    }
  };
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Plugin Template Error:", err);

  // Log error to database
  setImmediate(() => {
    logActivity("error", `Plugin Template Error: ${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      user: req.user ? req.user.email : "Anonymous",
    });
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    message: "Internal server error in Plugin Template",
    error: isDevelopment ? err.message : "An error occurred",
    ...(isDevelopment && { stack: err.stack }),
  });
};

module.exports = {
  requireAdmin,
  logActivity,
  requestLogger,
  validateFeature,
  errorHandler,
  getCachedSettings,
  invalidateSettingsCache,
};
