const express = require("express");
const router = express.Router();
const {
  WebPerformanceSettings,
  WebPerformanceMetrics,
  WebPerformanceQueue,
} = require("./models");
const {
  requireAdmin,
  invalidateSettingsCache,
  validateFileAccess,
} = require("./middleware");
const { calculateMetricsSummary } = require("./utils");
const { AnalyticsService } = require("./services");

// Debug middleware
router.use((req, res, next) => {
  console.log(
    `🚀 [WEB PERFORMANCE ROUTES] ${req.method} ${
      req.originalUrl
    } - ${new Date().toISOString()}`
  );
  next();
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Web Performance Optimization plugin is active",
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

// Get dashboard statistics (admin only)
router.get("/stats", requireAdmin, async (req, res) => {
  try {
    const settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    res.json({
      success: true,
      data: {
        overview: {
          enabled: settings?.general?.enabled || false,
          totalOptimizations: 0,
          sizeSaved: 0,
          cacheHitRate: 0,
        },
        optimization: {
          cssMinified: 0,
          jsMinified: 0,
          imagesOptimized: 0,
        },
        caching: {
          hits: 0,
          misses: 0,
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

// === NEW COMPREHENSIVE METRICS ENDPOINTS ===

// Metrics integration enable/disable (admin only)
router.get("/metrics-integration", requireAdmin, async (req, res) => {
  try {
    const settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    res.json({
      success: true,
      enabled: settings?.metricsIntegration?.enabled || false,
      data: settings?.metricsIntegration || { enabled: false },
    });
  } catch (error) {
    console.error("Error getting metrics integration status:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving metrics integration status",
    });
  }
});

router.put("/metrics-integration", requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;

    let settings = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });

    if (!settings) {
      settings = new WebPerformanceSettings({ settingsId: "default" });
    }

    if (!settings.metricsIntegration) {
      settings.metricsIntegration = {};
    }

    settings.metricsIntegration.enabled = enabled;
    settings.metricsIntegration.enabledAt = new Date();
    settings.updatedAt = new Date();

    await settings.save();

    res.json({
      success: true,
      message: `Metrics integration ${enabled ? "enabled" : "disabled"}`,
      data: settings.metricsIntegration,
    });
  } catch (error) {
    console.error("Error updating metrics integration:", error);
    res.status(500).json({
      success: false,
      message: "Error updating metrics integration",
    });
  }
});

// Core Web Vitals metrics (admin only)
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

    // Fetch Core Web Vitals data
    const metrics = await WebPerformanceMetrics.find({
      date: { $gte: startTime },
      "performance.largestContentfulPaint": { $exists: true },
    }).sort({ date: -1 });

    // Calculate averages and trends
    const calculateMetricData = (metricPath) => {
      const values = metrics
        .map((m) => {
          const keys = metricPath.split(".");
          return keys.reduce((obj, key) => obj?.[key], m);
        })
        .filter((val) => val !== undefined && val !== null);

      if (values.length === 0) return { value: "N/A", trend: 0 };

      const current = values.slice(0, Math.ceil(values.length / 2));
      const previous = values.slice(Math.ceil(values.length / 2));

      const currentAvg =
        current.reduce((sum, val) => sum + val, 0) / current.length;
      const previousAvg =
        previous.length > 0
          ? previous.reduce((sum, val) => sum + val, 0) / previous.length
          : currentAvg;

      const trend =
        previousAvg > 0 ? ((currentAvg - previousAvg) / previousAvg) * 100 : 0;

      return {
        value: Math.round(currentAvg),
        trend: parseFloat(trend.toFixed(1)),
      };
    };

    const coreWebVitals = {
      lcp: calculateMetricData("performance.largestContentfulPaint"),
      fid: calculateMetricData("performance.firstInputDelay"),
      cls: {
        value:
          calculateMetricData("performance.cumulativeLayoutShift").value / 100,
        trend: calculateMetricData("performance.cumulativeLayoutShift").trend,
      },
      ttfb: calculateMetricData("performance.timeToFirstByte"),
    };

    res.json({
      success: true,
      data: coreWebVitals,
    });
  } catch (error) {
    console.error("Error getting Core Web Vitals:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving Core Web Vitals metrics",
    });
  }
});

