const mongoose = require("mongoose");

// Plugin Template Settings Schema
const pluginTemplateSettingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    default: "default",
    unique: true,
  },
  general: {
    enabled: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "Plugin Template",
    },
    description: {
      type: String,
      default: "A template plugin for creating new plugins",
    },
  },
  features: {
    exampleFeature: {
      type: Boolean,
      default: true,
    },
    debugMode: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Plugin Template Data Schema (example data storage)
const pluginTemplateDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  type: {
    type: String,
    enum: ["string", "number", "boolean", "object", "array"],
    default: "string",
  },
  description: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Plugin Template Logs Schema (example logging)
const pluginTemplateLogSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ["info", "warn", "error", "debug"],
    default: "info",
  },
  message: {
    type: String,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Plugin Template Dynamic Config Schema
const pluginTemplateConfigSchema = new mongoose.Schema({
  pluginId: {
    type: String,
    default: "plugin-template",
    unique: true,
  },
  // UI Configuration (runtime-configurable)
  ui: {
    theme: {
      primaryColor: {
        type: String,
        default: "primary.main",
      },
      icon: {
        type: String,
        default: "Extension",
      },
    },
    timeouts: {
      successMessage: {
        type: Number,
        default: 3000,
      },
      loadingMinHeight: {
        type: String,
        default: "400px",
      },
    },
    messages: {
      title: {
        type: String,
        default: "Plugin Template",
      },
      subtitle: {
        type: String,
        default:
          "A template plugin for creating new plugins in the hMERN stack",
      },
      successAction: {
        type: String,
        default: "Example action completed: {action}",
      },
      errorAction: {
        type: String,
        default: "Failed to perform example action: {error}",
      },
    },
  },
  // Feature toggles (runtime-configurable)
  features: {
    showStatsCards: {
      type: Boolean,
      default: true,
    },
    showFeatureList: {
      type: Boolean,
      default: true,
    },
    enableTestAction: {
      type: Boolean,
      default: true,
    },
    enableRefreshButton: {
      type: Boolean,
      default: true,
    },
  },
  // Admin panel configuration
  adminPanel: {
    enabled: {
      type: Boolean,
      default: true,
    },
    menuItem: {
      title: {
        type: String,
        default: "Plugin Template",
      },
      description: {
        type: String,
        default: "Template for new plugins",
      },
    },
    card: {
      title: {
        type: String,
        default: "Plugin Template",
      },
      description: {
        type: String,
        default:
          "A comprehensive template for creating new plugins with database models, API routes, and admin interface components.",
      },
      buttonText: {
        type: String,
        default: "Manage Template",
      },
    },
  },
  // Configuration metadata
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    default: "system",
  },
});

// Update the updatedAt field before saving
pluginTemplateSettingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

pluginTemplateDataSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

pluginTemplateConfigSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const PluginTemplateSettings = mongoose.model(
  "PluginTemplateSettings",
  pluginTemplateSettingsSchema,
  "core_plugin_template_settings"
);

const PluginTemplateData = mongoose.model(
  "PluginTemplateData",
  pluginTemplateDataSchema,
  "core_plugin_template_data"
);

const PluginTemplateLog = mongoose.model(
  "PluginTemplateLog",
  pluginTemplateLogSchema,
  "core_plugin_template_logs"
);

const PluginTemplateConfig = mongoose.model(
  "PluginTemplateConfig",
  pluginTemplateConfigSchema,
  "core_plugin_template_config"
);

module.exports = {
  PluginTemplateSettings,
  PluginTemplateData,
  PluginTemplateLog,
  PluginTemplateConfig,
};
