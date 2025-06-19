// frontend/src/components/LicenseIndicator.js

import React, { useState, useEffect } from "react";
import { Box, Tooltip } from "@mui/material";
import { checkLicenseStatus } from "../services/license";

const LicenseIndicator = () => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pluginInstalled, setPluginInstalled] = useState(false);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const result = await checkLicenseStatus();
        setIsValid(result.isValid);
        setPluginInstalled(result.pluginInstalled);
      } catch (error) {
        console.log(
          "License check failed - running in free mode:",
          error.message
        );
        setIsValid(false);
        setPluginInstalled(false);
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

  return (
    <Tooltip
      title={isValid ? "License Active" : "License Inactive"}
      arrow
      placement="top"
    >
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
