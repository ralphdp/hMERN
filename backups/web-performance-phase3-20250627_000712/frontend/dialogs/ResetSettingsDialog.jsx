import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

const ResetSettingsDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reset Settings to Defaults</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to reset all web performance settings to their
          default values? This action cannot be undone and will disable all
          optimizations.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="warning" variant="contained">
          Reset to Defaults
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ResetSettingsDialog;
