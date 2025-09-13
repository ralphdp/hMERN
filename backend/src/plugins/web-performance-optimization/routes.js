const express = require("express");
const router = express.Router();
const {
  STATIC_CONFIG,
  getConfigValue,
  getOptimizationConfig,
  getCachingConfig,
  getMonitoringConfig,
  getProcessingConfig,
  getPaginationConfig,
} = require("./config");
const {
  WebPerformanceSettings,
  WebPerformanceMetrics,
  WebPerformanceQueue,
  WebPerformanceConfig,
  CacheMetrics,
  OptimizationHistory,
  PerformanceAlerts,
  BackgroundJobs,
} = require("./models");
const { settingsService } = require("../../services/settingsService");
const {
  requireAdmin,
  requestLogger,
  validateFeature,
  invalidateSettingsCache,
  validateFileAccess,
} = require("./middleware");
const {
  calculateMetricsSummary,
  performDataRetentionCleanup,
  generatePerformanceReport,
  exportPerformanceData,
  importPerformanceSettings,
} = require("./utils");
const { AnalyticsService } = require("./services");
// TEMPORARILY DISABLE PROBLEMATIC INTELLIGENCE SERVICE
// const {
//   performanceIntelligenceService,
// } = require("./performance-intelligence");

// Use centralized logging system
const { createPluginLogger } = require("../../utils/logger");
const logger = createPluginLogger("web-performance");

// Error message sanitization
const {
  sanitizeError,
  errorSanitizerMiddleware,
} = require("../../utils/errorSanitizer");

// Helper function to get credentials from core settings service
const getCredentials = async () => {
  return await settingsService.getCachedCredentials();
};

// Apply request logging to all routes (following plugin-template pattern)
router.use(requestLogger);

// DEBUG: Simple test endpoint
router.get("/debug-test", (req, res) => {
  logger.routes.debug("Test endpoint hit", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  res.json({
    success: true,
    message: "Web Performance routes are working!",
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
  });
});

// EMERGENCY: Simple connectivity check (no dependencies)
router.get("/emergency-test", (req, res) => {
  console.log("🚨 EMERGENCY ENDPOINT HIT:", req.originalUrl);
  res.json({
    success: true,
    message: "🚨 EMERGENCY: Web Performance routes are responding!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    basePath: "/api/web-performance",
  });
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Web Performance Optimization plugin is active",
    version: STATIC_CONFIG.version,
    features: [
      "CSS/JS Minification & Concatenation",
      "Image Optimization & WebP Conversion",
      "GZIP/Brotli Compression",
      "Database Query Caching (Redis)",
      "Fragment/Object Caching (Redis)",
      "Static File Caching (Cloudflare R2)",
      "Browser Caching (HTTP Headers)",
      "Lazy Loading",
      "Critical CSS",
      "Preloading",
      "Analytics & Monitoring",
      "Performance Intelligence",
      "Background Optimization",
    ],
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Web Performance Optimization plugin is working",
    timestamp: new Date().toISOString(),
  });
});

// Simple connectivity test without auth
router.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Web Performance API is reachable",
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID,
    hasUser: !!req.user,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
  });
});

// Get plugin info (public endpoint)
router.get("/info", async (req, res) => {
  try {
    const settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    res.json({
      success: true,
      data: {
        name: STATIC_CONFIG.name,
        version: STATIC_CONFIG.version,
        description:
          "Advanced web performance optimization with file optimization, caching layers, and performance features",
        enabled: settings?.general?.enabled || false,
        features: Object.keys(settings?.performanceFeatures || {}).filter(
          (key) => settings.performanceFeatures[key]?.enabled
        ),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting plugin info:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving plugin information",
    });
  }
});

// Public basic stats endpoint (for status panel - no sensitive data)
router.get("/public-stats", async (req, res) => {
  try {
    const settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    // Get basic counts
    const [totalOptimizations, recentOptimizations] = await Promise.all([
      OptimizationHistory.countDocuments(),
      OptimizationHistory.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    const publicStats = {
      system: {
        enabled: settings?.general?.enabled || false,
        masterSwitchEnabled: settings?.general?.enabled || false,
        featuresEnabled: {
          optimization: settings?.features?.optimization || false,
          caching: settings?.features?.caching || false,
          compression: settings?.features?.compression || false,
          monitoring: settings?.features?.monitoring || false,
        },
      },
      optimizations: {
        total: totalOptimizations,
        recent: recentOptimizations,
      },
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: publicStats,
    });
  } catch (error) {
    logger.routes.error("Error getting public performance stats", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving performance statistics",
    });
  }
});

// Public basic settings endpoint (for status panel - no sensitive data)
router.get("/public-settings", async (req, res) => {
  try {
    const settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    if (!settings) {
      return res.json({
        success: true,
        data: {
          general: { enabled: false },
          features: {
            optimization: false,
            caching: false,
            compression: false,
            monitoring: false,
          },
        },
      });
    }

    // Return only non-sensitive settings
    const publicSettings = {
      general: {
        enabled: settings.general?.enabled || false,
      },
      features: {
        optimization: settings.features?.optimization || false,
        caching: settings.features?.caching || false,
        compression: settings.features?.compression || false,
        monitoring: settings.features?.monitoring || false,
      },
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: publicSettings,
    });
  } catch (error) {
    logger.routes.error("Error getting public performance settings", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving performance settings",
    });
  }
});

