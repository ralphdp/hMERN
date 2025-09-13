const routes = require("./routes");
const { STATIC_CONFIG } = require("./config");
const {
  requireAdmin,
  logActivity,
  requestLogger,
  validateFeature,
  errorHandler,
  getCachedSettings,
  invalidateSettingsCache,
  performanceMonitoringMiddleware,
  cacheHeadersMiddleware,
  compressionMiddleware,
  lazyLoadingMiddleware,
  processOptimizationQueue,
  startBackgroundJobs,
  stopBackgroundJobs,
  cleanupTempFiles,
  enablePerformanceMiddleware,
  disablePerformanceMiddleware,
} = require("./middleware");

// Use centralized logging system
const { createPluginLogger } = require("../../utils/logger");
const logger = createPluginLogger("web-performance");

// Enhanced plugin interface for core integration - COPY FIREWALL ARCHITECTURE EXACTLY
class WebPerformancePlugin {
  constructor() {
    this.name = "web-performance-optimization";
    this.version = "1.0.0";
    this.middleware = {
      requireAdmin,
      logActivity,
      requestLogger,
      validateFeature,
      errorHandler,
      getCachedSettings,
      invalidateSettingsCache,
      performanceMonitoringMiddleware,
      cacheHeadersMiddleware,
      compressionMiddleware,
      lazyLoadingMiddleware,
      processOptimizationQueue,
      startBackgroundJobs,
      stopBackgroundJobs,
      cleanupTempFiles,
      enablePerformanceMiddleware,
      disablePerformanceMiddleware,
    };
    this.routes = routes;
    this.config = STATIC_CONFIG;
  }

  // Core integration methods - EXACTLY LIKE FIREWALL
  registerWithCore(app) {
    logger.config.info("⚡ Web Performance: Registering with core application");

    // 1. Register middleware
    this.registerMiddleware(app);

    // 2. Register routes
    this.registerRoutes(app);

    // 3. Register admin middleware
    this.registerAdminMiddleware(app);

    logger.config.info("⚡ Web Performance: Successfully registered with core");
  }

  registerMiddleware(app) {
    try {
      logger.config.info(
        "⚡ Web Performance: SKIPPING global middleware to fix session order"
      );
      // DISABLED: app.use(performanceMonitoringMiddleware);
      // This was causing issues because it runs before session middleware
      logger.config.info(
        "⚡ Web Performance: Middleware registration skipped (session order fix)"
      );
    } catch (error) {
      logger.config.error(
        "⚡ Web Performance: Error applying middleware:",
        error
      );
    }
  }

  registerRoutes(app) {
    try {
      logger.config.info(
        "⚡ Web Performance: SKIPPING automatic route registration to fix session order"
      );
      // DISABLED: app.use("/api/web-performance", routes);
      // Routes will be registered manually AFTER session setup in server.js

      // Store route reference for manual registration
      app.webPerformanceRoutes = routes;
      logger.config.info(
        "⚡ Web Performance: Route reference stored for manual registration"
      );
    } catch (error) {
      logger.config.error(
        "⚡ Web Performance: Error storing route reference:",
        error
      );
    }
  }

  registerAdminMiddleware(app) {
    try {
      logger.config.info("⚡ Web Performance: Registering admin middleware");
      app.webPerformanceRequireAdmin = requireAdmin;
      logger.config.info("⚡ Web Performance: Admin middleware registered");
    } catch (error) {
      logger.config.error(
        "⚡ Web Performance: Error registering admin middleware:",
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
        type: "Performance",
        masterSwitchEnabled: settings?.general?.enabled ?? false,
        optimizationEnabled:
          settings?.fileOptimization?.minification?.enableCSSMinification ??
          false,
        cachingEnabled: settings?.cachingLayers?.browserCache?.enabled ?? false,
        compressionEnabled:
          settings?.fileOptimization?.compression?.enableGzip ?? false,
        monitoringEnabled: settings?.general?.enableAnalytics ?? false,
        version: this.version,
      };
    } catch (error) {
      logger.config.error("⚡ Web Performance: Error getting status:", error);
      return {
        enabled: true,
        type: "Performance",
        masterSwitchEnabled: false,
        optimizationEnabled: false,
        cachingEnabled: false,
        compressionEnabled: false,
        monitoringEnabled: false,
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

// Legacy support - keep existing exports - EXACTLY LIKE FIREWALL
const plugin = new WebPerformancePlugin();

const loadPlugin = (app) => {
  logger.config.info(`Loading web performance plugin v${plugin.version}...`);

  try {
    // Enhanced registration with core
    plugin.registerWithCore(app);

    // Legacy support - attach to app.plugins
    app.plugins = app.plugins || {};
    app.plugins["web-performance-optimization"] = plugin;

    // Legacy route registration
    app.registerWebPerformanceRoutes = () => {
      logger.config.info("⚡ Legacy: Registering web performance routes");
      app.use("/api/web-performance", routes);
    };

    logger.config.info("✅ Web Performance plugin loaded successfully");
    return plugin;
  } catch (error) {
    logger.config.error("❌ Error loading web performance plugin:", error);
    throw error;
  }
};

// Register function for compatibility with server plugin loading system
const register = (app) => {
  logger.config.info(
    "⚡ Web Performance: Using register function (server compatibility)"
  );
  return loadPlugin(app);
};
module.exports = {
  // Server compatibility - add register function
  register,
  name: "hMERN Web Performance Optimization",
  version: "1.0.0",
  dependencies: [], // Remove dependencies for now

  // Existing exports
  loadPlugin,
  plugin: plugin,
  WebPerformancePlugin,
  // Legacy exports
  requireAdmin,
  logActivity,
  requestLogger,
  validateFeature,
  errorHandler,
  getCachedSettings,
  invalidateSettingsCache,
  performanceMonitoringMiddleware,
  cacheHeadersMiddleware,
  compressionMiddleware,
  lazyLoadingMiddleware,
  processOptimizationQueue,
  startBackgroundJobs,
  stopBackgroundJobs,
  cleanupTempFiles,
  enablePerformanceMiddleware,
  disablePerformanceMiddleware,
};
