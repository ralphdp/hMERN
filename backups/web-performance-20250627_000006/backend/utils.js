// Helper function to calculate metrics summary
const calculateMetricsSummary = (chartData) => {
  if (chartData.length === 0) {
    return {
      totalOptimizations: 0,
      totalSizeSaved: 0,
      avgCacheHitRate: 0,
      avgResponseTime: 0,
    };
  }

  const totals = chartData.reduce(
    (acc, day) => {
      acc.optimizations +=
        day.optimization.cssMinified +
        day.optimization.jsMinified +
        day.optimization.imagesOptimized;
      acc.sizeSaved += day.optimization.totalSizeSaved;
      acc.cacheHits += day.caching.cacheHits;
      acc.cacheMisses += day.caching.cacheMisses;
      acc.responseTimeSum += day.caching.avgResponseTime;
      acc.responseTimeCount += day.caching.avgResponseTime > 0 ? 1 : 0;
      return acc;
    },
    {
      optimizations: 0,
      sizeSaved: 0,
      cacheHits: 0,
      cacheMisses: 0,
      responseTimeSum: 0,
      responseTimeCount: 0,
    }
  );

  const totalRequests = totals.cacheHits + totals.cacheMisses;
  const cacheHitRate =
    totalRequests > 0 ? (totals.cacheHits / totalRequests) * 100 : 0;
  const avgResponseTime =
    totals.responseTimeCount > 0
      ? totals.responseTimeSum / totals.responseTimeCount
      : 0;

  return {
    totalOptimizations: totals.optimizations,
    totalSizeSaved: totals.sizeSaved,
    avgCacheHitRate: Math.round(cacheHitRate * 100) / 100,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
  };
};

module.exports = {
  calculateMetricsSummary,
};
