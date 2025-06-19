// backend/plugins/licensing/index.js

const routes = require("./routes");
const { validateLicense } = require("./middleware");

const plugin = {
  name: "hMERN Licensing",
  version: "1.0.0",
  register: (app) => {
    console.log("=== Registering hMERN Licensing plugin ===");
    console.log("Plugin name:", plugin.name);
    console.log("Plugin version:", plugin.version);
    console.log(
      "License server URL:",
      process.env.LICENSE_SERVER_URL || "https://hmern.com"
    );
    console.log("License key configured:", !!process.env.HMERN_LICENSE_KEY);

    app.use("/api/license", routes);
    console.log("Licensing routes registered at /api/license");
    console.log(
      "Available endpoints: /api/license/test, /api/license/health, /api/license/info, /api/license/status"
    );
    console.log("=== hMERN Licensing plugin registered successfully ===");
  },
  middleware: {
    validateLicense,
  },
};

module.exports = plugin;
