import React, { useState, useEffect, useCallback, useMemo } from "react";
import { MasterSwitchProvider, useMasterSwitch } from "./MasterSwitchProvider";
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Slider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Code as CodeIcon,
  Cached as CachedIcon,
  Speed as SpeedIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  CloudUpload as CloudUploadIcon,
  Science as ScienceIcon,
  Image as ImageIcon,
  Compress as CompressIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { getBackendUrl } from "../../../utils/config";
import ResetSettingsDialog from "../dialogs/ResetSettingsDialog";
import TestResultDialog from "../dialogs/TestResultDialog";

// Memoized SectionCard component to prevent re-renders
const SectionCard = React.memo(({ title, icon, children }) => {
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {icon}
            <Typography variant="h6">{title}</Typography>
          </Box>
        }
      />
      <CardContent>{children}</CardContent>
    </Card>
  );
});

// General Configuration Section
const GeneralConfiguration = React.memo(
  ({ settings, handleFeatureToggle, updateSetting }) => {
    const { isMainEnabled } = useMasterSwitch();
    return (
      <Grid container spacing={3}>
        {/* Master Enable/Disable */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SpeedIcon />
              <Typography variant="subtitle1">Master Control</Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6">
                  Web Performance Optimization
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Master switch to enable/disable all performance optimization
                  features
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={isMainEnabled}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      // Just update the master switch - no auto-save, no cascade
                      updateSetting("general.enabled", newValue);
                    }}
                    size="large"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={isMainEnabled ? "Enabled" : "Disabled"}
                      color={isMainEnabled ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                }
                labelPlacement="start"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

// File Optimization Section
const FileOptimization = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();
  return (
    <Grid container spacing={3}>
      {/* CSS/JS Minification */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CompressIcon />
            <Typography variant="subtitle1">
              CSS/JS Minification & Concatenation
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.minification
                        ?.enableCSSMinification ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.minification.enableCSSMinification",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable CSS Minification"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.minification
                        ?.enableJSMinification ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.minification.enableJSMinification",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable JS Minification"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.minification
                        ?.enableConcatenation ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.minification.enableConcatenation",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable File Concatenation"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.minification
                        ?.preserveComments ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.minification.preserveComments",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Preserve Important Comments"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.minification
                        ?.removeUnusedCSS ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.minification.removeUnusedCSS",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Remove Unused CSS"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Image Optimization */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ImageIcon />
            <Typography variant="subtitle1">
              Image Optimization & WebP Conversion
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.images?.enableOptimization ??
                      false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.images.enableOptimization",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Image Optimization"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.images?.enableWebPConversion ??
                      false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.images.enableWebPConversion",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.fileOptimization?.images?.enableOptimization
                    }
                  />
                }
                label="Enable WebP Conversion"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Quality Settings */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <SettingsIcon />
            <Typography variant="subtitle1">
              Image Quality & Size Settings
            </Typography>
          </Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" gutterBottom>
                JPEG Quality:{" "}
                {settings.fileOptimization?.images?.jpegQuality ?? 80}%
              </Typography>
              <Slider
                value={settings.fileOptimization?.images?.jpegQuality ?? 80}
                onChange={(e, value) =>
                  updateSetting("fileOptimization.images.jpegQuality", value)
                }
                min={1}
                max={100}
                disabled={
                  !isMainEnabled ||
                  !settings.fileOptimization?.images?.enableOptimization
                }
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" gutterBottom>
                PNG Quality:{" "}
                {settings.fileOptimization?.images?.pngQuality ?? 80}%
              </Typography>
              <Slider
                value={settings.fileOptimization?.images?.pngQuality ?? 80}
                onChange={(e, value) =>
                  updateSetting("fileOptimization.images.pngQuality", value)
                }
                min={1}
                max={100}
                disabled={
                  !isMainEnabled ||
                  !settings.fileOptimization?.images?.enableOptimization
                }
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" gutterBottom>
                WebP Quality:{" "}
                {settings.fileOptimization?.images?.webpQuality ?? 80}%
              </Typography>
              <Slider
                value={settings.fileOptimization?.images?.webpQuality ?? 80}
                onChange={(e, value) =>
                  updateSetting("fileOptimization.images.webpQuality", value)
                }
                min={1}
                max={100}
                disabled={
                  !isMainEnabled ||
                  !settings.fileOptimization?.images?.enableWebPConversion
                }
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Max Width (px)"
                type="number"
                value={settings.fileOptimization?.images?.maxWidth ?? 1920}
                onChange={(e) =>
                  updateSetting(
                    "fileOptimization.images.maxWidth",
                    parseInt(e.target.value) || 1920
                  )
                }
                disabled={
                  !isMainEnabled ||
                  !settings.fileOptimization?.images?.enableOptimization
                }
                inputProps={{ min: 100, max: 4000 }}
                helperText="Maximum image width"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Max Height (px)"
                type="number"
                value={settings.fileOptimization?.images?.maxHeight ?? 1080}
                onChange={(e) =>
                  updateSetting(
                    "fileOptimization.images.maxHeight",
                    parseInt(e.target.value) || 1080
                  )
                }
                disabled={
                  !isMainEnabled ||
                  !settings.fileOptimization?.images?.enableOptimization
                }
                inputProps={{ min: 100, max: 4000 }}
                helperText="Maximum image height"
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Compression Settings */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CompressIcon />
            <Typography variant="subtitle1">GZIP/Brotli Compression</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.compression?.enableGzip ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.compression.enableGzip",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable GZIP Compression"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.fileOptimization?.compression?.enableBrotli ??
                      false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "fileOptimization.compression.enableBrotli",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Brotli Compression"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Compression Level"
                type="number"
                value={
                  settings.fileOptimization?.compression?.compressionLevel ?? 6
                }
                onChange={(e) =>
                  updateSetting(
                    "fileOptimization.compression.compressionLevel",
                    parseInt(e.target.value) || 6
                  )
                }
                disabled={
                  !isMainEnabled ||
                  (!settings.fileOptimization?.compression?.enableGzip &&
                    !settings.fileOptimization?.compression?.enableBrotli)
                }
                inputProps={{ min: 1, max: 9 }}
                helperText="Compression level (1-9)"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Threshold (bytes)"
                type="number"
                value={
                  settings.fileOptimization?.compression?.threshold ?? 1024
                }
                onChange={(e) =>
                  updateSetting(
                    "fileOptimization.compression.threshold",
                    parseInt(e.target.value) || 1024
                  )
                }
                disabled={
                  !isMainEnabled ||
                  (!settings.fileOptimization?.compression?.enableGzip &&
                    !settings.fileOptimization?.compression?.enableBrotli)
                }
                inputProps={{ min: 0, max: 10240 }}
                helperText="Minimum file size to compress"
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

// Caching Layers Section
const CachingLayers = React.memo(
  ({
    settings,
    updateSetting,
    handleTestRedis,
    handleTestR2,
    testingRedis,
    testingR2,
    envConfig,
    savingSettings,
  }) => {
    const { isMainEnabled } = useMasterSwitch();
    return (
      <Grid container spacing={3}>
        {/* Database Cache */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <StorageIcon />
              <Typography variant="subtitle1">
                Database Query Caching (Redis)
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.databaseCache?.enabled ?? false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.databaseCache.enabled",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Database Caching"
                />
                {!envConfig?.hasRedisEndpoint && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      my: 1,
                      ml: 4,
                    }}
                  >
                    <WarningIcon color="warning" fontSize="small" />
                    <Typography variant="body2" color="warning.main">
                      Missing required Redis database configuration. Please
                      configure Redis credentials in admin settings
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default TTL (seconds)"
                  type="number"
                  value={
                    settings.cachingLayers?.databaseCache?.defaultTTL ?? 300
                  }
                  onChange={(e) =>
                    updateSetting(
                      "cachingLayers.databaseCache.defaultTTL",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={
                    !isMainEnabled ||
                    !settings.cachingLayers?.databaseCache?.enabled
                  }
                  inputProps={{ min: 60, max: 86400 }}
                  helperText="Cache time-to-live in seconds (60-86400)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Max Memory"
                  value={
                    settings.cachingLayers?.databaseCache?.maxMemory ?? "100mb"
                  }
                  onChange={(e) =>
                    updateSetting(
                      "cachingLayers.databaseCache.maxMemory",
                      e.target.value
                    )
                  }
                  disabled={
                    !isMainEnabled ||
                    !settings.cachingLayers?.databaseCache?.enabled
                  }
                  helperText="Maximum memory usage (e.g., 100mb, 1gb)"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={handleTestRedis}
                  disabled={testingRedis || !isMainEnabled}
                  startIcon={
                    testingRedis ? (
                      <CircularProgress size={20} />
                    ) : (
                      <ScienceIcon />
                    )
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {testingRedis ? "Testing..." : "Test Redis Connection"}
                </Button>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Database Configuration
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 2,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[50],
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[700]
                        : theme.palette.grey[200],
                  }}
                >
                  <Typography variant="body2">
                    <strong>Public Endpoint:</strong>{" "}
                    {envConfig?.credentials?.redisEndpoint || "Loading..."}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      envConfig?.hasRedisEndpoint && !savingSettings
                        ? "success.main"
                        : "text.secondary"
                    }
                    sx={{
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    {savingSettings
                      ? "⏳ Loading configuration..."
                      : envConfig?.hasRedisEndpoint
                      ? "✓ Redis endpoint configured in database settings"
                      : "⚠ Redis endpoint missing - configure in database settings"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Fragment/Object Cache */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <MemoryIcon />
              <Typography variant="subtitle1">
                Fragment/Object Caching (Redis)
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.fragmentCache?.enabled ?? false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.fragmentCache.enabled",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Fragment Caching"
                />
                {!envConfig?.hasRedisEndpoint && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      my: 1,
                      ml: 4,
                    }}
                  >
                    <WarningIcon color="warning" fontSize="small" />
                    <Typography variant="body2" color="warning.main">
                      Missing required Redis database configuration. Please
                      configure Redis credentials in admin settings
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Default TTL (seconds)"
                  type="number"
                  value={
                    settings.cachingLayers?.fragmentCache?.defaultTTL ?? 600
                  }
                  onChange={(e) =>
                    updateSetting(
                      "cachingLayers.fragmentCache.defaultTTL",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={
                    !isMainEnabled ||
                    !settings.cachingLayers?.fragmentCache?.enabled
                  }
                  inputProps={{ min: 60, max: 86400 }}
                  helperText="Cache time-to-live in seconds (60-86400)"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.fragmentCache
                          ?.enableFragmentCaching ?? false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.fragmentCache.enableFragmentCaching",
                          e.target.checked
                        )
                      }
                      disabled={
                        !isMainEnabled ||
                        !settings.cachingLayers?.fragmentCache?.enabled
                      }
                    />
                  }
                  label="Enable Fragment Caching"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.fragmentCache
                          ?.enableObjectCaching ?? false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.fragmentCache.enableObjectCaching",
                          e.target.checked
                        )
                      }
                      disabled={
                        !isMainEnabled ||
                        !settings.cachingLayers?.fragmentCache?.enabled
                      }
                    />
                  }
                  label="Enable Object Caching"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={handleTestRedis}
                  disabled={testingRedis || !isMainEnabled}
                  startIcon={
                    testingRedis ? (
                      <CircularProgress size={20} />
                    ) : (
                      <ScienceIcon />
                    )
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {testingRedis ? "Testing..." : "Test Redis Connection"}
                </Button>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Database Configuration
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 2,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[50],
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[700]
                        : theme.palette.grey[200],
                  }}
                >
                  <Typography variant="body2">
                    <strong>Public Endpoint:</strong>{" "}
                    {envConfig?.credentials?.redisEndpoint || "Loading..."}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      envConfig?.hasRedisEndpoint && !savingSettings
                        ? "success.main"
                        : "text.secondary"
                    }
                    sx={{
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    {savingSettings
                      ? "⏳ Loading configuration..."
                      : envConfig?.hasRedisEndpoint
                      ? "✓ Redis endpoint configured in database settings"
                      : "⚠ Redis endpoint missing - configure in database settings"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Browser Cache */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CachedIcon />
              <Typography variant="subtitle1">
                Browser Caching (HTTP Headers)
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.browserCache?.enabled ?? false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.browserCache.enabled",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled}
                    />
                  }
                  label="Enable Browser Caching"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.browserCache?.enableETag ??
                        false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.browserCache.enableETag",
                          e.target.checked
                        )
                      }
                      disabled={
                        !isMainEnabled ||
                        !settings.cachingLayers?.browserCache?.enabled
                      }
                    />
                  }
                  label="Enable ETag Headers"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.browserCache
                          ?.enableLastModified ?? false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.browserCache.enableLastModified",
                          e.target.checked
                        )
                      }
                      disabled={
                        !isMainEnabled ||
                        !settings.cachingLayers?.browserCache?.enabled
                      }
                    />
                  }
                  label="Enable Last-Modified Headers"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Static Files TTL (seconds)"
                  type="number"
                  value={
                    settings.cachingLayers?.browserCache?.staticFilesTTL ??
                    31536000
                  }
                  onChange={(e) =>
                    updateSetting(
                      "cachingLayers.browserCache.staticFilesTTL",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={
                    !isMainEnabled ||
                    !settings.cachingLayers?.browserCache?.enabled
                  }
                  inputProps={{ min: 86400, max: 31536000 }}
                  helperText="Cache time for static files (1 day - 1 year)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Dynamic Content TTL (seconds)"
                  type="number"
                  value={
                    settings.cachingLayers?.browserCache?.dynamicContentTTL ?? 0
                  }
                  onChange={(e) =>
                    updateSetting(
                      "cachingLayers.browserCache.dynamicContentTTL",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={
                    !isMainEnabled ||
                    !settings.cachingLayers?.browserCache?.enabled
                  }
                  inputProps={{ min: 0, max: 86400 }}
                  helperText="Cache time for dynamic content (0 = no cache)"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Static File Cache (Cloudflare R2) */}
        <Grid item xs={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <CloudUploadIcon />
              <Typography variant="subtitle1">
                Static File Caching (Cloudflare R2)
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.staticFileCache?.enabled ??
                        false
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.staticFileCache.enabled",
                          e.target.checked
                        )
                      }
                      disabled={!isMainEnabled || !envConfig?.hasR2Credentials}
                    />
                  }
                  label="Enable Static File Caching"
                />
                {!envConfig?.hasR2Credentials && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1,
                      mt: 1,
                      ml: 4,
                    }}
                  >
                    <WarningIcon
                      color="warning"
                      fontSize="small"
                      sx={{ mt: 0.25 }}
                    />
                    <Typography variant="body2" color="warning.main">
                      Missing required Cloudflare R2 database configuration.
                      Please configure Cloudflare R2 credentials in admin
                      settings
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        settings.cachingLayers?.staticFileCache
                          ?.enableVersioning ?? true
                      }
                      onChange={(e) =>
                        updateSetting(
                          "cachingLayers.staticFileCache.enableVersioning",
                          e.target.checked
                        )
                      }
                      disabled={
                        !isMainEnabled ||
                        !envConfig?.hasR2Credentials ||
                        !settings.cachingLayers?.staticFileCache?.enabled
                      }
                    />
                  }
                  label="Enable File Versioning"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cache TTL (seconds)"
                  type="number"
                  value={
                    settings.cachingLayers?.staticFileCache?.cacheTTL ?? 86400
                  }
                  onChange={(e) =>
                    updateSetting(
                      "cachingLayers.staticFileCache.cacheTTL",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={
                    !isMainEnabled ||
                    !envConfig?.hasR2Credentials ||
                    !settings.cachingLayers?.staticFileCache?.enabled
                  }
                  inputProps={{ min: 3600, max: 2592000 }}
                  helperText="Cache time-to-live (1 hour - 30 days)"
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  onClick={handleTestR2}
                  disabled={
                    testingR2 ||
                    !isMainEnabled ||
                    !envConfig?.hasR2Credentials ||
                    !settings.cachingLayers?.staticFileCache?.enabled
                  }
                  startIcon={
                    testingR2 ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CloudUploadIcon />
                    )
                  }
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {testingR2
                    ? "Testing R2..."
                    : "Test Cloudflare R2 Connection"}
                </Button>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Database Configuration
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 2,
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[800]
                        : theme.palette.grey[50],
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? theme.palette.grey[700]
                        : theme.palette.grey[200],
                  }}
                >
                  <Typography variant="body2">
                    <strong>Bucket Name:</strong>{" "}
                    {envConfig?.credentials?.bucketName || "Loading..."}
                  </Typography>
                  <Typography variant="body2">
                    <strong>API Token:</strong>{" "}
                    {envConfig?.credentials?.apiToken || "Loading..."}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Access Key ID:</strong>{" "}
                    {envConfig?.credentials?.accessKeyId || "Loading..."}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Secret Access Key:</strong>{" "}
                    {envConfig?.credentials?.secretAccessKey || "Loading..."}
                  </Typography>
                  <Typography variant="body2">
                    <strong>S3 Endpoint:</strong>{" "}
                    {envConfig?.credentials?.endpointS3 || "Loading..."}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={
                      envConfig?.hasR2Credentials && !savingSettings
                        ? "success.main"
                        : "text.secondary"
                    }
                    sx={{
                      mt: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    {savingSettings
                      ? "⏳ Loading configuration..."
                      : envConfig?.hasR2Credentials
                      ? "✓ All credentials configured in database settings"
                      : "⚠ Some credentials missing - configure in database settings"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    );
  }
);

