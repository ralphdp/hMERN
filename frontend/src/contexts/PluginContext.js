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
      const response = await fetch("/api/plugins", {
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlugins(data.data);
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
