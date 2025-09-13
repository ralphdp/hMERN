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
  adminPanel: {
    enabled: true,
    menuItem: {
      title: "Web Performance",
      description: "Optimize site performance",
      icon: "Speed", // Material-UI icon name
      path: "/admin/web-performance-optimization",
    },
    card: {
      title: "Web Performance",
      description:
        "Optimize your site's performance with file compression, caching, image optimization, and advanced performance features.",
      icon: "Speed",
      color: "primary.main",
      buttonText: "Manage Performance",
      path: "/admin/web-performance-optimization",
    },
  },
};
