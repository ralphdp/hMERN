import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

const TestResultDialog = ({ open, onClose, result }) => {
  if (!result) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          backgroundColor: result.success ? "success.main" : "error.main",
          color: "common.white",
        }}
      >
        {result.title}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <DialogContentText sx={{ mt: 2 }}>{result.message}</DialogContentText>
        {result.ip && (
          <DialogContentText sx={{ mt: 2 }}>
            <strong>Detected IP:</strong> {result.ip}
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} autoFocus>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TestResultDialog;
