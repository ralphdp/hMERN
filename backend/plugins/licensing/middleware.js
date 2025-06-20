const axios = require("axios");

// --- Configuration ---
// These are read from your MERN app's .env file.
const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL || "https://hmern.com";
const LICENSE_KEY = process.env.HMERN_LICENSE_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL.replace(
  /^https?:\/\//,
  ""
).replace(/\/$/, "");

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
    console.log("=== ENHANCED License Validation Request ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("License Server URL:", LICENSE_SERVER_URL);
    console.log(
      "License Key (first 8 chars):",
      LICENSE_KEY.substring(0, 8) + "..."
    );
    console.log(
      "License Key (last 8 chars):",
      "..." + LICENSE_KEY.substring(LICENSE_KEY.length - 8)
    );
    console.log("License Key length:", LICENSE_KEY.length);
    console.log("Domain being sent:", FRONTEND_URL);
    console.log("Environment variables:");
    console.log("  - NODE_ENV:", process.env.NODE_ENV);
    console.log("  - FRONTEND_URL (raw):", process.env.FRONTEND_URL);
    console.log("  - FRONTEND_URL (processed):", FRONTEND_URL);
    console.log("  - LICENSE_SERVER_URL:", process.env.LICENSE_SERVER_URL);
    console.log(
      "  - HMERN_LICENSE_KEY (set):",
      !!process.env.HMERN_LICENSE_KEY
    );
    console.log("Domain processing:");
    console.log("  - Original:", process.env.FRONTEND_URL);
    console.log(
      "  - After protocol removal:",
      process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.replace(/^https?:\/\//, "")
        : "undefined"
    );
    console.log("  - After trailing slash removal:", FRONTEND_URL);

    const requestPayload = {
      license_key: LICENSE_KEY,
      domain: FRONTEND_URL,
    };

    console.log("=== FULL REQUEST PAYLOAD ===");
    console.log("Request URL:", `${LICENSE_SERVER_URL}/api/license/validate`);
    console.log("Request method: POST");
    console.log("Request headers:", {
      "Content-Type": "application/json",
      "User-Agent": "axios/" + require("axios/package.json").version,
    });
    console.log(
      "Request payload (JSON):",
      JSON.stringify(requestPayload, null, 2)
    );
    console.log("Request payload (raw):", requestPayload);

    const response = await axios.post(
      `${LICENSE_SERVER_URL}/api/license/validate`,
      requestPayload,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "hMERN-License-Client/1.0",
        },
      }
    );

    console.log("=== ENHANCED License Server Response ===");
    console.log("Response timestamp:", new Date().toISOString());
    console.log("Response status:", response.status);
    console.log("Response status text:", response.statusText);
    console.log("Response headers:", response.headers);
    console.log("Response data (raw):", response.data);
    console.log(
      "Response data (JSON):",
      JSON.stringify(response.data, null, 2)
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
    console.error("=== ENHANCED License Validation Error ===");
    console.error("Error timestamp:", new Date().toISOString());
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    if (error.response) {
      console.error("=== ERROR RESPONSE DETAILS ===");
      console.error("Error status:", error.response.status);
      console.error("Error status text:", error.response.statusText);
      console.error("Error headers:", error.response.headers);
      console.error("Error data:", error.response.data);
      console.error(
        "Error data (JSON):",
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error.request) {
      console.error("=== ERROR REQUEST DETAILS ===");
      console.error("Request was made but no response received");
      console.error("Request details:", error.request);
    } else {
      console.error("=== ERROR SETUP DETAILS ===");
      console.error("Error occurred during request setup");
    }

    console.error("Full error object:", error);

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
