const { WebPerformanceAnalytics, WebPerformanceSettings } = require("./models");

/**
 * Analytics Service - Handles performance analytics tracking
 */
class AnalyticsService {
  /**
   * Record performance analytics data
   */
  static async recordPerformanceData(data) {
    try {
      const settings = await WebPerformanceSettings.findOne({
        settingsId: "default",
      });

      if (!settings?.general?.enableAnalytics) {
        return; // Analytics disabled
      }

      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const hour = now.getHours();

      // Find or create analytics record for this hour
      let analytics = await WebPerformanceAnalytics.findOne({ date, hour });

      if (!analytics) {
        analytics = new WebPerformanceAnalytics({ date, hour });
      }

      // Update performance metrics
      if (data.performance) {
        analytics.performance.pageViews += data.performance.pageViews || 0;
        analytics.performance.uniqueVisitors +=
          data.performance.uniqueVisitors || 0;

        if (data.performance.avgLoadTime) {
          analytics.performance.avgLoadTime =
            (analytics.performance.avgLoadTime + data.performance.avgLoadTime) /
            2;
        }

        if (data.performance.bounceRate) {
          analytics.performance.bounceRate =
            (analytics.performance.bounceRate + data.performance.bounceRate) /
            2;
        }

        // Core Web Vitals
        if (data.performance.coreWebVitals) {
          const vitals = data.performance.coreWebVitals;
          if (vitals.lcp)
            analytics.performance.coreWebVitals.lcp =
              (analytics.performance.coreWebVitals.lcp + vitals.lcp) / 2;
          if (vitals.fid)
            analytics.performance.coreWebVitals.fid =
              (analytics.performance.coreWebVitals.fid + vitals.fid) / 2;
          if (vitals.cls)
            analytics.performance.coreWebVitals.cls =
              (analytics.performance.coreWebVitals.cls + vitals.cls) / 2;
        }
      }

      // Update optimization metrics
      if (data.optimization) {
        analytics.optimization.filesProcessed +=
          data.optimization.filesProcessed || 0;
        analytics.optimization.bytesOptimized +=
          data.optimization.bytesOptimized || 0;
        analytics.optimization.optimizationTime +=
          data.optimization.optimizationTime || 0;

        if (data.optimization.errorRate) {
          analytics.optimization.errorRate =
            (analytics.optimization.errorRate + data.optimization.errorRate) /
            2;
        }
      }

      // Update cache metrics
      if (data.cache) {
        analytics.cache.totalRequests += data.cache.totalRequests || 0;
        analytics.cache.bandwidthSaved += data.cache.bandwidthSaved || 0;

        if (data.cache.hitRate) {
          analytics.cache.hitRate =
            (analytics.cache.hitRate + data.cache.hitRate) / 2;
        }

        if (data.cache.avgResponseTime) {
          analytics.cache.avgResponseTime =
            (analytics.cache.avgResponseTime + data.cache.avgResponseTime) / 2;
        }
      }

      await analytics.save();
      return analytics;
    } catch (error) {
      console.error("Error recording analytics data:", error);
      throw error;
    }
  }

  /**
   * Get analytics data for a time range
   */
  static async getAnalyticsData(startDate, endDate, granularity = "hour") {
    try {
      const pipeline = [
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $sort: { date: 1, hour: 1 },
        },
      ];

      if (granularity === "day") {
        pipeline.push({
          $group: {
            _id: "$date",
            performance: {
              $push: "$performance",
            },
            optimization: {
              $push: "$optimization",
            },
            cache: {
              $push: "$cache",
            },
          },
        });
      }

      const data = await WebPerformanceAnalytics.aggregate(pipeline);
      return data;
    } catch (error) {
      console.error("Error getting analytics data:", error);
      throw error;
    }
  }

  /**
   * Get analytics summary
   */
  static async getAnalyticsSummary(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - days * 24 * 60 * 60 * 1000
      );

      const summary = await WebPerformanceAnalytics.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalPageViews: { $sum: "$performance.pageViews" },
            totalUniqueVisitors: { $sum: "$performance.uniqueVisitors" },
            avgLoadTime: { $avg: "$performance.avgLoadTime" },
            avgBounceRate: { $avg: "$performance.bounceRate" },
            totalFilesProcessed: { $sum: "$optimization.filesProcessed" },
            totalBytesOptimized: { $sum: "$optimization.bytesOptimized" },
            avgOptimizationTime: { $avg: "$optimization.optimizationTime" },
            avgErrorRate: { $avg: "$optimization.errorRate" },
            avgCacheHitRate: { $avg: "$cache.hitRate" },
            totalCacheRequests: { $sum: "$cache.totalRequests" },
            totalBandwidthSaved: { $sum: "$cache.bandwidthSaved" },
            avgResponseTime: { $avg: "$cache.avgResponseTime" },
          },
        },
      ]);

      return summary[0] || {};
    } catch (error) {
      console.error("Error getting analytics summary:", error);
      throw error;
    }
  }
}

module.exports = {
  AnalyticsService,
};
