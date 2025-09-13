const routes = require("./routes");
const { STATIC_CONFIG } = require("./config");
const {
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
} = require("./middleware");
const { startDataRetentionJobs, stopDataRetentionJobs } = require("./utils");

// Use centralized logging system
const { createPluginLogger } = require("../../utils/logger");
const logger = createPluginLogger("firewall");

// Enhanced plugin interface for core integration
class FirewallPlugin {
  constructor() {
    this.name = "firewall";
    this.version = "1.0.0";
    this.middleware = {
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
    };
    this.routes = routes;
    this.config = STATIC_CONFIG;
  }

  // Core integration methods
  registerWithCore(app) {
    logger.config.info("🔥 Firewall: Registering with core application");

    // 1. Register middleware globally
    this.registerMiddleware(app);

    // 2. Register routes
    this.registerRoutes(app);

    // 3. Register rate limiting hooks
    this.registerRateLimitingHooks(app);

    // 4. Register admin middleware
    this.registerAdminMiddleware(app);

    logger.config.info("🔥 Firewall: Successfully registered with core");
  }

  registerMiddleware(app) {
    try {
      logger.config.info(
        "🔥 Firewall: Storing middleware for application AFTER database connection"
      );
      // Store middleware for later application AFTER database and session setup
      app.firewallMiddleware = firewallMiddleware;
      app.getFirewallMiddleware = () => firewallMiddleware;
      logger.config.info(
        "🔥 Firewall: Middleware stored for manual application after database setup"
      );
    } catch (error) {
      logger.config.error("🔥 Firewall: Error storing middleware:", error);
    }
  }

  registerRoutes(app) {
    try {
      logger.config.info(
        "🔥 Firewall: Storing route registration function for later use"
      );

      // Store route registration function for later use (after session setup)
      app.registerFirewallRoutes = () => {
        logger.config.info(
          "🔥 Firewall: Registering routes NOW (after session setup)"
        );
        app.use("/api/firewall", routes);
        logger.config.info(
          "🔥 Firewall: Routes registered successfully at /api/firewall"
        );
      };

      logger.config.info(
        "🔥 Firewall: Route registration function stored for later execution"
      );
    } catch (error) {
      logger.config.error(
        "🔥 Firewall: Error storing route registration function:",
        error
      );
    }
  }

  registerRateLimitingHooks(app) {
    try {
      logger.config.info("🔥 Firewall: Installing rate limiting hooks");

      // Override global rate limiter bypass logic
      app.shouldBypassGlobalRateLimit = (req) => {
        // Skip global rate limiter if firewall is handling rate limiting
        if (process.env.NODE_ENV === "production") {
          return true; // Firewall handles all rate limiting in production
        }
        return false;
      };

      // Provide rate limiting check for catch-all routes
      app.checkFirewallRateLimit = async (req, res) => {
        try {
          const ip = getClientIp(req);
          const rateLimitResult = await checkRateLimit(ip, req);

          if (rateLimitResult.limited) {
            logger.config.info(
              "🚫 Firewall: Blocking request due to rate limit",
              {
                ip,
                url: req.originalUrl,
                reason: rateLimitResult.reason,
              }
            );

            return res.status(429).json({
              success: false,
              message: "Too many requests. Please try again later.",
              error: "Rate limit exceeded",
              details: {
                ip,
                reason: rateLimitResult.reason,
                retryAfter: rateLimitResult.retryAfter,
                timestamp: new Date().toISOString(),
              },
              rateLimited: true,
            });
          }
          return null; // No rate limiting applied
        } catch (error) {
          logger.config.error(
            "🔥 Firewall: Error checking rate limits:",
            error
          );
          return null; // Allow request on error
        }
      };

      logger.config.info("🔥 Firewall: Rate limiting hooks installed");
    } catch (error) {
      logger.config.error(
        "🔥 Firewall: Error installing rate limiting hooks:",
        error
      );
    }
  }

  registerAdminMiddleware(app) {
    try {
      logger.config.info("🔥 Firewall: Registering admin middleware");
      app.firewallRequireAdmin = requireAdmin;
      logger.config.info("🔥 Firewall: Admin middleware registered");
    } catch (error) {
      logger.config.error(
        "🔥 Firewall: Error registering admin middleware:",
        error
      );
    }
  }

  // Status reporting for core
  async getPluginStatus() {
    try {
      const settings = await getCachedSettings();
      return {
        enabled: true,
        type: "Security",
        masterSwitchEnabled: settings.general?.enabled ?? true,
        rateLimitingEnabled: settings.features?.rateLimiting ?? true,
        developmentModeEnabled: settings.developmentMode?.enabled ?? false,
        localNetworksEnabled: settings.localNetworks?.enabled ?? false,
        version: this.version,
      };
    } catch (error) {
      logger.config.error("🔥 Firewall: Error getting status:", error);
      return {
        enabled: true,
        type: "Security",
        masterSwitchEnabled: false,
        rateLimitingEnabled: false,
        developmentModeEnabled: false,
        localNetworksEnabled: false,
        version: this.version,
        error: error.message,
      };
    }
  }

  // Generic admin middleware for core to use
  static createFallbackAdminMiddleware() {
    return (req, res, next) => {
      if (!req.user || !req.user.isAdmin || !req.user.isAdmin()) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }
      next();
    };
  }
}

// Legacy support - keep existing exports
const plugin = new FirewallPlugin();

const loadPlugin = (app) => {
  logger.config.info(`Loading firewall plugin v${plugin.version}...`);

  try {
    // Enhanced registration with core
    plugin.registerWithCore(app);

    // Legacy support - attach to app.plugins
    app.plugins = app.plugins || {};
    app.plugins.firewall = plugin;

    // Legacy middleware function
    app.getFirewallMiddleware = () => firewallMiddleware;

    // Legacy route registration
    app.registerFirewallRoutes = () => {
      logger.config.info("🔥 Legacy: Registering firewall routes");
      app.use("/api/firewall", routes);
    };

    startCleanupIntervals();
    logger.config.info("✅ Firewall plugin loaded successfully");
    return plugin;
  } catch (error) {
    logger.config.error("❌ Error loading firewall plugin:", error);
    throw error;
  }
};

// Register function for compatibility with server plugin loading system
const register = (app) => {
  logger.config.info(
    "🔥 Firewall: Using register function (server compatibility)"
  );
  return loadPlugin(app);
};

module.exports = {
  // Server compatibility - add register function
  register,
  name: "hMERN Firewall",
  version: "1.0.0",
  dependencies: ["licensing"], // Add dependencies for server loading order

  // Existing exports
  loadPlugin,
  plugin: plugin,
  FirewallPlugin,
  // Legacy exports
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
};
