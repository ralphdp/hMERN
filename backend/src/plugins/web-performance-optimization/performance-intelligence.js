const axios = require("axios");
const {
  WebPerformanceMetrics,
  WebPerformanceSettings,
  OptimizationHistory,
  PerformanceAlerts,
  BackgroundJobs,
  CacheMetrics,
} = require("./models");
const { createPluginLogger } = require("../../utils/logger");

const logger = createPluginLogger("performance-intelligence");

/**
 * Performance Intelligence Service
 *
 * Features:
 * - Real-time performance monitoring and analysis
 * - Predictive performance optimization recommendations
 * - Performance metric aggregation and trending
 * - Automated performance issue detection
 * - Performance baseline establishment and monitoring
 * - Core Web Vitals monitoring and alerting
 * - Resource optimization recommendations
 * - Performance budget management
 */
class PerformanceIntelligence {
  constructor(config = {}) {
    this.config = {
      enablePredictiveAnalysis: config.enablePredictiveAnalysis || true,
      enableAutoOptimization: config.enableAutoOptimization || false,
      confidenceThreshold: config.confidenceThreshold || 80,
      cacheTTL: 1800000, // 30 minutes cache
      alertThresholds: config.alertThresholds || {
        loadTime: 3000, // ms
        firstByte: 500, // ms
        domReady: 2000, // ms
        fullyLoaded: 5000, // ms
        coreWebVitals: {
          lcp: 2500, // ms
          fid: 100, // ms
          cls: 0.1, // score
        },
      },
      performanceBudgets: config.performanceBudgets || {
        javascript: 170, // KB
        css: 14, // KB
        images: 1700, // KB
        fonts: 100, // KB
        total: 2000, // KB
      },
    };

    this.cache = new Map();
    this.performanceBaselines = new Map();
    this.analysisQueue = [];
    this.isProcessing = false;
    this.metrics = {
      analysisCount: 0,
      recommendationsGenerated: 0,
      optimizationsApplied: 0,
      alertsTriggered: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  // Initialize the intelligence service
  async initialize() {
    try {
      logger.config.info("Initializing Performance Intelligence Service");

      // Load configuration from database
      await this.loadConfiguration();

      // Establish performance baselines
      await this.establishBaselines();

      // Start background analysis processor
      this.startBackgroundProcessor();

      logger.config.info(
        "Performance Intelligence Service initialized successfully"
      );
      return this;
    } catch (error) {
      logger.config.error(
        "Error initializing Performance Intelligence Service:",
        error
      );
      throw error;
    }
  }

  // Load configuration from database settings
  async loadConfiguration() {
    try {
      const settings = await WebPerformanceSettings.findOne({
        settingsId: "default",
      });

      if (!settings?.intelligence) {
        logger.config.info(
          "No intelligence configuration found, using defaults"
        );
        return;
      }

      const { intelligence } = settings;

      // Update configuration with database values
      this.config = {
        ...this.config,
        enablePredictiveAnalysis:
          intelligence.enablePredictiveAnalysis ??
          this.config.enablePredictiveAnalysis,
        enableAutoOptimization:
          intelligence.enableAutoOptimization ??
          this.config.enableAutoOptimization,
        confidenceThreshold:
          intelligence.confidenceThreshold ?? this.config.confidenceThreshold,
        alertThresholds: {
          ...this.config.alertThresholds,
          ...intelligence.alertThresholds,
        },
        performanceBudgets: {
          ...this.config.performanceBudgets,
          ...intelligence.performanceBudgets,
        },
      };

      logger.config.info("Intelligence configuration loaded from database");
    } catch (error) {
      logger.config.error("Error loading intelligence configuration:", error);
      // Continue with defaults
    }
  }

  // Establish performance baselines for comparison
  async establishBaselines() {
    try {
      logger.config.info("Establishing performance baselines");

      // Get historical performance data (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const historicalData = await WebPerformanceMetrics.find({
        timestamp: { $gte: thirtyDaysAgo },
      }).sort({ timestamp: -1 });

      if (historicalData.length === 0) {
        logger.config.info(
          "No historical data found, will establish baselines over time"
        );
        return;
      }

      // Calculate baseline metrics
      const baselines = this.calculateBaselines(historicalData);

      // Store baselines in memory and database
      this.performanceBaselines.set("global", baselines);

      // Store in database for persistence
      const backgroundJob = new BackgroundJobs({
        type: "baseline_update",
        data: baselines,
        status: "completed",
        createdAt: new Date(),
        completedAt: new Date(),
      });
      await backgroundJob.save();

      logger.config.info("Performance baselines established", {
        dataPoints: historicalData.length,
        baselineMetrics: Object.keys(baselines).length,
      });
    } catch (error) {
      logger.config.error("Error establishing baselines:", error);
    }
  }

