import React, { Component } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import createLogger from "../utils/logger";

const logger = createLogger("ErrorBoundary");

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    logger.error("Caught an error in ErrorBoundary", { error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper sx={{ p: 4, m: 2, textAlign: "center" }}>
          <ErrorOutline sx={{ fontSize: 48, color: "error.main" }} />
          <Typography variant="h5" gutterBottom>
            Something went wrong.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            We're sorry for the inconvenience. Please try reloading the page.
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReload}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
          {process.env.NODE_ENV === "development" && (
            <Box
              sx={{
                mt: 2,
                textAlign: "left",
                maxHeight: 300,
                overflow: "auto",
              }}
            >
              <Typography variant="subtitle2" color="error.main">
                {this.state.error && this.state.error.toString()}
              </Typography>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </Box>
          )}
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
