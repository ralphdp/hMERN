import React, { useState, useEffect } from "react";
import { Box, Tooltip } from "@mui/material";

// Inline license service to avoid external dependencies
const checkLicenseStatus = async () => {
  try {
    // Determine the correct backend URL
    let backendUrl;
    if (process.env.REACT_APP_BACKEND_URL) {
      backendUrl = process.env.REACT_APP_BACKEND_URL;
    } else if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      // In development, backend runs on port 5050
      backendUrl = `http://${window.location.hostname}:5050`;
    } else {
      // In production, same origin
      backendUrl = window.location.origin;
    }

    const response = await fetch(`${backendUrl}/api/license/status`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        isValid: data.isValid || false,
        pluginInstalled: true,
        licenseInfo: data, // Pass the entire response data
      };
    }

    // If endpoint doesn't exist (plugin not installed), return plugin not installed
    if (response.status === 404) {
      console.log("Licensing plugin not installed - running in free mode");
      return { isValid: false, pluginInstalled: false, licenseInfo: null };
    }

    // Other HTTP errors - plugin installed but license invalid
    return { isValid: false, pluginInstalled: true, licenseInfo: null };
  } catch (error) {
    // Network errors or other issues - assume plugin not installed for safety
    console.log("License check failed - running in free mode:", error.message);
    return { isValid: false, pluginInstalled: false, licenseInfo: null };
  }
};

const LicenseIndicator = () => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pluginInstalled, setPluginInstalled] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState(null);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const result = await checkLicenseStatus();
        setIsValid(result.isValid);
        setPluginInstalled(result.pluginInstalled);
        setLicenseInfo(result.licenseInfo);
      } catch (error) {
        console.log(
          "License check failed - running in free mode:",
          error.message
        );
        setIsValid(false);
        setPluginInstalled(false);
        setLicenseInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to avoid showing the indicator immediately
    const timer = setTimeout(checkLicense, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  // Don't show indicator if plugin is not installed (free mode)
  if (!pluginInstalled) {
    return null;
  }

  // Determine tooltip text based on license status
  let tooltipText = "License Inactive";
  if (isValid) {
    if (licenseInfo?.development_mode) {
      if (licenseInfo?.free_mode) {
        tooltipText = "Development Mode (Free)";
      } else if (licenseInfo?.offline_mode) {
        tooltipText = "Development Mode (Offline)";
      } else {
        tooltipText = "Development Mode (Licensed)";
      }
    } else {
      tooltipText = "License Active";
    }
  }

  return (
    <Tooltip title={tooltipText} arrow placement="top">
      <Box
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: isValid ? "#4caf50" : "#f44336",
          boxShadow: isValid
            ? "0 0 6px rgba(76, 175, 80, 0.4), 0 0 12px rgba(76, 175, 80, 0.2)"
            : "none",
          animation: isValid ? "pulse 3s ease-in-out infinite" : "none",
          opacity: 0.8,
          "@keyframes pulse": {
            "0%": {
              boxShadow:
                "0 0 6px rgba(76, 175, 80, 0.4), 0 0 12px rgba(76, 175, 80, 0.2)",
            },
            "50%": {
              boxShadow:
                "0 0 8px rgba(76, 175, 80, 0.6), 0 0 16px rgba(76, 175, 80, 0.3)",
            },
            "100%": {
              boxShadow:
                "0 0 6px rgba(76, 175, 80, 0.4), 0 0 12px rgba(76, 175, 80, 0.2)",
            },
          },
        }}
      />
    </Tooltip>
  );
};

export default LicenseIndicator;