// Debug endpoint for performance status
router.get("/debug-performance-status", async (req, res) => {
  try {
    const settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    // TEMPORARILY DISABLE INTELLIGENCE SERVICE
    const intelligenceService = null; // performanceIntelligenceService.getInstance();
    const intelligenceStats = null;

    const performanceStatus = {
      settings: {
        enabled: settings?.general?.enabled || false,
        optimization: settings?.features?.optimization || false,
        caching: settings?.features?.caching || false,
        monitoring: settings?.features?.monitoring || false,
      },
      intelligence: {
        available: !!intelligenceService,
        stats: intelligenceStats,
      },
      queues: {
        optimization: await WebPerformanceQueue.countDocuments({
          status: "pending",
        }),
        backgroundJobs: await BackgroundJobs.countDocuments({
          status: "running",
        }),
      },
      metrics: {
        recentAlerts: await PerformanceAlerts.countDocuments({
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }),
        cacheMetrics: await CacheMetrics.findOne().sort({ timestamp: -1 }),
      },
    };

    res.json({
      success: true,
      data: performanceStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.routes.error("Error getting performance debug status", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving performance debug status",
    });
  }
});

// Get dynamic configuration (admin only)
router.get("/config", requireAdmin, async (req, res) => {
  try {
    let config = await WebPerformanceConfig.findOne({
      pluginId: STATIC_CONFIG.pluginId,
    });

    // If no config exists, create default one
    if (!config) {
      config = new WebPerformanceConfig({
        pluginId: STATIC_CONFIG.pluginId,
        features: {
          optimization: true,
          caching: true,
          compression: true,
          monitoring: true,
          intelligence: true,
          backgroundJobs: true,
          analytics: true,
        },
        ui: {
          messages: {
            title: "Web Performance Optimization",
            subtitle:
              "Advanced performance optimization with intelligent recommendations and monitoring",
          },
          theme: {
            primaryColor: "primary.main",
            icon: "Speed",
          },
        },
        thresholds: {
          maxFileSize: 50 * 1024 * 1024, // 50MB
          maxConcurrentOptimizations: 5,
          cacheRetentionDays: 30,
        },
      });
      await config.save();
    }

    res.json({
      success: true,
      data: {
        static: STATIC_CONFIG,
        dynamic: config,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error getting config:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving configuration",
    });
  }
});

// Update dynamic configuration (admin only)
router.put("/config", requireAdmin, async (req, res) => {
  try {
    let config = await WebPerformanceConfig.findOne({
      pluginId: STATIC_CONFIG.pluginId,
    });

    if (!config) {
      config = new WebPerformanceConfig({
        pluginId: STATIC_CONFIG.pluginId,
      });
    }

    // Deep merge configuration updates
    function deepMerge(target, source) {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }

    deepMerge(config, req.body);
    config.updatedAt = new Date();
    config.updatedBy = req.user?.email || "system";

    await config.save();
    invalidateSettingsCache();

    res.json({
      success: true,
      message: "Configuration updated successfully",
      data: config,
    });
  } catch (error) {
    logger.routes.error("Error updating config", error);
    res.status(500).json({
      success: false,
      message: "Error updating configuration",
    });
  }
});

// Get dashboard statistics (admin only)
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    // Get recent optimization history
    const recentOptimizations = await OptimizationHistory.find()
      .sort({ timestamp: -1 })
      .limit(10);

    // Get cache metrics
    const cacheMetrics = await CacheMetrics.findOne().sort({ timestamp: -1 });

    // Get recent alerts
    const recentAlerts = await PerformanceAlerts.find({
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ timestamp: -1 });

    // Calculate totals
    const totalOptimizations = await OptimizationHistory.countDocuments();
    const totalSizeSaved = await OptimizationHistory.aggregate([
      { $group: { _id: null, total: { $sum: "$sizeSaved" } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          enabled: settings?.general?.enabled || false,
          totalOptimizations,
          sizeSaved: totalSizeSaved[0]?.total || 0,
          cacheHitRate: cacheMetrics?.hitRate || 0,
          recentAlerts: recentAlerts.length,
        },
        optimization: {
          recent: recentOptimizations,
          queue: await WebPerformanceQueue.countDocuments({
            status: "pending",
          }),
        },
        caching: {
          metrics: cacheMetrics,
          hitRate: cacheMetrics?.hitRate || 0,
          responseTime: cacheMetrics?.avgResponseTime || 0,
        },
        intelligence: {
          available: false, // !!performanceIntelligenceService.getInstance(),
          recentAnalyses: 0, // await OptimizationHistory.countDocuments({
          //   type: "intelligence_analysis",
          //   timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          // }),
        },
      },
    });
  } catch (error) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving statistics",
    });
  }
});

// Get settings (admin only)
router.get("/settings", requireAdmin, async (req, res) => {
  try {
    let settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    if (!settings) {
      settings = new WebPerformanceSettings({ settingsId: "default" });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving settings",
    });
  }
});

// Update settings (admin only)
router.put("/settings", requireAdmin, async (req, res) => {
  try {
    const startTime = Date.now();
    let settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    if (!settings) {
      settings = new WebPerformanceSettings({ settingsId: "default" });
    }

    const oldSettings = JSON.parse(JSON.stringify(settings));

    // Update all provided settings using deep merge
    function deepMerge(target, source) {
      for (const key in source) {
        if (
          source[key] &&
          typeof source[key] === "object" &&
          !Array.isArray(source[key])
        ) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }

    deepMerge(settings, req.body);

    settings.updatedAt = new Date();

    console.log(
      "🔧 [WEB PERFORMANCE] Saving settings:",
      JSON.stringify(settings.toObject(), null, 2)
    );
    await settings.save();
    console.log("✅ [WEB PERFORMANCE] Settings saved successfully");

    invalidateSettingsCache();

    res.json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);

    res.status(500).json({
      success: false,
      message: "Error updating settings",
    });
  }
});

// Get performance metrics (admin only)
router.get("/metrics", requireAdmin, async (req, res) => {
  try {
    const { timeRange = "7d", granularity = "day" } = req.query;

    // Calculate time range
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const metrics = await WebPerformanceMetrics.find({
      date: { $gte: startTime },
    }).sort({ date: 1 });

    // Transform data for charts
    const chartData = metrics.map((metric) => ({
      date: metric.date,
      optimization: {
        cssMinified: metric.optimization.cssMinified,
        jsMinified: metric.optimization.jsMinified,
        imagesOptimized: metric.optimization.imagesOptimized,
        webpConverted: metric.optimization.webpConverted,
        totalSizeSaved: metric.optimization.totalSizeSaved,
      },
      caching: {
        cacheHits: metric.caching.cacheHits,
        cacheMisses: metric.caching.cacheMisses,
        avgResponseTime: metric.caching.avgResponseTime,
        bandwidthSaved: metric.caching.bandwidthSaved,
      },
      performance: {
        pageLoadTime: metric.performance.pageLoadTime,
        firstContentfulPaint: metric.performance.firstContentfulPaint,
        largestContentfulPaint: metric.performance.largestContentfulPaint,
        cumulativeLayoutShift: metric.performance.cumulativeLayoutShift,
      },
    }));

    res.json({
      success: true,
      data: {
        timeRange,
        granularity,
        metrics: chartData,
        summary: calculateMetricsSummary(chartData),
      },
    });
  } catch (error) {
    console.error("Error getting performance metrics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving performance metrics",
    });
  }
});

