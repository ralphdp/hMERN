const routes = require("./routes");
const {
  requireAdmin,
  performanceMonitoringMiddleware,
  cacheHeadersMiddleware,
  compressionMiddleware,
  lazyLoadingMiddleware,
} = require("./middleware");

const plugin = {
  name: "hMERN Web Performance Optimization",
  version: "1.0.0",
  description:
    "Advanced web performance optimization with file optimization, caching layers, and performance features",
  dependencies: [], // No dependencies
  register: (app) => {
    console.log(
      "=== Registering hMERN Web Performance Optimization plugin ==="
    );
    console.log("Plugin name:", plugin.name);
    console.log("Plugin version:", plugin.version);

    // Store route registration function for later use (after session setup)
    app.registerWebPerformanceRoutes = () => {
      console.log("=== Registering Web Performance Routes (Post-Session) ===");

      // Register web performance routes
      app.use("/api/web-performance", routes);
      console.log("Web Performance routes registered at /api/web-performance");

      console.log("Available web performance endpoints:");
      console.log("  - GET /api/web-performance/test - Test plugin");
      console.log("  - GET /api/web-performance/health - Health check");
      console.log(
        "  - GET /api/web-performance/stats - Dashboard statistics (admin)"
      );
      console.log(
        "  - GET /api/web-performance/settings - Manage settings (admin)"
      );
      console.log(
        "  - PUT /api/web-performance/settings - Update settings (admin)"
      );
      console.log(
        "Frontend admin page available at: /admin/web-performance-optimization"
      );
      console.log("=== Web Performance Routes Registration Complete ===");
    };

    // Note: Performance middleware will be conditionally applied based on settings
    // We don't apply them globally here to avoid blocking requests
    console.log(
      "Web Performance middleware available but not globally applied"
    );
    console.log(
      "=== hMERN Web Performance Optimization plugin registered successfully ==="
    );
    console.log("NOTE: Routes will be registered after session setup");

    return true;
  },
  middleware: {
    requireAdmin,
    performanceMonitoringMiddleware,
    cacheHeadersMiddleware,
    compressionMiddleware,
    lazyLoadingMiddleware,
  },
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
    "Performance Monitoring",
  ],
  frontend: {
    adminPage: "/admin/web-performance-optimization",
    component:
      "frontend/src/plugins/web-performance-optimization/WebPerformanceAdmin.jsx",
    usage: "Admin-only web performance optimization interface",
  },
};

module.exports = plugin;