// Optimization statistics (admin only)
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

    // Fetch optimization data
    const metrics = await WebPerformanceMetrics.find({
      date: { $gte: startTime },
    }).sort({ date: -1 });

    const queueItems = await WebPerformanceQueue.find({
      createdAt: { $gte: startTime },
    });

    // Calculate optimization stats
    const totalFiles = metrics.reduce(
      (sum, m) =>
        sum +
        (m.optimization?.cssMinified || 0) +
        (m.optimization?.jsMinified || 0) +
        (m.optimization?.imagesOptimized || 0),
      0
    );

    const totalBytesSaved = metrics.reduce(
      (sum, m) => sum + (m.optimization?.totalSizeSaved || 0),
      0
    );

    const completedTasks = queueItems.filter(
      (item) => item.status === "completed"
    );
    const avgOptimizationTime =
      completedTasks.length > 0
        ? completedTasks.reduce(
            (sum, item) =>
              sum + (item.completedAt ? item.completedAt - item.createdAt : 0),
            0
          ) / completedTasks.length
        : 0;

    const successRate =
      queueItems.length > 0 ? completedTasks.length / queueItems.length : 0;

    // Generate sparkline data
    const sparklineData = metrics
      .slice(0, 20)
      .reverse()
      .map((metric, index) => ({
        x: index,
        value:
          (metric.optimization?.cssMinified || 0) +
          (metric.optimization?.jsMinified || 0) +
          (metric.optimization?.imagesOptimized || 0),
      }));

    // Generate trends data
    const trendsData = metrics
      .slice(0, 30)
      .reverse()
      .map((metric) => ({
        timestamp: metric.date,
        optimizations:
          (metric.optimization?.cssMinified || 0) +
          (metric.optimization?.jsMinified || 0) +
          (metric.optimization?.imagesOptimized || 0),
        bytesSaved: metric.optimization?.totalSizeSaved || 0,
        cacheHits:
          ((metric.caching?.cacheHits || 0) /
            Math.max(
              (metric.caching?.cacheHits || 0) +
                (metric.caching?.cacheMisses || 0),
              1
            )) *
          100,
        responseTime: metric.caching?.avgResponseTime || 0,
      }));

    // Calculate actual trends by comparing first half vs second half of data
    const calculateTrend = (currentValue, historicalData, extractValue) => {
      if (historicalData.length < 2) return 0;

      const midPoint = Math.floor(historicalData.length / 2);
      const recent = historicalData.slice(0, midPoint);
      const older = historicalData.slice(midPoint);

      const recentAvg =
        recent.length > 0
          ? recent.reduce((sum, item) => sum + extractValue(item), 0) /
            recent.length
          : 0;
      const olderAvg =
        older.length > 0
          ? older.reduce((sum, item) => sum + extractValue(item), 0) /
            older.length
          : 0;

      return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    };

    const filesProcessedTrend = calculateTrend(
      totalFiles,
      metrics,
      (m) =>
        (m.optimization?.cssMinified || 0) +
        (m.optimization?.jsMinified || 0) +
        (m.optimization?.imagesOptimized || 0)
    );

    const bytesSavedTrend = calculateTrend(
      totalBytesSaved,
      metrics,
      (m) => m.optimization?.totalSizeSaved || 0
    );

    const optimizationTimeTrend = calculateTrend(
      avgOptimizationTime,
      completedTasks,
      (item) => (item.completedAt ? item.completedAt - item.createdAt : 0)
    );

    const successRateTrend = calculateTrend(successRate, queueItems, (item) =>
      item.status === "completed" ? 1 : 0
    );

    res.json({
      success: true,
      data: {
        filesProcessed: totalFiles,
        bytesSaved: totalBytesSaved,
        avgOptimizationTime,
        successRate,
        filesProcessedTrend: parseFloat(filesProcessedTrend.toFixed(1)),
        bytesSavedTrend: parseFloat(bytesSavedTrend.toFixed(1)),
        optimizationTimeTrend: parseFloat(optimizationTimeTrend.toFixed(1)),
        successRateTrend: parseFloat(successRateTrend.toFixed(1)),
        sparklineData,
        trendsData,
      },
    });
  } catch (error) {
    console.error("Error getting optimization stats:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving optimization statistics",
    });
  }
});