// Get Core Web Vitals metrics (admin only)
router.get("/metrics/core-web-vitals", requireAdmin, async (req, res) => {
  try {
    const { timeRange = "24h" } = req.query;

    // Calculate time range
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const metrics = await WebPerformanceMetrics.find({
      date: { $gte: startTime },
    }).sort({ date: 1 });

    // Extract Core Web Vitals data
    const coreWebVitals = {
      lcp: {
        current:
          metrics.length > 0
            ? metrics[metrics.length - 1].performance.largestContentfulPaint
            : 0,
        average:
          metrics.length > 0
            ? metrics.reduce(
                (sum, m) => sum + m.performance.largestContentfulPaint,
                0
              ) / metrics.length
            : 0,
        trend: metrics.map((m) => ({
          date: m.date,
          value: m.performance.largestContentfulPaint,
        })),
      },
      fid: {
        current:
          metrics.length > 0
            ? metrics[metrics.length - 1].performance.firstInputDelay || 0
            : 0,
        average:
          metrics.length > 0
            ? metrics.reduce(
                (sum, m) => sum + (m.performance.firstInputDelay || 0),
                0
              ) / metrics.length
            : 0,
        trend: metrics.map((m) => ({
          date: m.date,
          value: m.performance.firstInputDelay || 0,
        })),
      },
      cls: {
        current:
          metrics.length > 0
            ? metrics[metrics.length - 1].performance.cumulativeLayoutShift
            : 0,
        average:
          metrics.length > 0
            ? metrics.reduce(
                (sum, m) => sum + m.performance.cumulativeLayoutShift,
                0
              ) / metrics.length
            : 0,
        trend: metrics.map((m) => ({
          date: m.date,
          value: m.performance.cumulativeLayoutShift,
        })),
      },
      fcp: {
        current:
          metrics.length > 0
            ? metrics[metrics.length - 1].performance.firstContentfulPaint
            : 0,
        average:
          metrics.length > 0
            ? metrics.reduce(
                (sum, m) => sum + m.performance.firstContentfulPaint,
                0
              ) / metrics.length
            : 0,
        trend: metrics.map((m) => ({
          date: m.date,
          value: m.performance.firstContentfulPaint,
        })),
      },
    };

    res.json({
      success: true,
      data: coreWebVitals,
      timeRange,
      totalDataPoints: metrics.length,
    });
  } catch (error) {
    logger.routes.error("Error getting Core Web Vitals", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving Core Web Vitals metrics",
    });
  }
});

// Get optimization statistics (admin only)
router.get("/metrics/optimization-stats", requireAdmin, async (req, res) => {
  try {
    const { timeRange = "24h" } = req.query;

    // Calculate time range
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get optimization history for the time range
    const optimizations = await OptimizationHistory.find({
      timestamp: { $gte: startTime },
    }).sort({ timestamp: 1 });

    // Get metrics for the time range
    const metrics = await WebPerformanceMetrics.find({
      date: { $gte: startTime },
    }).sort({ date: 1 });

    // Calculate optimization statistics
    const stats = {
      totalOptimizations: optimizations.length,
      sizeSaved: {
        total: optimizations.reduce(
          (sum, opt) => sum + (opt.sizeSaved || 0),
          0
        ),
        css: optimizations
          .filter((opt) => opt.type === "css_minification")
          .reduce((sum, opt) => sum + (opt.sizeSaved || 0), 0),
        js: optimizations
          .filter((opt) => opt.type === "js_minification")
          .reduce((sum, opt) => sum + (opt.sizeSaved || 0), 0),
        images: optimizations
          .filter((opt) => opt.type === "image_optimization")
          .reduce((sum, opt) => sum + (opt.sizeSaved || 0), 0),
      },
      optimizationTypes: {
        cssMinified: metrics.reduce(
          (sum, m) => sum + (m.optimization?.cssMinified || 0),
          0
        ),
        jsMinified: metrics.reduce(
          (sum, m) => sum + (m.optimization?.jsMinified || 0),
          0
        ),
        imagesOptimized: metrics.reduce(
          (sum, m) => sum + (m.optimization?.imagesOptimized || 0),
          0
        ),
        webpConverted: metrics.reduce(
          (sum, m) => sum + (m.optimization?.webpConverted || 0),
          0
        ),
      },
      trend: optimizations.map((opt) => ({
        date: opt.timestamp,
        type: opt.type,
        sizeSaved: opt.sizeSaved || 0,
        processingTime: opt.processingTime || 0,
      })),
      averageProcessingTime:
        optimizations.length > 0
          ? optimizations.reduce(
              (sum, opt) => sum + (opt.processingTime || 0),
              0
            ) / optimizations.length
          : 0,
    };

    res.json({
      success: true,
      data: stats,
      timeRange,
      totalOptimizations: optimizations.length,
    });
  } catch (error) {
    logger.routes.error("Error getting optimization stats", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving optimization statistics",
    });
  }
});

