// Plugin Template - Static Configuration (Backend Version)
// CommonJS version for backend consumption

const STATIC_CONFIG = {
  // Core plugin identification
  pluginId: "plugin-template",
  name: "hMERN Plugin Template",
  version: "1.0.0",
  author: "hMERN Team",
  category: "Template",

  // API configuration
  api: {
    basePath: "/api/plugin-template",
    endpoints: {
      health: "/health",
      test: "/test",
      info: "/info",
      stats: "/stats",
      settings: "/settings",
      data: "/data",
      logs: "/logs",
      exampleAction: "/example-action",
      config: "/config",
    },
  },

  // Frontend routing
  frontend: {
    adminPath: "/admin/plugin-template",
    componentPath:
      "frontend/src/plugins/plugin-template/PluginTemplateAdmin.jsx",
  },

  // Database collections (static names)
  database: {
    collections: {
      settings: "core_plugin_template_settings",
      data: "core_plugin_template_data",
      logs: "core_plugin_template_logs",
      config: "core_plugin_template_config",
    },
    defaultSettingsId: "default",
    defaultConfigId: "plugin-template",
  },

  // Static metadata
  metadata: {
    tags: ["template", "development", "example"],
    databaseCollections: [
      "core_plugin_template_settings",
      "core_plugin_template_data",
      "core_plugin_template_logs",
      "core_plugin_template_config",
    ],
  },

  // Constants
  constants: {
    DAY_IN_MS: 24 * 60 * 60 * 1000,
    HOUR_IN_MS: 60 * 60 * 1000,
    DEFAULT_PAGE_SIZE: 20,
    DEFAULT_LOG_LIMIT: 50,
    DEFAULT_SUCCESS_TIMEOUT: 3000,
  },

  // Collection names accessible to frontend
  collections: [
    "core_plugin_template_settings",
    "core_plugin_template_data",
    "core_plugin_template_logs",
    "core_plugin_template_config",
  ],
};

// Helper function to construct full API URLs
const getApiUrl = (endpoint) => {
  return `${STATIC_CONFIG.api.basePath}${
    STATIC_CONFIG.api.endpoints[endpoint] || endpoint
  }`;
};

// Helper function to get collection name
const getCollectionName = (type) => {
  return STATIC_CONFIG.database.collections[type];
};

module.exports = {
  STATIC_CONFIG,
  getApiUrl,
  getCollectionName,
};
