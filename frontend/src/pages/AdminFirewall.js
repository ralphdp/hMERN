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
import { FirewallAdmin } from "../plugins/firewall";

const AdminFirewall = () => {
  const { user } = useAuth();
  const { isPluginEnabled, loading: pluginsLoading } = usePlugins();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    // Check if firewall plugin is enabled (only after plugins are loaded)
    if (!pluginsLoading && !isPluginEnabled("firewall")) {
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

  // If firewall plugin is disabled, show error message
  if (!isPluginEnabled("firewall")) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">
          <Typography variant="h6">Firewall Plugin Disabled</Typography>
          <Typography>
            The firewall plugin is currently disabled. Please enable it in the
            plugin management section to access this feature.
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

  return <FirewallAdmin />;
};

export default AdminFirewall;
