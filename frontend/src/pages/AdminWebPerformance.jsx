import React, { useState, useEffect } from "react";
import {
  Container,
  Alert,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const AdminWebPerformance = () => {
  const navigate = useNavigate();
  const [WebPerformanceComponent, setWebPerformanceComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWebPerformanceComponent = async () => {
      try {
        const webPerformanceModule = await import(
          "../plugins/web-performance-optimization"
        );
        const { WebPerformanceAdmin } = webPerformanceModule;

        if (WebPerformanceAdmin) {
          setWebPerformanceComponent(() => WebPerformanceAdmin);
          console.log("⚡ Web Performance admin component loaded");
        } else {
          setError(
            "Web Performance admin component not found in plugin module."
          );
        }
      } catch (error) {
        console.log("📭 Web Performance plugin not available:", error.message);
        setError("Web Performance plugin is not installed or not available.");
      } finally {
        setLoading(false);
      }
    };

    loadWebPerformanceComponent();
  }, []);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading Web Performance...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6">
            Web Performance Plugin Not Available
          </Typography>
          <Typography>{error}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            To use the Web Performance feature, please install the Web
            Performance plugin through the Plugin Management system.
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

  return WebPerformanceComponent ? <WebPerformanceComponent /> : null;
};

export default AdminWebPerformance;