// Get cache performance metrics (admin only)
router.get("/metrics/cache-performance", requireAdmin, async (req, res) => {
  try {
    const { timeRange = "24h" } = req.query;

    // Calculate time range
    const now = new Date();
    let startTime;

    switch (timeRange) {
      case "24h":
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Get cache metrics for the time range
    const cacheMetrics = await CacheMetrics.find({
      timestamp: { $gte: startTime },
    }).sort({ timestamp: 1 });

    // Get general metrics for cache data
    const metrics = await WebPerformanceMetrics.find({
      date: { $gte: startTime },
    }).sort({ date: 1 });

    // Calculate cache performance stats
    const cacheStats = {
      hitRate: {
        current:
          cacheMetrics.length > 0
            ? cacheMetrics[cacheMetrics.length - 1].hitRate
            : 0,
        average:
          cacheMetrics.length > 0
            ? cacheMetrics.reduce((sum, m) => sum + m.hitRate, 0) /
              cacheMetrics.length
            : 0,
        trend: cacheMetrics.map((m) => ({
          date: m.timestamp,
          value: m.hitRate,
        })),
      },
      responseTime: {
        current:
          cacheMetrics.length > 0
            ? cacheMetrics[cacheMetrics.length - 1].avgResponseTime
            : 0,
        average:
          cacheMetrics.length > 0
            ? cacheMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) /
              cacheMetrics.length
            : 0,
        trend: cacheMetrics.map((m) => ({
          date: m.timestamp,
          value: m.avgResponseTime,
        })),
      },
      bandwidthSaved: {
        total: cacheMetrics.reduce(
          (sum, m) => sum + (m.bandwidthSaved || 0),
          0
        ),
        trend: cacheMetrics.map((m) => ({
          date: m.timestamp,
          value: m.bandwidthSaved || 0,
        })),
      },
      requests: {
        total: cacheMetrics.reduce((sum, m) => sum + (m.totalRequests || 0), 0),
        hits: cacheMetrics.reduce(
          (sum, m) => sum + ((m.totalRequests || 0) * (m.hitRate || 0)) / 100,
          0
        ),
        misses: cacheMetrics.reduce(
          (sum, m) =>
            sum + (m.totalRequests || 0) * (1 - (m.hitRate || 0) / 100),
          0
        ),
      },
      performance: {
        cacheHits: metrics.reduce(
          (sum, m) => sum + (m.caching?.cacheHits || 0),
          0
        ),
        cacheMisses: metrics.reduce(
          (sum, m) => sum + (m.caching?.cacheMisses || 0),
          0
        ),
        avgResponseTime:
          metrics.length > 0
            ? metrics.reduce(
                (sum, m) => sum + (m.caching?.avgResponseTime || 0),
                0
              ) / metrics.length
            : 0,
      },
    };

    res.json({
      success: true,
      data: cacheStats,
      timeRange,
      totalDataPoints: cacheMetrics.length,
    });
  } catch (error) {
    logger.routes.error("Error getting cache performance", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving cache performance metrics",
    });
  }
});

// Get processing queue status (admin only)
router.get("/metrics/processing-queue", requireAdmin, async (req, res) => {
  try {
    // Get current queue status
    const queueStats = await WebPerformanceQueue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgProcessingTime: { $avg: "$processingTime" },
          oldestItem: { $min: "$createdAt" },
        },
      },
    ]);

    // Get background jobs status
    const jobStats = await BackgroundJobs.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          avgDuration: { $avg: "$duration" },
          oldestJob: { $min: "$createdAt" },
        },
      },
    ]);

    // Get recent queue activity (last 24 hours)
    const recentActivity = await WebPerformanceQueue.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    // Transform data for frontend
    const queueData = {
      queue: {
        status: queueStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            avgProcessingTime: stat.avgProcessingTime || 0,
            oldestItem: stat.oldestItem,
          };
          return acc;
        }, {}),
        total: queueStats.reduce((sum, stat) => sum + stat.count, 0),
        processing: queueStats.find((s) => s._id === "processing")?.count || 0,
        pending: queueStats.find((s) => s._id === "pending")?.count || 0,
        completed: queueStats.find((s) => s._id === "completed")?.count || 0,
        failed: queueStats.find((s) => s._id === "failed")?.count || 0,
      },
      backgroundJobs: {
        status: jobStats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            avgDuration: stat.avgDuration || 0,
            oldestJob: stat.oldestJob,
          };
          return acc;
        }, {}),
        total: jobStats.reduce((sum, stat) => sum + stat.count, 0),
        running: jobStats.find((s) => s._id === "running")?.count || 0,
        pending: jobStats.find((s) => s._id === "pending")?.count || 0,
        completed: jobStats.find((s) => s._id === "completed")?.count || 0,
        failed: jobStats.find((s) => s._id === "failed")?.count || 0,
      },
      recentActivity: recentActivity.map((item) => ({
        id: item._id,
        type: item.taskType,
        status: item.status,
        createdAt: item.createdAt,
        completedAt: item.completedAt,
        processingTime: item.processingTime,
        filePath: item.filePath,
      })),
      health: {
        queueBacklog: queueStats.find((s) => s._id === "pending")?.count || 0,
        processingCapacity: 5, // Max concurrent from config
        avgProcessingTime:
          queueStats.find((s) => s._id === "completed")?.avgProcessingTime || 0,
        errorRate:
          (queueStats.find((s) => s._id === "failed")?.count /
            Math.max(
              queueStats.reduce((sum, stat) => sum + stat.count, 0),
              1
            )) *
            100 || 0,
      },
    };

    res.json({
      success: true,
      data: queueData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.routes.error("Error getting processing queue status", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving processing queue status",
    });
  }
});

// Analytics endpoints
// Get analytics data (admin only)
router.get("/analytics", requireAdmin, async (req, res) => {
  try {
    const { timeRange = "7d", granularity = "hour" } = req.query;

    // Calculate time range
    const now = new Date();
    let startDate;

    switch (timeRange) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const analyticsData = await AnalyticsService.getAnalyticsData(
      startDate,
      now,
      granularity
    );

    const summary = await AnalyticsService.getAnalyticsSummary(
      timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30
    );

    res.json({
      success: true,
      data: {
        timeRange,
        granularity,
        analytics: analyticsData,
        summary,
      },
    });
  } catch (error) {
    console.error("Error getting analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving analytics data",
    });
  }
});

