# hMERN Licensing Plugin

This plugin provides comprehensive license validation and management for the hMERN stack application, including both frontend components and backend API services.

## Overview

The licensing plugin serves as the core licensing system for hMERN applications, providing:

- **License Validation**: Validate licenses against remote hmern.com license server
- **Frontend Integration**: Visual license status indicators
- **Development Support**: Development mode bypasses and testing tools
- **API Services**: Comprehensive RESTful API for license management
- **Error Handling**: Robust error handling and fallback mechanisms

## Frontend Components

### LicenseIndicator Component

A React component that displays a visual indicator of the license status.

#### Usage

```javascript
import { LicenseIndicator } from "../plugins/licensing";

// Use in your React component
function MyComponent() {
  return (
    <div>
      <LicenseIndicator />
    </div>
  );
}
```

#### Features

- **Automatic Detection**: Automatically detects if the licensing plugin is installed
- **Visual Indicator**: Shows a colored dot (green for active, red for inactive)
- **Tooltip**: Displays license status on hover
- **Graceful Fallback**: Hides itself if the plugin is not installed
- **Self-Contained**: Includes all necessary dependencies inline
- **Development Mode**: Special handling for development environments

#### Behavior

- **Loading State**: Component is hidden while checking license status
- **Plugin Not Installed**: Component is hidden (free mode)
- **License Active**: Shows green pulsing dot with "License Active" tooltip
- **License Inactive**: Shows red dot with "License Inactive" tooltip
- **Development Mode**: Shows special indicators for development/offline modes

## Backend API Services

The backend provides comprehensive license management API endpoints.

### API Endpoints

#### Basic Status & Health

- `GET /api/license/test` - Simple test endpoint to verify plugin is loaded
- `GET /api/license/health` - Health check with configuration status
- `GET /api/license/status` - Frontend license status check (main endpoint)

#### License Information

- `GET /api/license/info` - Get public license information
- `GET /api/license/debug` - Debug endpoint with detailed logging

### Endpoint Details

#### `/api/license/status`

The main endpoint used by the frontend LicenseIndicator component.

**Response for Valid License:**

```json
{
  "isValid": true,
  "message": "License is active and valid for this domain.",
  "development_mode": false,
  "license_info": {
    "domain": "your-domain.com",
    "expires": "2024-12-31",
    "plan": "premium"
  }
}
```

**Response for Invalid License:**

```json
{
  "isValid": false,
  "message": "License is invalid or expired.",
  "development_mode": false,
  "error": "License not found"
}
```

**Development Mode Response:**

```json
{
  "isValid": true,
  "message": "Development environment active (free mode).",
  "development_mode": true,
  "free_mode": true
}
```

#### `/api/license/health`

Health check endpoint that verifies configuration.

**Response:**

```json
{
  "success": true,
  "message": "Licensing plugin is active.",
  "license_server_url": "https://hmern.com",
  "frontend_url": "your-domain.com",
  "license_key_set": true
}
```

#### `/api/license/debug`

Comprehensive debug endpoint with detailed logging and diagnostics.

**Features:**

- Complete environment variable logging
- License server communication testing
- Request/response payload inspection
- Network connectivity diagnostics
- Configuration validation

## Configuration

### Environment Variables

The backend plugin requires these environment variables:

```bash
# Required - License server configuration
LICENSE_SERVER_URL=https://hmern.com
HMERN_LICENSE_KEY=your_license_key_here
FRONTEND_URL=https://your-domain.com

# Optional - Development settings
NODE_ENV=development  # Enables development mode features
```

### Development Mode

When `NODE_ENV=development` and running on localhost:

- **Free Mode**: Automatically allows free mode without license key
- **Server Bypass**: Bypasses license server when unreachable
- **Enhanced Logging**: Detailed console logging for debugging
- **Offline Mode**: Continues working when license server is down

### Domain Processing

The plugin automatically processes domain names:

```javascript
// Original: https://your-domain.com/
// Processed: your-domain.com
```

- Removes protocol prefixes (`http://`, `https://`)
- Removes trailing slashes
- Uses processed domain for license validation

## License Validation Flow

### 1. Configuration Check

```javascript
// Check required environment variables
const LICENSE_KEY = process.env.HMERN_LICENSE_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const LICENSE_SERVER_URL =
  process.env.LICENSE_SERVER_URL || "https://hmern.com";
```

### 2. Development Mode Detection

```javascript
const isDevelopment = process.env.NODE_ENV === "development";
const isLocalhost =
  FRONTEND_URL &&
  (FRONTEND_URL.includes("localhost") || FRONTEND_URL.includes("127.0.0.1"));
```

### 3. License Server Communication

