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
} = require("./middleware");

const plugin = {
  name: STATIC_CONFIG.name,
  version: STATIC_CONFIG.version,
  description:
    "A template plugin for creating new plugins in the hMERN stack with database models, API routes, and admin interface",
  dependencies: [], // No dependencies for the template
  register: (app) => {
    console.log("=== Registering hMERN Plugin Template ===");
    console.log("Plugin name:", plugin.name);
    console.log("Plugin version:", plugin.version);
    console.log("Plugin description:", plugin.description);

    // Store route registration function for later use (after session setup)
    app.registerPluginTemplateRoutes = () => {
      console.log("=== Registering Plugin Template Routes (Post-Session) ===");

      // Register plugin template routes using static config
      app.use(STATIC_CONFIG.api.basePath, routes);
      console.log(
        `Plugin Template routes registered at ${STATIC_CONFIG.api.basePath}`
      );

      console.log("Available plugin template endpoints:");
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
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.stats} - Dashboard statistics (admin)`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.config} - Get configuration (admin)`
      );
      console.log(
        `  - PUT ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.config} - Update configuration (admin)`
      );
      console.log(
        `  - POST ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.config}/reset - Reset configuration (admin)`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.settings} - Manage settings (admin)`
      );
      console.log(
        `  - PUT ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.settings} - Update settings (admin)`
      );
      console.log(
        `  - POST ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.settings}/reset - Reset settings (admin)`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.data} - Manage data entries (admin)`
      );
      console.log(
        `  - POST ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.data} - Create data entry (admin)`
      );
      console.log(
        `  - GET ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.logs} - View logs (admin)`
      );
      console.log(
        `  - DELETE ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.logs} - Clear logs (admin)`
      );
      console.log(
        `  - POST ${STATIC_CONFIG.api.basePath}${STATIC_CONFIG.api.endpoints.exampleAction} - Example action (admin)`
      );
      console.log(
        `Frontend admin page available at: ${STATIC_CONFIG.frontend.adminPath}`
      );
      console.log("=== Plugin Template Routes Registration Complete ===");
    };

    // Log plugin registration
    setImmediate(() => {
      logActivity("info", "Plugin Template registered successfully", {
        version: plugin.version,
        registeredAt: new Date().toISOString(),
      });
    });

    console.log("=== hMERN Plugin Template registered successfully ===");
    console.log("NOTE: Routes will be registered after session setup");

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
  },
  features: [
    "Template structure for new plugins",
    "Basic admin interface example",
    "Database models with MongoDB",
    "API routes with Express router",
    "Middleware examples",
    "Settings management",
    "Activity logging",
    "Feature toggling",
    "Error handling",
    "Request validation",
    "Dynamic configuration system",
  ],
  frontend: {
    adminPage: STATIC_CONFIG.frontend.adminPath,
    component: STATIC_CONFIG.frontend.componentPath,
    usage: "Admin-only plugin template management interface",
  },
  // Utility functions that can be used by other parts of the application
  utils: {
    getCachedSettings,
    logActivity,
    validateFeature,
  },
  // Plugin metadata for the admin interface
  metadata: {
    category: STATIC_CONFIG.category,
    tags: STATIC_CONFIG.metadata.tags,
    documentation: "frontend/src/plugins/plugin-template/README.md",
    apiEndpoints: STATIC_CONFIG.api.basePath,
    adminInterface: STATIC_CONFIG.frontend.adminPath,
    databaseCollections: STATIC_CONFIG.metadata.databaseCollections,
  },
};

module.exports = plugin;
