import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Cache as CacheIcon,
  Storage as StorageIcon,
  Memory as MemoryIcon,
  Database as DatabaseIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

const ClearCacheDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  cacheStats = null,
}) => {
  const [selectedCacheTypes, setSelectedCacheTypes] = useState({
    database: false,
    fragment: false,
    static_file: false,
    browser: false,
    memory: false,
    redis: false,
  });

  const [confirmationText, setConfirmationText] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const cacheTypeInfo = {
    database: {
      icon: <DatabaseIcon />,
      label: "Database Cache",
      description: "Query results and database object cache",
      impact: "May temporarily slow down database queries",
      color: "primary",
    },
    fragment: {
      icon: <CacheIcon />,
      label: "Fragment Cache",
      description: "Page fragments and rendered content cache",
      impact: "Pages may load slower initially",
      color: "secondary",
    },
    static_file: {
      icon: <StorageIcon />,
      label: "Static File Cache",
      description: "CSS, JS, and other static assets cache",
      impact: "Static files will need to be re-cached",
      color: "success",
    },
    browser: {
      icon: <SpeedIcon />,
      label: "Browser Cache",
      description: "Client-side browser cache headers",
      impact: "Visitors will need to download assets again",
      color: "warning",
    },
    memory: {
      icon: <MemoryIcon />,
      label: "Memory Cache",
      description: "In-memory cache for frequently accessed data",
      impact: "Immediate performance impact until cache rebuilds",
      color: "error",
    },
    redis: {
      icon: <CacheIcon />,
      label: "Redis Cache",
      description: "External Redis cache store",
      impact: "Session data and cached objects will be lost",
      color: "info",
    },
  };

  const handleCacheTypeChange = (cacheType) => {
    setSelectedCacheTypes((prev) => ({
      ...prev,
      [cacheType]: !prev[cacheType],
    }));
  };

  const selectedCount =
    Object.values(selectedCacheTypes).filter(Boolean).length;
  const hasSelections = selectedCount > 0;

  const handleConfirm = () => {
    const selectedTypes = Object.keys(selectedCacheTypes).filter(
      (key) => selectedCacheTypes[key]
    );

    onConfirm({
      cacheTypes: selectedTypes,
      force: showAdvanced,
      confirmationText,
    });
  };

  const getCacheSize = (type) => {
    if (!cacheStats || !cacheStats[type]) return "Unknown";
    const size = cacheStats[type].size || 0;
    return formatBytes(size);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: "500px" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pb: 1,
        }}
      >
        <DeleteIcon color="error" />
        Clear Performance Cache
        {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              ⚠️ Cache Clearing Impact
            </Typography>
            <Typography variant="body2">
              Clearing cache will temporarily reduce performance until caches
              are rebuilt. Select only the cache types you need to clear.
            </Typography>
          </Box>
        </Alert>

        <Typography variant="h6" gutterBottom>
          Select Cache Types to Clear:
        </Typography>

        <FormControl component="fieldset" sx={{ width: "100%", mb: 3 }}>
          <FormGroup>
            {Object.entries(cacheTypeInfo).map(([type, info]) => (
              <Paper
                key={type}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 2,
                  border: selectedCacheTypes[type] ? 2 : 1,
                  borderColor: selectedCacheTypes[type]
                    ? "primary.main"
                    : "divider",
                  "&:hover": {
                    borderColor: "primary.light",
                    boxShadow: 1,
                  },
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedCacheTypes[type]}
                      onChange={() => handleCacheTypeChange(type)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ width: "100%" }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        {info.icon}
                        <Typography variant="subtitle1" fontWeight={600}>
                          {info.label}
                        </Typography>
                        <Chip
                          label={getCacheSize(type)}
                          size="small"
                          color={info.color}
                          variant="outlined"
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {info.description}
                      </Typography>
                      <Typography variant="caption" color="warning.main">
                        Impact: {info.impact}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: "flex-start", margin: 0, width: "100%" }}
                />
              </Paper>
            ))}
          </FormGroup>
        </FormControl>

        {hasSelections && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              📊 Impact Summary
            </Typography>
            <Typography variant="body2">
              {selectedCount} cache type{selectedCount > 1 ? "s" : ""} selected
              for clearing. This action cannot be undone, but caches will
              automatically rebuild.
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <FormControlLabel
          control={
            <Checkbox
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
              color="warning"
            />
          }
          label={
            <Box>
              <Typography variant="body2" fontWeight={500}>
                Advanced: Force clear all cache keys
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Bypasses safety checks and clears all related cache data
              </Typography>
            </Box>
          }
        />

        {hasSelections && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Expected Recovery Times:
            </Typography>
            <List dense>
              {Object.entries(selectedCacheTypes)
                .filter(([_, selected]) => selected)
                .map(([type, _]) => (
                  <ListItem key={type} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InfoIcon fontSize="small" color="info" />
                    </ListItemIcon>
                    <ListItemText
                      primary={cacheTypeInfo[type].label}
                      secondary={getRecoveryTime(type)}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={!hasSelections || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <DeleteIcon />}
        >
          {loading
            ? "Clearing..."
            : `Clear ${selectedCount} Cache Type${
                selectedCount !== 1 ? "s" : ""
              }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const getRecoveryTime = (cacheType) => {
  const times = {
    database: "1-5 minutes (as queries are executed)",
    fragment: "5-15 minutes (as pages are visited)",
    static_file: "2-10 minutes (on first access)",
    browser: "10-30 minutes (for returning visitors)",
    memory: "30 seconds - 2 minutes (immediate rebuild)",
    redis: "1-5 minutes (as sessions are created)",
  };
  return times[cacheType] || "Variable";
};

export default ClearCacheDialog;
