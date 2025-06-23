import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePlugins } from "../contexts/PluginContext";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Alert,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { WebPerformanceAdmin } from "../plugins/web-performance-optimization";

const AdminWebPerformance = () => {
  const { user } = useAuth();
  const { isPluginEnabled, loading: pluginsLoading } = usePlugins();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    // Check if web-performance-optimization plugin is enabled (only after plugins are loaded)
    if (!pluginsLoading && !isPluginEnabled("web-performance-optimization")) {
      navigate("/admin");
      return;
    }
  }, [user, navigate, isPluginEnabled, pluginsLoading]);

  // Show loading while plugins are being fetched
  if (pluginsLoading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
      </Container>
    );
  }

  // If user is not admin, don't render anything (redirect will happen)
  if (!user || user.role !== "admin") {
    return null;
  }

  // If web-performance-optimization plugin is disabled, show error message
  if (!isPluginEnabled("web-performance-optimization")) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Web Performance Plugin Disabled</Typography>
          <Typography>
            The web performance optimization plugin is currently disabled.
            Please enable it in the plugin management section to access this
            feature.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => navigate("/admin/plugins")}
            sx={{ mt: 2 }}
          >
            Go to Plugin Management
          </Button>
        </Alert>
      </Container>
    );
  }

  return <WebPerformanceAdmin />;
};

export default AdminWebPerformance;
