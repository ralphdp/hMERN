import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
} from "@mui/material";

const RuleEditorDialog = ({ open, onClose, onSave, rule }) => {
  const [formState, setFormState] = useState({
    name: "",
    type: "ip_block",
    value: "",
    action: "block",
    enabled: true,
    priority: 100,
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormState({ ...rule, description: rule.description || "" });
    } else {
      setFormState({
        name: "",
        type: "ip_block",
        value: "",
        action: "block",
        enabled: true,
        priority: 100,
        description: "",
      });
    }
    // Clear errors when dialog opens/closes or rule changes
    setErrors({});
  }, [rule, open]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormState((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formState.name || formState.name.trim() === "") {
      newErrors.name = "Rule name is required";
    }

    if (!formState.value || formState.value.trim() === "") {
      newErrors.value = "Value is required";
    }

    if (!formState.type) {
      newErrors.type = "Type is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      // Trim whitespace from string fields
      const cleanedFormState = {
        ...formState,
        name: formState.name.trim(),
        value: formState.value.trim(),
        description: formState.description.trim(),
      };

      // Only pass existing rule if it has an _id (i.e., it's an existing rule from database)
      const existingRule = rule && rule._id ? rule : null;
      const success = await onSave(cleanedFormState, existingRule);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving rule:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{rule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
      <DialogContent>
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Please fix the following errors:
            <ul style={{ margin: "8px 0 0 20px" }}>
              {Object.values(errors).map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="name"
              label="Rule Name"
              value={formState.name}
              onChange={handleChange}
              required
              error={!!errors.name}
              helperText={
                errors.name || "Enter a descriptive name for this rule"
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel>Type</InputLabel>
              <Select
                name="type"
                value={formState.type}
                label="Type"
                onChange={handleChange}
              >
                <MenuItem value="ip_block">IP Block</MenuItem>
                <MenuItem value="country_block">Country Block</MenuItem>
                <MenuItem value="suspicious_pattern">
                  Suspicious Pattern
                </MenuItem>
                <MenuItem value="rate_limit">Rate Limit</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="value"
              label="Value"
              value={formState.value}
              onChange={handleChange}
              required
              error={!!errors.value}
              helperText={
                errors.value ||
                "Enter the value for this rule (IP, country code, pattern, etc.)"
              }
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="description"
              label="Description"
              value={formState.description}
              onChange={handleChange}
              multiline
              rows={2}
              helperText="Optional description for this rule"
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                name="action"
                value={formState.action}
                label="Action"
                onChange={handleChange}
              >
                <MenuItem value="block">Block</MenuItem>
                <MenuItem value="allow">Allow</MenuItem>
                <MenuItem value="rate_limit">Rate Limit</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField
              fullWidth
              type="number"
              name="priority"
              label="Priority"
              value={formState.priority}
              onChange={handleChange}
              helperText="Lower numbers = higher priority"
              inputProps={{ min: 1, max: 1000 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Switch
                  name="enabled"
                  checked={formState.enabled}
                  onChange={handleChange}
                />
              }
              label="Enabled"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RuleEditorDialog;
