import React, { createContext, useContext, useState, useEffect } from "react";

const PluginContext = createContext();

export const usePlugins = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error("usePlugins must be used within a PluginProvider");
  }
  return context;
};

export const PluginProvider = ({ children }) => {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPlugins = async () => {
    try {
      console.log("🔌 Fetching plugins...");
      console.log("🔌 Document cookies:", document.cookie);

      const response = await fetch("/api/plugins", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("🔌 Plugins response status:", response.status);
      console.log("🔌 Plugins response URL:", response.url);

      if (response.ok) {
        const data = await response.json();
        setPlugins(data.data);
        console.log("🔌 Plugins loaded successfully:", data);
      } else {
        console.warn(
          "Failed to fetch plugins:",
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console.warn("Error response:", errorText);
      }
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const isPluginEnabled = (pluginName) => {
    const plugin = plugins.find((p) => p.name === pluginName);
    return plugin ? plugin.enabled : false;
  };

  const getPlugin = (pluginName) => {
    return plugins.find((p) => p.name === pluginName);
  };

  const refreshPlugins = () => {
    return fetchPlugins();
  };

  const value = {
    plugins,
    loading,
    isPluginEnabled,
    getPlugin,
    refreshPlugins,
    setPlugins,
  };

  return (
    <PluginContext.Provider value={value}>{children}</PluginContext.Provider>
  );
};
