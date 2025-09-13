import { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";

export const useWebPerformanceMetrics = (timeRange = "24h") => {
  const [coreWebVitals, setCoreWebVitals] = useState({});
  const [optimizationStats, setOptimizationStats] = useState({});
  const [cachePerformance, setCachePerformance] = useState({});
  const [processingQueue, setProcessingQueue] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Utility functions
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  const formatPercentage = useCallback((value) => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  const formatDuration = useCallback((ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }, []);

  // Fetch Core Web Vitals
  const fetchCoreWebVitals = useCallback(async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/metrics/core-web-vitals?timeRange=${timeRange}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCoreWebVitals(data.data);
      } else {
        console.error("Failed to fetch Core Web Vitals:", response.statusText);
        setCoreWebVitals(null);
      }
    } catch (error) {
      console.error("Error fetching Core Web Vitals:", error);
      setCoreWebVitals(null);
      setError("Failed to connect to server. Please check your connection.");
    }
  }, [timeRange]);

  // Fetch optimization statistics
  const fetchOptimizationStats = useCallback(async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/metrics/optimization-stats?timeRange=${timeRange}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOptimizationStats(data.data);
      } else {
        console.error(
          "Failed to fetch optimization stats:",
          response.statusText
        );
        setOptimizationStats(null);
      }
    } catch (error) {
      console.error("Error fetching optimization stats:", error);
      setOptimizationStats(null);
      setError("Failed to connect to server. Please check your connection.");
    }
  }, [timeRange]);

  // Fetch cache performance
  const fetchCachePerformance = useCallback(async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/metrics/cache-performance?timeRange=${timeRange}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCachePerformance(data.data);
      } else {
        console.error(
          "Failed to fetch cache performance:",
          response.statusText
        );
        setCachePerformance(null);
      }
    } catch (error) {
      console.error("Error fetching cache performance:", error);
      setCachePerformance(null);
      setError("Failed to connect to server. Please check your connection.");
    }
  }, [timeRange]);

  // Fetch processing queue status
  const fetchProcessingQueue = useCallback(async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/metrics/processing-queue`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProcessingQueue(data.data);
      } else {
        console.error("Failed to fetch processing queue:", response.statusText);
        setProcessingQueue(null);
      }
    } catch (error) {
      console.error("Error fetching processing queue:", error);
      setProcessingQueue(null);
      setError("Failed to connect to server. Please check your connection.");
    }
  }, []);

  // Main fetch function
  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchCoreWebVitals(),
        fetchOptimizationStats(),
        fetchCachePerformance(),
        fetchProcessingQueue(),
      ]);
    } catch (err) {
      // Individual functions handle their own error states
      console.error("Error fetching metrics:", err);
    } finally {
      setLoading(false);
    }
  }, [
    fetchCoreWebVitals,
    fetchOptimizationStats,
    fetchCachePerformance,
    fetchProcessingQueue,
  ]);

  // Auto-fetch on mount and timeRange change
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    coreWebVitals,
    optimizationStats,
    cachePerformance,
    processingQueue,
    loading,
    error,
    fetchMetrics,
    formatFileSize,
    formatPercentage,
    formatDuration,
  };
};
