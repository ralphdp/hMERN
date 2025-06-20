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

    // Register firewall routes (protected by license validation)
    app.use("/api/firewall", validateLicense, routes);
    console.log("Firewall routes registered at /api/firewall");

    // Apply firewall middleware to all requests (after license check)
    app.use(firewallMiddleware);
    console.log("Firewall middleware applied to all requests");

    console.log("Available firewall endpoints:");
    console.log("  - GET /api/firewall/test - Test firewall plugin");
    console.log("  - GET /api/firewall/health - Firewall health check");
    console.log("  - GET /api/firewall/stats - Dashboard statistics (admin)");
    console.log("  - GET /api/firewall/rules - Manage firewall rules (admin)");
    console.log(
      "  - GET /api/firewall/blocked-ips - Manage blocked IPs (admin)"
    );
    console.log("  - GET /api/firewall/logs - View firewall logs (admin)");
    console.log("Frontend admin page available at: /admin/firewall");
    console.log("=== hMERN Firewall plugin registered successfully ===");

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