// Cache performance metrics (admin only)
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

    // Fetch cache performance data
    const metrics = await WebPerformanceMetrics.find({
      date: { $gte: startTime },
    }).sort({ date: -1 });

    // Calculate cache performance
    const totalHits = metrics.reduce(
      (sum, m) => sum + (m.caching?.cacheHits || 0),
      0
    );
    const totalMisses = metrics.reduce(
      (sum, m) => sum + (m.caching?.cacheMisses || 0),
      0
    );
    const totalRequests = totalHits + totalMisses;

    const hitRate = totalRequests > 0 ? totalHits / totalRequests : 0;
    const missRate = totalRequests > 0 ? totalMisses / totalRequests : 0;

    const avgResponseTime =
      metrics.length > 0
        ? metrics.reduce(
            (sum, m) => sum + (m.caching?.avgResponseTime || 0),
            0
          ) / metrics.length
        : 0;

    const bandwidthSaved = metrics.reduce(
      (sum, m) => sum + (m.caching?.bandwidthSaved || 0),
      0
    );

    // Generate sparkline data
    const sparklineData = metrics
      .slice(0, 20)
      .reverse()
      .map((metric, index) => ({
        x: index,
        value: metric.caching?.cacheHits || 0,
      }));

    // Calculate actual trends by comparing first half vs second half of data
    const calculateCacheTrend = (historicalData, extractValue) => {
      if (historicalData.length < 2) return 0;

      const midPoint = Math.floor(historicalData.length / 2);
      const recent = historicalData.slice(0, midPoint);
      const older = historicalData.slice(midPoint);

      const recentAvg =
        recent.length > 0
          ? recent.reduce((sum, item) => sum + extractValue(item), 0) /
            recent.length
          : 0;
      const olderAvg =
        older.length > 0
          ? older.reduce((sum, item) => sum + extractValue(item), 0) /
            older.length
          : 0;

      return olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    };

    const hitRateTrend = calculateCacheTrend(metrics, (m) => {
      const hits = m.caching?.cacheHits || 0;
      const misses = m.caching?.cacheMisses || 0;
      const total = hits + misses;
      return total > 0 ? hits / total : 0;
    });

    const missRateTrend = calculateCacheTrend(metrics, (m) => {
      const hits = m.caching?.cacheHits || 0;
      const misses = m.caching?.cacheMisses || 0;
      const total = hits + misses;
      return total > 0 ? misses / total : 0;
    });

    const responseTimeTrend = calculateCacheTrend(
      metrics,
      (m) => m.caching?.avgResponseTime || 0
    );
    const bandwidthSavedTrend = calculateCacheTrend(
      metrics,
      (m) => m.caching?.bandwidthSaved || 0
    );

    res.json({
      success: true,
      data: {
        hitRate,
        missRate,
        avgResponseTime,
        bandwidthSaved,
        hitRateTrend: parseFloat(hitRateTrend.toFixed(1)),
        missRateTrend: parseFloat(missRateTrend.toFixed(1)),
        responseTimeTrend: parseFloat(responseTimeTrend.toFixed(1)),
        bandwidthSavedTrend: parseFloat(bandwidthSavedTrend.toFixed(1)),
        sparklineData,
      },
    });
  } catch (error) {
    console.error("Error getting cache performance:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving cache performance metrics",
    });
  }
});

// Processing queue metrics (admin only)
router.get("/metrics/processing-queue", requireAdmin, async (req, res) => {
  try {
    // Get current queue stats
    const stats = await WebPerformanceQueue.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusCounts = stats.reduce(
      (acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      },
      {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
      }
    );

    // Get recent activities
    const recentActivities = await WebPerformanceQueue.find({})
      .sort({ updatedAt: -1 })
      .limit(20)
      .select(
        "taskType filePath status createdAt updatedAt completedAt originalSize optimizedSize"
      );

    const formattedActivities = recentActivities.map((activity) => ({
      fileName: activity.filePath
        ? activity.filePath.split("/").pop()
        : "Unknown",
      operation:
        activity.taskType
          ?.replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()) || "Processing",
      status: activity.status,
      timestamp: activity.updatedAt || activity.createdAt,
      size: activity.originalSize || 0,
    }));

    const totalItems = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0
    );

    res.json({
      success: true,
      data: {
        ...statusCounts,
        totalItems,
        recentActivities: formattedActivities,
      },
    });
  } catch (error) {
    console.error("Error getting processing queue metrics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving processing queue metrics",
    });
  }
});

