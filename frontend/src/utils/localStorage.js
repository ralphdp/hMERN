// Generic localStorage utility for plugin preferences

/**
 * Generic PluginLocalStorage class for managing plugin-specific localStorage preferences
 * Each plugin gets its own namespace and can define its own default preferences
 */
class PluginLocalStorage {
  constructor(pluginName, defaultPreferences = {}) {
    this.pluginName = pluginName;
    this.storageKey = `${pluginName}_preferences`;
    this.defaultPreferences = defaultPreferences;
  }

  // Get all preferences for this plugin
  getPreferences() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.defaultPreferences, ...parsed };
      }
    } catch (error) {
      console.warn(
        `Error reading ${this.pluginName} preferences from localStorage:`,
        error
      );
    }
    return this.defaultPreferences;
  }

  // Save all preferences for this plugin
  setPreferences(preferences) {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
    } catch (error) {
      console.warn(
        `Error saving ${this.pluginName} preferences to localStorage:`,
        error
      );
    }
  }

  // Get specific preference
  getPreference(key, defaultValue = null) {
    const preferences = this.getPreferences();
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  }

  // Set specific preference
  setPreference(key, value) {
    this.setPreferences({ [key]: value });
  }

  // Table pagination methods (generic across plugins)
  getTableSettings(table = "default") {
    const preferences = this.getPreferences();
    return {
      pageSize: preferences[`${table}PageSize`] || 10,
      searchTerm: preferences[`${table}SearchTerm`] || "",
    };
  }

  setTableSettings(table, settings) {
    const updates = {};
    if (settings.pageSize !== undefined) {
      updates[`${table}PageSize`] = settings.pageSize;
    }
    if (settings.searchTerm !== undefined) {
      updates[`${table}SearchTerm`] = settings.searchTerm;
    }
    this.setPreferences(updates);
  }

  // Search terms methods (generic across plugins)
  getSearchTerm(table) {
    return this.getPreference(`${table}SearchTerm`, "");
  }

  setSearchTerm(table, term) {
    this.setPreference(`${table}SearchTerm`, term);
  }

  // Clear all preferences for this plugin
  clearPreferences() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.warn(`Error clearing ${this.pluginName} preferences:`, error);
    }
  }

  // Export preferences (for backup)
  exportPreferences() {
    return this.getPreferences();
  }

  // Import preferences (for restore)
  importPreferences(preferences) {
    try {
      const validated = { ...this.defaultPreferences, ...preferences };
      localStorage.setItem(this.storageKey, JSON.stringify(validated));
      return true;
    } catch (error) {
      console.warn(`Error importing ${this.pluginName} preferences:`, error);
      return false;
    }
  }

  // Generic tab state management
  getLastActiveTab() {
    return this.getPreference("lastActiveTab", 0);
  }

  setLastActiveTab(tabIndex) {
    this.setPreference("lastActiveTab", tabIndex);
  }
}

// ===== FIREWALL-SPECIFIC IMPLEMENTATION =====
// Backward compatibility: Keep existing FirewallLocalStorage API

const FIREWALL_STORAGE_KEYS = {
  FIREWALL_PREFERENCES: "firewall_preferences", // Updated to use new generic key
  SEARCH_TERMS: "firewall_search_terms",
  PAGINATION: "firewall_pagination",
  FILTERS: "firewall_filters",
  VIEW_SETTINGS: "firewall_view_settings",
};

const FIREWALL_DEFAULT_PREFERENCES = {
  // Dashboard settings
  autoRefresh: false,
  autoRefreshInterval: 30, // seconds
  selectedTimeRange: "24h",
  granularity: "hour",

  // Table settings
  rulesPageSize: 20,
  logsPageSize: 25,

  // Search settings
  rulesSearchTerm: "",
  logsSearchTerm: "",

  // View preferences
  theme: "auto",
  compactMode: false,
  showSparklines: true,
  sparklineTimeRange: 30, // days

  // Last used filters
  ruleTypeFilter: "",
  ruleSourceFilter: "",
  logActionFilter: "",

  // UI state
  sidebarCollapsed: false,
  lastActiveTab: 0,
};

/**
 * FirewallLocalStorage - Backward compatible implementation
 * Maintains the exact same API as before while using the new generic system
 */
class FirewallLocalStorage extends PluginLocalStorage {
  constructor() {
    super("firewall", FIREWALL_DEFAULT_PREFERENCES);
  }

  // Firewall-specific dashboard methods
  static getDashboardSettings() {
    const instance = new FirewallLocalStorage();
    const preferences = instance.getPreferences();
    return {
      autoRefresh: preferences.autoRefresh,
      autoRefreshInterval: preferences.autoRefreshInterval,
      selectedTimeRange: preferences.selectedTimeRange,
      granularity: preferences.granularity,
    };
  }

  static setDashboardSettings(settings) {
    const instance = new FirewallLocalStorage();
    instance.setPreferences(settings);
  }

