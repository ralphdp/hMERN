// frontend/src/App.jsx

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import PowerIcon from "@mui/icons-material/Power";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PluginProvider } from "./contexts/PluginContext";
import { getTheme } from "./theme";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import Verify from "./pages/Verify";
import ResendVerification from "./pages/ResendVerification";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import AdminFirewall from "./pages/AdminFirewall";
import AdminPlugins from "./pages/AdminPlugins";
import AdminWebPerformance from "./pages/AdminWebPerformance";
import AdminPluginTemplate from "./pages/AdminPluginTemplate";
import AdminSettings from "./pages/AdminSettings";
import AdminActivity from "./pages/AdminActivity";
import SwitchTest from "./pages/SwitchTest";

function AppContent() {
  const { user, loading } = useAuth();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // Initialize theme mode from localStorage or system preference
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem("themeMode");
    if (savedMode && (savedMode === "light" || savedMode === "dark")) {
      return savedMode;
    }
    return prefersDarkMode ? "dark" : "light";
  });

  // Update localStorage when mode changes
  useEffect(() => {
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  // Only update from system preference if no saved preference exists
  useEffect(() => {
    if (!localStorage.getItem("themeMode")) {
      setMode(prefersDarkMode ? "dark" : "light");
    }
  }, [prefersDarkMode]);

  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
          }}
        >
          <Typography>Loading...</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route
            element={
              <Layout
                mode={mode}
                toggleColorMode={toggleColorMode}
                user={user}
              />
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/verify" element={<ResendVerification />} />
            <Route path="/verify-email" element={<Verify />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* Admin Routes - Only accessible to admin users */}
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Admin />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/firewall"
              element={
                <PrivateRoute>
                  <AdminFirewall />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/plugins"
              element={
                <PrivateRoute>
                  <AdminPlugins />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <PrivateRoute>
                  <AdminSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/activity"
              element={
                <PrivateRoute>
                  <AdminActivity />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/web-performance-optimization"
              element={
                <PrivateRoute>
                  <AdminWebPerformance />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/plugin-template"
              element={
                <PrivateRoute>
                  <AdminPluginTemplate />
                </PrivateRoute>
              }
            />
            <Route
              path="/switch-test"
              element={
                <PrivateRoute>
                  <SwitchTest />
                </PrivateRoute>
              }
            />

            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/cookies" element={<Cookies />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

function App() {
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const [pluginLoadError, setPluginLoadError] = useState(null);

  useEffect(() => {
    const loadPlugins = async () => {
      try {
        console.log("🚀 Starting plugin system initialization...");

        // Try to dynamically import and initialize the plugin registry
        try {
          const registryModule = await import("./plugins/registry");
          const { initializePlugins } = registryModule;

          await initializePlugins();
          console.log("✅ Plugin system initialized successfully");
        } catch (registryError) {
          console.log("📭 Plugin system not available:", registryError.message);
          console.log("🎯 Running in plugin-free mode");
        }

        setPluginsLoaded(true);
      } catch (error) {
        console.error("❌ App initialization failed:", error);
        setPluginLoadError(error.message);
        // Continue loading the app even if plugins fail
        setPluginsLoaded(true);
      }
    };

    loadPlugins();
  }, []);

  // Show loading screen while plugins initialize
  if (!pluginsLoaded) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          gap: "16px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <PowerIcon sx={{ fontSize: 24, color: "primary.main" }} />
          <Typography variant="body1">Initializing system...</Typography>
        </Box>
        {pluginLoadError && (
          <div style={{ color: "red", fontSize: "14px" }}>
            Warning: {pluginLoadError}
          </div>
        )}
      </div>
    );
  }

  return (
    <AuthProvider>
      <PluginProvider>
        <AppContent />
      </PluginProvider>
    </AuthProvider>
  );
}

export default App;
