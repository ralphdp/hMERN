# Plugin Template

A comprehensive template for creating new plugins in the hMERN stack with database models, API routes, and admin interface components.

## Features

- Complete backend plugin structure with database models
- REST API endpoints with authentication and validation
- Frontend admin interface with Material-UI components
- Plugin configuration and settings management
- Dynamic admin panel integration
- Comprehensive documentation

## Getting Started

### 1. Create Your Plugin Structure

Copy the plugin template and rename it to your plugin name:

```bash
# Backend
cp -r backend/src/plugins/plugin-template backend/src/plugins/my-plugin
# Frontend
cp -r frontend/src/plugins/plugin-template frontend/src/plugins/my-plugin
```

### 2. Update Plugin Metadata

Edit your plugin's `frontend/src/plugins/my-plugin/index.js`:

```jsx
// My Plugin Frontend
import MyPluginAdmin from "./MyPluginAdmin.jsx";

export { MyPluginAdmin };

export default {
  name: "My Plugin Name",
  version: "1.0.0",
  description: "Description of what your plugin does",
  components: {
    MyPluginAdmin,
  },
  routes: [
    {
      path: "/admin/my-plugin",
      component: MyPluginAdmin,
      adminOnly: true,
    },
  ],
  adminPanel: {
    enabled: true,
    menuItem: {
      title: "My Plugin",
      description: "Short description for sidebar",
      icon: "YourIconName", // Material-UI icon name
      path: "/admin/my-plugin",
    },
    card: {
      title: "My Plugin Dashboard",
      description:
        "Detailed description for the admin card that explains what this plugin does and its key features.",
      icon: "YourIconName",
      color: "primary.main", // or "success.main", "warning.main", etc.
      buttonText: "Manage Plugin",
      path: "/admin/my-plugin",
    },
  },
};
```

### 3. Register Your Plugin

Add your plugin to `frontend/src/plugins/registry.js`:

```jsx
// Import your plugin
import myPlugin from "./my-plugin";

// Add to plugin registry
const pluginRegistry = {
  firewall: firewallPlugin,
  "web-performance-optimization": webPerformancePlugin,
  "plugin-template": pluginTemplatePlugin,
  "my-plugin": myPlugin, // Add your plugin here
};
```

**Important**: The registry is the central hub that manages all plugin metadata and enables automatic discovery. When you add your plugin here:

- Admin panels are automatically discovered and rendered
- Menu items and cards are dynamically generated
- Icons are automatically mapped and displayed
- Enabled/disabled states are managed via PluginContext

### 4. Add Icon Support (if using a new icon)

If you're using a new Material-UI icon, add it to the icon map in `registry.js`:

```jsx
import { YourIcon as YourIconName } from "@mui/icons-material";

const iconMap = {
  Shield: ShieldIcon,
  Speed: SpeedIcon,
  Extension: ExtensionIcon,
  YourIconName: YourIconName, // Add your icon here
  // ... other icons
};
```

### 5. Backend Integration