  // Firewall-specific sparkline methods
  static getSparklineSettings() {
    const instance = new FirewallLocalStorage();
    const preferences = instance.getPreferences();
    return {
      enabled: preferences.showSparklines,
      timeRange: preferences.sparklineTimeRange,
    };
  }

  static setSparklineSettings(settings) {
    const instance = new FirewallLocalStorage();
    const updates = {};
    if (settings.enabled !== undefined) {
      updates.showSparklines = settings.enabled;
    }
    if (settings.timeRange !== undefined) {
      updates.sparklineTimeRange = settings.timeRange;
    }
    instance.setPreferences(updates);
  }

  // Static methods for backward compatibility with existing firewall code
  static getPreferences() {
    const instance = new FirewallLocalStorage();
    return instance.getPreferences();
  }

  static setPreferences(preferences) {
    const instance = new FirewallLocalStorage();
    instance.setPreferences(preferences);
  }

  static getPreference(key, defaultValue = null) {
    const instance = new FirewallLocalStorage();
    return instance.getPreference(key, defaultValue);
  }

  static setPreference(key, value) {
    const instance = new FirewallLocalStorage();
    instance.setPreference(key, value);
  }

  static getTableSettings(table = "rules") {
    const instance = new FirewallLocalStorage();
    return instance.getTableSettings(table);
  }

  static setTableSettings(table, settings) {
    const instance = new FirewallLocalStorage();
    instance.setTableSettings(table, settings);
  }

  static getSearchTerm(table) {
    const instance = new FirewallLocalStorage();
    return instance.getSearchTerm(table);
  }

  static setSearchTerm(table, term) {
    const instance = new FirewallLocalStorage();
    instance.setSearchTerm(table, term);
  }

  static clearPreferences() {
    const instance = new FirewallLocalStorage();
    instance.clearPreferences();
  }

  static exportPreferences() {
    const instance = new FirewallLocalStorage();
    return instance.exportPreferences();
  }

  static importPreferences(preferences) {
    const instance = new FirewallLocalStorage();
    return instance.importPreferences(preferences);
  }

  static getLastActiveTab() {
    const instance = new FirewallLocalStorage();
    return instance.getLastActiveTab();
  }

  static setLastActiveTab(tabIndex) {
    const instance = new FirewallLocalStorage();
    instance.setLastActiveTab(tabIndex);
  }
}

// ===== MIGRATION HELPER =====
// Handle migration from old storage key to new storage key
const migrateFirewallPreferences = () => {
  try {
    const oldKey = "firewall_admin_preferences";
    const newKey = "firewall_preferences";

    const oldData = localStorage.getItem(oldKey);
    const newData = localStorage.getItem(newKey);

    // If old data exists but new data doesn't, migrate
    if (oldData && !newData) {
      console.log("🔄 Migrating firewall preferences to new storage format...");
      localStorage.setItem(newKey, oldData);
      localStorage.removeItem(oldKey);
      console.log("✅ Firewall preferences migration completed");
    }
  } catch (error) {
    console.warn("Error during firewall preferences migration:", error);
  }
};

// Run migration on module load
migrateFirewallPreferences();

// ===== EXPORTS =====

// Export the generic class for other plugins to use
export { PluginLocalStorage };

// Export firewall-specific items for backward compatibility
export default FirewallLocalStorage;
export {
  FIREWALL_STORAGE_KEYS as STORAGE_KEYS,
  FIREWALL_DEFAULT_PREFERENCES as DEFAULT_PREFERENCES,
};

// ===== USAGE EXAMPLES FOR OTHER PLUGINS =====

/**
 * Example usage for other plugins:
 *
 * // In your plugin file (e.g., web-performance-optimization/utils/localStorage.js)
 * import { PluginLocalStorage } from '../../../utils/localStorage';
 *
 * const WEB_PERF_DEFAULTS = {
 *   cacheEnabled: true,
 *   compressionLevel: 6,
 *   optimizationMode: 'balanced',
 *   lastActiveTab: 0,
 * };
 *
 * class WebPerformanceLocalStorage extends PluginLocalStorage {
 *   constructor() {
 *     super('web-performance', WEB_PERF_DEFAULTS);
 *   }
 *
 *   // Plugin-specific methods
 *   static getOptimizationSettings() {
 *     const instance = new WebPerformanceLocalStorage();
 *     const prefs = instance.getPreferences();
 *     return {
 *       cacheEnabled: prefs.cacheEnabled,
 *       compressionLevel: prefs.compressionLevel,
 *       optimizationMode: prefs.optimizationMode,
 *     };
 *   }
 *
 *   // Add static methods similar to FirewallLocalStorage for ease of use
 *   static getPreference(key, defaultValue) {
 *     const instance = new WebPerformanceLocalStorage();
 *     return instance.getPreference(key, defaultValue);
 *   }
 * }
 *
 * export default WebPerformanceLocalStorage;
 */