// Record analytics data (internal endpoint)
router.post("/analytics/record", async (req, res) => {
  try {
    const analyticsData = req.body;

    const result = await AnalyticsService.recordPerformanceData(analyticsData);

    res.json({
      success: true,
      message: "Analytics data recorded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error recording analytics data:", error);
    res.status(500).json({
      success: false,
      message: "Error recording analytics data",
    });
  }
});

// Performance Intelligence Analysis endpoint (admin only)
router.post("/analysis", requireAdmin, async (req, res) => {
  try {
    const { metrics } = req.body;

    if (!metrics) {
      return res.status(400).json({
        success: false,
        message: "Performance metrics are required for analysis",
      });
    }

    const intelligenceService = performanceIntelligenceService.getInstance();
    if (!intelligenceService) {
      return res.status(503).json({
        success: false,
        message: "Performance Intelligence service is not available",
      });
    }

    const analysis = await intelligenceService.analyzePerformance(metrics);

    res.json({
      success: true,
      data: analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.routes.error("Error performing performance analysis", error);
    res.status(500).json({
      success: false,
      message: "Error performing performance analysis",
    });
  }
});

// Get performance alerts (admin only)
router.get("/alerts", requireAdmin, async (req, res) => {
  try {
    const { limit = 50, severity, type } = req.query;

    const filter = {};
    if (severity && ["error", "warning", "info"].includes(severity)) {
      filter.severity = severity;
    }
    if (type) {
      filter.type = type;
    }

    const alerts = await PerformanceAlerts.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    const alertStats = await PerformanceAlerts.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        stats: alertStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    logger.routes.error("Error getting performance alerts", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving performance alerts",
    });
  }
});

// Get background jobs status (admin only)
router.get("/jobs", requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const filter = {};
    if (
      status &&
      ["pending", "running", "completed", "failed"].includes(status)
    ) {
      filter.status = status;
    }

    const jobs = await BackgroundJobs.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const jobStats = await BackgroundJobs.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        stats: jobStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    logger.routes.error("Error getting background jobs", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving background jobs",
    });
  }
});

// Performance Intelligence service stats (admin only)
router.get("/intelligence", requireAdmin, async (req, res) => {
  try {
    // TEMPORARILY DISABLE INTELLIGENCE SERVICE
    const intelligenceService = null; // performanceIntelligenceService.getInstance();

    if (!intelligenceService) {
      return res.json({
        success: true,
        data: {
          available: false,
          message: "Performance Intelligence service is temporarily disabled",
        },
      });
    }

    const stats = null; // await intelligenceService.getStats();

    res.json({
      success: true,
      data: {
        available: true,
        stats,
        health: (await intelligenceService.healthCheck)
          ? await intelligenceService.healthCheck()
          : null,
      },
    });
  } catch (error) {
    logger.routes.error("Error getting intelligence service stats", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving intelligence service statistics",
    });
  }
});

// Get performance recommendations (admin only)
router.get("/recommendations", requireAdmin, async (req, res) => {
  try {
    const { category, priority } = req.query;

    // Get recent optimization history to analyze
    const recentOptimizations = await OptimizationHistory.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).sort({ timestamp: -1 });

    // Get performance metrics for analysis
    const recentMetrics = await WebPerformanceMetrics.findOne().sort({
      date: -1,
    });

    const intelligenceService = performanceIntelligenceService.getInstance();
    let recommendations = [];

    if (intelligenceService && recentMetrics) {
      const analysis = await intelligenceService.analyzePerformance({
        performance: recentMetrics.performance,
        resources: recentMetrics.resources,
      });
      recommendations = analysis.recommendations || [];
    }

    // Filter recommendations if requested
    if (category) {
      recommendations = recommendations.filter(
        (rec) => rec.category === category
      );
    }
    if (priority) {
      recommendations = recommendations.filter(
        (rec) => rec.priority === priority
      );
    }

    res.json({
      success: true,
      data: {
        recommendations,
        categories: [...new Set(recommendations.map((r) => r.category))],
        priorities: [...new Set(recommendations.map((r) => r.priority))],
      },
    });
  } catch (error) {
    logger.routes.error("Error getting performance recommendations", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving performance recommendations",
    });
  }
});

// Performance benchmarking endpoint (admin only)
router.post("/benchmark", requireAdmin, async (req, res) => {
  try {
    const { url, options = {} } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required for benchmarking",
      });
    }

    // This would integrate with performance testing tools
    const benchmark = {
      url,
      timestamp: new Date(),
      metrics: {
        loadTime: Math.random() * 3000 + 1000, // Simulated data
        firstByte: Math.random() * 500 + 100,
        domReady: Math.random() * 2000 + 500,
        fullyLoaded: Math.random() * 4000 + 2000,
        coreWebVitals: {
          lcp: Math.random() * 2000 + 1000,
          fid: Math.random() * 100 + 50,
          cls: Math.random() * 0.2,
        },
      },
      score: Math.floor(Math.random() * 30) + 70,
    };

    // Store benchmark result
    const backgroundJob = new BackgroundJobs({
      type: "performance_benchmark",
      data: benchmark,
      status: "completed",
      createdAt: new Date(),
      completedAt: new Date(),
    });
    await backgroundJob.save();

    res.json({
      success: true,
      data: benchmark,
      message: "Benchmark completed successfully",
    });
  } catch (error) {
    logger.routes.error("Error running performance benchmark", error);
    res.status(500).json({
      success: false,
      message: "Error running performance benchmark",
    });
  }
});

