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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  AutoFixHigh as AutoFixHighIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  PlayArrow as PlayArrowIcon,
  Folder as FolderIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  FilterList as FilterListIcon,
  Tune as TuneIcon,
} from "@mui/icons-material";

const BulkOptimizationDialog = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  estimatedFiles = 0,
  estimatedSize = 0,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedOperations, setSelectedOperations] = useState({
    image_optimization: false,
    css_minification: false,
    js_minification: false,
    webp_conversion: false,
    cache_optimization: false,
  });

  const [filters, setFilters] = useState({
    // Path filters
    includePaths: "",
    excludePaths: "",
    fileExtensions: [],

    // Size filters
    minFileSize: 0, // bytes
    maxFileSize: 50 * 1024 * 1024, // 50MB

    // Date filters
    modifiedAfter: "",
    modifiedBefore: "",

    // Content filters
    skipAlreadyOptimized: true,
    skipSystemFiles: true,
    includeHiddenFiles: false,
  });

  const [batchSettings, setBatchSettings] = useState({
    batchSize: 10,
    maxParallel: 3,
    delayBetweenBatches: 1000, // milliseconds
    stopOnError: false,
    createBackup: true,
    compressionLevel: "balanced",
    priority: "normal",
  });

  const [schedule, setSchedule] = useState({
    runImmediately: true,
    scheduledTime: "",
    recurring: false,
    interval: "weekly",
  });

  const optimizationOperations = {
    image_optimization: {
      label: "Image Optimization",
      icon: <ImageIcon />,
      color: "primary",
      description: "Compress and optimize images (JPEG, PNG, WebP)",
      estimatedSavings: "30-60%",
      extensions: ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"],
    },
    css_minification: {
      label: "CSS Minification",
      icon: <CodeIcon />,
      color: "secondary",
      description: "Remove whitespace and comments from CSS files",
      estimatedSavings: "15-30%",
      extensions: ["css", "scss", "sass", "less"],
    },
    js_minification: {
      label: "JavaScript Minification",
      icon: <CodeIcon />,
      color: "success",
      description: "Minify JavaScript files and remove unused code",
      estimatedSavings: "20-40%",
      extensions: ["js", "jsx", "ts", "tsx", "mjs"],
    },
    webp_conversion: {
      label: "WebP Conversion",
      icon: <ImageIcon />,
      color: "info",
      description: "Convert images to WebP format for better compression",
      estimatedSavings: "25-50%",
      extensions: ["jpg", "jpeg", "png"],
    },
    cache_optimization: {
      label: "Cache Optimization",
      icon: <StorageIcon />,
      color: "warning",
      description: "Optimize cache headers and file versioning",
      estimatedSavings: "10-20%",
      extensions: ["html", "css", "js", "jpg", "png", "webp"],
    },
  };

  const fileExtensionOptions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "svg",
    "bmp",
    "css",
    "scss",
    "sass",
    "less",
    "js",
    "jsx",
    "ts",
    "tsx",
    "mjs",
    "html",
    "htm",
    "php",
  ];

  const handleOperationToggle = (operation) => {
    setSelectedOperations((prev) => ({
      ...prev,
      [operation]: !prev[operation],
    }));
  };

  const handleExtensionToggle = (extension) => {
    setFilters((prev) => ({
      ...prev,
      fileExtensions: prev.fileExtensions.includes(extension)
        ? prev.fileExtensions.filter((ext) => ext !== extension)
        : [...prev.fileExtensions, extension],
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const selectedOperationsCount =
    Object.values(selectedOperations).filter(Boolean).length;
  const canProceed = selectedOperationsCount > 0;

  const calculateEstimatedProcessingTime = () => {
    // Rough estimate: 100 files per minute
    const filesPerMinute = 100 / selectedOperationsCount;
    const estimatedMinutes = Math.ceil(estimatedFiles / filesPerMinute);
    return estimatedMinutes;
  };

  const handleConfirm = () => {
    const selectedOps = Object.keys(selectedOperations).filter(
      (key) => selectedOperations[key]
    );

    onConfirm({
      operations: selectedOps,
      filters,
      batchSettings,
      schedule,
      estimatedFiles,
      estimatedProcessingTime: calculateEstimatedProcessingTime(),
    });
  };

  const StepOperationSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Optimization Operations
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose which optimization operations to run. Multiple operations can be
        selected.
      </Typography>

      <Grid container spacing={2}>
        {Object.entries(optimizationOperations).map(([key, operation]) => (
          <Grid item xs={12} sm={6} key={key}>
            <Card
              variant="outlined"
              sx={{
                border: selectedOperations[key] ? 2 : 1,
                borderColor: selectedOperations[key]
                  ? `${operation.color}.main`
                  : "divider",
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  borderColor: `${operation.color}.light`,
                  boxShadow: 1,
                },
              }}
              onClick={() => handleOperationToggle(key)}
            >
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedOperations[key]}
                        onChange={() => handleOperationToggle(key)}
                        color={operation.color}
                      />
                    }
                    label=""
                    sx={{ margin: 0 }}
                  />
                  {operation.icon}
                  <Typography variant="subtitle1" fontWeight={600}>
                    {operation.label}
                  </Typography>
                  <Chip
                    label={operation.estimatedSavings}
                    size="small"
                    color={operation.color}
                    variant="outlined"
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {operation.description}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {operation.extensions.slice(0, 4).map((ext) => (
                    <Chip
                      key={ext}
                      label={`.${ext}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                  {operation.extensions.length > 4 && (
                    <Chip
                      label={`+${operation.extensions.length - 4} more`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const StepFilters = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Configure Filters
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set filters to control which files are processed during bulk
        optimization.
      </Typography>

      <Grid container spacing={3}>
        {/* Path Filters */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FolderIcon />
                <Typography variant="subtitle1">Path Filters</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Include Paths"
                    placeholder="e.g., /uploads/, /assets/"
                    value={filters.includePaths}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        includePaths: e.target.value,
                      }))
                    }
                    helperText="Comma-separated paths to include"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Exclude Paths"
                    placeholder="e.g., /temp/, /cache/"
                    value={filters.excludePaths}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        excludePaths: e.target.value,
                      }))
                    }
                    helperText="Comma-separated paths to exclude"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* File Extensions */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterListIcon />
                <Typography variant="subtitle1">
                  File Extensions ({filters.fileExtensions.length} selected)
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {fileExtensionOptions.map((ext) => (
                  <Chip
                    key={ext}
                    label={`.${ext}`}
                    clickable
                    color={
                      filters.fileExtensions.includes(ext)
                        ? "primary"
                        : "default"
                    }
                    variant={
                      filters.fileExtensions.includes(ext)
                        ? "filled"
                        : "outlined"
                    }
                    onClick={() => handleExtensionToggle(ext)}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Size Filters */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <StorageIcon />
                <Typography variant="subtitle1">Size Filters</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Min File Size (KB)"
                    value={Math.round(filters.minFileSize / 1024)}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        minFileSize: parseInt(e.target.value) * 1024 || 0,
                      }))
                    }
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max File Size (MB)"
                    value={Math.round(filters.maxFileSize / (1024 * 1024))}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        maxFileSize:
                          parseInt(e.target.value) * 1024 * 1024 ||
                          50 * 1024 * 1024,
                      }))
                    }
                    inputProps={{ min: 1, max: 1000 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Content Filters */}
        <Grid item xs={12}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TuneIcon />
                <Typography variant="subtitle1">Content Filters</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.skipAlreadyOptimized}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          skipAlreadyOptimized: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Skip already optimized files"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.skipSystemFiles}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          skipSystemFiles: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Skip system files"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.includeHiddenFiles}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          includeHiddenFiles: e.target.checked,
                        }))
                      }
                    />
                  }
                  label="Include hidden files"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>
        </Grid>
      </Grid>
    </Box>
  );

  const StepBatchSettings = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Batch Processing Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how files are processed in batches to optimize performance and
        system resources.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Batch Size</InputLabel>
            <Select
              value={batchSettings.batchSize}
              onChange={(e) =>
                setBatchSettings((prev) => ({
                  ...prev,
                  batchSize: e.target.value,
                }))
              }
              label="Batch Size"
            >
              <MenuItem value={5}>
                Small (5 files) - Lower resource usage
              </MenuItem>
              <MenuItem value={10}>Medium (10 files) - Balanced</MenuItem>
              <MenuItem value={20}>
                Large (20 files) - Faster processing
              </MenuItem>
              <MenuItem value={50}>
                Extra Large (50 files) - Maximum speed
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Max Parallel Operations</InputLabel>
            <Select
              value={batchSettings.maxParallel}
              onChange={(e) =>
                setBatchSettings((prev) => ({
                  ...prev,
                  maxParallel: e.target.value,
                }))
              }
              label="Max Parallel Operations"
            >
              <MenuItem value={1}>Sequential (1) - Safest</MenuItem>
              <MenuItem value={3}>Low (3) - Recommended</MenuItem>
              <MenuItem value={5}>Medium (5) - Good balance</MenuItem>
              <MenuItem value={8}>High (8) - Fast processing</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography gutterBottom>
            Delay Between Batches: {batchSettings.delayBetweenBatches / 1000}s
          </Typography>
          <Slider
            value={batchSettings.delayBetweenBatches}
            onChange={(e, value) =>
              setBatchSettings((prev) => ({
                ...prev,
                delayBetweenBatches: value,
              }))
            }
            min={0}
            max={5000}
            step={500}
            marks={[
              { value: 0, label: "0s" },
              { value: 1000, label: "1s" },
              { value: 2500, label: "2.5s" },
              { value: 5000, label: "5s" },
            ]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value / 1000}s`}
          />
        </Grid>

        <Grid item xs={12}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={batchSettings.stopOnError}
                  onChange={(e) =>
                    setBatchSettings((prev) => ({
                      ...prev,
                      stopOnError: e.target.checked,
                    }))
                  }
                />
              }
              label="Stop processing on first error"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={batchSettings.createBackup}
                  onChange={(e) =>
                    setBatchSettings((prev) => ({
                      ...prev,
                      createBackup: e.target.checked,
                    }))
                  }
                />
              }
              label="Create backup of original files"
            />
          </FormGroup>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Compression Level</InputLabel>
            <Select
              value={batchSettings.compressionLevel}
              onChange={(e) =>
                setBatchSettings((prev) => ({
                  ...prev,
                  compressionLevel: e.target.value,
                }))
              }
              label="Compression Level"
            >
              <MenuItem value="fast">
                Fast - Lower compression, faster processing
              </MenuItem>
              <MenuItem value="balanced">
                Balanced - Good compression and speed
              </MenuItem>
              <MenuItem value="maximum">
                Maximum - Best compression, slower processing
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Processing Priority</InputLabel>
            <Select
              value={batchSettings.priority}
              onChange={(e) =>
                setBatchSettings((prev) => ({
                  ...prev,
                  priority: e.target.value,
                }))
              }
              label="Processing Priority"
            >
              <MenuItem value="low">Low - Background processing</MenuItem>
              <MenuItem value="normal">Normal - Standard priority</MenuItem>
              <MenuItem value="high">High - Priority processing</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  const StepSummary = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Optimization Summary
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Review your settings before starting the bulk optimization process.
      </Typography>

      {/* Operation Summary */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader title="Selected Operations" avatar={<AutoFixHighIcon />} />
        <CardContent>
          <Grid container spacing={1}>
            {Object.entries(selectedOperations)
              .filter(([_, selected]) => selected)
              .map(([key, _]) => (
                <Grid item key={key}>
                  <Chip
                    icon={optimizationOperations[key].icon}
                    label={optimizationOperations[key].label}
                    color={optimizationOperations[key].color}
                    variant="outlined"
                  />
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Estimates */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight={700}>
                {estimatedFiles}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Estimated Files
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight={700}>
                {formatFileSize(estimatedSize)}
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
                ~{Math.round((estimatedSize * 0.35) / (1024 * 1024))}MB
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Est. Savings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Card variant="outlined">
            <CardContent sx={{ textAlign: "center", p: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight={700}>
                ~{calculateEstimatedProcessingTime()}min
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Est. Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Warnings & Info */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          📊 Processing Overview
        </Typography>
        <Typography variant="body2">
          • Files will be processed in batches of {batchSettings.batchSize}•
          Maximum {batchSettings.maxParallel} parallel operations •{" "}
          {batchSettings.delayBetweenBatches / 1000}s delay between batches •{" "}
          {batchSettings.createBackup
            ? "Backups will be created"
            : "No backups (original files replaced)"}
        </Typography>
      </Alert>

      {!batchSettings.createBackup && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            ⚠️ No Backup Warning
          </Typography>
          <Typography variant="body2">
            Original files will be replaced without backup. This action cannot
            be undone.
          </Typography>
        </Alert>
      )}
    </Box>
  );

  const steps = [
    {
      label: "Select Operations",
      content: <StepOperationSelection />,
    },
    {
      label: "Configure Filters",
      content: <StepFilters />,
    },
    {
      label: "Batch Settings",
      content: <StepBatchSettings />,
    },
    {
      label: "Review & Start",
      content: <StepSummary />,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh" },
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
        <AutoFixHighIcon color="primary" />
        Bulk Optimization Configuration
        {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  {step.content}
                  <Box sx={{ mt: 3, mb: 2 }}>
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(activeStep + 1)}
                      disabled={index === 0 && !canProceed}
                      sx={{ mr: 1 }}
                    >
                      {index === steps.length - 1 ? "Review" : "Continue"}
                    </Button>
                    <Button
                      disabled={activeStep === 0}
                      onClick={() => setActiveStep(activeStep - 1)}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
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
          disabled={!canProceed || activeStep < steps.length - 1 || loading}
          startIcon={
            loading ? <CircularProgress size={16} /> : <PlayArrowIcon />
          }
        >
          {loading ? "Starting..." : `Start Bulk Optimization`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkOptimizationDialog;