Update your backend plugin's `plugin.json`:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "displayName": "My Plugin Name",
  "description": "Description of your plugin",
  "enabled": true,
  "author": "Your Name",
  "dependencies": [],
  "routes": "/api/my-plugin",
  "adminInterface": "/admin/my-plugin"
}
```

### 6. Add Routes to Server

Register your plugin routes in `backend/src/server.js`:

```jsx
// Plugin routes - my-plugin
if (await isPluginEnabled("my-plugin")) {
  try {
    const myPluginRoutes = require("./plugins/my-plugin").routes;
    app.use("/api/my-plugin", myPluginRoutes);
    console.log("✅ My Plugin routes registered");
  } catch (error) {
    console.error("❌ Failed to register my-plugin routes:", error.message);
  }
}
```

### 7. Enable Your Plugin

Add your plugin to `backend/src/config/plugins.json`:

```json
{
  "my-plugin": {
    "enabled": true
  }
}
```

## Dynamic Admin Panel System

The admin panels are now completely dynamic! This revolutionary system eliminates the need for manual admin interface configuration.

### 🚀 **Key Benefits**

- **Zero Manual Setup**: No need to edit `Admin.jsx` or any core files
- **Automatic Discovery**: Plugins are automatically found and integrated
- **Consistent UI**: Standardized interface across all plugins
- **Easy Maintenance**: Self-contained plugin metadata
- **Scalable**: Add unlimited plugins without touching core code
- **Hot Reload**: Changes to plugin metadata are immediately reflected

### How It Works

### Automatic Discovery

- Plugins are automatically discovered from the registry
- Only enabled plugins appear in the admin interface
- No need to manually edit `Admin.jsx` anymore

### Menu Items

Admin sidebar menu items are automatically generated from plugin metadata:

- **Title**: Shown as the main text
- **Description**: Shown as secondary text
- **Icon**: Material-UI icon component
- **Path**: Navigation route

### Admin Cards

Main dashboard cards are automatically created:

- **Title**: Card header
- **Description**: Detailed explanation of plugin functionality
- **Icon**: Large icon with custom color
- **Button**: Action button with custom text

### Plugin States

- **Enabled**: Plugin appears in admin interface
- **Disabled**: Plugin is hidden from admin interface
- **Not Installed**: Plugin is not registered in the system

## Available Icons

Here are commonly used Material-UI icons for plugins:

**Security & Protection:**

- `Shield` - Security, firewall, protection
- `Security` - Authentication, access control
- `Lock` - Encryption, secure data

**Performance & Optimization:**

- `Speed` - Performance, optimization
- `Timeline` - Analytics, monitoring
- `TrendingUp` - Growth, improvements

**Development & Tools:**

- `Extension` - General plugins, extensions
- `Code` - Development tools, code management
- `Build` - Build tools, deployment

**Data & Analytics:**

- `Analytics` - Data analysis, metrics
- `BarChart` - Charts, reports
- `Storage` - Database, file management

**Communication & Social:**

- `Email` - Email services, notifications
- `Chat` - Messaging, communication
- `Share` - Social media, sharing

## Best Practices

### 1. Plugin Naming

- Use kebab-case for plugin IDs (`my-awesome-plugin`)
- Use descriptive names for display titles
- Keep descriptions concise but informative

### 2. Icon Selection

- Choose icons that clearly represent your plugin's function
- Use consistent colors (`primary.main` for general plugins)
- Consider using `success.main` for positive features, `warning.main` for security

### 3. Routes and Paths

- Follow the pattern `/admin/plugin-name`
- Ensure backend API routes match frontend expectations
- Use consistent naming between frontend and backend

### 4. Plugin Organization

- Keep plugin code self-contained
- Use consistent file naming conventions
- Document your plugin's features and API

### 5. Testing

- Test both enabled and disabled states
- Verify admin panel appears correctly
- Ensure navigation works properly

## Plugin Development Tips

1. **Start with the Template**: Always begin with the plugin-template structure
2. **Follow Conventions**: Use the established patterns for consistency
3. **Test Thoroughly**: Verify your plugin works in both development and production
4. **Document Everything**: Update README files and add inline comments
5. **Handle Errors**: Implement proper error handling and user feedback

## Troubleshooting

### Plugin Not Appearing in Admin

1. Check if plugin is enabled in `plugins.json`
2. Verify plugin is registered in `registry.js`
3. Ensure `adminPanel.enabled` is set to `true`
4. Check browser console for import errors

### Icon Not Displaying

1. Verify icon name matches Material-UI icon exactly
2. Check if icon is imported in `registry.js`
3. Use default `Extension` icon as fallback

### Routes Not Working

1. Ensure backend routes are registered in `server.js`
2. Check if plugin is enabled on backend
3. Verify API endpoint paths match frontend expectations

That's it! Your plugin will now automatically appear in the admin interface when enabled, without needing to manually edit the Admin.jsx file.

## Backend Structure

```
backend/src/plugins/plugin-template/
├── index.js           # Main plugin registration
├── routes.js          # API endpoints
├── middleware.js      # Authentication & validation
├── models.js          # Database schemas
├── plugin.json        # Plugin metadata
└── README.md          # This file
```

## Frontend Structure

```
frontend/src/plugins/plugin-template/
├── index.js                    # Plugin exports
├── PluginTemplateAdmin.jsx     # Main admin component
└── README.md                   # Documentation
```

## API Endpoints

- `GET /api/plugin-template/health` - Health check
- `GET /api/plugin-template/test` - Test endpoint
- `GET /api/plugin-template/info` - Plugin information
- `GET /api/plugin-template/stats` - Dashboard statistics (admin)
- `GET /api/plugin-template/settings` - Get settings (admin)
- `PUT /api/plugin-template/settings` - Update settings (admin)
- `POST /api/plugin-template/settings/reset` - Reset settings (admin)
- `GET /api/plugin-template/data` - Get data entries (admin)
- `POST /api/plugin-template/data` - Create data entry (admin)
- `GET /api/plugin-template/logs` - View logs (admin)
- `DELETE /api/plugin-template/logs` - Clear logs (admin)
- `POST /api/plugin-template/example-action` - Example action (admin)

## Admin Interface Integration

### 1. Adding to Main Admin Page (`frontend/src/pages/Admin.jsx`)

To integrate your plugin into the main admin dashboard at `http://localhost:3000/admin`, you need to add two components:

