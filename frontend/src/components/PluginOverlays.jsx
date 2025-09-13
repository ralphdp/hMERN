import React, { useState, useEffect } from "react";
import { getOverlayComponents } from "../plugins/registry";

const PluginOverlays = () => {
  const [overlayComponents, setOverlayComponents] = useState([]);

  useEffect(() => {
    // Get overlay components from plugin registry
    const components = getOverlayComponents();
    setOverlayComponents(components);
  }, []);

  // Re-check for new overlay components periodically in case plugins load after initial render
  useEffect(() => {
    const checkForUpdates = () => {
      const components = getOverlayComponents();
      if (components.length !== overlayComponents.length) {
        setOverlayComponents(components);
      }
    };

    const interval = setInterval(checkForUpdates, 1000); // Check every second

    // Stop checking after 10 seconds to avoid unnecessary overhead
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [overlayComponents.length]);

  if (overlayComponents.length === 0) {
    return null;
  }

  return (
    <>
      {overlayComponents.map((overlay, index) => {
        try {
          const Component = overlay.component;
          const key = overlay.pluginName
            ? `${overlay.pluginName}-${index}`
            : `overlay-${index}`;

          return <Component key={key} {...(overlay.props || {})} />;
        } catch (error) {
          console.error(`Error rendering overlay component ${index}:`, error);
          return null;
        }
      })}
    </>
  );
};

export default PluginOverlays;
