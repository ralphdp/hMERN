import React, { useState, useEffect } from "react";
import {
  Container,
  Alert,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AdminPluginTemplate = () => {
  const navigate = useNavigate();
  const [PluginTemplateComponent, setPluginTemplateComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPluginTemplateComponent = async () => {
      try {
        const pluginTemplateModule = await import("../plugins/plugin-template");
        const { PluginTemplateAdmin } = pluginTemplateModule;

        if (PluginTemplateAdmin) {
          setPluginTemplateComponent(() => PluginTemplateAdmin);
          console.log("🔧 Plugin Template admin component loaded");
        } else {
          setError(
            "Plugin Template admin component not found in plugin module."
          );
        }
      } catch (error) {
        console.log("📭 Plugin Template plugin not available:", error.message);
        setError("Plugin Template plugin is not installed or not available.");
      } finally {
        setLoading(false);
      }
    };

    loadPluginTemplateComponent();
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Plugin Template...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6">Plugin Template Not Available</Typography>
          <Typography>{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            To use the Plugin Template feature, please install the Plugin
            Template through the Plugin Management system.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/admin/plugins")}
            sx={{ mt: 2, mr: 1 }}
          >
            Go to Plugin Management
          </Button>
          <Button
            variant="text"
            onClick={() => navigate("/admin")}
            sx={{ mt: 2 }}
          >
            Back to Admin Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  return PluginTemplateComponent ? <PluginTemplateComponent /> : null;
};

export default AdminPluginTemplate;