#### A. Menu Item (Left Sidebar)

Add a menu item to the admin navigation menu:

```jsx
// In the Admin Menu section
{
  isPluginEnabled("plugin-template") && (
    <ListItem
      button
      onClick={() => navigate("/admin/plugin-template")}
      sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
    >
      <ListItemIcon>
        <ExtensionIcon /> {/* Choose appropriate icon */}
      </ListItemIcon>
      <ListItemText
        primary="Plugin Template"
        secondary="Template for new plugins"
      />
    </ListItem>
  );
}
```

**Icon Options**: Import from `@mui/icons-material`:

- `ExtensionIcon` - General plugins
- `SettingsIcon` - Configuration
- `StorageIcon` - Data management
- `SecurityIcon` - Security features
- `SpeedIcon` - Performance
- `AnalyticsIcon` - Analytics
- `CodeIcon` - Development tools

**Required Imports** for Admin.jsx:

```jsx
import {
  // ... existing imports
  Extension as ExtensionIcon, // Add your chosen icon
} from "@mui/icons-material";
```

### 2. Creating Admin Routes (`frontend/src/App.jsx`)

Add the route for your plugin's admin page:

```jsx
// In the Routes section, after existing admin routes
<Route
  path="/admin/plugin-template"
  element={
    <PrivateRoute>
      <AdminPluginTemplate />
    </PrivateRoute>
  }
/>
```

**Required Imports** for App.jsx:

```jsx
// Add to existing imports
import AdminPluginTemplate from "./pages/AdminPluginTemplate";
// OR if using direct component import:
import { PluginTemplateAdmin } from "./plugins/plugin-template";
```

### 3. Creating the Admin Page Component

#### Option A: Create a dedicated page component

Create `frontend/src/pages/AdminPluginTemplate.jsx`:

```jsx
import React from "react";
import { PluginTemplateAdmin } from "../plugins/plugin-template";

const AdminPluginTemplate = () => {
  return <PluginTemplateAdmin />;
};

export default AdminPluginTemplate;
```

#### Option B: Use the plugin component directly

In `App.jsx`, import and use the component directly:

