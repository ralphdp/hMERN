// Plugin Registry - Fault-Tolerant Dynamic System
import {
  Shield as ShieldIcon,
  Speed as SpeedIcon,
  Extension as ExtensionIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  Code as CodeIcon,
  Person as PersonIcon,
  BarChart as ChartIcon,
} from "@mui/icons-material";

// Icon mapping for dynamic icon resolution
const iconMap = {
  Shield: ShieldIcon,
  Speed: SpeedIcon,
  Extension: ExtensionIcon,
  Settings: SettingsIcon,
  Storage: StorageIcon,
  Security: SecurityIcon,
  Analytics: AnalyticsIcon,
  Code: CodeIcon,
  Person: PersonIcon,
  BarChart: ChartIcon,
};

// Auto-detected plugin registry
let pluginRegistry = {};
let registryInitialized = false;
let dynamicConfigs = {}; // Cache for dynamic configurations
let overlayComponents = []; // Registry for plugin overlay components

// Known plugin configurations for auto-detection
const KNOWN_PLUGINS = [
  "firewall",
  "web-performance-optimization",
  "plugin-template",
  "licensing",
];

// Fetch dynamic configuration for a plugin (if available)
const fetchDynamicConfig = async (pluginName) => {
  try {
    if (pluginName === "firewall") {
      console.log(`🔧 Fetching dynamic configuration for ${pluginName}...`);
      console.log(`🔧 Document cookies:`, document.cookie);

      const response = await fetch("/api/firewall/config", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log(`🔧 Config response status:`, response.status);
      console.log(`🔧 Config response URL:`, response.url);

      if (response.ok) {
        const configData = await response.json();
        if (configData.success && configData.data) {
          console.log(`✅ Dynamic configuration loaded for ${pluginName}`);
          return configData.data;
        }
      } else {
        console.log(
          `📭 No dynamic config available for ${pluginName} (${response.status})`
        );
        const errorText = await response.text();
        console.log(`📭 Error response:`, errorText);
      }
    }

    return null;
  } catch (error) {
    console.log(
      `📭 Failed to fetch dynamic config for ${pluginName}:`,
      error.message
    );
    return null;
  }
};

// Safely load a plugin with error handling
const safeLoadPlugin = async (pluginName) => {
  try {
    console.log(`🔌 Attempting to load plugin: ${pluginName}`);

    // Dynamic import with error handling
    const pluginModule = await import(`./${pluginName}/index.js`);

    if (!pluginModule.default) {
      console.warn(`⚠️ Plugin '${pluginName}' has no default export`);
      return null;
    }

    const plugin = pluginModule.default;

    // Basic validation
    if (!plugin.name || !plugin.version) {
      console.warn(`⚠️ Plugin '${pluginName}' missing required metadata`);
      return null;
    }

    console.log(`✅ Successfully loaded plugin: ${pluginName}`);

    // Try to load dynamic configuration
    const dynamicConfig = await fetchDynamicConfig(pluginName);
    if (dynamicConfig) {
      dynamicConfigs[pluginName] = dynamicConfig;

      // Merge dynamic config with static plugin config for admin panel
      if (dynamicConfig.adminPanel && plugin.adminPanel) {
        plugin.adminPanel = {
          ...plugin.adminPanel,
          enabled:
            dynamicConfig.adminPanel.enabled ?? plugin.adminPanel.enabled,
          menuItem: {
            ...plugin.adminPanel.menuItem,
            ...(dynamicConfig.adminPanel.menuItem || {}),
          },
          card: {
            ...plugin.adminPanel.card,
            ...(dynamicConfig.adminPanel.card || {}),
          },
        };

        console.log(`🔧 Merged dynamic admin panel config for ${pluginName}`);
      }
    }

    return plugin;
  } catch (error) {
    console.log(`📭 Plugin '${pluginName}' not available: ${error.message}`);
    return null;
  }
};

// Auto-detect and load all available plugins
const autoDetectPlugins = async () => {
  console.log("🔍 Auto-detecting available plugins...");

  const detectedPlugins = {};
  let successCount = 0;

  for (const pluginName of KNOWN_PLUGINS) {
    const plugin = await safeLoadPlugin(pluginName);
    if (plugin) {
      detectedPlugins[pluginName] = plugin;
      successCount++;
    }
  }

  console.log(
    `🎯 Plugin detection complete: ${successCount}/${KNOWN_PLUGINS.length} plugins available`
  );
  return detectedPlugins;
};

// Initialize the plugin registry
const initializeRegistry = async () => {
  if (registryInitialized) {
    return pluginRegistry;
  }

  console.log("🚀 Initializing plugin registry...");

  try {
    pluginRegistry = await autoDetectPlugins();
    registryInitialized = true;

    const pluginNames = Object.keys(pluginRegistry);
    console.log("📦 Available plugins:", pluginNames);

    // Debug each plugin
    pluginNames.forEach((pluginName) => {
      const plugin = pluginRegistry[pluginName];
      console.log(`🔌 Plugin ${pluginName}:`, {
        hasAdminPanel: !!plugin?.adminPanel,
        adminPanelEnabled: plugin?.adminPanel?.enabled,
        hasMenuItems: !!plugin?.adminPanel?.menuItem,
        hasCards: !!plugin?.adminPanel?.card,
      });
    });
  } catch (error) {
    console.error("❌ Failed to initialize plugin registry:", error);
    pluginRegistry = {};
    registryInitialized = true; // Mark as initialized even if failed
  }

  return pluginRegistry;
};

// Public API functions with safe fallbacks

export const getPlugin = (pluginName) => {
  return pluginRegistry[pluginName] || null;
};

export const getAllPlugins = () => {
  try {
    return Object.keys(pluginRegistry)
      .filter((key) => pluginRegistry[key] !== null)
      .map((key) => ({
        id: key,
        ...pluginRegistry[key],
      }));
  } catch (error) {
    console.warn("Error getting all plugins:", error);
    return [];
  }
};

export const getAdminPlugins = () => {
  try {
    return getAllPlugins().filter(
      (plugin) => plugin.adminPanel && plugin.adminPanel.enabled
    );
  } catch (error) {
    console.warn("Error getting admin plugins:", error);
    return [];
  }
};

export const getIcon = (iconName) => {
  return iconMap[iconName] || ExtensionIcon;
};

export const getPluginMenuItems = () => {
  try {
    if (!registryInitialized) {
      return [];
    }

    return getAdminPlugins()
      .filter((plugin) => plugin.adminPanel?.menuItem)
      .map((plugin) => ({
        id: plugin.id,
        ...plugin.adminPanel.menuItem,
        icon: getIcon(plugin.adminPanel.menuItem.icon),
      }));
  } catch (error) {
    console.warn("Error getting plugin menu items:", error);
    return [];
  }
};

export const getPluginCards = () => {
  try {
    if (!registryInitialized) {
      return [];
    }

    return getAdminPlugins()
      .filter((plugin) => plugin.adminPanel?.card)
      .map((plugin) => ({
        id: plugin.id,
        ...plugin.adminPanel.card,
        icon: getIcon(plugin.adminPanel.card.icon),
      }));
  } catch (error) {
    console.warn("Error getting plugin cards:", error);
    return [];
  }
};

export const initializePlugins = async () => {
  return await initializeRegistry();
};

export const getPluginLoadingStatus = () => {
  return {
    total: Object.keys(pluginRegistry).length,
    loaded: Object.keys(pluginRegistry).length,
    failed: 0,
    isComplete: registryInitialized,
    initialized: registryInitialized,
  };
};

export const isPluginAvailable = (pluginName) => {
  return pluginName in pluginRegistry;
};

export const isPluginLoaded = (pluginName) => {
  return (
    pluginRegistry[pluginName] !== null &&
    pluginRegistry[pluginName] !== undefined
  );
};

export const refreshPlugins = async () => {
  console.log("🔄 Refreshing plugin registry...");
  registryInitialized = false;
  pluginRegistry = {};
  dynamicConfigs = {};
  return await initializeRegistry();
};

export const refreshDynamicConfigs = async () => {
  console.log("🔄 Refreshing dynamic plugin configurations...");

  for (const pluginName of Object.keys(pluginRegistry)) {
    try {
      const dynamicConfig = await fetchDynamicConfig(pluginName);
      if (dynamicConfig) {
        dynamicConfigs[pluginName] = dynamicConfig;

        // Update the plugin in the registry with new dynamic config
        const plugin = pluginRegistry[pluginName];
        if (dynamicConfig.adminPanel && plugin?.adminPanel) {
          plugin.adminPanel = {
            ...plugin.adminPanel,
            enabled:
              dynamicConfig.adminPanel.enabled ?? plugin.adminPanel.enabled,
            menuItem: {
              ...plugin.adminPanel.menuItem,
              ...(dynamicConfig.adminPanel.menuItem || {}),
            },
            card: {
              ...plugin.adminPanel.card,
              ...(dynamicConfig.adminPanel.card || {}),
            },
          };

          console.log(`🔧 Updated dynamic config for ${pluginName}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to refresh config for ${pluginName}:`, error);
    }
  }
};

// Overlay component registration system
export const registerOverlayComponent = (component) => {
  if (!component || !component.component) {
    console.warn("Invalid overlay component registration:", component);
    return;
  }

  // Check if this plugin is already registered to prevent duplicates
  const existingIndex = overlayComponents.findIndex(
    (existing) => existing.pluginName === component.pluginName
  );

  if (existingIndex !== -1) {
    console.log(`🔄 Updating overlay component for ${component.pluginName}`);
    overlayComponents[existingIndex] = component;
  } else {
    overlayComponents.push(component);
    console.log(
      `📌 Registered overlay component from ${
        component.pluginName || "unknown"
      }`
    );
  }
};

export const getOverlayComponents = () => {
  return overlayComponents;
};

export const clearOverlayComponents = () => {
  overlayComponents = [];
};

export default {
  getPlugin,
  getAllPlugins,
  getAdminPlugins,
  getIcon,
  getPluginMenuItems,
  getPluginCards,
  getPluginLoadingStatus,
  initializePlugins,
  isPluginAvailable,
  isPluginLoaded,
  refreshPlugins,
  refreshDynamicConfigs,
  registerOverlayComponent,
  getOverlayComponents,
  clearOverlayComponents,
};
