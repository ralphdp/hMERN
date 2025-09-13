import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert, Slide } from "@mui/material";

const SnackbarContext = createContext();

export const useFirewallSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error(
      "useFirewallSnackbar must be used within FirewallSnackbarProvider"
    );
  }
  return context;
};

const SlideTransition = (props) => <Slide {...props} direction="left" />;

export const FirewallSnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
    autoHideDuration: 6000,
  });

  const showSnackbar = (
    message,
    severity = "success",
    autoHideDuration = null
  ) => {
    // Set default durations based on severity
    let duration = autoHideDuration;
    if (duration === null) {
      switch (severity) {
        case "success":
          duration = 4000;
          break;
        case "info":
          duration = 6000;
          break;
        case "warning":
          duration = 8000;
          break;
        case "error":
          duration = 10000;
          break;
        default:
          duration = 6000;
      }
    }

    setSnackbar({
      open: true,
      message,
      severity,
      autoHideDuration: duration,
    });
  };

  const hideSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        TransitionComponent={SlideTransition}
        sx={{ mt: 8 }} // Offset from top to avoid header
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            minWidth: 300,
            maxWidth: 500,
            wordBreak: "break-word",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
