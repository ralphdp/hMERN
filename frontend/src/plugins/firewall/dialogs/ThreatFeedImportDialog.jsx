import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import {
  Warning as WarningIcon,
  CloudDownload as CloudDownloadIcon,
} from "@mui/icons-material";

const ThreatFeedImportDialog = ({
  open,
  onClose,
  onConfirm,
  existingCount = 0,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="threat-feed-dialog-title"
      aria-describedby="threat-feed-dialog-description"
    >
      <DialogTitle
        id="threat-feed-dialog-title"
        sx={{
          backgroundColor: "info.main",
          color: "info.contrastText",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <CloudDownloadIcon />
        Threat Feed Import Confirmation
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <DialogContentText
          id="threat-feed-dialog-description"
          component="div"
          sx={{ mt: 2 }}
        >
          <Typography
            variant="body1"
            gutterBottom
            sx={{ fontWeight: "bold", color: "warning.main" }}
          >
            You already have {existingCount} threat intelligence rules
            installed!
          </Typography>
          <Typography variant="body2" paragraph>
            Importing additional threat feeds with existing rules may:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            <Typography component="li" variant="body2">
              Result in many duplicate IPs being processed (but automatically
              skipped)
            </Typography>
            <Typography component="li" variant="body2">
              Take longer to complete due to duplicate checking
            </Typography>
            <Typography component="li" variant="body2">
              Consume additional bandwidth downloading feeds
            </Typography>
            <Typography component="li" variant="body2">
              Generate verbose import logs
            </Typography>
          </Box>

          {/* Smart Duplicate Detection Notice */}
          <Typography
            variant="body2"
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.success.dark
                  : theme.palette.success.light,
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.success.light
                  : theme.palette.success.dark,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.success.main}`,
            }}
          >
            <strong>✅ Smart Duplicate Detection Active:</strong> Existing
            threat intelligence rules will be automatically preserved. Only new
            IPs will be imported, preventing database conflicts and rule
            duplication.
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.grey[800]
                  : theme.palette.info.light,
              color: (theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.info.light
                  : theme.palette.info.dark,
              borderRadius: 1,
              border: (theme) =>
                `1px solid ${
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[700]
                    : theme.palette.info.main
                }`,
            }}
          >
            <strong>💡 Pro Tip:</strong> If you want to refresh existing threat
            feeds, consider cleaning up old threat intelligence rules first from
            the Rules tab, then import fresh feeds.
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="primary"
          size="large"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="success"
          size="large"
          startIcon={<CloudDownloadIcon />}
          autoFocus
        >
          Import with Smart Detection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ThreatFeedImportDialog;
