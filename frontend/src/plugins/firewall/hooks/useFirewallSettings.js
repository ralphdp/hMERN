import { useState, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";

const defaultSettings = {
  rateLimit: { perMinute: 120, perHour: 720 },
  progressiveDelays: [10, 60, 90, 120],
  adminRateLimit: { perMinute: 500, perHour: 4000 },
  ruleCache: { enabled: true, ttl: 60 },
  trustedProxies: ["127.0.0.1", "::1"],
  securityThresholds: {
    maxPatternLength: 500,
    maxInputLength: 2000,
    regexTimeout: 100,
  },
  cache: {
    enabled: true,
    ttl: 300,
    maxSize: 1000,
    strategy: "lru",
    cacheGeoData: true,
  },
  responses: {
    blocked: {
      statusCode: 403,
      message: "Request blocked by firewall rules",
    },
    rateLimited: { statusCode: 429, message: "Too many requests" },
  },
  monitoring: {
    enableRealTimeAlerts: false,
    alertEmail: "",
  },
};

export const useFirewallSettings = (showAlert) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/settings`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data.data }));
      } else {
        console.error(
          "Failed to fetch settings:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, []);

  const saveSettings = useCallback(
    async (newSettings) => {
      setSavingSettings(true);
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/firewall/settings`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(newSettings),
          }
        );

        if (response.ok) {
          showAlert("Settings saved successfully!");
          setSettings(newSettings);
        } else {
          const error = await response.json();
          showAlert(error.message || "Error saving settings", "error");
        }
      } catch (error) {
        showAlert("Error saving settings", "error");
      } finally {
        setSavingSettings(false);
      }
    },
    [showAlert]
  );

  return {
    settings,
    setSettings,
    fetchSettings,
    saveSettings,
    savingSettings,
    defaultSettings,
  };
};
