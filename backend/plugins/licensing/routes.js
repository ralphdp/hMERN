const express = require("express");
const router = express.Router();
const axios = require("axios");

const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL || "https://hmern.com";
const LICENSE_KEY = process.env.HMERN_LICENSE_KEY;

/**
 * Provides a health check for the licensing plugin itself.
 */
router.get("/health", (req, res) => {
  if (!LICENSE_KEY) {
    return res.status(500).json({
      success: false,
      message: "License key is not configured on this application server.",
    });
  }
  res.json({
    success: true,
    message: "Licensing plugin is active.",
    server_url: LICENSE_SERVER_URL,
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
 */
router.get("/status", async (req, res) => {
  if (!LICENSE_KEY) {
    return res.json({
      isValid: false,
      message: "No license key configured",
    });
  }

  try {
    const response = await axios.post(
      `${LICENSE_SERVER_URL}/api/license/info`,
      {
        license_key: LICENSE_KEY,
      }
    );

    // Check if the license is valid based on the response
    const isValid =
      response.data.success &&
      response.data.license &&
      response.data.license.status === "active";

    res.json({
      isValid: isValid,
      message: isValid ? "License is active" : "License is inactive",
    });
  } catch (error) {
    res.json({
      isValid: false,
      message: "Unable to verify license",
    });
  }
});

module.exports = router;
