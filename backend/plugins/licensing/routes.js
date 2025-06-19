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
    console.log("=== License Status Check ===");
    console.log("License Server URL:", LICENSE_SERVER_URL);
    console.log("License Key:", LICENSE_KEY.substring(0, 8) + "...");
    console.log("Domain being sent:", FRONTEND_URL);
    console.log("Full request payload:", {
      license_key: LICENSE_KEY.substring(0, 8) + "...",
      domain: FRONTEND_URL,
    });

    const response = await axios.post(
      `${LICENSE_SERVER_URL}/api/license/validate`,
      {
        license_key: LICENSE_KEY,
        domain: FRONTEND_URL, // Now this is the domain without protocol
      }
    );

    console.log("=== License Server Response ===");
    console.log("Status:", response.status);
    console.log("Response data:", response.data);

    const isValid = response.data && response.data.success;

    res.json({
      isValid: isValid,
      message: isValid
        ? "License is active and valid for this domain."
        : response.data.message || "License is invalid.",
    });
  } catch (error) {
    console.error("=== License Status Check Error ===");
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("Error status:", error.response.status);
      console.error("Error data:", error.response.data);
    }

    res.json({
      isValid: false,
      message:
        error.response?.data?.message || "Unable to verify license status.",
    });
  }
});

module.exports = router;
