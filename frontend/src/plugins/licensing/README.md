# Frontend Licensing Plugin

This directory contains the frontend components for the hMERN Licensing plugin.

## LicenseIndicator Component

A React component that displays a visual indicator of the license status.

### Usage

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

### Features

- **Automatic Detection**: Automatically detects if the licensing plugin is installed
- **Visual Indicator**: Shows a colored dot (green for active, red for inactive)
- **Tooltip**: Displays license status on hover
- **Graceful Fallback**: Hides itself if the plugin is not installed
- **Self-Contained**: Includes all necessary dependencies inline

### Behavior

- **Loading State**: Component is hidden while checking license status
- **Plugin Not Installed**: Component is hidden (free mode)
- **License Active**: Shows green pulsing dot with "License Active" tooltip
- **License Inactive**: Shows red dot with "License Inactive" tooltip

### Dependencies

- React
- Material-UI (Box, Tooltip components)

The component is self-contained and includes the license checking logic inline to avoid external dependencies.

### Backend Integration

This frontend component communicates with the backend licensing plugin at `/api/license/status` to check license validity against the hmern.com license server.

### Environment Variables

The backend plugin requires these environment variables:

- `LICENSE_SERVER_URL=https://hmern.com`
- `HMERN_LICENSE_KEY=your_license_key`
- `FRONTEND_URL=https://your-app.herokuapp.com`
