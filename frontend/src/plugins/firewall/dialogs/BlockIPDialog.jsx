import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
} from "@mui/material";

const BlockIPDialog = ({
  open,
  onClose,
  blockForm,
  setBlockForm,
  onSubmit,
}) => {
  const handleSubmit = () => {
    if (blockForm.ip && blockForm.reason) {
      onSubmit();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Block IP Address</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="IP Address"
              id="ip-address"
              name="ip-address"
              value={blockForm.ip}
              onChange={(e) =>
                setBlockForm({ ...blockForm, ip: e.target.value })
              }
              placeholder="192.168.1.1"
              required
              error={!blockForm.ip}
              helperText={!blockForm.ip ? "IP address is required" : ""}
              autoFocus
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reason for Blocking"
              id="reason"
              name="reason"
              value={blockForm.reason}
              onChange={(e) =>
                setBlockForm({ ...blockForm, reason: e.target.value })
              }
              placeholder="Reason for blocking"
              required
              error={!blockForm.reason}
              helperText="A brief, clear reason for the block"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  id="permanent-block"
                  name="permanent-block"
                  checked={blockForm.permanent}
                  onChange={(e) =>
                    setBlockForm({
                      ...blockForm,
                      permanent: e.target.checked,
                    })
                  }
                />
              }
              label="Permanent Block"
            />
          </Grid>
          {!blockForm.permanent && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Expires In (seconds)"
                id="expires-in"
                name="expires-in"
                value={blockForm.expiresIn}
                onChange={(e) =>
                  setBlockForm({
                    ...blockForm,
                    expiresIn: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 60 }}
                helperText="Default: 3600 seconds (1 hour)"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={!blockForm.ip || !blockForm.reason}
        >
          Block IP
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlockIPDialog;
