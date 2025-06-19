// backend/plugins/licensing/middleware.js

const axios = require("axios");

// --- Configuration ---
// These are read from your MERN app's .env file.
const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL || "https://hmern.com";
const LICENSE_KEY = process.env.HMERN_LICENSE_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL.replace(/^https?:\/\//, "");

// --- In-memory cache for license status ---
let licenseCache = null;
let lastCheck = 0;
const CACHE_DURATION = 1000 * 60 * 60; // Cache for 1 hour

/**
 * Express middleware to validate the application's license key.
 * Caches the validation result to reduce server load.
 */
const validateLicense = async (req, res, next) => {
  const now = Date.now();

  // 1. Check for a valid, recent cache entry
  if (licenseCache && now - lastCheck < CACHE_DURATION) {
    if (licenseCache.success) {
      req.licenseInfo = licenseCache.data; // Attach license data to request
      return next();
    } else {
      // If cached result was a failure, return that failure
      return res.status(403).json(licenseCache);
    }
  }

  // 2. Ensure server is configured correctly
  if (!LICENSE_KEY || !FRONTEND_URL) {
    console.error(
      "LICENSE ERROR: HMERN_LICENSE_KEY and FRONTEND_URL must be set in your .env file."
    );
    return res.status(500).json({
      success: false,
      message:
        "Licensing is not configured correctly on this application server.",
      error_code: "CONFIGURATION_ERROR",
    });
  }

  // 3. Perform live validation check with your license server
  try {
    const response = await axios.post(
      `${LICENSE_SERVER_URL}/api/license/validate`,
      {
        license_key: LICENSE_KEY,
        domain: FRONTEND_URL,
      },
      { timeout: 10000 }
    );

    lastCheck = now; // Update timestamp of the last check

    if (response.data.success) {
      console.log("License validation successful.");
      licenseCache = { success: true, ...response.data };
      req.licenseInfo = response.data.data; // Attach license data to request
      next();
    } else {
      console.warn("License validation failed:", response.data.message);
      licenseCache = { success: false, ...response.data };
      res.status(403).json(licenseCache);
    }
  } catch (error) {
    console.error("Could not connect to license server:", error.message);

    // Use stale cache on connection error if available
    if (licenseCache && licenseCache.success) {
      console.warn("Connection to license server failed. Using stale cache.");
      req.licenseInfo = licenseCache.data;
      return next();
    }

    const statusCode = error.response ? error.response.status : 503;
    const message = error.response
      ? error.response.data.message
      : "Unable to connect to license server";
    res.status(statusCode).json({
      success: false,
      message: message,
      error_code: "SERVER_UNAVAILABLE",
    });
  }
};

module.exports = { validateLicense };
