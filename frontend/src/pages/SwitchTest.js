import React, { useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Box,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const SwitchTest = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    features: {
      ipBlocking: true,
      countryBlocking: true,
      rateLimiting: true,
      suspiciousPatterns: true,
    },
  });

  return (
    <Container maxWidth="md" sx={{ my: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          🧪 Switch Animation Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Isolated test to check if Material-UI switches animate smoothly
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate("/admin/firewall")}
          sx={{ mt: 2 }}
        >
          Back to Firewall Admin
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Test Switches - Should Animate Smoothly
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features?.ipBlocking || false}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          ipBlocking: e.target.checked,
                        },
                      }));
                    }}
                  />
                }
                label="IP Blocking"
              />
              <Typography variant="body2" color="text.secondary">
                Enable/disable IP-based blocking rules
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features?.countryBlocking || false}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          countryBlocking: e.target.checked,
                        },
                      }));
                    }}
                  />
                }
                label="Country Blocking"
              />
              <Typography variant="body2" color="text.secondary">
                Enable/disable geo-blocking by country
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features?.rateLimiting || false}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          rateLimiting: e.target.checked,
                        },
                      }));
                    }}
                  />
                }
                label="Rate Limiting"
              />
              <Typography variant="body2" color="text.secondary">
                Enable/disable rate limiting protection
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.features?.suspiciousPatterns || false}
                    onChange={(e) => {
                      setSettings((prev) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          suspiciousPatterns: e.target.checked,
                        },
                      }));
                    }}
                  />
                }
                label="Pattern Detection"
              />
              <Typography variant="body2" color="text.secondary">
                Enable/disable suspicious pattern detection
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Test Results:
            </Typography>
            <Typography variant="body2">
              • If these switches animate smoothly: The issue is specific to the
              FirewallAdmin component
              <br />
              • If these switches also don't animate: The issue is
              browser/system-wide
              <br />• Compare with AdminPlugins switches at /admin/plugins
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SwitchTest;
