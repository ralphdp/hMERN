import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { NotInterested as NotInterestedIcon } from "@mui/icons-material";

const IPBlockingDisableDialog = ({
  open,
  onClose,
  onConfirm,
  activeBlockedIpsCount = 0,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          backgroundColor: "warning.main",
          color: "warning.contrastText",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <NotInterestedIcon color="warning" />
        <Typography variant="h6">Disable IP Blocking</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You are about to disable IP blocking. This will automatically
            unblock all currently blocked IP addresses.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>
                {activeBlockedIpsCount} IP address
                {activeBlockedIpsCount !== 1 ? "es" : ""}
                will be deactivated
              </strong>{" "}
              when you proceed. The IPs will remain visible in the table but
              marked as inactive.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This ensures that when IP blocking is re-enabled, no legitimate
            traffic is inadvertently blocked by outdated rules.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="warning"
          startIcon={<NotInterestedIcon />}
        >
          Disable & Unblock All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IPBlockingDisableDialog;
