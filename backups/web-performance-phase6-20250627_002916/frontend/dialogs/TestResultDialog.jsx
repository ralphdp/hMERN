import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
} from "@mui/material";
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

const TestResultDialog = ({ open, onClose, testResult }) => {
  if (!testResult) return null;

  const getIcon = () => {
    switch (testResult.severity) {
      case "success":
        return <SuccessIcon sx={{ color: "common.white" }} />;
      case "error":
        return <ErrorIcon sx={{ color: "common.white" }} />;
      case "warning":
        return <WarningIcon sx={{ color: "common.white" }} />;
      default:
        return <InfoIcon sx={{ color: "common.white" }} />;
    }
  };

  const getBackgroundColor = () => {
    switch (testResult.severity) {
      case "success":
        return "success.main";
      case "error":
        return "error.main";
      case "warning":
        return "warning.main";
      default:
        return "info.main";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="test-result-dialog-title"
    >
      <DialogTitle
        id="test-result-dialog-title"
        sx={{
          backgroundColor: getBackgroundColor(),
          color: "common.white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {getIcon()}
        {testResult.title}
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <DialogContentText sx={{ my: 2 }}>
          {testResult.message}
        </DialogContentText>

        {/* Connection Details - Show for both Redis and R2 */}
        {testResult.details && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              Connection Details:
            </Typography>
            {testResult.details.endpoint && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Endpoint:</strong> {testResult.details.endpoint}
              </Typography>
            )}
            {testResult.details.bucketName && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Bucket:</strong> {testResult.details.bucketName}
              </Typography>
            )}
            {testResult.details.accessKeyId && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Access Key:</strong> {testResult.details.accessKeyId}
              </Typography>
            )}
          </Box>
        )}

        {/* Test Results */}
        {testResult.testResults && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              Test Results:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {testResult.testResults.connectivity !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={
                      testResult.testResults.connectivity ? "PASS" : "FAIL"
                    }
                    color={
                      testResult.testResults.connectivity ? "success" : "error"
                    }
                    size="small"
                  />
                  <Typography variant="body2">Connection Test</Typography>
                </Box>
              )}
              {testResult.testResults.headBucket !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={testResult.testResults.headBucket ? "PASS" : "FAIL"}
                    color={
                      testResult.testResults.headBucket ? "success" : "error"
                    }
                    size="small"
                  />
                  <Typography variant="body2">Bucket Access Test</Typography>
                </Box>
              )}
              {testResult.testResults.listBuckets !== undefined && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip
                    label={testResult.testResults.listBuckets ? "PASS" : "FAIL"}
                    color={
                      testResult.testResults.listBuckets ? "success" : "error"
                    }
                    size="small"
                  />
                  <Typography variant="body2">List Buckets Test</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Buckets Found - Only for R2 tests */}
        {testResult.bucketsFound !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              Buckets Found: {testResult.bucketsFound}
            </Typography>
            {testResult.buckets && testResult.buckets.length > 0 && (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {testResult.buckets.map((bucket, index) => (
                  <Chip
                    key={index}
                    label={bucket}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Troubleshooting Tips - Show for both Redis and R2 errors */}
        {testResult.severity === "error" && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              Troubleshooting Tips:
            </Typography>
            <Typography variant="body2" component="div">
              {testResult.title?.includes("Redis") ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Verify Redis endpoint is accessible from your server</li>
                  <li>Check Redis password and connection string</li>
                  <li>
                    Ensure Redis service is running and accepting connections
                  </li>
                  <li>Verify firewall settings allow Redis port access</li>
                </ul>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>
                    Verify your R2 API token has "Account → Cloudflare R2:Edit"
                    permission
                  </li>
                  <li>
                    Check that the bucket name exists in your R2 dashboard
                  </li>
                  <li>Ensure R2 is enabled on your Cloudflare account</li>
                  <li>Verify your credentials are up to date</li>
                </ul>
              )}
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="contained" autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestResultDialog;
