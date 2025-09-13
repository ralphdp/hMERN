// Plugin Template Frontend
import PluginTemplateAdmin from "./PluginTemplateAdmin.jsx";
import { STATIC_CONFIG } from "./config.js";

export { PluginTemplateAdmin };

export default {
  name: STATIC_CONFIG.name,
  version: STATIC_CONFIG.version,
  description:
    "A template plugin for creating new plugins in the hMERN stack with database models, API routes, and admin interface",
  components: {
    PluginTemplateAdmin,
  },
  routes: [
    {
      path: STATIC_CONFIG.frontend.adminPath,
      component: PluginTemplateAdmin,
      adminOnly: true,
    },
  ],
  metadata: {
    category: STATIC_CONFIG.category,
    tags: STATIC_CONFIG.metadata.tags,
    apiEndpoints: STATIC_CONFIG.api.basePath,
    adminInterface: STATIC_CONFIG.frontend.adminPath,
  },
  adminPanel: {
    enabled: true,
    menuItem: {
      title: "Plugin Template",
      description: "Template for new plugins",
      icon: "Extension", // Material-UI icon name
      path: STATIC_CONFIG.frontend.adminPath,
    },
    card: {
      title: "Plugin Template",
      description:
        "A comprehensive template for creating new plugins with database models, API routes, and admin interface components.",
      icon: "Extension",
      color: "primary.main",
      buttonText: "Manage Template",
      path: STATIC_CONFIG.frontend.adminPath,
    },
  },
};
