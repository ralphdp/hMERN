const express = require("express");
const router = express.Router();
const axios = require("axios");

const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL || "https://hmern.com";
const LICENSE_KEY = process.env.HMERN_LICENSE_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.replace(/^https?:\/\//, "")
  : "localhost:3000";

/**
 * Simple test endpoint to verify the plugin is loaded.
 */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Licensing plugin is loaded and working",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Provides a health check for the licensing plugin itself.
 */
router.get("/health", (req, res) => {
  if (!LICENSE_KEY || !FRONTEND_URL) {
    return res.status(500).json({
      success: false,
      message:
        "HMERN_LICENSE_KEY and FRONTEND_URL must be configured on this application server.",
    });
  }
  res.json({
    success: true,
    message: "Licensing plugin is active.",
    license_server_url: LICENSE_SERVER_URL,
    frontend_url: FRONTEND_URL,
    license_key_set: !!LICENSE_KEY,
  });
});

/**
 * Fetches public information about the currently configured license key.
 */
router.get("/info", async (req, res) => {
  if (!LICENSE_KEY) {
    return res.status(500).json({
      success: false,
      message: "License key is not configured on this application server.",
    });
  }

  try {
    const response = await axios.post(
      `${LICENSE_SERVER_URL}/api/license/info`,
      {
        license_key: LICENSE_KEY,
      }
    );
    res.json(response.data);
  } catch (error) {
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
});

/**
 * Simple status check for the frontend license indicator.
 * This endpoint performs a full validation.
 */
router.get("/status", async (req, res) => {
  // For development on localhost, the license is always valid.
  if (
    process.env.NODE_ENV === "development" &&
    FRONTEND_URL &&
    (FRONTEND_URL.includes("localhost") || FRONTEND_URL.includes("127.0.0.1"))
  ) {
    return res.json({
      isValid: true,
      message: "Development environment active.",
    });
  }

  if (!LICENSE_KEY || !FRONTEND_URL) {
    return res.json({
      isValid: false,
      message: "License key or frontend URL is not configured.",
    });
  }

  try {
    console.log("=== ENHANCED License Status Check ===");
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

    const requestPayload = {
      license_key: LICENSE_KEY,
      domain: FRONTEND_URL, // Now this is the domain without protocol
    };

    console.log("=== FULL REQUEST PAYLOAD ===");
    console.log("Request URL:", `${LICENSE_SERVER_URL}/api/license/validate`);
    console.log("Request method: POST");
    console.log("Request headers:", {
      "Content-Type": "application/json",
      "User-Agent": "hMERN-License-Client/1.0",
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

    const isValid = response.data && response.data.success;

    res.json({
      isValid: isValid,
      message: isValid
        ? "License is active and valid for this domain."
        : response.data.message || "License is invalid.",
    });
  } catch (error) {
    console.error("=== ENHANCED License Status Check Error ===");
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

    res.json({
      isValid: false,
      message:
        error.response?.data?.message || "Unable to verify license status.",
    });
  }
});

/**
 * Debug endpoint to manually test license validation with detailed logging
 */
router.get("/debug", async (req, res) => {
  console.log("=== MANUAL LICENSE DEBUG TEST ===");
  console.log("Timestamp:", new Date().toISOString());

  // Log all environment variables
  console.log("=== ENVIRONMENT VARIABLES ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
  console.log("LICENSE_SERVER_URL:", process.env.LICENSE_SERVER_URL);
  console.log("HMERN_LICENSE_KEY (set):", !!process.env.HMERN_LICENSE_KEY);
  console.log(
    "HMERN_LICENSE_KEY (length):",
    process.env.HMERN_LICENSE_KEY ? process.env.HMERN_LICENSE_KEY.length : 0
  );

  // Log processed values
  console.log("=== PROCESSED VALUES ===");
  console.log("LICENSE_SERVER_URL (processed):", LICENSE_SERVER_URL);
  console.log(
    "LICENSE_KEY (processed):",
    LICENSE_KEY
      ? LICENSE_KEY.substring(0, 8) +
          "..." +
          LICENSE_KEY.substring(LICENSE_KEY.length - 8)
      : "NOT SET"
  );
  console.log("FRONTEND_URL (processed):", FRONTEND_URL);

  if (!LICENSE_KEY || !FRONTEND_URL) {
    console.log("=== CONFIGURATION ERROR ===");
    console.log("Missing required configuration");
    return res.json({
      success: false,
      message: "License key or frontend URL is not configured.",
      debug: {
        license_key_set: !!LICENSE_KEY,
        frontend_url_set: !!FRONTEND_URL,
        environment_vars: {
          NODE_ENV: process.env.NODE_ENV,
          FRONTEND_URL: process.env.FRONTEND_URL,
          LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL,
          HMERN_LICENSE_KEY_set: !!process.env.HMERN_LICENSE_KEY,
        },
      },
    });
  }

  try {
    const requestPayload = {
      license_key: LICENSE_KEY,
      domain: FRONTEND_URL,
    };

    console.log("=== MANUAL REQUEST DETAILS ===");
    console.log("Request URL:", `${LICENSE_SERVER_URL}/api/license/validate`);
    console.log("Request method: POST");
    console.log("Request payload:", JSON.stringify(requestPayload, null, 2));
    console.log("Request payload (raw):", requestPayload);

    console.log("=== SENDING REQUEST TO LICENSE SERVER ===");
    const startTime = Date.now();

    const response = await axios.post(
      `${LICENSE_SERVER_URL}/api/license/validate`,
      requestPayload,
      {
        timeout: 15000,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "hMERN-License-Debug/1.0",
        },
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log("=== MANUAL RESPONSE DETAILS ===");
    console.log("Response time:", responseTime + "ms");
    console.log("Response status:", response.status);
    console.log("Response status text:", response.statusText);
    console.log("Response headers:", response.headers);
    console.log("Response data:", JSON.stringify(response.data, null, 2));

    res.json({
      success: true,
      message: "Debug test completed successfully",
      debug: {
        request: {
          url: `${LICENSE_SERVER_URL}/api/license/validate`,
          method: "POST",
          payload: requestPayload,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "hMERN-License-Debug/1.0",
          },
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          responseTime: responseTime + "ms",
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          FRONTEND_URL: process.env.FRONTEND_URL,
          LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL,
          HMERN_LICENSE_KEY_set: !!process.env.HMERN_LICENSE_KEY,
        },
      },
    });
  } catch (error) {
    console.error("=== MANUAL DEBUG ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);

    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error status text:", error.response.statusText);
      console.error("Error headers:", error.response.headers);
      console.error(
        "Error data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error.request) {
      console.error("Request was made but no response received");
      console.error("Request details:", error.request);
    } else {
      console.error("Error occurred during request setup");
    }

    res.json({
      success: false,
      message: "Debug test failed",
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
      },
      debug: {
        request: {
          url: `${LICENSE_SERVER_URL}/api/license/validate`,
          method: "POST",
          payload: {
            license_key: LICENSE_KEY
              ? LICENSE_KEY.substring(0, 8) +
                "..." +
                LICENSE_KEY.substring(LICENSE_KEY.length - 8)
              : "NOT SET",
            domain: FRONTEND_URL,
          },
        },
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            }
          : null,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          FRONTEND_URL: process.env.FRONTEND_URL,
          LICENSE_SERVER_URL: process.env.LICENSE_SERVER_URL,
          HMERN_LICENSE_KEY_set: !!process.env.HMERN_LICENSE_KEY,
        },
      },
    });
  }
});

module.exports = router;
