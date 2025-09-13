import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Link as MuiLink,
  Divider,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";

const Footer = () => {
  const navigate = useNavigate();
  const [LicenseIndicator, setLicenseIndicator] = useState(null);
  const [licenseAvailable, setLicenseAvailable] = useState(false);

  useEffect(() => {
    // Dynamically load licensing component if available
    const loadLicenseIndicator = async () => {
      try {
        const licensingModule = await import("../plugins/licensing");
        const { LicenseIndicator: LicenseComponent } = licensingModule;

        if (LicenseComponent) {
          setLicenseIndicator(() => LicenseComponent);
          setLicenseAvailable(true);
          console.log("📋 Licensing system loaded");
        }
      } catch (error) {
        console.log("📭 Licensing system not available:", error.message);
        setLicenseAvailable(false);
      }
    };

    loadLicenseIndicator();
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: (theme) =>
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.02)",
        pt: 4,
        width: "100%",
        flexShrink: 0,
        mt: "auto",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              About
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A modern MERN stack boilerplate with authentication, deployment
              configuration, and best practices built-in.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Quick Links
            </Typography>
            <MuiLink
              component={Link}
              to="/"
              color="inherit"
              display="block"
              sx={{ mb: 1 }}
            >
              Home
            </MuiLink>
            <MuiLink
              component={Link}
              to="/about"
              color="inherit"
              display="block"
              sx={{ mb: 1 }}
            >
              About
            </MuiLink>
            <MuiLink
              component={Link}
              to="/contact"
              color="inherit"
              display="block"
              sx={{ mb: 1 }}
            >
              Contact
            </MuiLink>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Email: contact@example.com
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <IconButton
                component="a"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                aria-label="GitHub"
              >
                <GitHubIcon />
              </IconButton>
              <IconButton
                component="a"
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                color="inherit"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Container>
      <Box
        sx={{
          mt: 3,
          py: 2,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.01)",
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} hMERN.app. All rights reserved.
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Typography
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/terms")}
                  sx={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    color: "text.secondary",
                    textDecoration: "underline",
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  Terms of Service
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/privacy")}
                  sx={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    color: "text.secondary",
                    textDecoration: "underline",
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  Privacy Policy
                </Typography>
                <Divider orientation="vertical" flexItem />
                <Typography
                  component="button"
                  variant="body2"
                  onClick={() => navigate("/cookies")}
                  sx={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    color: "text.secondary",
                    textDecoration: "underline",
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  Cookie Policy
                </Typography>
              </Box>
            </Box>
            {licenseAvailable && LicenseIndicator && (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LicenseIndicator />
              </Box>
            )}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