  // Calculate baseline metrics from historical data
  calculateBaselines(data) {
    const metrics = {
      loadTime: [],
      firstByte: [],
      domReady: [],
      fullyLoaded: [],
      coreWebVitals: {
        lcp: [],
        fid: [],
        cls: [],
      },
      resourceSizes: {
        javascript: [],
        css: [],
        images: [],
        fonts: [],
      },
    };

    // Aggregate metrics
    data.forEach((entry) => {
      if (entry.performance) {
        const perf = entry.performance;
        if (perf.loadTime) metrics.loadTime.push(perf.loadTime);
        if (perf.firstByte) metrics.firstByte.push(perf.firstByte);
        if (perf.domReady) metrics.domReady.push(perf.domReady);
        if (perf.fullyLoaded) metrics.fullyLoaded.push(perf.fullyLoaded);

        if (perf.coreWebVitals) {
          if (perf.coreWebVitals.lcp)
            metrics.coreWebVitals.lcp.push(perf.coreWebVitals.lcp);
          if (perf.coreWebVitals.fid)
            metrics.coreWebVitals.fid.push(perf.coreWebVitals.fid);
          if (perf.coreWebVitals.cls)
            metrics.coreWebVitals.cls.push(perf.coreWebVitals.cls);
        }
      }

      if (entry.resources) {
        const resources = entry.resources;
        if (resources.javascript)
          metrics.resourceSizes.javascript.push(resources.javascript);
        if (resources.css) metrics.resourceSizes.css.push(resources.css);
        if (resources.images)
          metrics.resourceSizes.images.push(resources.images);
        if (resources.fonts) metrics.resourceSizes.fonts.push(resources.fonts);
      }
    });

    // Calculate statistical baselines
    const baselines = {};

    Object.keys(metrics).forEach((key) => {
      if (key === "coreWebVitals") {
        baselines[key] = {};
        Object.keys(metrics[key]).forEach((vital) => {
          baselines[key][vital] = this.calculateStatistics(metrics[key][vital]);
        });
      } else if (key === "resourceSizes") {
        baselines[key] = {};
        Object.keys(metrics[key]).forEach((resource) => {
          baselines[key][resource] = this.calculateStatistics(
            metrics[key][resource]
          );
        });
      } else {
        baselines[key] = this.calculateStatistics(metrics[key]);
      }
    });

    return baselines;
  }

  // Calculate statistical measures for a dataset
  calculateStatistics(data) {
    if (!data || data.length === 0) {
      return { mean: 0, median: 0, p95: 0, p99: 0, std: 0 };
    }

    const sorted = [...data].sort((a, b) => a - b);
    const length = sorted.length;

    const mean = data.reduce((sum, val) => sum + val, 0) / length;
    const median =
      length % 2 === 0
        ? (sorted[length / 2 - 1] + sorted[length / 2]) / 2
        : sorted[Math.floor(length / 2)];

    const p95Index = Math.floor(length * 0.95);
    const p99Index = Math.floor(length * 0.99);
    const p95 = sorted[p95Index] || sorted[length - 1];
    const p99 = sorted[p99Index] || sorted[length - 1];

    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / length;
    const std = Math.sqrt(variance);

    return { mean, median, p95, p99, std, count: length };
  }