```javascript
const response = await axios.post(
  `${LICENSE_SERVER_URL}/api/license/validate`,
  {
    license_key: LICENSE_KEY,
    domain: FRONTEND_URL,
    development_mode: isDevelopment,
  },
  {
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "hMERN-License-Client/1.0",
    },
  }
);
```

### 4. Response Processing

The plugin handles various response scenarios:

- **Success**: License is valid and active
- **Domain Mismatch**: License valid but wrong domain
- **Expired**: License expired
- **Server Error**: License server issues
- **Network Error**: Connection problems

## Error Handling

### Development Mode Fallbacks

In development mode, the plugin provides graceful fallbacks:

```javascript
// License server unreachable
if (isDevelopment && LICENSE_KEY && LICENSE_KEY.length > 20) {
  return {
    isValid: true,
    message:
      "Development mode: License server unreachable, bypassed for testing",
    development_mode: true,
    offline_mode: true,
    server_unreachable: true,
  };
}
```

### Production Behavior

In production mode:

- Strict license validation
- No bypasses or fallbacks
- Detailed error logging
- Graceful failure handling

## Integration with Other Plugins

### Plugin Dependencies

Other plugins can check licensing status:

```javascript
// In other plugins
const licenseStatus = await axios.get("/api/license/status");
if (!licenseStatus.data.isValid) {
  // Disable premium features or exit
  return;
}
```

### Firewall Plugin Integration

The firewall plugin depends on licensing:

```json
// In firewall/plugin.json
{
  "enabled": true,
  "dependsOn": ["licensing"],
  "type": "Security"
}
```

## Troubleshooting

### Common Issues

**"License key is not configured"**

- Check `HMERN_LICENSE_KEY` environment variable
- Ensure license key is properly set

**"Unable to connect to license server"**

- Check internet connectivity
- Verify `LICENSE_SERVER_URL` is accessible
- Check firewall settings

**"Domain mismatch"**

- Verify `FRONTEND_URL` matches your actual domain
- Check domain processing (remove protocols/slashes)

**Development mode not working**

- Ensure `NODE_ENV=development`
- Check if domain contains "localhost" or "127.0.0.1"

### Debug Tools

#### Using the Debug Endpoint

```bash
# Get detailed debugging information
curl http://localhost:5050/api/license/debug
```

#### Console Logging

The plugin provides extensive console logging:

```
=== ENHANCED License Status Check ===
Timestamp: 2024-01-01T00:00:00.000Z
Development Mode: true
License Server URL: https://hmern.com
License Key (first 8 chars): 7c6f5421...
Domain being sent: your-domain.com
```

#### Environment Variable Check

Verify all required variables are set:

```bash
# Check environment variables
echo $HMERN_LICENSE_KEY
echo $FRONTEND_URL
echo $LICENSE_SERVER_URL
echo $NODE_ENV
```

## Dependencies

### Backend Dependencies

```json
{
  "axios": "^1.6.0",
  "express": "^4.18.0"
}
```

### Frontend Dependencies

```json
{
  "@mui/material": "^5.0.0",
  "@mui/icons-material": "^5.0.0",
  "react": "^18.0.0"
}
```

## Security Considerations

### License Key Protection

- Store license keys securely in environment variables
- Never commit license keys to version control
- Use different keys for development/production

### Domain Validation

- License validation is tied to specific domains
- Prevents unauthorized use on different domains
- Development mode bypasses only work on localhost

### Communication Security

- All license server communication uses HTTPS
- Proper timeout and error handling
- Request/response validation

## Best Practices

### Environment Setup

1. **Separate Keys**: Use different license keys for development and production
2. **Secure Storage**: Store license keys in secure environment variable systems
3. **Regular Validation**: Monitor license status regularly
4. **Backup Plans**: Have procedures for license server outages

### Development Workflow

1. **Local Development**: Use development mode for local testing
2. **Staging**: Test with actual license keys in staging environment
3. **Production**: Ensure proper license validation in production
4. **Monitoring**: Set up monitoring for license validation failures

### Error Monitoring

1. **Log Analysis**: Monitor license validation logs
2. **Alert Setup**: Set up alerts for license failures
3. **Fallback Plans**: Have procedures for license issues
4. **User Communication**: Inform users appropriately about license issues

## API Response Codes

| Status Code | Description         | Action                     |
| ----------- | ------------------- | -------------------------- |
| 200         | License valid       | Continue normal operation  |
| 400         | Invalid request     | Check request parameters   |
| 401         | License invalid     | Display license error      |
| 403         | Domain mismatch     | Check domain configuration |
| 404         | License not found   | Check license key          |
| 500         | Server error        | Retry or contact support   |
| 503         | Service unavailable | License server down        |
