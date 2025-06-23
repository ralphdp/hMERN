const routes = require("./routes");
const { firewallMiddleware, requireAdmin } = require("./middleware");

const plugin = {
  name: "hMERN Firewall",
  version: "1.0.0",
  description:
    "Advanced firewall protection with IP blocking, rate limiting, geo-blocking, and threat detection",
  dependencies: ["licensing"], // Requires licensing plugin
  register: (app) => {
    console.log("=== Registering hMERN Firewall plugin ===");
    console.log("Plugin name:", plugin.name);
    console.log("Plugin version:", plugin.version);

    // Check if licensing plugin is available and active
    if (!app.plugins.licensing) {
      console.error(
        "FIREWALL ERROR: Licensing plugin is required but not found"
      );
      console.log("Firewall plugin will not be loaded");
      return false;
    }

    // Verify license is valid
    const { validateLicense } = app.plugins.licensing.middleware;
    if (!validateLicense) {
      console.error(
        "FIREWALL ERROR: License validation middleware not available"
      );
      console.log("Firewall plugin will not be loaded");
      return false;
    }

    console.log(
      "License validation available - proceeding with firewall registration"
    );

    // Store route registration function for later use (after session setup)
    app.registerFirewallRoutes = () => {
      console.log("=== Registering Firewall Routes (Post-Session) ===");

      // Register firewall routes (protected by license validation in production only)
      if (process.env.NODE_ENV === "production") {
        app.use("/api/firewall", validateLicense, routes.router);
        console.log(
          "Firewall routes registered at /api/firewall (with license validation)"
        );
      } else {
        app.use("/api/firewall", routes.router);
        console.log(
          "Firewall routes registered at /api/firewall (development mode - no license validation)"
        );
      }

      console.log("Available firewall endpoints:");
      console.log("  - GET /api/firewall/test - Test firewall plugin");
      console.log("  - GET /api/firewall/health - Firewall health check");
      console.log("  - GET /api/firewall/stats - Dashboard statistics (admin)");
      console.log(
        "  - GET /api/firewall/rules - Manage firewall rules (admin)"
      );
      console.log(
        "  - GET /api/firewall/blocked-ips - Manage blocked IPs (admin)"
      );
      console.log("  - GET /api/firewall/logs - View firewall logs (admin)");
      console.log("Frontend admin page available at: /admin/firewall");
      console.log("=== Firewall Routes Registration Complete ===");
    };

    // Make middleware available to the app
    app.getFirewallMiddleware = () => firewallMiddleware;

    console.log("=== hMERN Firewall plugin registered successfully ===");
    console.log("NOTE: Routes will be registered after session setup");
    console.log("NOTE: Middleware will be applied by server.js after CORS");

    return true;
  },
  middleware: {
    firewallMiddleware,
    requireAdmin,
  },
  features: [
    "IP Blocking",
    "Enhanced Rate Limiting (50/min, 400/hour)",
    "Progressive Delays (10s → 60s → 90s → 120s → Block)",
    "Geo-blocking by Country/Region",
    "Suspicious Request Detection",
    "Real-time Logging",
    "Admin Dashboard",
    "Automatic Threat Response",
  ],
  frontend: {
    adminPage: "/admin/firewall",
    component: "frontend/src/plugins/firewall/FirewallAdmin.jsx",
    usage: "Admin-only firewall management interface",
  },
};

module.exports = plugin;