```jsx
import { PluginTemplateAdmin } from "./plugins/plugin-template";

// Then in routes:
<Route
  path="/admin/plugin-template"
  element={
    <PrivateRoute>
      <PluginTemplateAdmin />
    </PrivateRoute>
  }
/>;
```

### 4. Plugin Context Integration

The `isPluginEnabled()` function comes from the `PluginContext`. Your plugin will automatically be available once:

1. **Backend Registration**: Plugin is loaded in `backend/src/server.js`
2. **Configuration**: Plugin is enabled in `backend/src/config/plugins.json`
3. **Database**: Plugin settings exist in the database

### 5. Complete Integration Example

Here's a complete example for a new plugin called "my-analytics":

#### Step 1: Update Admin.jsx

```jsx
// Add imports
import { Analytics as AnalyticsIcon } from "@mui/icons-material";

// Add menu item
{
  isPluginEnabled("my-analytics") && (
    <ListItem
      button
      onClick={() => navigate("/admin/my-analytics")}
      sx={{ borderRadius: 1, mx: 1, my: 0.5 }}
    >
      <ListItemIcon>
        <AnalyticsIcon />
      </ListItemIcon>
      <ListItemText primary="Analytics" secondary="View site analytics" />
    </ListItem>
  );
}

// Add plugin card
{
  isPluginEnabled("my-analytics") && (
    <Grid item md={6} xs={12}>
      <Card sx={{ height: "100%" }}>
        <CardContent
          sx={{
            textAlign: "center",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AnalyticsIcon sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Site Analytics
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flexGrow: 1, mb: 2 }}
          >
            View detailed analytics, user behavior, and performance metrics for
            your website.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/admin/my-analytics")}
            fullWidth
          >
            View Analytics
          </Button>
        </CardContent>
      </Card>
    </Grid>
  );
}
```

#### Step 2: Update App.jsx

```jsx
// frontend/src/pages/AdminMyAnalytics.jsx
import React from "react";
import { MyAnalyticsAdmin } from "../plugins/my-analytics";

const AdminMyAnalytics = () => {
  return <MyAnalyticsAdmin />;
};

export default AdminMyAnalytics;
```

#### Step 3: Create page component

```jsx
// frontend/src/pages/AdminMyAnalytics.jsx
import React from "react";
import { MyAnalyticsAdmin } from "../plugins/my-analytics";

const AdminMyAnalytics = () => {
  return <MyAnalyticsAdmin />;
};

export default AdminMyAnalytics;
```

## Admin Interface

Access the admin interface at `/admin/plugin-template` when logged in as an administrator.

## Usage as Template

To create a new plugin based on this template:

1. Copy the entire `plugin-template` directory
2. Rename it to your plugin name (e.g., `my-new-plugin`)
3. Update `plugin.json` with your plugin metadata
4. Modify the database models in `models.js`
5. Customize the API routes in `routes.js`
6. Update the frontend component
7. Add to server.js plugin registration
8. Update the plugins configuration
9. **Add to main admin page** (follow steps above)
10. **Create admin routes** (follow steps above)

## Development

This template includes:

- Settings caching for performance
- Comprehensive error handling
- Request logging and debugging
- Feature flags for controlled rollouts
- Database activity logging
- Admin authentication
- API validation middleware

## Production Ready

The template is designed to work in both development and production environments with:

- Environment-specific configurations
- Error message sanitization
- Performance optimizations
- Security best practices

## Common Patterns

### Admin Page Layout

- Use Material-UI Grid system for responsive layout
- Cards for sectioned content
- Tabs for organizing features
- Consistent spacing with `sx={{ p: 3 }}`

### API Integration

- Use `getBackendUrl()` helper for API calls
- Include `credentials: "include"` for authenticated requests
- Implement proper error handling with user-friendly messages
- Use loading states and success/error alerts

### Plugin State Management

- Use React hooks for local state
- Implement proper data fetching patterns
- Cache settings and data appropriately
- Handle plugin disabled states gracefully