  // Analyze performance metrics and generate insights
  async analyzePerformance(metrics) {
    try {
      this.metrics.analysisCount++;

      // Check cache first
      const cacheKey = `analysis:${JSON.stringify(metrics).slice(0, 100)}`;
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return { ...cached, fromCache: true };
      }
      this.metrics.cacheMisses++;

      const analysis = {
        timestamp: new Date(),
        metrics: metrics,
        insights: [],
        recommendations: [],
        alerts: [],
        score: 0,
        grade: "F",
      };

      // Performance score calculation
      analysis.score = this.calculatePerformanceScore(metrics);
      analysis.grade = this.getPerformanceGrade(analysis.score);

      // Generate insights
      analysis.insights = await this.generateInsights(metrics);

      // Generate recommendations
      analysis.recommendations = await this.generateRecommendations(
        metrics,
        analysis.insights
      );

      // Check for alerts
      analysis.alerts = await this.checkPerformanceAlerts(metrics);

      // Store in cache
      this.setCachedResult(cacheKey, analysis);

      // Queue for background processing if needed
      if (analysis.alerts.length > 0 || analysis.score < 70) {
        this.queueForBackgroundProcessing(analysis);
      }

      this.metrics.recommendationsGenerated += analysis.recommendations.length;
      this.metrics.alertsTriggered += analysis.alerts.length;

      return analysis;
    } catch (error) {
      logger.config.error("Error analyzing performance:", error);
      throw error;
    }
  }

  // Calculate performance score (0-100)
  calculatePerformanceScore(metrics) {
    let score = 100;
    const weights = {
      loadTime: 0.3,
      firstByte: 0.2,
      coreWebVitals: 0.4,
      resourceSizes: 0.1,
    };

    // Load time scoring
    if (metrics.performance?.loadTime) {
      const loadTime = metrics.performance.loadTime;
      if (loadTime > 5000) score -= 30 * weights.loadTime;
      else if (loadTime > 3000) score -= 20 * weights.loadTime;
      else if (loadTime > 2000) score -= 10 * weights.loadTime;
    }

    // First byte scoring
    if (metrics.performance?.firstByte) {
      const firstByte = metrics.performance.firstByte;
      if (firstByte > 1000) score -= 30 * weights.firstByte;
      else if (firstByte > 500) score -= 20 * weights.firstByte;
      else if (firstByte > 200) score -= 10 * weights.firstByte;
    }

    // Core Web Vitals scoring
    if (metrics.performance?.coreWebVitals) {
      const vitals = metrics.performance.coreWebVitals;

      // LCP (Largest Contentful Paint)
      if (vitals.lcp > 4000) score -= 15 * weights.coreWebVitals;
      else if (vitals.lcp > 2500) score -= 10 * weights.coreWebVitals;

      // FID (First Input Delay)
      if (vitals.fid > 300) score -= 15 * weights.coreWebVitals;
      else if (vitals.fid > 100) score -= 10 * weights.coreWebVitals;

      // CLS (Cumulative Layout Shift)
      if (vitals.cls > 0.25) score -= 15 * weights.coreWebVitals;
      else if (vitals.cls > 0.1) score -= 10 * weights.coreWebVitals;
    }

    // Resource size scoring
    if (metrics.resources) {
      const budgets = this.config.performanceBudgets;
      const resources = metrics.resources;

      Object.keys(budgets).forEach((resource) => {
        if (resources[resource] && resources[resource] > budgets[resource]) {
          const overBudget =
            (resources[resource] - budgets[resource]) / budgets[resource];
          score -= Math.min(overBudget * 10, 20) * weights.resourceSizes;
        }
      });
    }

    return Math.max(0, Math.round(score));
  }

  // Get performance grade based on score
  getPerformanceGrade(score) {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  }

  // Generate performance insights
  async generateInsights(metrics) {
    const insights = [];
    const baselines = this.performanceBaselines.get("global");

    if (!baselines) {
      insights.push({
        type: "info",
        title: "Baseline Establishment",
        description:
          "Still establishing performance baselines. More insights will be available as data accumulates.",
        impact: "low",
      });
      return insights;
    }

    // Load time insights
    if (metrics.performance?.loadTime && baselines.loadTime) {
      const loadTime = metrics.performance.loadTime;
      const baseline = baselines.loadTime.mean;

      if (loadTime > baseline * 1.5) {
        insights.push({
          type: "warning",
          title: "Slow Load Time Detected",
          description: `Current load time (${loadTime}ms) is ${Math.round(
            (loadTime / baseline - 1) * 100
          )}% slower than baseline (${Math.round(baseline)}ms)`,
          impact: "high",
          metric: "loadTime",
          current: loadTime,
          baseline: baseline,
        });
      }
    }

    // Core Web Vitals insights
    if (metrics.performance?.coreWebVitals) {
      const vitals = metrics.performance.coreWebVitals;

      if (vitals.lcp > 2500) {
        insights.push({
          type: "error",
          title: "Poor LCP Performance",
          description: `Largest Contentful Paint (${vitals.lcp}ms) exceeds the recommended threshold of 2.5 seconds`,
          impact: "high",
          metric: "lcp",
          current: vitals.lcp,
          threshold: 2500,
        });
      }

      if (vitals.cls > 0.1) {
        insights.push({
          type: "warning",
          title: "Layout Shift Issues",
          description: `Cumulative Layout Shift (${vitals.cls}) indicates visual instability`,
          impact: "medium",
          metric: "cls",
          current: vitals.cls,
          threshold: 0.1,
        });
      }
    }

    // Resource budget insights
    if (metrics.resources) {
      const budgets = this.config.performanceBudgets;
      const resources = metrics.resources;

      Object.keys(budgets).forEach((resource) => {
        if (resources[resource] && resources[resource] > budgets[resource]) {
          const overBudget = resources[resource] - budgets[resource];
          insights.push({
            type: "warning",
            title: `${
              resource.charAt(0).toUpperCase() + resource.slice(1)
            } Budget Exceeded`,
            description: `${resource} size (${resources[resource]}KB) exceeds budget by ${overBudget}KB`,
            impact: "medium",
            metric: resource,
            current: resources[resource],
            budget: budgets[resource],
          });
        }
      });
    }

    return insights;
  }

  // Generate optimization recommendations
  async generateRecommendations(metrics, insights) {
    const recommendations = [];

    // Load time recommendations
    if (metrics.performance?.loadTime > 3000) {
      recommendations.push({
        priority: "high",
        category: "performance",
        title: "Optimize Load Time",
        description:
          "Implement code splitting and lazy loading to reduce initial bundle size",
        actions: [
          "Enable code splitting for JavaScript bundles",
          "Implement lazy loading for images and components",
          "Optimize critical rendering path",
          "Enable resource compression",
        ],
        estimatedImpact: "high",
        estimatedEffort: "medium",
      });
    }

    // Image optimization recommendations
    if (metrics.resources?.images > 1000) {
      recommendations.push({
        priority: "medium",
        category: "optimization",
        title: "Optimize Images",
        description:
          "Large image sizes detected. Implement image optimization strategies",
        actions: [
          "Convert images to WebP format",
          "Implement responsive images",
          "Enable progressive JPEG",
          "Use appropriate image dimensions",
        ],
        estimatedImpact: "high",
        estimatedEffort: "low",
      });
    }

    // Caching recommendations
    const cacheMetrics = await this.getCacheMetrics();
    if (cacheMetrics && cacheMetrics.hitRate < 0.8) {
      recommendations.push({
        priority: "medium",
        category: "caching",
        title: "Improve Cache Strategy",
        description: `Cache hit rate (${Math.round(
          cacheMetrics.hitRate * 100
        )}%) is below optimal threshold`,
        actions: [
          "Review cache headers configuration",
          "Implement service worker caching",
          "Optimize cache invalidation strategy",
          "Enable browser caching for static assets",
        ],
        estimatedImpact: "medium",
        estimatedEffort: "medium",
      });
    }

    // Core Web Vitals recommendations
    if (metrics.performance?.coreWebVitals?.lcp > 2500) {
      recommendations.push({
        priority: "high",
        category: "core-web-vitals",
        title: "Improve Largest Contentful Paint",
        description: "LCP optimization needed for better user experience",
        actions: [
          "Optimize server response times",
          "Preload critical resources",
          "Optimize images and fonts",
          "Remove render-blocking resources",
        ],
        estimatedImpact: "high",
        estimatedEffort: "high",
      });
    }

    return recommendations;
  }

  // Check for performance alerts
  async checkPerformanceAlerts(metrics) {
    const alerts = [];
    const thresholds = this.config.alertThresholds;

    // Load time alerts
    if (metrics.performance?.loadTime > thresholds.loadTime) {
      alerts.push({
        severity: "warning",
        type: "performance",
        title: "Load Time Threshold Exceeded",
        message: `Load time (${metrics.performance.loadTime}ms) exceeds threshold (${thresholds.loadTime}ms)`,
        threshold: thresholds.loadTime,
        current: metrics.performance.loadTime,
        timestamp: new Date(),
      });
    }

    // Core Web Vitals alerts
    if (metrics.performance?.coreWebVitals) {
      const vitals = metrics.performance.coreWebVitals;
      const vitalThresholds = thresholds.coreWebVitals;

      if (vitals.lcp > vitalThresholds.lcp) {
        alerts.push({
          severity: "error",
          type: "core-web-vitals",
          title: "LCP Performance Alert",
          message: `LCP (${vitals.lcp}ms) exceeds threshold (${vitalThresholds.lcp}ms)`,
          threshold: vitalThresholds.lcp,
          current: vitals.lcp,
          timestamp: new Date(),
        });
      }

      if (vitals.cls > vitalThresholds.cls) {
        alerts.push({
          severity: "warning",
          type: "core-web-vitals",
          title: "CLS Performance Alert",
          message: `CLS (${vitals.cls}) exceeds threshold (${vitalThresholds.cls})`,
          threshold: vitalThresholds.cls,
          current: vitals.cls,
          timestamp: new Date(),
        });
      }
    }

    // Store alerts in database
    for (const alert of alerts) {
      try {
        const performanceAlert = new PerformanceAlerts(alert);
        await performanceAlert.save();
      } catch (error) {
        logger.config.error("Error saving performance alert:", error);
      }
    }

    return alerts;
  }

  // Get cache metrics
  async getCacheMetrics() {
    try {
      const recentCache = await CacheMetrics.findOne()
        .sort({ timestamp: -1 })
        .limit(1);

      return recentCache
        ? {
            hitRate: recentCache.hitRate,
            responseTime: recentCache.avgResponseTime,
            bandwidthSaved: recentCache.bandwidthSaved,
          }
        : null;
    } catch (error) {
      logger.config.error("Error getting cache metrics:", error);
      return null;
    }
  }

  // Queue analysis for background processing
  queueForBackgroundProcessing(analysis) {
    this.analysisQueue.push({
      id: Date.now(),
      analysis,
      timestamp: new Date(),
    });

    // Limit queue size
    if (this.analysisQueue.length > 100) {
      this.analysisQueue = this.analysisQueue.slice(-50);
    }
  }

  // Start background processor
  startBackgroundProcessor() {
    if (this.backgroundProcessor) {
      clearInterval(this.backgroundProcessor);
    }

    this.backgroundProcessor = setInterval(async () => {
      if (this.isProcessing || this.analysisQueue.length === 0) {
        return;
      }

      this.isProcessing = true;
      try {
        const batch = this.analysisQueue.splice(0, 10); // Process 10 at a time
        await this.processAnalysisBatch(batch);
      } catch (error) {
        logger.config.error("Error processing analysis batch:", error);
      } finally {
        this.isProcessing = false;
      }
    }, 30000); // Process every 30 seconds
  }

  // Process batch of analyses
  async processAnalysisBatch(batch) {
    for (const item of batch) {
      try {
        const { analysis } = item;

        // Apply auto-optimizations if enabled
        if (this.config.enableAutoOptimization) {
          await this.applyAutoOptimizations(analysis);
        }

        // Update optimization history
        const history = new OptimizationHistory({
          type: "intelligence_analysis",
          status: "completed",
          details: {
            score: analysis.score,
            grade: analysis.grade,
            recommendationsCount: analysis.recommendations.length,
            alertsCount: analysis.alerts.length,
          },
          timestamp: new Date(),
        });
        await history.save();
      } catch (error) {
        logger.config.error("Error processing analysis item:", error);
      }
    }
  }

  // Apply automatic optimizations
  async applyAutoOptimizations(analysis) {
    const autoOptimizations = analysis.recommendations.filter(
      (rec) =>
        rec.priority === "high" &&
        rec.estimatedEffort === "low" &&
        rec.category === "optimization"
    );

    for (const optimization of autoOptimizations) {
      try {
        // This would trigger actual optimization processes
        logger.config.info("Auto-applying optimization:", optimization.title);
        this.metrics.optimizationsApplied++;
      } catch (error) {
        logger.config.error("Error applying auto-optimization:", error);
      }
    }
  }

  // Cache management
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  setCachedResult(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Simple cache cleanup
    if (this.cache.size > 1000) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 200).forEach(([key]) => this.cache.delete(key));
    }
  }

  // Get intelligence service statistics
  async getStats() {
    try {
      const recentAlerts = await PerformanceAlerts.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      const recentOptimizations = await OptimizationHistory.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      });

      return {
        ...this.metrics,
        recentAlerts,
        recentOptimizations,
        queueSize: this.analysisQueue.length,
        cacheSize: this.cache.size,
        isProcessing: this.isProcessing,
        uptime: Date.now() - (this.initTime || Date.now()),
        baselines: this.performanceBaselines.size,
      };
    } catch (error) {
      logger.config.error("Error getting intelligence stats:", error);
      return this.metrics;
    }
  }

  // Cleanup resources
  async shutdown() {
    logger.config.info("Shutting down Performance Intelligence Service");

    if (this.backgroundProcessor) {
      clearInterval(this.backgroundProcessor);
    }

    this.cache.clear();
    this.analysisQueue = [];
    this.performanceBaselines.clear();

    logger.config.info("Performance Intelligence Service shutdown complete");
  }

  // Clean up cache
  cleanupCache() {
    const now = Date.now();
    const expired = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL) {
        expired.push(key);
      }
    }

    expired.forEach((key) => this.cache.delete(key));

    logger.config.debug(`Cleaned up ${expired.length} expired cache entries`);
  }
}

// Singleton instance
let performanceIntelligenceInstance = null;

const performanceIntelligenceService = {
  async initialize(config) {
    if (!performanceIntelligenceInstance) {
      performanceIntelligenceInstance = new PerformanceIntelligence(config);
      await performanceIntelligenceInstance.initialize();
    }
    return performanceIntelligenceInstance;
  },

  getInstance() {
    return performanceIntelligenceInstance;
  },

  async shutdown() {
    if (performanceIntelligenceInstance) {
      await performanceIntelligenceInstance.shutdown();
      performanceIntelligenceInstance = null;
    }
  },
};

module.exports = {
  PerformanceIntelligence,
  performanceIntelligenceService,
};
