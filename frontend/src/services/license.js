// frontend/src/services/license.js

import { getBackendUrl } from "../utils/config";

export const checkLicenseStatus = async () => {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/license/status`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { isValid: data.isValid || false, pluginInstalled: true };
    }

    // If endpoint doesn't exist (plugin not installed), return plugin not installed
    if (response.status === 404) {
      console.log("Licensing plugin not installed - running in free mode");
      return { isValid: false, pluginInstalled: false };
    }

    // Other HTTP errors - plugin installed but license invalid
    return { isValid: false, pluginInstalled: true };
  } catch (error) {
    // Network errors or other issues - assume plugin not installed for safety
    console.log("License check failed - running in free mode:", error.message);
    return { isValid: false, pluginInstalled: false };
  }
};
