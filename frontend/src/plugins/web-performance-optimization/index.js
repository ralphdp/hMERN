// Web Performance Optimization Plugin
import WebPerformanceAdmin from "./WebPerformanceAdmin";

export { WebPerformanceAdmin };

export default {
  name: "hMERN Web Performance Optimization",
  version: "1.0.0",
  description:
    "Advanced web performance optimization with file optimization, caching layers, and performance features",
  components: {
    WebPerformanceAdmin,
  },
  routes: [
    {
      path: "/admin/web-performance-optimization",
      component: WebPerformanceAdmin,
      adminOnly: true,
    },
  ],
};
