import React, { createContext, useContext, useMemo } from "react";

const MasterSwitchContext = createContext();

export const useMasterSwitch = () => {
  const context = useContext(MasterSwitchContext);
  if (!context) {
    throw new Error(
      "useMasterSwitch must be used within a MasterSwitchProvider"
    );
  }
  return context;
};

export const MasterSwitchProvider = ({
  children,
  settings,
  hasUnsavedChanges = false,
}) => {
  const isMainEnabled = useMemo(() => {
    return settings?.general?.enabled ?? true; // Default to true for firewall
  }, [settings?.general?.enabled]);

  const isSettingsSaved = useMemo(() => {
    return !hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  const value = useMemo(
    () => ({
      isMainEnabled,
      isSettingsSaved,
    }),
    [isMainEnabled, isSettingsSaved]
  );

  return (
    <MasterSwitchContext.Provider value={value}>
      {children}
    </MasterSwitchContext.Provider>
  );
};

export default MasterSwitchProvider;
