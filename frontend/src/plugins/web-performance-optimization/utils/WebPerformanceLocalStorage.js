import { PluginLocalStorage } from "../../../utils/localStorage";

// Web Performance Plugin default preferences
const WEB_PERFORMANCE_DEFAULT_PREFERENCES = {
  // Dashboard settings
  autoRefresh: false,
  refreshInterval: 30, // seconds
  compactView: false,
  showAdvancedMetrics: false,

  // Table settings
  optimizationsPageSize: 20,
  analyticsPageSize: 25,
  alertsPageSize: 15,

  // Search settings
  optimizationsSearchTerm: "",
  analyticsSearchTerm: "",
  alertsSearchTerm: "",

  // View preferences
  theme: "auto",
  showSparklines: true,
  sparklineTimeRange: 30, // days

  // Last used filters
  priorityFilter: "",
  statusFilter: "",
  typeFilter: "",

  // UI state
  sidebarCollapsed: false,
  lastActiveTab: 0,

  // Intelligence settings
  enableAIRecommendations: true,
  autoAnalysis: false,

  // Performance settings
  optimizationMode: "balanced",
  cacheEnabled: true,
  compressionLevel: 6,
};

/**
 * WebPerformanceLocalStorage - Plugin-specific localStorage management
 * Extends PluginLocalStorage with web performance specific methods
 */
class WebPerformanceLocalStorage extends PluginLocalStorage {
  constructor() {
    super("web-performance", WEB_PERFORMANCE_DEFAULT_PREFERENCES);
  }

  // Dashboard settings methods
  static getDashboardSettings() {
    const instance = new WebPerformanceLocalStorage();
    const preferences = instance.getPreferences();
    return {
      autoRefresh: preferences.autoRefresh,
      refreshInterval: preferences.refreshInterval,
      compactView: preferences.compactView,
      showAdvancedMetrics: preferences.showAdvancedMetrics,
    };
  }

  static setDashboardSettings(settings) {
    const instance = new WebPerformanceLocalStorage();
    instance.setPreferences(settings);
  }

  // Optimization settings methods
  static getOptimizationSettings() {
    const instance = new WebPerformanceLocalStorage();
    const preferences = instance.getPreferences();
    return {
      optimizationMode: preferences.optimizationMode,
      cacheEnabled: preferences.cacheEnabled,
      compressionLevel: preferences.compressionLevel,
    };
  }

  static setOptimizationSettings(settings) {
    const instance = new WebPerformanceLocalStorage();
    instance.setPreferences(settings);
  }

  // Intelligence settings methods
  static getIntelligenceSettings() {
    const instance = new WebPerformanceLocalStorage();
    const preferences = instance.getPreferences();
    return {
      enableAIRecommendations: preferences.enableAIRecommendations,
      autoAnalysis: preferences.autoAnalysis,
    };
  }

  static setIntelligenceSettings(settings) {
    const instance = new WebPerformanceLocalStorage();
    instance.setPreferences(settings);
  }

  // Static methods for backward compatibility and ease of use
  static getPreferences() {
    const instance = new WebPerformanceLocalStorage();
    return instance.getPreferences();
  }

  static setPreferences(preferences) {
    const instance = new WebPerformanceLocalStorage();
    instance.setPreferences(preferences);
  }

  static getPreference(key, defaultValue = null) {
    const instance = new WebPerformanceLocalStorage();
    return instance.getPreference(key, defaultValue);
  }

  static setPreference(key, value) {
    const instance = new WebPerformanceLocalStorage();
    instance.setPreference(key, value);
  }

  static getTableSettings(table = "optimizations") {
    const instance = new WebPerformanceLocalStorage();
    return instance.getTableSettings(table);
  }

  static setTableSettings(table, settings) {
    const instance = new WebPerformanceLocalStorage();
    instance.setTableSettings(table, settings);
  }

  static getSearchTerm(table) {
    const instance = new WebPerformanceLocalStorage();
    return instance.getSearchTerm(table);
  }

  static setSearchTerm(table, term) {
    const instance = new WebPerformanceLocalStorage();
    instance.setSearchTerm(table, term);
  }

  static clearPreferences() {
    const instance = new WebPerformanceLocalStorage();
    instance.clearPreferences();
  }

  static exportPreferences() {
    const instance = new WebPerformanceLocalStorage();
    return instance.exportPreferences();
  }

  static importPreferences(preferences) {
    const instance = new WebPerformanceLocalStorage();
    return instance.importPreferences(preferences);
  }

  static getLastActiveTab() {
    const instance = new WebPerformanceLocalStorage();
    return instance.getLastActiveTab();
  }

  static setLastActiveTab(tabIndex) {
    const instance = new WebPerformanceLocalStorage();
    instance.setLastActiveTab(tabIndex);
  }
}

export default WebPerformanceLocalStorage;
export { WEB_PERFORMANCE_DEFAULT_PREFERENCES as DEFAULT_PREFERENCES };