// Clear completed queue items (admin only)
router.delete("/queue/completed", requireAdmin, async (req, res) => {
  try {
    const result = await WebPerformanceQueue.deleteMany({
      status: { $in: ["completed", "failed"] },
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
    });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} completed/failed queue items`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing queue:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing queue",
    });
  }
});

// Test Redis connection (admin only)
router.post("/test-redis", requireAdmin, async (req, res) => {
  try {
    const { redisPassword } = req.body;

    // Use environment password if not provided or empty
    const finalRedisPassword =
      (redisPassword && redisPassword.trim()) || process.env.REDIS_PASSWORD;

    if (!process.env.REDIS_PUBLIC_ENDPOINT) {
      return res.status(400).json({
        success: false,
        message: "Redis endpoint not configured in environment variables",
      });
    }

    try {
      const redis = require("redis");
      const testClient = redis.createClient({
        url: process.env.REDIS_PUBLIC_ENDPOINT,
        password: finalRedisPassword || undefined,
        socket: {
          connectTimeout: 5000,
          lazyConnect: true,
        },
      });

      await testClient.connect();
      await testClient.ping();
      await testClient.quit();

      res.json({
        success: true,
        message: `Redis connection successful to ${process.env.REDIS_PUBLIC_ENDPOINT}`,
        data: {
          testResult: {
            title: "Redis Connection Test Successful",
            message: `Successfully connected to Redis at ${process.env.REDIS_PUBLIC_ENDPOINT}`,
            severity: "success",
            details: {
              endpoint: process.env.REDIS_PUBLIC_ENDPOINT,
            },
            testResults: {
              connectivity: true,
            },
          },
        },
      });
    } catch (redisError) {
      console.error("Redis connection test failed:", redisError);

      res.status(400).json({
        success: false,
        message: `Redis connection failed: ${redisError.message}`,
        data: {
          testResult: {
            title: "Redis Connection Test Failed",
            message: `Failed to connect to Redis: ${redisError.message}`,
            severity: "error",
            details: {
              endpoint: process.env.REDIS_PUBLIC_ENDPOINT,
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

    console.log(
      "🔧 [R2 TEST] Request body:",
      JSON.stringify(req.body, null, 2)
    );
    console.log("🔧 [R2 TEST] Environment check:");
    console.log(
      "  - CLOUDFLARE_ACCESS_KEY_ID:",
      process.env.CLOUDFLARE_ACCESS_KEY_ID
        ? `${process.env.CLOUDFLARE_ACCESS_KEY_ID.substring(0, 8)}...`
        : "NOT SET"
    );
    console.log(
      "  - CLOUDFLARE_SECRET_ACCESS_KEY:",
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY
        ? `${process.env.CLOUDFLARE_SECRET_ACCESS_KEY.substring(0, 8)}...`
        : "NOT SET"
    );
    console.log(
      "  - CLOUDFLARE_ENDPOINT_S3:",
      process.env.CLOUDFLARE_ENDPOINT_S3 || "NOT SET"
    );
    console.log(
      "  - CLOUDFLARE_R2_BUCKET:",
      process.env.CLOUDFLARE_R2_BUCKET || "NOT SET"
    );

    // Use environment variables as fallback if not provided in request (handle empty strings)
    const finalAccessKeyId =
      (accessKeyId && accessKeyId.trim()) ||
      process.env.CLOUDFLARE_ACCESS_KEY_ID;
    const finalSecretAccessKey =
      (secretAccessKey && secretAccessKey.trim()) ||
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
    const finalEndpointS3 =
      (endpointS3 && endpointS3.trim()) || process.env.CLOUDFLARE_ENDPOINT_S3;

    const testBucketName = "hmern"; // Use your actual bucket name

    console.log("🔧 [R2 TEST] Final credentials:", {
      accessKeyId: finalAccessKeyId
        ? `${finalAccessKeyId.substring(0, 8)}...`
        : "NOT SET",
      secretAccessKey: finalSecretAccessKey
        ? `${finalSecretAccessKey.substring(0, 8)}...`
        : "NOT SET",
      endpoint: finalEndpointS3 || "NOT SET",
      bucketName: testBucketName,
    });

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

      console.log("🔧 [R2 TEST] S3 Client created successfully");

      // Validate credentials format
      if (finalAccessKeyId.length !== 32) {
        console.log(
          "⚠️ [R2 TEST] Warning: Access Key ID should be 32 characters long for Cloudflare R2"
        );
      }
      if (finalSecretAccessKey.length !== 64) {
        console.log(
          "⚠️ [R2 TEST] Warning: Secret Access Key should be 64 characters long for Cloudflare R2"
        );
      }

      console.log(`🔧 [R2 TEST] Testing with bucket: ${testBucketName}`);

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
              console.log(
                `✅ [R2 TEST] Basic connectivity successful! Status: ${res.statusCode}`
              );
              resolve();
            }
          );

          req.on("error", reject);
          req.on("timeout", () => reject(new Error("Connection timeout")));
          req.end();
        });

        testResults.connectivity = true;
        console.log("✅ [R2 TEST] Connectivity test passed");
      } catch (connectError) {
        console.log(
          "❌ [R2 TEST] Connectivity test failed:",
          connectError.message
        );
        testErrors.connectivityError = connectError.message;
      }

      // Test 2: HeadBucket operation
      try {
        const headCommand = new HeadBucketCommand({ Bucket: testBucketName });
        await s3Client.send(headCommand);
        testResults.headBucket = true;
        console.log("✅ [R2 TEST] HeadBucket test passed");
      } catch (headError) {
        console.log("❌ [R2 TEST] HeadBucket test failed:", headError.message);
        testErrors.headBucketError = headError.message;
      }

      // Test 3: ListBuckets operation
      try {
        const listCommand = new ListBucketsCommand({});
        const listResponse = await s3Client.send(listCommand);
        testResults.listBuckets = true;
        response = listResponse;
        console.log("✅ [R2 TEST] ListBuckets test passed");
      } catch (listError) {
        console.log("❌ [R2 TEST] ListBuckets test failed:", listError.message);
        testErrors.listBucketsError = listError.message;
        // Set a default response if ListBuckets fails
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
        // Some tests failed, but we got partial results
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

// Get environment configuration (admin only)
router.get("/config", requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        defaultBucketName: process.env.CLOUDFLARE_R2_BUCKET || "hmern",
        hasRedisEndpoint: !!process.env.REDIS_PUBLIC_ENDPOINT,
        hasR2Credentials: !!(
          process.env.CLOUDFLARE_R2_BUCKET &&
          process.env.CLOUDFLARE_R2_TOKEN &&
          process.env.CLOUDFLARE_ACCESS_KEY_ID &&
          process.env.CLOUDFLARE_SECRET_ACCESS_KEY &&
          process.env.CLOUDFLARE_ENDPOINT_S3
        ),
        // Masked credential values for display
        credentials: {
          bucketName: process.env.CLOUDFLARE_R2_BUCKET || "NOT CONFIGURED",
          apiToken: maskCredential(process.env.CLOUDFLARE_R2_TOKEN, 2),
          accessKeyId: maskCredential(process.env.CLOUDFLARE_ACCESS_KEY_ID, 2),
          secretAccessKey: maskCredential(
            process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
            2
          ),
          endpointS3: maskUrl(process.env.CLOUDFLARE_ENDPOINT_S3),
          redisEndpoint: maskUrl(process.env.REDIS_PUBLIC_ENDPOINT),
        },
      },
    });
  } catch (error) {
    console.error("Error getting configuration:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving configuration",
    });
  }
});

// Reset settings to defaults (admin only)
router.post("/settings/reset", requireAdmin, async (req, res) => {
  try {
    const startTime = Date.now();

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

module.exports = router;
