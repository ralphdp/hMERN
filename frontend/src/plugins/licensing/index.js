// Licensing Plugin Frontend
import LicenseIndicator from "./LicenseIndicator.jsx";
import { STATIC_CONFIG } from "./config.js";

export { LicenseIndicator };

export default {
  name: STATIC_CONFIG.name,
  version: STATIC_CONFIG.version,
  description:
    "Core licensing system that enables and validates other plugins in the hMERN stack",
  components: {
    LicenseIndicator,
  },
  routes: [
    // No frontend routes - licensing is handled at API level
  ],
  metadata: {
    category: STATIC_CONFIG.category,
    tags: STATIC_CONFIG.metadata.tags,
    type: STATIC_CONFIG.metadata.type,
    dependencies: STATIC_CONFIG.metadata.dependencies,
    isCore: STATIC_CONFIG.metadata.isCore, // Mark as core dependency
    requiredFor: STATIC_CONFIG.metadata.requiredFor, // Required for other plugins to function
    invisible: true, // Don't show in plugin lists
    databaseCollections: STATIC_CONFIG.metadata.databaseCollections,
  },
  adminPanel: {
    enabled: false, // Keep invisible in admin interface for now
    // Future admin interface will be at STATIC_CONFIG.frontend.adminPath
    // No menuItem or card since this should be invisible in current phase
  },
  // API helper functions for frontend usage
  api: {
    basePath: STATIC_CONFIG.api.basePath,
    endpoints: STATIC_CONFIG.api.endpoints,
  },
};
