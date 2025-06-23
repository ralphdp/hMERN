// localStorage utility for firewall admin preferences

const STORAGE_KEYS = {
  FIREWALL_PREFERENCES: "firewall_admin_preferences",
  SEARCH_TERMS: "firewall_search_terms",
  PAGINATION: "firewall_pagination",
  FILTERS: "firewall_filters",
  VIEW_SETTINGS: "firewall_view_settings",
};

const DEFAULT_PREFERENCES = {
  // Dashboard settings
  autoRefresh: false,
  autoRefreshInterval: 30, // seconds
  selectedTimeRange: "24h",
  granularity: "hour",

  // Table settings
  rulesPageSize: 10,
  logsPageSize: 10,

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

class FirewallLocalStorage {
  // Get all preferences
  static getPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FIREWALL_PREFERENCES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.warn(
        "Error reading firewall preferences from localStorage:",
        error
      );
    }
    return DEFAULT_PREFERENCES;
  }

  // Save all preferences
  static setPreferences(preferences) {
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...preferences };
      localStorage.setItem(
        STORAGE_KEYS.FIREWALL_PREFERENCES,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.warn("Error saving firewall preferences to localStorage:", error);
    }
  }

  // Get specific preference
  static getPreference(key, defaultValue = null) {
    const preferences = this.getPreferences();
    return preferences[key] !== undefined ? preferences[key] : defaultValue;
  }

  // Set specific preference
  static setPreference(key, value) {
    this.setPreferences({ [key]: value });
  }

  // Dashboard-specific methods
  static getDashboardSettings() {
    const preferences = this.getPreferences();
    return {
      autoRefresh: preferences.autoRefresh,
      autoRefreshInterval: preferences.autoRefreshInterval,
      selectedTimeRange: preferences.selectedTimeRange,
      granularity: preferences.granularity,
    };
  }

  static setDashboardSettings(settings) {
    this.setPreferences(settings);
  }

  // Table pagination methods
  static getTableSettings(table = "rules") {
    const preferences = this.getPreferences();
    return {
      pageSize: preferences[`${table}PageSize`] || 10,
      searchTerm: preferences[`${table}SearchTerm`] || "",
    };
  }

  static setTableSettings(table, settings) {
    const updates = {};
    if (settings.pageSize !== undefined) {
      updates[`${table}PageSize`] = settings.pageSize;
    }
    if (settings.searchTerm !== undefined) {
      updates[`${table}SearchTerm`] = settings.searchTerm;
    }
    this.setPreferences(updates);
  }

  // Search terms methods
  static getSearchTerm(table) {
    return this.getPreference(`${table}SearchTerm`, "");
  }

  static setSearchTerm(table, term) {
    this.setPreference(`${table}SearchTerm`, term);
  }

  // Sparkline settings
  static getSparklineSettings() {
    const preferences = this.getPreferences();
    return {
      enabled: preferences.showSparklines,
      timeRange: preferences.sparklineTimeRange,
    };
  }

  static setSparklineSettings(settings) {
    const updates = {};
    if (settings.enabled !== undefined) {
      updates.showSparklines = settings.enabled;
    }
    if (settings.timeRange !== undefined) {
      updates.sparklineTimeRange = settings.timeRange;
    }
    this.setPreferences(updates);
  }

  // Clear all preferences
  static clearPreferences() {
    try {
      localStorage.removeItem(STORAGE_KEYS.FIREWALL_PREFERENCES);
    } catch (error) {
      console.warn("Error clearing firewall preferences:", error);
    }
  }

  // Export preferences (for backup)
  static exportPreferences() {
    return this.getPreferences();
  }

  // Import preferences (for restore)
  static importPreferences(preferences) {
    try {
      const validated = { ...DEFAULT_PREFERENCES, ...preferences };
      localStorage.setItem(
        STORAGE_KEYS.FIREWALL_PREFERENCES,
        JSON.stringify(validated)
      );
      return true;
    } catch (error) {
      console.warn("Error importing firewall preferences:", error);
      return false;
    }
  }

  // Get last active tab
  static getLastActiveTab() {
    return this.getPreference("lastActiveTab", 0);
  }

  // Set last active tab
  static setLastActiveTab(tabIndex) {
    this.setPreference("lastActiveTab", tabIndex);
  }
}

export default FirewallLocalStorage;
export { STORAGE_KEYS, DEFAULT_PREFERENCES };
