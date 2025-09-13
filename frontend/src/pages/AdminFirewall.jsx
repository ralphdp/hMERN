import React, { useState, useEffect } from "react";
import {
  Container,
  Alert,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AdminFirewall = () => {
  const navigate = useNavigate();
  const [FirewallComponent, setFirewallComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFirewallComponent = async () => {
      try {
        const firewallModule = await import("../plugins/firewall");
        const { FirewallAdmin } = firewallModule;

        if (FirewallAdmin) {
          setFirewallComponent(() => FirewallAdmin);
          console.log("🛡️ Firewall admin component loaded");
        } else {
          setError("Firewall admin component not found in plugin module.");
        }
      } catch (error) {
        console.log("📭 Firewall plugin not available:", error.message);
        setError("Firewall plugin is not installed or not available.");
      } finally {
        setLoading(false);
      }
    };

    loadFirewallComponent();
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Firewall...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6">Firewall Plugin Not Available</Typography>
          <Typography>{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            To use the Firewall feature, please install the Firewall plugin
            through the Plugin Management system.
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

  return FirewallComponent ? <FirewallComponent /> : null;
};

export default AdminFirewall;
