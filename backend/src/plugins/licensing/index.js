// backend/plugins/licensing/index.js

const routes = require("./routes");
const { STATIC_CONFIG } = require("./config");
const {
  validateLicense, // ← PRESERVED EXACTLY AS-IS
  logActivity,
  requestLogger,
  validateFeature,
  errorHandler,
  getCachedConfig,
  invalidateConfigCache,
} = require("./middleware");

const plugin = {
  name: STATIC_CONFIG.name,
  version: STATIC_CONFIG.version,
  description:
    "Core licensing system that enables and validates other plugins in the hMERN stack",
  dependencies: STATIC_CONFIG.metadata.dependencies, // No dependencies - core plugin
  register: (app) => {
    console.log("=== Registering hMERN Licensing plugin ===");
    console.log("Plugin name:", plugin.name);
    console.log("Plugin version:", plugin.version);
    console.log("Plugin description:", plugin.description);
    console.log(
      "License server URL:",
      process.env.LICENSE_SERVER_URL || "https://hmern.com"
    );
    console.log("License key configured:", !!process.env.HMERN_LICENSE_KEY);

    // Store route registration function for later use (after session setup)
    app.registerLicensingRoutes = () => {
      console.log("=== Registering Licensing Routes (Post-Session) ===");

      // Register licensing routes using static config
      app.use(STATIC_CONFIG.api.basePath, routes);
      console.log(
        `Licensing routes registered at ${STATIC_CONFIG.api.basePath}`
      );

      console.log("Available licensing endpoints:");
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.health} - Health check`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.test} - Test plugin`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.info} - Plugin information`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.status} - License status`
      );
      console.log(
        `  - POST ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.validate} - Validate license`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.debug} - Debug info`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.config} - Get configuration (admin)`
      );
      console.log(
        `Frontend component available at: ${STATIC_CONFIG.frontend.componentPath}`
      );
      console.log("=== Licensing Routes Registration Complete ===");
    };

    // For backward compatibility, also register routes immediately
    // This ensures existing functionality continues to work
    app.use(STATIC_CONFIG.api.basePath, routes);
    console.log(
      `Licensing routes registered at ${STATIC_CONFIG.api.basePath} (immediate registration for compatibility)`
    );

    // Log plugin registration
    setImmediate(() => {
      logActivity("info", "Licensing Plugin registered successfully", {
        version: plugin.version,
        registeredAt: new Date().toISOString(),
      });
    });

    console.log("=== hMERN Licensing plugin registered successfully ===");
    console.log(
      "NOTE: Routes are registered immediately for core functionality"
    );

    return plugin; // Return plugin instance instead of true
  },
  middleware: {
    validateLicense, // ← PRESERVED EXACTLY AS-IS
    logActivity,
    requestLogger,
    validateFeature,
    errorHandler,
    getCachedConfig,
    invalidateConfigCache,
  },
  features: [
    "License validation and caching",
    "Development mode bypass",
    "Offline mode support",
    "License analytics and monitoring",
    "Multi-server failover",
    "Activity logging",
    "Performance monitoring",
    "Configuration management",
  ],
  frontend: {
    component: STATIC_CONFIG.frontend.componentPath,
    adminPage: STATIC_CONFIG.frontend.adminPath, // For future admin interface
    usage:
      "Import and use in your React components: import { LicenseIndicator } from 'plugins/licensing'",
  },
  // Utility functions that can be used by other parts of the application
  utils: {
    getCachedConfig,
    logActivity,
    validateFeature,
    invalidateConfigCache,
  },
  // Plugin metadata for the admin interface
  metadata: {
    category: STATIC_CONFIG.category,
    tags: STATIC_CONFIG.metadata.tags,
    type: STATIC_CONFIG.metadata.type,
    dependencies: STATIC_CONFIG.metadata.dependencies,
    isCore: STATIC_CONFIG.metadata.isCore,
    requiredFor: STATIC_CONFIG.metadata.requiredFor,
    documentation: "frontend/src/plugins/licensing/README.md",
    apiEndpoints: STATIC_CONFIG.api.basePath,
    adminInterface: STATIC_CONFIG.frontend.adminPath,
    databaseCollections: STATIC_CONFIG.metadata.databaseCollections,
  },
};

module.exports = plugin;
