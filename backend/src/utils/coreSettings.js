const CoreSettings = require("../models/CoreSettings");

// Cache for core settings to avoid database hits on every request
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get core settings from cache or database
 */
const getCoreSettings = async () => {
  const now = Date.now();

  // Return cached settings if valid
  if (settingsCache && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
    return settingsCache;
  }

  try {
    let settings = await CoreSettings.findOne({ settingsId: "default" });

    // Create default settings if none exist
    if (!settings) {
      settings = new CoreSettings({
        settingsId: "default",
        rateLimiting: {
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100,
          skipAdminRoutes: true,
          skipPluginRoutes: true,
          enabled: true,
          message: "Too many requests from this IP, please try again later.",
        },
        security: {
          trustProxy: true,
          helmetEnabled: true,
          corsEnabled: true,
        },
        updatedBy: "system",
      });

      await settings.save();
      console.log("Created default core settings");
    }

    // Update cache
    settingsCache = settings;
    cacheTimestamp = now;

    return settings;
  } catch (error) {
    console.error("Error loading core settings:", error);

    // Return fallback settings if database fails
    return {
      rateLimiting: {
        windowMs: 15 * 60 * 1000,
        maxRequests: 100,
        skipAdminRoutes: true,
        skipPluginRoutes: true,
        enabled: true,
        message: "Too many requests from this IP, please try again later.",
      },
      security: {
        trustProxy: true,
        helmetEnabled: true,
        corsEnabled: true,
      },
    };
  }
};

/**
 * Invalidate the settings cache
 */
const invalidateSettingsCache = () => {
  settingsCache = null;
  cacheTimestamp = null;
  console.log("Core settings cache invalidated");
};

/**
 * Update core settings
 */
const updateCoreSettings = async (updates, updatedBy = "admin") => {
  try {
    const settings = await CoreSettings.findOneAndUpdate(
      { settingsId: "default" },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
          updatedBy,
        },
      },
      { new: true, upsert: true }
    );

    // Invalidate cache after update
    invalidateSettingsCache();

    return settings;
  } catch (error) {
    console.error("Error updating core settings:", error);
    throw error;
  }
};

module.exports = {
  getCoreSettings,
  invalidateSettingsCache,
  updateCoreSettings,
};