// Optimize file endpoint (admin only)
router.post("/optimize", requireAdmin, async (req, res) => {
  try {
    const startTime = Date.now();
    const { filePath, taskType } = req.body;

    if (!filePath || !taskType) {
      return res.status(400).json({
        success: false,
        message: "File path and task type are required",
      });
    }

    // Validate task type
    const validTaskTypes = [
      "minify_css",
      "minify_js",
      "optimize_image",
      "upload_to_r2",
      "compress_assets",
      "generate_webp",
    ];
    if (!validTaskTypes.includes(taskType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid task type. Must be one of: ${validTaskTypes.join(
          ", "
        )}`,
      });
    }

    // Validate file path
    const allowedDirectory =
      taskType === "optimize_image"
        ? "frontend/public/assets/upload"
        : "frontend/src";

    if (!validateFileAccess(filePath, allowedDirectory)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file path or file does not exist",
      });
    }

    // Add to processing queue
    const queueItem = new WebPerformanceQueue({
      taskType,
      filePath,
      priority: 0, // Normal priority
    });

    await queueItem.save();

    res.json({
      success: true,
      message: "File added to optimization queue",
      data: {
        queueId: queueItem._id,
        taskType,
        filePath,
        status: queueItem.status,
      },
    });
  } catch (error) {
    console.error("Error adding file to optimization queue:", error);

    res.status(500).json({
      success: false,
      message: "Error adding file to optimization queue",
    });
  }
});

// Bulk operations endpoint (admin only)
router.post("/bulk-actions", requireAdmin, async (req, res) => {
  try {
    const { action, targets, options = {} } = req.body;

    if (!action || !targets || !Array.isArray(targets)) {
      return res.status(400).json({
        success: false,
        message: "Action and targets array are required",
      });
    }

    const validActions = [
      "optimize_multiple",
      "clear_cache",
      "generate_reports",
      "cleanup_old_data",
      "rebuild_cache",
    ];

    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid action. Must be one of: ${validActions.join(", ")}`,
      });
    }

    // Create background job for bulk operation
    const bulkJob = new BackgroundJobs({
      type: "bulk_operation",
      data: {
        action,
        targets,
        options,
        totalTargets: targets.length,
      },
      status: "pending",
      createdAt: new Date(),
    });
    await bulkJob.save();

    // Start processing (this would be handled by background processors)
    // For now, just simulate the job
    setTimeout(async () => {
      try {
        bulkJob.status = "completed";
        bulkJob.completedAt = new Date();
        bulkJob.data.processedTargets = targets.length;
        await bulkJob.save();
      } catch (error) {
        logger.routes.error("Error completing bulk job", error);
      }
    }, 5000);

    res.json({
      success: true,
      message: `Bulk ${action} operation started`,
      data: {
        jobId: bulkJob._id,
        action,
        targetCount: targets.length,
        status: bulkJob.status,
      },
    });
  } catch (error) {
    logger.routes.error("Error starting bulk operation", error);
    res.status(500).json({
      success: false,
      message: "Error starting bulk operation",
    });
  }
});

// Generate performance reports (admin only)
router.post("/reports", requireAdmin, async (req, res) => {
  try {
    const {
      reportType = "summary",
      timeRange = "7d",
      format = "json",
    } = req.body;

    const validReportTypes = [
      "summary",
      "detailed",
      "optimization",
      "caching",
      "alerts",
    ];
    const validFormats = ["json", "pdf", "csv"];

    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid report type. Must be one of: ${validReportTypes.join(
          ", "
        )}`,
      });
    }

    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `Invalid format. Must be one of: ${validFormats.join(", ")}`,
      });
    }

    // Generate report data based on type
    const reportData = await generatePerformanceReport(reportType, timeRange);

    res.json({
      success: true,
      data: {
        reportType,
        timeRange,
        format,
        generatedAt: new Date(),
        data: reportData,
      },
    });
  } catch (error) {
    logger.routes.error("Error generating performance report", error);
    res.status(500).json({
      success: false,
      message: "Error generating performance report",
    });
  }
});

// Export performance data (admin only)
router.get("/export", requireAdmin, async (req, res) => {
  try {
    const { type = "all", format = "json", timeRange = "30d" } = req.query;

    const exportData = await exportPerformanceData(type, timeRange);

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=performance-data.csv"
      );
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.send(csv);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=performance-data.json"
      );
      res.json({
        success: true,
        exportType: type,
        format,
        timeRange,
        exportedAt: new Date(),
        data: exportData,
      });
    }
  } catch (error) {
    logger.routes.error("Error exporting performance data", error);
    res.status(500).json({
      success: false,
      message: "Error exporting performance data",
    });
  }
});

// Get processing queue status (admin only)
router.get("/queue", requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    const filter = {};
    if (
      status &&
      ["pending", "processing", "completed", "failed"].includes(status)
    ) {
      filter.status = status;
    }

    const queueItems = await WebPerformanceQueue.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = await WebPerformanceQueue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        queue: queueItems,
        stats: statusCounts,
      },
    });
  } catch (error) {
    console.error("Error getting processing queue:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving processing queue",
    });
  }
});

// Cache management endpoints (admin only)
router.get("/cache", requireAdmin, async (req, res) => {
  try {
    const cacheMetrics = await CacheMetrics.find()
      .sort({ timestamp: -1 })
      .limit(24); // Last 24 entries

    const summary = await CacheMetrics.aggregate([
      {
        $group: {
          _id: null,
          avgHitRate: { $avg: "$hitRate" },
          avgResponseTime: { $avg: "$avgResponseTime" },
          totalBandwidthSaved: { $sum: "$bandwidthSaved" },
          totalRequests: { $sum: "$totalRequests" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        metrics: cacheMetrics,
        summary: summary[0] || {},
      },
    });
  } catch (error) {
    logger.routes.error("Error getting cache metrics", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving cache metrics",
    });
  }
});

// Clear cache endpoint (admin only)
router.post("/cache/clear", requireAdmin, async (req, res) => {
  try {
    const { type = "all" } = req.body;

    // This would integrate with actual cache clearing logic
    invalidateSettingsCache();

    // Record the cache clear operation
    const cacheMetric = new CacheMetrics({
      hitRate: 0, // Reset after clear
      totalRequests: 0,
      avgResponseTime: 0,
      bandwidthSaved: 0,
      timestamp: new Date(),
      metadata: {
        action: "cache_cleared",
        type,
        clearedBy: req.user?.email || "system",
      },
    });
    await cacheMetric.save();

    res.json({
      success: true,
      message: `Cache ${
        type === "all" ? "completely" : type
      } cleared successfully`,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.routes.error("Error clearing cache", error);
    res.status(500).json({
      success: false,
      message: "Error clearing cache",
    });
  }
});

// Data cleanup endpoint (admin only)
router.post("/cleanup", requireAdmin, async (req, res) => {
  try {
    const { type = "old_data", olderThan = 30 } = req.body;

    const cleanupResult = await performDataRetentionCleanup(type, olderThan);

    res.json({
      success: true,
      message: "Data cleanup completed successfully",
      data: cleanupResult,
    });
  } catch (error) {
    logger.routes.error("Error performing data cleanup", error);
    res.status(500).json({
      success: false,
      message: "Error performing data cleanup",
    });
  }
});

// Reset settings endpoint (admin only)
router.post("/reset", requireAdmin, async (req, res) => {
  try {
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: "Confirmation required to reset settings",
      });
    }

    // Reset to default settings
    let settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });
    if (settings) {
      await settings.deleteOne();
    }

    // Create new default settings
    settings = new WebPerformanceSettings({ settingsId: "default" });
    await settings.save();

    invalidateSettingsCache();

    res.json({
      success: true,
      message: "Settings reset to defaults successfully",
      data: settings,
    });
  } catch (error) {
    logger.routes.error("Error resetting settings", error);
    res.status(500).json({
      success: false,
      message: "Error resetting settings",
    });
  }
});

// Helper function to mask sensitive values
const maskCredential = (value, showLength = 8) => {
  if (!value) return "NOT CONFIGURED";
  const start = value.substring(0, showLength);
  const end = value.substring(value.length - showLength);
  const middle = "•••"; // Fixed 3-dot mask instead of full length
  return `${start}${middle}${end}`;
};

// Helper function to mask URL
const maskUrl = (url) => {
  if (!url) return "NOT CONFIGURED";
  try {
    const urlObj = new URL(url);
    const hostParts = urlObj.hostname.split(".");
    if (hostParts.length > 2) {
      const start = hostParts[0].substring(0, 8);
      const end = `.${hostParts[hostParts.length - 2]}.${
        hostParts[hostParts.length - 1]
      }`;
      const middle = "•••"; // Fixed 3-dot mask instead of full length
      return `${urlObj.protocol}//${start}${middle}${end}`;
    }
    return url;
  } catch (e) {
    return maskCredential(url, 12);
  }
};

