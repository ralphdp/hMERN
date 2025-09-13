import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  LinearProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  Compress as CompressIcon,
  Queue as QueueIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const WebPerformanceOptimizations = ({
  stats = {},
  settings = {},
  config = {},
  onOptimizeFile,
  onBulkOperation,
  apiCall,
  showSnackbar,
  optimizing = false,
  refreshing = false,
}) => {
  const [queue, setQueue] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [taskType, setTaskType] = useState("minify_css");
  const [filePath, setFilePath] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);

  // Fetch optimization queue
  const fetchQueue = async () => {
    try {
      setLoading(true);
      const data = await apiCall("queue");
      setQueue(data.data.queue || []);
    } catch (error) {
      showSnackbar("Error fetching queue", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const taskTypeOptions = [
    { value: "minify_css", label: "Minify CSS", icon: <CodeIcon /> },
    { value: "minify_js", label: "Minify JavaScript", icon: <CodeIcon /> },
    { value: "optimize_image", label: "Optimize Image", icon: <ImageIcon /> },
    { value: "generate_webp", label: "Generate WebP", icon: <ImageIcon /> },
    {
      value: "compress_assets",
      label: "Compress Assets",
      icon: <CompressIcon />,
    },
    { value: "upload_to_r2", label: "Upload to R2", icon: <UploadIcon /> },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "processing":
        return "warning";
      case "pending":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckIcon />;
      case "failed":
        return <ErrorIcon />;
      case "processing":
        return <PlayIcon />;
      case "pending":
        return <ScheduleIcon />;
      default:
        return <QueueIcon />;
    }
  };

  const handleAddOptimization = async () => {
    if (!filePath.trim()) {
      showSnackbar("Please enter a file path", "error");
      return;
    }

    try {
      await onOptimizeFile(filePath, taskType);
      setShowAddDialog(false);
      setFilePath("");
      await fetchQueue();
    } catch (error) {
      showSnackbar("Error adding optimization task", "error");
    }
  };

  const handleBulkOptimize = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar("Please select files to optimize", "error");
      return;
    }

    try {
      await onBulkOperation("optimize_multiple", selectedFiles, { taskType });
      setSelectedFiles([]);
      await fetchQueue();
    } catch (error) {
      showSnackbar("Error starting bulk optimization", "error");
    }
  };

  const filteredQueue = queue.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const queueStats = {
    pending: queue.filter((item) => item.status === "pending").length,
    processing: queue.filter((item) => item.status === "processing").length,
    completed: queue.filter((item) => item.status === "completed").length,
    failed: queue.filter((item) => item.status === "failed").length,
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Performance Optimizations
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchQueue}
            disabled={loading || refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddDialog(true)}
            disabled={optimizing}
          >
            Add Optimization
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Badge badgeContent={queueStats.pending} color="info">
                  <QueueIcon color="info" />
                </Badge>
                <Box>
                  <Typography variant="h6">{queueStats.pending}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Badge badgeContent={queueStats.processing} color="warning">
                  <PlayIcon color="warning" />
                </Badge>
                <Box>
                  <Typography variant="h6">{queueStats.processing}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Processing
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Badge badgeContent={queueStats.completed} color="success">
                  <CheckIcon color="success" />
                </Badge>
                <Box>
                  <Typography variant="h6">{queueStats.completed}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Badge badgeContent={queueStats.failed} color="error">
                  <ErrorIcon color="error" />
                </Badge>
                <Box>
                  <Typography variant="h6">{queueStats.failed}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Queue Table */}
      <Card>
        <CardHeader
          title="Optimization Queue"
          action={
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Filter</InputLabel>
                <Select
                  value={filter}
                  label="Filter"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
              {selectedFiles.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleBulkOptimize}
                  disabled={optimizing}
                >
                  Optimize {selectedFiles.length} Selected
                </Button>
              )}
            </Box>
          }
        />
        <CardContent>
          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {filteredQueue.length === 0 ? (
            <Alert severity="info">
              No optimization tasks found.{" "}
              {filter !== "all" && `Try changing the filter or `}
              <Button onClick={() => setShowAddDialog(true)} size="small">
                add a new optimization task
              </Button>
              .
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      {/* Checkbox for select all */}
                    </TableCell>
                    <TableCell>Task Type</TableCell>
                    <TableCell>File Path</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQueue.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell padding="checkbox">
                        {/* Checkbox for individual selection */}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          {
                            taskTypeOptions.find(
                              (t) => t.value === item.taskType
                            )?.icon
                          }
                          {taskTypeOptions.find(
                            (t) => t.value === item.taskType
                          )?.label || item.taskType}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {item.filePath}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(item.status)}
                          label={item.status}
                          color={getStatusColor(item.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(item.createdAt).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        {item.status === "failed" && (
                          <Tooltip title="Retry">
                            <IconButton size="small" color="primary">
                              <RefreshIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add Optimization Dialog */}
      <Dialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Optimization Task</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={taskType}
                label="Task Type"
                onChange={(e) => setTaskType(e.target.value)}
              >
                {taskTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {option.icon}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="File Path"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              placeholder="e.g., frontend/src/styles/main.css"
              helperText="Enter the relative path to the file to optimize"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddOptimization}
            variant="contained"
            disabled={!filePath.trim() || optimizing}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WebPerformanceOptimizations;
