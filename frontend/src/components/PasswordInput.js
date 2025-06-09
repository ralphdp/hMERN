import React, { useState } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  LinearProgress,
  Typography,
  Tooltip
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

const PasswordInput = ({
  value,
  onChange,
  error,
  helperText,
  label = 'Password',
  required = true,
  fullWidth = true,
  margin = 'normal',
  id = 'password',
  name = 'password',
  autoComplete = 'new-password'
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState(0);

  const calculateStrength = (password) => {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character type checks
    if (/[A-Z]/.test(password)) score += 1; // Uppercase
    if (/[a-z]/.test(password)) score += 1; // Lowercase
    if (/[0-9]/.test(password)) score += 1; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Special characters
    
    return Math.min(score, 5); // Max score of 5
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1:
        return 'error';
      case 2:
      case 3:
        return 'warning';
      case 4:
      case 5:
        return 'success';
      default:
        return 'error';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      case 5:
        return 'Very Strong';
      default:
        return 'Very Weak';
    }
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setStrength(calculateStrength(newPassword));
    onChange(e);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        margin={margin}
        required={required}
        fullWidth={fullWidth}
        id={id}
        name={name}
        label={label}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={handlePasswordChange}
        error={error}
        helperText={helperText}
        autoComplete={autoComplete}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
      {value && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={(strength / 5) * 100}
            color={getStrengthColor(strength)}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography
            variant="caption"
            color={getStrengthColor(strength)}
            sx={{ mt: 0.5, display: 'block' }}
          >
            Password Strength: {getStrengthText(strength)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PasswordInput; 