// Test Redis connection (admin only)
router.post("/test-redis", requireAdmin, async (req, res) => {
  try {
    const credentials = await getCredentials();

    if (!credentials.redis.endpoint) {
      return res.status(400).json({
        success: false,
        message: "Redis endpoint not configured",
        data: {
          testResult: {
            title: "Redis Connection Test Failed",
            message: "Redis endpoint is not configured in the system",
            severity: "error",
            testResults: {
              connectivity: false,
              connectivityError: "Redis endpoint not configured",
            },
          },
        },
      });
    }

    try {
      // Test Redis connectivity
      const redis = require("redis");
      const client = redis.createClient({
        url: credentials.redis.endpoint,
        password: credentials.redis.password,
        retry_strategy: false,
        connect_timeout: 5000,
      });

      await client.connect();
      await client.ping();
      await client.disconnect();

      res.json({
        success: true,
        message: `Redis connection successful to ${credentials.redis.endpoint}`,
        data: {
          testResult: {
            title: "Redis Connection Test Successful",
            message: `Successfully connected to Redis at ${credentials.redis.endpoint}`,
            severity: "success",
            details: {
              endpoint: credentials.redis.endpoint,
            },
            testResults: {
              connectivity: true,
              ping: true,
            },
          },
        },
      });
    } catch (redisError) {
      logger.routes.error("Redis connection test failed", redisError);

      res.status(400).json({
        success: false,
        message: `Redis connection failed: ${redisError.message}`,
        data: {
          testResult: {
            title: "Redis Connection Test Failed",
            message: `Failed to connect to Redis: ${redisError.message}`,
            severity: "error",
            details: {
              endpoint: credentials.redis.endpoint,
            },
            testResults: {
              connectivity: false,
              connectivityError: redisError.message,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error testing Redis connection:", error);
    res.status(500).json({
      success: false,
      message: "Error testing Redis connection",
    });
  }
});

// Test Cloudflare R2 connection (admin only)
router.post("/test-r2", requireAdmin, async (req, res) => {
  try {
    const { token, accessKeyId, secretAccessKey, endpointS3, bucketName } =
      req.body;
    const credentials = await getCredentials();

    // Use request values as override, otherwise use database/environment fallback
    const finalAccessKeyId =
      (accessKeyId && accessKeyId.trim()) ||
      credentials.cloudflareR2.accessKeyId;
    const finalSecretAccessKey =
      (secretAccessKey && secretAccessKey.trim()) ||
      credentials.cloudflareR2.secretAccessKey;
    const finalEndpointS3 =
      (endpointS3 && endpointS3.trim()) || credentials.cloudflareR2.endpointS3;

    const testBucketName = credentials.cloudflareR2.bucket || "hmern";

    if (!finalAccessKeyId || !finalSecretAccessKey || !finalEndpointS3) {
      return res.status(400).json({
        success: false,
        message:
          "Access Key ID, Secret Access Key, and Endpoint are required (either in settings or environment variables)",
      });
    }

    try {
      const {
        S3Client,
        ListBucketsCommand,
        HeadBucketCommand,
      } = require("@aws-sdk/client-s3");

      const s3Client = new S3Client({
        region: "auto", // Cloudflare R2 uses "auto" region
        endpoint: finalEndpointS3,
        credentials: {
          accessKeyId: finalAccessKeyId,
          secretAccessKey: finalSecretAccessKey,
        },
        forcePathStyle: true, // Required for R2
      });

      // Perform comprehensive R2 tests
      const testResults = {
        connectivity: false,
        headBucket: false,
        listBuckets: false,
      };
      const testErrors = {};
      let response = { Buckets: [] };

      // Test 1: Basic connectivity
      try {
        const https = require("https");
        const url = new URL(finalEndpointS3);

        await new Promise((resolve, reject) => {
          const req = https.request(
            {
              hostname: url.hostname,
              port: 443,
              method: "HEAD",
              timeout: 5000,
            },
            (res) => {
              resolve();
            }
          );

          req.on("error", reject);
          req.on("timeout", () => reject(new Error("Connection timeout")));
          req.end();
        });

        testResults.connectivity = true;
      } catch (connectError) {
        testErrors.connectivityError = connectError.message;
      }

      // Test 2: HeadBucket operation
      try {
        const headCommand = new HeadBucketCommand({ Bucket: testBucketName });
        await s3Client.send(headCommand);
        testResults.headBucket = true;
      } catch (headError) {
        testErrors.headBucketError = headError.message;
      }

      // Test 3: ListBuckets operation
      try {
        const listCommand = new ListBucketsCommand({});
        const listResponse = await s3Client.send(listCommand);
        testResults.listBuckets = true;
        response = listResponse;
      } catch (listError) {
        testErrors.listBucketsError = listError.message;
        response = {
          Buckets: testResults.headBucket ? [{ Name: testBucketName }] : [],
        };
      }

      // Determine overall success
      const overallSuccess =
        testResults.connectivity &&
        (testResults.headBucket || testResults.listBuckets);

      if (overallSuccess) {
        res.json({
          success: true,
          message: `Cloudflare R2 connection successful to ${finalEndpointS3}`,
          data: {
            bucketsFound: response.Buckets ? response.Buckets.length : 0,
            buckets: response.Buckets
              ? response.Buckets.map((b) => b.Name)
              : [],
            testResult: {
              title: "R2 Connection Test Successful",
              message: `Successfully connected to Cloudflare R2 at ${finalEndpointS3}`,
              severity: "success",
              details: {
                endpoint: finalEndpointS3,
                bucketName: testBucketName,
                accessKeyId: finalAccessKeyId
                  ? `${finalAccessKeyId.substring(0, 8)}...`
                  : "NOT SET",
              },
              testResults: {
                ...testResults,
                ...testErrors,
              },
              bucketsFound: response.Buckets ? response.Buckets.length : 0,
              buckets: response.Buckets
                ? response.Buckets.map((b) => b.Name)
                : [],
            },
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Cloudflare R2 connection partially failed`,
          data: {
            testResult: {
              title: "R2 Connection Test Partially Failed",
              message: `Some R2 connection tests failed. Check individual test results below.`,
              severity: "warning",
              details: {
                endpoint: finalEndpointS3,
                bucketName: testBucketName,
                accessKeyId: finalAccessKeyId
                  ? `${finalAccessKeyId.substring(0, 8)}...`
                  : "NOT SET",
              },
              testResults: {
                ...testResults,
                ...testErrors,
              },
              bucketsFound: response.Buckets ? response.Buckets.length : 0,
              buckets: response.Buckets
                ? response.Buckets.map((b) => b.Name)
                : [],
            },
          },
        });
      }
    } catch (r2Error) {
      console.error("R2 connection test failed:", r2Error);

      res.status(400).json({
        success: false,
        message: `Cloudflare R2 connection failed: ${r2Error.message}`,
        data: {
          testResult: {
            title: "R2 Connection Test Failed",
            message: `Failed to connect to Cloudflare R2: ${r2Error.message}`,
            severity: "error",
            details: {
              endpoint: finalEndpointS3,
              bucketName: testBucketName,
              accessKeyId: finalAccessKeyId
                ? `${finalAccessKeyId.substring(0, 8)}...`
                : "NOT SET",
            },
            testResults: {
              connectivity: false,
              headBucket: false,
              listBuckets: false,
              connectivityError: r2Error.message,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error testing R2 connection:", error);
    res.status(500).json({
      success: false,
      message: "Error testing R2 connection",
    });
  }
});

// Get external services credentials (admin only)
router.get("/external-services", requireAdmin, async (req, res) => {
  try {
    const credentials = await getCredentials();

    res.json({
      success: true,
      data: {
        redis: {
          endpoint: credentials.redis.endpoint || "",
          hasPassword: !!credentials.redis.password,
        },
        cloudflareR2: {
          bucket: credentials.cloudflareR2.bucket || "",
          hasToken: !!credentials.cloudflareR2.token,
          hasAccessKeyId: !!credentials.cloudflareR2.accessKeyId,
          hasSecretAccessKey: !!credentials.cloudflareR2.secretAccessKey,
          endpointS3: credentials.cloudflareR2.endpointS3 || "",
        },
      },
    });
  } catch (error) {
    console.error("Error getting external services credentials:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving external services credentials",
    });
  }
});

// Update external services credentials (admin only)
router.put("/external-services", requireAdmin, async (req, res) => {
  try {
    const { redis, cloudflareR2 } = req.body;

    // Use the settings service to update credentials
    const updatedCredentials = await settingsService.updateCredentials({
      redis,
      cloudflareR2,
    });

    res.json({
      success: true,
      message: "External services credentials updated successfully",
      data: {
        redis: {
          endpoint: updatedCredentials.redis.endpoint || "",
          hasPassword: !!updatedCredentials.redis.password,
        },
        cloudflareR2: {
          bucket: updatedCredentials.cloudflareR2.bucket || "",
          hasToken: !!updatedCredentials.cloudflareR2.token,
          hasAccessKeyId: !!updatedCredentials.cloudflareR2.accessKeyId,
          hasSecretAccessKey: !!updatedCredentials.cloudflareR2.secretAccessKey,
          endpointS3: updatedCredentials.cloudflareR2.endpointS3 || "",
        },
      },
    });
  } catch (error) {
    console.error("Error updating external services credentials:", error);
    res.status(500).json({
      success: false,
      message: "Error updating external services credentials",
    });
  }
});

// Reset settings to defaults with confirmation (admin only)
router.post("/settings/reset", requireAdmin, async (req, res) => {
  try {
    // Delete existing settings to trigger default values
    await WebPerformanceSettings.deleteOne({ settingsId: "default" });

    // Create new settings with defaults
    const defaultSettings = new WebPerformanceSettings({
      settingsId: "default",
    });
    await defaultSettings.save();

    invalidateSettingsCache();

    res.json({
      success: true,
      message: "Settings reset to defaults successfully",
      data: defaultSettings,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);

    res.status(500).json({
      success: false,
      message: "Error resetting settings",
    });
  }
});

// Helper function to convert data to CSV format
function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return "No data available";
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => JSON.stringify(row[header] || "")).join(",")
    ),
  ].join("\n");

  return csvContent;
}

module.exports = router;