// Performance Features Section
const PerformanceFeatures = React.memo(({ settings, updateSetting }) => {
  const { isMainEnabled } = useMasterSwitch();
  return (
    <Grid container spacing={3}>
      {/* Lazy Loading */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <VisibilityIcon />
            <Typography variant="subtitle1">Lazy Loading</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.lazyLoading?.enabled ??
                      false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.lazyLoading.enabled",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Lazy Loading"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.lazyLoading
                        ?.enableImageLazyLoading ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.lazyLoading.enableImageLazyLoading",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.lazyLoading?.enabled
                    }
                  />
                }
                label="Lazy Load Images"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.lazyLoading
                        ?.enableIframeLazyLoading ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.lazyLoading.enableIframeLazyLoading",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.lazyLoading?.enabled
                    }
                  />
                }
                label="Lazy Load Iframes"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Threshold (pixels)"
                type="number"
                value={
                  settings.performanceFeatures?.lazyLoading?.threshold ?? 100
                }
                onChange={(e) =>
                  updateSetting(
                    "performanceFeatures.lazyLoading.threshold",
                    parseInt(e.target.value) || 100
                  )
                }
                disabled={
                  !isMainEnabled ||
                  !settings.performanceFeatures?.lazyLoading?.enabled
                }
                inputProps={{ min: 0, max: 1000 }}
                helperText="Distance before viewport to trigger loading"
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Critical CSS */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CodeIcon />
            <Typography variant="subtitle1">Critical CSS</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.criticalCSS?.enabled ??
                      false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.criticalCSS.enabled",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Critical CSS"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.criticalCSS
                        ?.enableAutomaticExtraction ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.criticalCSS.enableAutomaticExtraction",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.criticalCSS?.enabled
                    }
                  />
                }
                label="Automatic Extraction"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Inline Threshold (bytes)"
                type="number"
                value={
                  settings.performanceFeatures?.criticalCSS?.inlineThreshold ??
                  14000
                }
                onChange={(e) =>
                  updateSetting(
                    "performanceFeatures.criticalCSS.inlineThreshold",
                    parseInt(e.target.value)
                  )
                }
                disabled={
                  !isMainEnabled ||
                  !settings.performanceFeatures?.criticalCSS?.enabled
                }
                inputProps={{ min: 1000, max: 50000 }}
                helperText="Maximum size for inline CSS"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Preloading */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CloudUploadIcon />
            <Typography variant="subtitle1">Preloading</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.preloading?.enabled ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.preloading.enabled",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Preloading"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.preloading
                        ?.enableDNSPrefetch ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.preloading.enableDNSPrefetch",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.preloading?.enabled
                    }
                  />
                }
                label="DNS Prefetch"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.preloading?.preloadFonts ??
                      false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.preloading.preloadFonts",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.preloading?.enabled
                    }
                  />
                }
                label="Preload Fonts"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.preloading
                        ?.preloadCriticalImages ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.preloading.preloadCriticalImages",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.preloading?.enabled
                    }
                  />
                }
                label="Preload Critical Images"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.preloading
                        ?.enablePreconnect ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.preloading.enablePreconnect",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.preloading?.enabled
                    }
                  />
                }
                label="Enable Preconnect"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.performanceFeatures?.preloading
                        ?.enableResourceHints ?? false
                    }
                    onChange={(e) =>
                      updateSetting(
                        "performanceFeatures.preloading.enableResourceHints",
                        e.target.checked
                      )
                    }
                    disabled={
                      !isMainEnabled ||
                      !settings.performanceFeatures?.preloading?.enabled
                    }
                  />
                }
                label="Enable Resource Hints"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
});

