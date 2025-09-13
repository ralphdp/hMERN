import { useState, useEffect, useCallback } from "react";
import { getBackendUrl } from "../../../utils/config";
import { defaultSettings } from "../constants/webPerformanceConstants";

export const useWebPerformanceSettings = ({
  initialSettings,
  showAlert,
  refreshData,
}) => {
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [testingRedis, setTestingRedis] = useState(false);
  const [testingR2, setTestingR2] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    } else {
      setSettings(defaultSettings);
    }
  }, [initialSettings]);

  // Handle toggle changes - only update local state, no API call
  const handleFeatureToggle = useCallback(
    (section, subsection, field, newValue) => {
      setSettings((prevSettings) => {
        const newSettings = { ...prevSettings };
        if (subsection) {
          if (!newSettings[section]) newSettings[section] = {};
          if (!newSettings[section][subsection])
            newSettings[section][subsection] = {};
          newSettings[section][subsection][field] = newValue;
        } else {
          if (!newSettings[section]) newSettings[section] = {};
          newSettings[section][field] = newValue;
        }
        return newSettings;
      });
    },
    []
  );

  const saveSettings = async (settingsToSave) => {
    console.log("🔧 [useWebPerformanceSettings] Starting saveSettings...");
    console.log(
      "🔧 [useWebPerformanceSettings] Settings to save:",
      settingsToSave
    );

    setSavingSettings(true);

    try {
      console.log(
        "🔧 [useWebPerformanceSettings] Making API call to save settings..."
      );
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "include",
          body: JSON.stringify(settingsToSave),
        }
      );

      console.log(
        "🔧 [useWebPerformanceSettings] API response status:",
        response.status
      );
      const data = await response.json();
      console.log("🔧 [useWebPerformanceSettings] API response data:", data);

      if (response.ok) {
        console.log(
          "🔧 [useWebPerformanceSettings] Settings saved successfully!"
        );
        showAlert("Settings saved successfully!", "success");
        // Update local settings with the response data to ensure consistency
        setSettings(data.data);
        console.log(
          "🔧 [useWebPerformanceSettings] Local settings updated with:",
          data.data
        );
      } else {
        console.error(
          "🔧 [useWebPerformanceSettings] Settings save failed:",
          data.message
        );
        showAlert(data.message || "Failed to save settings", "error");
      }
    } catch (error) {
      console.error(
        "🔧 [useWebPerformanceSettings] Settings save error:",
        error
      );
      showAlert("Error saving settings", "error");
    } finally {
      console.log("🔧 [useWebPerformanceSettings] Finished saveSettings");
      setSavingSettings(false);
    }
  };

  const handleSaveSettings = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log("🔧 [useWebPerformanceSettings] handleSaveSettings called");
    saveSettings(settings);
  };

  const handleTestRedis = async () => {
    setTestingRedis(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/test-redis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            redisPassword:
              settings.cachingLayers?.databaseCache?.redisPassword || "",
          }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        showAlert(result.message, "success");
      } else {
        showAlert(result.message || "Redis test failed", "error");
      }
    } catch (error) {
      console.error("Error testing Redis:", error);
      showAlert("Error testing Redis connection", "error");
    } finally {
      setTestingRedis(false);
    }
  };

  const handleTestR2 = async () => {
    setTestingR2(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/test-r2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(
            settings.cachingLayers?.staticFileCache?.cloudflareR2 || {}
          ),
        }
      );

      const result = await response.json();
      if (response.ok) {
        showAlert(result.message, "success");
      } else {
        showAlert(result.message || "Cloudflare R2 test failed", "error");
      }
    } catch (error) {
      console.error("Error testing R2:", error);
      showAlert("Error testing Cloudflare R2 connection", "error");
    } finally {
      setTestingR2(false);
    }
  };

  const resetToDefaults = () => {
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/settings/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();
      if (response.ok) {
        setSettings(result.data);
        setShowResetDialog(false);
        showAlert(result.message, "success");
        // Refresh data to ensure consistency
        if (refreshData) {
          refreshData();
        }
      } else {
        showAlert(result.message || "Failed to reset settings", "error");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      showAlert("Error resetting settings", "error");
    }
  };

  const handleSettingChange = (section, subsection, field, value) => {
    const newSettings = { ...settings };
    if (subsection) {
      if (!newSettings[section]) newSettings[section] = {};
      if (!newSettings[section][subsection])
        newSettings[section][subsection] = {};
      newSettings[section][subsection][field] = value;
    } else {
      if (!newSettings[section]) newSettings[section] = {};
      newSettings[section][field] = value;
    }
    setSettings(newSettings);
  };

  return {
    settings,
    savingSettings,
    testingRedis,
    testingR2,
    showResetDialog,
    handleFeatureToggle,
    handleSaveSettings,
    handleTestRedis,
    handleTestR2,
    resetToDefaults,
    confirmReset,
    handleSettingChange,
    setShowResetDialog,
  };
};
