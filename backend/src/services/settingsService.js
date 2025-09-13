const { Settings } = require("../models/Settings");

/**
 * Core Settings Service
 * Provides centralized access to application settings and external service credentials
 * Used by all plugins and core application components
 */
class SettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.lastCacheUpdate = null;
  }

  /**
   * Get external service credentials from database with environment fallback
   * @returns {Object} Credentials object with redis and cloudflareR2 sections
   */
  async getCredentials() {
    try {
      let settings = await Settings.findOne({ settingsId: "default" });

      console.log(
        "🔍 [SETTINGS DEBUG] Raw settings from database:",
        settings ? "found" : "not found"
      );

      // If no settings exist, create default one with environment values
      if (!settings) {
        settings = new Settings({
          settingsId: "default",
          externalServices: {
            redis: {
              endpoint: process.env.REDIS_PUBLIC_ENDPOINT || "",
              password: process.env.REDIS_PASSWORD || "",
            },
            cloudflareR2: {
              bucket: process.env.CLOUDFLARE_R2_BUCKET || "hmern",
              token: process.env.CLOUDFLARE_R2_TOKEN || "",
              accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
              secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
              endpointS3: process.env.CLOUDFLARE_ENDPOINT_S3 || "",
            },
          },
        });
        await settings.save();
        console.log("✅ Created initial settings with environment variables");
      }

      // Ensure externalServices structure exists
      if (!settings.externalServices) {
        settings.externalServices = {
          redis: {
            endpoint: process.env.REDIS_PUBLIC_ENDPOINT || "",
            password: process.env.REDIS_PASSWORD || "",
          },
          cloudflareR2: {
            bucket: process.env.CLOUDFLARE_R2_BUCKET || "hmern",
            token: process.env.CLOUDFLARE_R2_TOKEN || "",
            accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
            endpointS3: process.env.CLOUDFLARE_ENDPOINT_S3 || "",
          },
        };
        settings.markModified("externalServices");
        await settings.save();
      }

      // Ensure individual service structures exist
      if (!settings.externalServices.redis) {
        settings.externalServices.redis = {
          endpoint: process.env.REDIS_PUBLIC_ENDPOINT || "",
          password: process.env.REDIS_PASSWORD || "",
        };
      }

      if (!settings.externalServices.cloudflareR2) {
        settings.externalServices.cloudflareR2 = {
          bucket: process.env.CLOUDFLARE_R2_BUCKET || "hmern",
          token: process.env.CLOUDFLARE_R2_TOKEN || "",
          accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
          endpointS3: process.env.CLOUDFLARE_ENDPOINT_S3 || "",
        };
      }

      // Convert to object to trigger getters (decryption)
      const settingsObj = settings.toObject();

      console.log(
        "🔍 [SETTINGS DEBUG] ENCRYPTION_KEY exists:",
        !!process.env.ENCRYPTION_KEY
      );
      console.log("🔍 [SETTINGS DEBUG] External services after toObject():");
      console.log(
        "  - Redis endpoint:",
        settingsObj.externalServices?.redis?.endpoint ? "SET" : "EMPTY"
      );
      console.log(
        "  - R2 bucket:",
        settingsObj.externalServices?.cloudflareR2?.bucket ? "SET" : "EMPTY"
      );
      console.log(
        "  - R2 token:",
        settingsObj.externalServices?.cloudflareR2?.token ? "SET" : "EMPTY"
      );
      console.log(
        "  - R2 accessKeyId:",
        settingsObj.externalServices?.cloudflareR2?.accessKeyId
          ? "SET"
          : "EMPTY"
      );
      console.log(
        "  - R2 secretAccessKey:",
        settingsObj.externalServices?.cloudflareR2?.secretAccessKey
          ? "SET"
          : "EMPTY"
      );
      console.log(
        "  - R2 endpointS3:",
        settingsObj.externalServices?.cloudflareR2?.endpointS3 ? "SET" : "EMPTY"
      );

      return settingsObj.externalServices;
    } catch (error) {
      console.error("Error getting credentials from database:", error);
      // Fallback to environment variables
      return {
        redis: {
          endpoint: process.env.REDIS_PUBLIC_ENDPOINT || "",
          password: process.env.REDIS_PASSWORD || "",
        },
        cloudflareR2: {
          bucket: process.env.CLOUDFLARE_R2_BUCKET || "hmern",
          token: process.env.CLOUDFLARE_R2_TOKEN || "",
          accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
          endpointS3: process.env.CLOUDFLARE_ENDPOINT_S3 || "",
        },
      };
    }
  }

  /**
   * Get cached credentials to avoid frequent database calls
   * @returns {Object} Cached credentials or fresh from database
   */
  async getCachedCredentials() {
    const now = Date.now();
    const cacheKey = "credentials";

    // Check if cache is still valid
    if (
      this.cache.has(cacheKey) &&
      this.lastCacheUpdate &&
      now - this.lastCacheUpdate < this.cacheTimeout
    ) {
      return this.cache.get(cacheKey);
    }

    // Fetch fresh credentials
    const credentials = await this.getCredentials();

    // Update cache
    this.cache.set(cacheKey, credentials);
    this.lastCacheUpdate = now;

    return credentials;
  }

  /**
   * Update external service credentials
   * @param {Object} updates - Object containing redis and/or cloudflareR2 updates
   * @returns {Object} Updated credentials
   */
  async updateCredentials(updates) {
    try {
      let settings = await Settings.findOne({ settingsId: "default" });

      if (!settings) {
        settings = new Settings({ settingsId: "default" });
      }

      // Ensure externalServices structure exists
      if (!settings.externalServices) {
        settings.externalServices = {
          redis: {
            endpoint: "",
            password: "",
          },
          cloudflareR2: {
            bucket: "",
            token: "",
            accessKeyId: "",
            secretAccessKey: "",
            endpointS3: "",
          },
        };
      }

      // Ensure redis structure exists
      if (!settings.externalServices.redis) {
        settings.externalServices.redis = {
          endpoint: "",
          password: "",
        };
      }

      // Ensure cloudflareR2 structure exists
      if (!settings.externalServices.cloudflareR2) {
        settings.externalServices.cloudflareR2 = {
          bucket: "",
          token: "",
          accessKeyId: "",
          secretAccessKey: "",
          endpointS3: "",
        };
      }

      // Update Redis credentials if provided
      if (updates.redis) {
        if (updates.redis.endpoint !== undefined) {
          settings.externalServices.redis.endpoint = updates.redis.endpoint;
        }
        if (updates.redis.password !== undefined) {
          settings.externalServices.redis.password = updates.redis.password;
        }
      }

      // Update Cloudflare R2 credentials if provided
      if (updates.cloudflareR2) {
        if (updates.cloudflareR2.bucket !== undefined) {
          settings.externalServices.cloudflareR2.bucket =
            updates.cloudflareR2.bucket;
        }
        if (updates.cloudflareR2.token !== undefined) {
          settings.externalServices.cloudflareR2.token =
            updates.cloudflareR2.token;
        }
        if (updates.cloudflareR2.accessKeyId !== undefined) {
          settings.externalServices.cloudflareR2.accessKeyId =
            updates.cloudflareR2.accessKeyId;
        }
        if (updates.cloudflareR2.secretAccessKey !== undefined) {
          settings.externalServices.cloudflareR2.secretAccessKey =
            updates.cloudflareR2.secretAccessKey;
        }
        if (updates.cloudflareR2.endpointS3 !== undefined) {
          settings.externalServices.cloudflareR2.endpointS3 =
            updates.cloudflareR2.endpointS3;
        }
      }

      settings.updatedAt = new Date();
      await settings.save();

      // Invalidate cache
      this.invalidateCache();

      return settings.externalServices;
    } catch (error) {
      console.error("Error updating credentials:", error);
      throw error;
    }
  }

  /**
   * Get all application settings
   * @returns {Object} Complete settings object
   */
  async getSettings() {
    try {
      let settings = await Settings.findOne({ settingsId: "default" });

      if (!settings) {
        settings = new Settings({ settingsId: "default" });
        await settings.save();
      }

      return settings;
    } catch (error) {
      console.error("Error getting settings:", error);
      throw error;
    }
  }

  /**
   * Update application settings
   * @param {Object} updates - Settings updates
   * @returns {Object} Updated settings
   */
  async updateSettings(updates) {
    try {
      let settings = await Settings.findOne({ settingsId: "default" });

      if (!settings) {
        settings = new Settings({ settingsId: "default" });
      }

      // Deep merge updates
      const deepMerge = (target, source) => {
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
      };

      deepMerge(settings, updates);

      settings.updatedAt = new Date();
      await settings.save();

      // Invalidate cache
      this.invalidateCache();

      return settings;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  }

  /**
   * Get plugin-specific settings
   * @param {string} pluginName - Name of the plugin
   * @returns {Object} Plugin settings
   */
  async getPluginSettings(pluginName) {
    try {
      const settings = await this.getSettings();
      return settings.plugins[pluginName] || {};
    } catch (error) {
      console.error(`Error getting ${pluginName} plugin settings:`, error);
      return {};
    }
  }

  /**
   * Update plugin-specific settings
   * @param {string} pluginName - Name of the plugin
   * @param {Object} updates - Plugin settings updates
   * @returns {Object} Updated plugin settings
   */
  async updatePluginSettings(pluginName, updates) {
    try {
      let settings = await Settings.findOne({ settingsId: "default" });

      if (!settings) {
        settings = new Settings({ settingsId: "default" });
      }

      if (!settings.plugins) {
        settings.plugins = {};
      }

      if (!settings.plugins[pluginName]) {
        settings.plugins[pluginName] = {};
      }

      // Deep merge plugin updates
      const deepMerge = (target, source) => {
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
      };

      deepMerge(settings.plugins[pluginName], updates);

      settings.updatedAt = new Date();
      await settings.save();

      // Invalidate cache
      this.invalidateCache();

      return settings.plugins[pluginName];
    } catch (error) {
      console.error(`Error updating ${pluginName} plugin settings:`, error);
      throw error;
    }
  }

  /**
   * Invalidate the settings cache
   */
  invalidateCache() {
    this.cache.clear();
    this.lastCacheUpdate = null;
    console.log("Settings cache invalidated");
  }

  /**
   * Check if external services are configured
   * @returns {Object} Configuration status
   */
  async getExternalServicesStatus() {
    try {
      const credentials = await this.getCachedCredentials();

      // Ensure credentials have the expected structure
      const redis = credentials?.redis || { endpoint: "", password: "" };
      const cloudflareR2 = credentials?.cloudflareR2 || {
        bucket: "",
        token: "",
        accessKeyId: "",
        secretAccessKey: "",
        endpointS3: "",
      };

      return {
        redis: {
          configured: !!redis.endpoint,
          hasPassword: !!redis.password,
        },
        cloudflareR2: {
          configured: !!(
            cloudflareR2.bucket &&
            cloudflareR2.token &&
            cloudflareR2.accessKeyId &&
            cloudflareR2.secretAccessKey &&
            cloudflareR2.endpointS3
          ),
          bucket: cloudflareR2.bucket || "",
          hasToken: !!cloudflareR2.token,
          hasAccessKeyId: !!cloudflareR2.accessKeyId,
          hasSecretAccessKey: !!cloudflareR2.secretAccessKey,
          endpointS3: cloudflareR2.endpointS3 || "",
        },
      };
    } catch (error) {
      console.error("Error getting external services status:", error);
      return {
        redis: { configured: false, hasPassword: false },
        cloudflareR2: {
          configured: false,
          bucket: "",
          hasToken: false,
          hasAccessKeyId: false,
          hasSecretAccessKey: false,
          endpointS3: "",
        },
      };
    }
  }
}

// Create singleton instance
const settingsService = new SettingsService();

module.exports = {
  settingsService,
  SettingsService,
};