// Email Reporting Section
const EmailReporting = React.memo(({ settings, updateSetting, showAlert }) => {
  const { isMainEnabled } = useMasterSwitch();
  const [newReportEmail, setNewReportEmail] = useState("");
  const [deleteEmailDialog, setDeleteEmailDialog] = useState({
    open: false,
    email: "",
    index: -1,
  });
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const addReportEmail = () => {
    const email = newReportEmail.trim();

    // Validate email format
    if (!email) {
      setErrorDialog({
        open: true,
        title: "Invalid Email",
        message: "Please enter an email address.",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorDialog({
        open: true,
        title: "Invalid Email Format",
        message: "Please enter a valid email address (e.g., user@example.com).",
      });
      return;
    }

    const currentEmails = Array.isArray(settings.emailReports?.emails)
      ? settings.emailReports.emails
      : [];

    // Check for duplicates
    const emailToAdd = email.toLowerCase();
    const isDuplicate = currentEmails.some(
      (existingEmail) => existingEmail.toLowerCase() === emailToAdd
    );

    if (isDuplicate) {
      setErrorDialog({
        open: true,
        title: "Duplicate Email",
        message: `The email address "${email}" is already in the report list.`,
      });
      return;
    }

    // Add email if all validations pass
    updateSetting("emailReports.emails", [...currentEmails, email]);
    setNewReportEmail("");
  };

  const handleRemoveReportEmail = (index) => {
    const currentEmails = Array.isArray(settings.emailReports?.emails)
      ? settings.emailReports.emails
      : [];

    setDeleteEmailDialog({
      open: true,
      email: currentEmails[index],
      index: index,
    });
  };

  const confirmRemoveReportEmail = () => {
    const currentEmails = Array.isArray(settings.emailReports?.emails)
      ? settings.emailReports.emails
      : [];

    updateSetting(
      "emailReports.emails",
      currentEmails.filter((_, i) => i !== deleteEmailDialog.index)
    );

    setDeleteEmailDialog({ open: false, email: "", index: -1 });
  };

  const cancelRemoveReportEmail = () => {
    setDeleteEmailDialog({ open: false, email: "", index: -1 });
  };

  const reportEmails = Array.isArray(settings.emailReports?.emails)
    ? settings.emailReports.emails
    : [];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <EmailIcon />
            <Typography variant="subtitle1">Performance Reports</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailReports?.enabled ?? false}
                    onChange={(e) =>
                      updateSetting("emailReports.enabled", e.target.checked)
                    }
                    disabled={!isMainEnabled}
                  />
                }
                label="Enable Email Reports"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Email addresses to receive performance metrics reports
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="Enter email address"
                  value={newReportEmail}
                  onChange={(e) => setNewReportEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addReportEmail()}
                  disabled={!isMainEnabled || !settings.emailReports?.enabled}
                />
                <Button
                  variant="outlined"
                  onClick={addReportEmail}
                  startIcon={<AddIcon />}
                  disabled={!isMainEnabled || !settings.emailReports?.enabled}
                >
                  Add
                </Button>
              </Box>
              <List dense sx={{ maxHeight: 150, overflow: "auto" }}>
                {reportEmails.map((email, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={email} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveReportEmail(index)}
                        aria-label={`Remove report email ${email}`}
                        color="error"
                        disabled={
                          !isMainEnabled || !settings.emailReports?.enabled
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ScheduleIcon />
            <Typography variant="subtitle1">
              Report Schedule & Content
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl
                fullWidth
                disabled={!isMainEnabled || !settings.emailReports?.enabled}
              >
                <InputLabel>Report Frequency</InputLabel>
                <Select
                  value={settings.emailReports?.frequency ?? "weekly"}
                  onChange={(e) =>
                    updateSetting("emailReports.frequency", e.target.value)
                  }
                  label="Report Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Report Time (24h format)"
                type="time"
                value={settings.emailReports?.time ?? "09:00"}
                onChange={(e) =>
                  updateSetting("emailReports.time", e.target.value)
                }
                disabled={!isMainEnabled || !settings.emailReports?.enabled}
                helperText="Time to send reports (server timezone)"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeCoreWebVitals ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeCoreWebVitals",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Core Web Vitals"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeFileOptimization ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeFileOptimization",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include File Optimization"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeCachePerformance ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeCachePerformance",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Cache Performance"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeProcessingQueue ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeProcessingQueue",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Processing Queue"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeRecentActivities ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeRecentActivities",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Recent Activities"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeFeatureStatus ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeFeatureStatus",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Feature Status"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includePerformanceTrends ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includePerformanceTrends",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Performance Trends"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailReports?.includeSparklines ?? true}
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeSparklines",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Activity Sparklines"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeExecutiveSummary ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeExecutiveSummary",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Executive Summary"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={
                      settings.emailReports?.includeRecommendations ?? true
                    }
                    onChange={(e) =>
                      updateSetting(
                        "emailReports.includeRecommendations",
                        e.target.checked
                      )
                    }
                    disabled={!isMainEnabled || !settings.emailReports?.enabled}
                  />
                }
                label="Include Performance Recommendations"
              />
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Delete Email Confirmation Dialog */}
      <Dialog
        open={deleteEmailDialog.open}
        onClose={cancelRemoveReportEmail}
        aria-labelledby="delete-email-dialog-title"
      >
        <DialogTitle id="delete-email-dialog-title">
          Confirm Email Removal
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove "{deleteEmailDialog.email}" from the
            report email list? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRemoveReportEmail} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmRemoveReportEmail}
            color="error"
            variant="contained"
            autoFocus
          >
            Remove Email
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <Dialog
        open={errorDialog.open}
        onClose={() => setErrorDialog({ open: false, title: "", message: "" })}
        aria-labelledby="error-dialog-title"
      >
        <DialogTitle id="error-dialog-title">{errorDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{errorDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setErrorDialog({ open: false, title: "", message: "" })
            }
            color="primary"
            variant="contained"
            autoFocus
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
});

