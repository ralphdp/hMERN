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
} = require("./middleware");

const plugin = {
  name: STATIC_CONFIG.name,
  version: STATIC_CONFIG.version,
  description:
    "Advanced web performance optimization with file optimization, caching layers, and performance features",
  dependencies: STATIC_CONFIG.metadata.dependencies, // No dependencies
  register: (app) => {
    console.log(
      "=== Registering hMERN Web Performance Optimization plugin ==="
    );
    console.log("Plugin name:", plugin.name);
    console.log("Plugin version:", plugin.version);

    // Store route registration function for later use (after session setup)
    app.registerWebPerformanceRoutes = () => {
      console.log("=== Registering Web Performance Routes (Post-Session) ===");

      // Register web performance routes using static config
      app.use(STATIC_CONFIG.api.basePath, routes);
      console.log(
        `Web Performance routes registered at ${STATIC_CONFIG.api.basePath}`
      );

      console.log("Available web performance endpoints:");
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.health} - Health check`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.test} - Test plugin`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.stats} - Dashboard statistics (admin)`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.config} - Get configuration (admin)`
      );
      console.log(
        `  - PUT ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.config} - Update configuration (admin)`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.settings} - Manage settings (admin)`
      );
      console.log(
        `  - PUT ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.settings} - Update settings (admin)`
      );
      console.log(
        `Frontend admin page available at: ${STATIC_CONFIG.frontend.adminPath}`
      );
      console.log("=== Web Performance Routes Registration Complete ===");
    };

    // Note: Performance middleware will be conditionally applied based on settings
    // We don't apply them globally here to avoid blocking requests
    console.log(
      "Web Performance middleware available but not globally applied"
    );
    console.log(
      "=== hMERN Web Performance Optimization plugin registered successfully ==="
    );
    console.log("NOTE: Routes will be registered after session setup");

    // Log plugin registration
    setImmediate(() => {
      logActivity(
        "info",
        "Web Performance Optimization Plugin registered successfully",
        {
          version: plugin.version,
          registeredAt: new Date().toISOString(),
        }
      );
    });

    return true;
  },
  middleware: {
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
  },
  features: [
    "CSS/JS Minification & Concatenation",
    "Image Optimization & WebP Conversion",
    "GZIP/Brotli Compression",
    "Database Query Caching (Redis)",
    "Fragment/Object Caching (Redis)",
    "Static File Caching (Cloudflare R2)",
    "Browser Caching (HTTP Headers)",
    "Lazy Loading",
    "Critical CSS",
    "Preloading",
    "Performance Monitoring",
  ],
  frontend: {
    adminPage: STATIC_CONFIG.frontend.adminPath,
    component: STATIC_CONFIG.frontend.componentPath,
    usage: "Admin-only web performance optimization interface",
  },
  // Utility functions that can be used by other parts of the application
  utils: {
    getCachedSettings,
    logActivity,
    validateFeature,
    invalidateSettingsCache,
  },
  // Plugin metadata for the admin interface
  metadata: {
    category: STATIC_CONFIG.category,
    tags: STATIC_CONFIG.metadata.tags,
    type: STATIC_CONFIG.metadata.type,
    dependencies: STATIC_CONFIG.metadata.dependencies,
    documentation:
      "frontend/src/plugins/web-performance-optimization/README.md",
    apiEndpoints: STATIC_CONFIG.api.basePath,
    adminInterface: STATIC_CONFIG.frontend.adminPath,
    databaseCollections: STATIC_CONFIG.metadata.databaseCollections,
  },
};

module.exports = plugin;
