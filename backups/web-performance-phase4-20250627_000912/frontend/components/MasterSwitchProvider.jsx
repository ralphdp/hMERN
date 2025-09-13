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

export const MasterSwitchProvider = ({ children, settings }) => {
  const isMainEnabled = useMemo(() => {
    return settings?.general?.enabled || false;
  }, [settings?.general?.enabled]);

  const value = useMemo(
    () => ({
      isMainEnabled,
    }),
    [isMainEnabled]
  );

  return (
    <MasterSwitchContext.Provider value={value}>
      {children}
    </MasterSwitchContext.Provider>
  );
};

export default MasterSwitchProvider;