const WebPerformanceSettings = ({
  initialSettings,
  handleFeatureToggle,
  saveSettings,
  savingSettings,
  showAlert,
  defaultSettings,
  refreshData,
}) => {
  const [settings, setSettings] = useState(initialSettings);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showTestResultModal, setShowTestResultModal] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testingRedis, setTestingRedis] = useState(false);
  const [testingR2, setTestingR2] = useState(false);
  const [envConfig, setEnvConfig] = useState(null);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  // Fetch environment configuration
  useEffect(() => {
    const fetchEnvConfig = async () => {
      try {
        const response = await fetch(
          `${getBackendUrl()}/api/web-performance/external-services`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const result = await response.json();
          // Map the external services response to the expected envConfig format
          setEnvConfig({
            hasRedisEndpoint: !!result.data.redis.endpoint,
            hasR2Credentials: !!(
              result.data.cloudflareR2.bucket &&
              result.data.cloudflareR2.hasToken &&
              result.data.cloudflareR2.hasAccessKeyId &&
              result.data.cloudflareR2.hasSecretAccessKey &&
              result.data.cloudflareR2.endpointS3
            ),
            credentials: {
              redisEndpoint: result.data.redis.endpoint || "Not configured",
              bucketName: result.data.cloudflareR2.bucket || "Not configured",
              apiToken: result.data.cloudflareR2.hasToken
                ? "Configured"
                : "Not configured",
              accessKeyId: result.data.cloudflareR2.hasAccessKeyId
                ? "Configured"
                : "Not configured",
              secretAccessKey: result.data.cloudflareR2.hasSecretAccessKey
                ? "Configured"
                : "Not configured",
              endpointS3:
                result.data.cloudflareR2.endpointS3 || "Not configured",
            },
          });
        } else if (response.status === 401 || response.status === 403) {
          // User not authenticated as admin - assume database is configured
          // since they wouldn't be using web-performance features without proper setup
          console.log(
            "Not authenticated as admin - assuming database is configured"
          );
          setEnvConfig({
            hasRedisEndpoint: true, // Assume configured to prevent warnings
            hasR2Credentials: true, // Assume configured to prevent warnings
            credentials: {
              redisEndpoint: "••••• (admin access required for details)",
              bucketName: "••••• (admin access required for details)",
              apiToken: "••••• (admin access required for details)",
              accessKeyId: "••••• (admin access required for details)",
              secretAccessKey: "••••• (admin access required for details)",
              endpointS3: "••••• (admin access required for details)",
            },
          });
        } else {
          console.error(
            "Failed to fetch external services configuration:",
            response.status
          );
          // Set defaults to prevent warnings when endpoint fails
          setEnvConfig({
            hasRedisEndpoint: false,
            hasR2Credentials: false,
            credentials: {
              redisEndpoint: "Loading...",
              bucketName: "Loading...",
              apiToken: "Loading...",
              accessKeyId: "Loading...",
              secretAccessKey: "Loading...",
              endpointS3: "Loading...",
            },
          });
        }
      } catch (error) {
        console.error("Error fetching external services configuration:", error);
        // Assume configured to prevent unnecessary warnings in case of network issues
        setEnvConfig({
          hasRedisEndpoint: true,
          hasR2Credentials: true,
          credentials: {
            redisEndpoint: "••••• (connection error)",
            bucketName: "••••• (connection error)",
            apiToken: "••••• (connection error)",
            accessKeyId: "••••• (connection error)",
            secretAccessKey: "••••• (connection error)",
            endpointS3: "••••• (connection error)",
          },
        });
      }
    };

    fetchEnvConfig();
  }, []);

  const updateSetting = useCallback((path, value) => {
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined) current[key] = {};
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  }, []);

  const handleTestRedis = async () => {
    setTestingRedis(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/test-redis`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();
      if (result.data?.testResult) {
        setTestResult(result.data.testResult);
        setShowTestResultModal(true);
      } else {
        // Fallback to alert if no structured result
        if (response.ok) {
          showAlert(result.message, "success");
        } else {
          showAlert(result.message || "Redis test failed", "error");
        }
      }
    } catch (error) {
      console.error("Error testing Redis:", error);
      setTestResult({
        title: "Redis Connection Test Failed",
        message: "A network error occurred while testing Redis connection",
        severity: "error",
        testResults: {
          connectivity: false,
          connectivityError: error.message,
        },
      });
      setShowTestResultModal(true);
    } finally {
      setTestingRedis(false);
    }
  };

  const handleTestR2 = async () => {
    setTestingR2(true);
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/test-r2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            bucketName:
              settings.cachingLayers?.staticFileCache?.cloudflareR2
                ?.bucketName || "hmern",
          }),
        }
      );

      const result = await response.json();
      if (result.data?.testResult) {
        setTestResult(result.data.testResult);
        setShowTestResultModal(true);
      } else {
        // Fallback to alert if no structured result
        if (response.ok) {
          showAlert(result.message, "success");
        } else {
          showAlert(result.message || "Cloudflare R2 test failed", "error");
        }
      }
    } catch (error) {
      console.error("Error testing R2:", error);
      setTestResult({
        title: "R2 Connection Test Failed",
        message:
          "A network error occurred while testing Cloudflare R2 connection",
        severity: "error",
        testResults: {
          connectivity: false,
          connectivityError: error.message,
        },
      });
      setShowTestResultModal(true);
    } finally {
      setTestingR2(false);
    }
  };

  const resetToDefaults = () => {
    setShowResetDialog(true);
  };

  const confirmReset = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/web-performance/settings/reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      const result = await response.json();
      if (response.ok) {
        setSettings(result.data);
        setShowResetDialog(false);
        showAlert(result.message, "success");

        // Refresh parent component data to sync the reset
        if (refreshData) {
          await refreshData();
        }
      } else {
        showAlert(result.message || "Failed to reset settings", "error");
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      showAlert("Error resetting settings", "error");
    }
  };

  const handleSaveSettings = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    saveSettings(settings);
  };

  if (!settings) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MasterSwitchProvider settings={settings}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Performance Settings
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Note:</strong> These settings control web performance
          optimization features. Enable the master switch to activate all
          performance enhancements.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SectionCard title="General Configuration" icon={<SettingsIcon />}>
            <GeneralConfiguration
              settings={settings}
              handleFeatureToggle={handleFeatureToggle}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="File Optimization" icon={<CodeIcon />}>
            <FileOptimization
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Caching Layers" icon={<CachedIcon />}>
            <CachingLayers
              settings={settings}
              updateSetting={updateSetting}
              handleTestRedis={handleTestRedis}
              handleTestR2={handleTestR2}
              testingRedis={testingRedis}
              testingR2={testingR2}
              envConfig={envConfig}
              savingSettings={savingSettings}
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Performance Features" icon={<SpeedIcon />}>
            <PerformanceFeatures
              settings={settings}
              updateSetting={updateSetting}
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <SectionCard title="Email Reports" icon={<EmailIcon />}>
            <EmailReporting
              settings={settings}
              updateSetting={updateSetting}
              showAlert={showAlert}
            />
          </SectionCard>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={resetToDefaults}
              disabled={savingSettings}
              startIcon={<RestoreIcon />}
              size="large"
              color="warning"
            >
              Reset to Defaults
            </Button>
            <Button
              variant="contained"
              type="button"
              onClick={handleSaveSettings}
              disabled={savingSettings}
              startIcon={
                savingSettings ? <CircularProgress size={20} /> : <SaveIcon />
              }
              size="large"
            >
              {savingSettings ? "Saving..." : "Save Settings"}
            </Button>
          </Box>
        </Grid>
      </Grid>

      <ResetSettingsDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={confirmReset}
      />

      <TestResultDialog
        open={showTestResultModal}
        onClose={() => setShowTestResultModal(false)}
        testResult={testResult}
      />
    </MasterSwitchProvider>
  );
};

export default WebPerformanceSettings;
