import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Preview as PreviewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Tune as TuneIcon,
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

const OptimizationPreviewDialog = ({
  open,
  onClose,
  onConfirm,
  optimizationType = "image_optimization",
  files = [],
  loading = false,
  scanning = false,
  onScan,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [optimizationSettings, setOptimizationSettings] = useState({
    quality: 80,
    format: "auto",
    maxWidth: 1920,
    maxHeight: 1080,
    preserveMetadata: false,
    enableProgressive: true,
    backupOriginals: true,
  });

  // Initialize selected files when files change
  useEffect(() => {
    if (files.length > 0) {
      setSelectedFiles(new Set(files.map((file) => file.id || file.path)));
    }
  }, [files]);

  const optimizationTypes = {
    image_optimization: {
      label: "Image Optimization",
      icon: <ImageIcon />,
      color: "primary",
      description: "Compress and optimize images for better performance",
    },
    css_minification: {
      label: "CSS Minification",
      icon: <CodeIcon />,
      color: "secondary",
      description: "Minify CSS files to reduce file size",
    },
    js_minification: {
      label: "JavaScript Minification",
      icon: <CodeIcon />,
      color: "success",
      description: "Minify JavaScript files to reduce file size",
    },
    webp_conversion: {
      label: "WebP Conversion",
      icon: <ImageIcon />,
      color: "info",
      description: "Convert images to WebP format for better compression",
    },
  };

  const currentType =
    optimizationTypes[optimizationType] || optimizationTypes.image_optimization;

  const handleFileToggle = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((file) => file.id || file.path)));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const calculateEstimatedSavings = () => {
    const selectedFileList = files.filter((file) =>
      selectedFiles.has(file.id || file.path)
    );

    const totalSize = selectedFileList.reduce(
      (sum, file) => sum + (file.size || 0),
      0
    );
    const estimatedSavings =
      totalSize * (optimizationType === "image_optimization" ? 0.4 : 0.3); // 40% for images, 30% for others

    return {
      totalFiles: selectedFileList.length,
      totalSize,
      estimatedSavings,
      estimatedFinalSize: totalSize - estimatedSavings,
    };
  };

  const stats = calculateEstimatedSavings();

  const handleConfirm = () => {
    const selectedFileList = files.filter((file) =>
      selectedFiles.has(file.id || file.path)
    );

    onConfirm({
      files: selectedFileList,
      settings: optimizationSettings,
      type: optimizationType,
      estimatedSavings: stats.estimatedSavings,
    });
  };

  const FilesList = () => (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={
                  selectedFiles.size > 0 && selectedFiles.size < files.length
                }
                checked={
                  files.length > 0 && selectedFiles.size === files.length
                }
                onChange={handleSelectAll}
              />
            </TableCell>
            <TableCell>File</TableCell>
            <TableCell>Size</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Estimated Savings</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((file) => {
            const fileId = file.id || file.path;
            const isSelected = selectedFiles.has(fileId);
            const estimatedSaving =
              (file.size || 0) *
              (optimizationType === "image_optimization" ? 0.4 : 0.3);

            return (
              <TableRow key={fileId} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleFileToggle(fileId)}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {currentType.icon}
                    <Tooltip title={file.path} arrow>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {file.name || file.path.split("/").pop()}
                      </Typography>
                    </Tooltip>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatFileSize(file.size || 0)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={file.type || "Unknown"}
                    size="small"
                    color={currentType.color}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    color="success.main"
                    fontWeight={600}
                  >
                    {formatFileSize(estimatedSaving)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={file.status || "Ready"}
                    size="small"
                    color={file.status === "error" ? "error" : "success"}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const SettingsPanel = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Optimization Settings
      </Typography>

      <Grid container spacing={3}>
        {optimizationType === "image_optimization" && (
          <>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Quality</InputLabel>
                <Select
                  value={optimizationSettings.quality}
                  onChange={(e) =>
                    setOptimizationSettings((prev) => ({
                      ...prev,
                      quality: e.target.value,
                    }))
                  }
                  label="Quality"
                >
                  <MenuItem value={60}>Low (60% - High compression)</MenuItem>
                  <MenuItem value={80}>Medium (80% - Recommended)</MenuItem>
                  <MenuItem value={90}>High (90% - Low compression)</MenuItem>
                  <MenuItem value={95}>
                    Maximum (95% - Minimal compression)
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Output Format</InputLabel>
                <Select
                  value={optimizationSettings.format}
                  onChange={(e) =>
                    setOptimizationSettings((prev) => ({
                      ...prev,
                      format: e.target.value,
                    }))
                  }
                  label="Output Format"
                >
                  <MenuItem value="auto">Auto (Best format)</MenuItem>
                  <MenuItem value="jpeg">JPEG</MenuItem>
                  <MenuItem value="png">PNG</MenuItem>
                  <MenuItem value="webp">WebP</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Width (px)"
                value={optimizationSettings.maxWidth}
                onChange={(e) =>
                  setOptimizationSettings((prev) => ({
                    ...prev,
                    maxWidth: parseInt(e.target.value) || 1920,
                  }))
                }
                inputProps={{ min: 100, max: 4000 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Max Height (px)"
                value={optimizationSettings.maxHeight}
                onChange={(e) =>
                  setOptimizationSettings((prev) => ({
                    ...prev,
                    maxHeight: parseInt(e.target.value) || 1080,
                  }))
                }
                inputProps={{ min: 100, max: 4000 }}
              />
            </Grid>
          </>
        )}

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={optimizationSettings.preserveMetadata}
                onChange={(e) =>
                  setOptimizationSettings((prev) => ({
                    ...prev,
                    preserveMetadata: e.target.checked,
                  }))
                }
              />
            }
            label="Preserve metadata (EXIF, etc.)"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={optimizationSettings.backupOriginals}
                onChange={(e) =>
                  setOptimizationSettings((prev) => ({
                    ...prev,
                    backupOriginals: e.target.checked,
                  }))
                }
              />
            }
            label="Backup original files"
          />
        </Grid>

        {optimizationType === "image_optimization" && (
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={optimizationSettings.enableProgressive}
                  onChange={(e) =>
                    setOptimizationSettings((prev) => ({
                      ...prev,
                      enableProgressive: e.target.checked,
                    }))
                  }
                />
              }
              label="Enable progressive loading"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );

  const SummaryPanel = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Optimization Summary
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight={700}>
                {stats.totalFiles}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Files Selected
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight={700}>
                {formatFileSize(stats.totalSize)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total Size
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight={700}>
                {formatFileSize(stats.estimatedSavings)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estimated Savings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight={700}>
                {Math.round((stats.estimatedSavings / stats.totalSize) * 100) ||
                  0}
                %
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compression Ratio
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          💡 Optimization Preview
        </Typography>
        <Typography variant="body2">
          This is an estimated preview. Actual results may vary based on file
          content and settings. Processing time: ~
          {Math.ceil(stats.totalFiles / 10)} minutes for {stats.totalFiles}{" "}
          files.
        </Typography>
      </Alert>

      <List dense>
        <ListItem>
          <ListItemIcon>
            <CheckCircleIcon color="success" />
          </ListItemIcon>
          <ListItemText
            primary="Backup Strategy"
            secondary={
              optimizationSettings.backupOriginals
                ? "Original files will be backed up"
                : "No backup (original files will be replaced)"
            }
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <SpeedIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Performance Impact"
            secondary="Optimized files will load faster and use less bandwidth"
          />
        </ListItem>

        <ListItem>
          <ListItemIcon>
            <StorageIcon color="info" />
          </ListItemIcon>
          <ListItemText
            primary="Storage Savings"
            secondary={`Approximately ${formatFileSize(
              stats.estimatedSavings
            )} will be saved`}
          />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "80vh" },
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
        <PreviewIcon color="primary" />
        Optimization Preview - {currentType.label}
        {scanning && <CircularProgress size={20} sx={{ ml: 1 }} />}
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onScan} disabled={scanning} size="small">
          <RefreshIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Alert severity="info" sx={{ m: 2, mb: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            {currentType.description}
          </Typography>
          <Typography variant="body2">
            Review the files and settings below, then click "Start Optimization"
            to begin.
          </Typography>
        </Alert>

        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={`Files (${files.length})`}
            icon={<StorageIcon />}
            iconPosition="start"
          />
          <Tab label="Settings" icon={<TuneIcon />} iconPosition="start" />
          <Tab label="Summary" icon={<InfoIcon />} iconPosition="start" />
        </Tabs>

        <Box sx={{ height: "calc(100% - 48px)", overflow: "auto" }}>
          {tabValue === 0 && <FilesList />}
          {tabValue === 1 && <SettingsPanel />}
          {tabValue === 2 && <SummaryPanel />}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={selectedFiles.size === 0 || loading}
          startIcon={
            loading ? <CircularProgress size={16} /> : <PlayArrowIcon />
          }
        >
          {loading
            ? "Starting..."
            : `Optimize ${selectedFiles.size} File${
                selectedFiles.size !== 1 ? "s" : ""
              }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OptimizationPreviewDialog;
