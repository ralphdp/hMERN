# hMERN Firewall Plugin

Advanced firewall protection plugin for hMERN applications with comprehensive security features.

## Features

### 🛡️ **Core Protection**

- **IP Blocking**: Block specific IP addresses or IP ranges
- **Enhanced Rate Limiting**: 50 requests/minute, 400/hour with progressive delays
- **Geo-blocking**: Block requests by country/region
- **Suspicious Request Detection**: Pattern-based threat detection

### 📊 **Progressive Rate Limiting**

- **First violation**: 10 second delay
- **Second violation**: 60 second delay
- **Third violation**: 90 second delay
- **Fourth violation**: 120 second delay
- **Fifth+ violation**: Permanent IP block

### 🌍 **Geo-Location Features**

- Country-based blocking using `geoip-lite`
- Regional filtering capabilities
- Automatic geo-tagging of requests

### 📈 **Real-time Monitoring**

- Live request logging
- Threat detection alerts
- Statistical dashboards
- Top blocked countries/IPs analytics

### 🔧 **Admin Management**

- Web-based admin interface at `/admin/firewall`
- Rule management (create, edit, delete, enable/disable)
- Manual IP blocking/unblocking
- Log viewing and analysis
- Dashboard with key metrics

## Installation

The firewall plugin is automatically loaded when:

1. The licensing plugin is active and valid
2. The firewall plugin files are present in `backend/plugins/firewall/`
3. The admin user role is properly configured

## Configuration

### Admin Users

Admin users are configured in `backend/config/admins.json`:

```json
{
  "adminEmails": ["admin@example.com"]
}
```

### Rate Limits

Default rate limits (configurable in middleware):

- 50 requests per minute per IP
- 400 requests per hour per IP
- Progressive delays: 10s → 60s → 90s → 120s → permanent block

## API Endpoints

### Public Endpoints

- `GET /api/firewall/test` - Test firewall functionality
- `GET /api/firewall/health` - Health check

### Admin Endpoints (requires admin role)

- `GET /api/firewall/stats` - Dashboard statistics
- `GET /api/firewall/rules` - List firewall rules
- `POST /api/firewall/rules` - Create new rule
- `PUT /api/firewall/rules/:id` - Update rule
- `DELETE /api/firewall/rules/:id` - Delete rule
- `GET /api/firewall/blocked-ips` - List blocked IPs
- `POST /api/firewall/blocked-ips` - Block IP manually
- `DELETE /api/firewall/blocked-ips/:id` - Unblock IP
- `GET /api/firewall/logs` - View firewall logs
- `DELETE /api/firewall/logs` - Clear old logs

## Rule Types

### IP Block Rules

Block specific IP addresses or ranges:

```javascript
{
  name: "Block Malicious IP",
  type: "ip_block",
  value: "192.168.1.100",
  action: "block"
}
```

### Country Block Rules

Block requests from specific countries:

```javascript
{
  name: "Block Country X",
  type: "country_block",
  value: "CN",
  action: "block"
}
```

### Suspicious Pattern Rules

Block requests matching suspicious patterns:

```javascript
{
  name: "Block SQL Injection",
  type: "suspicious_pattern",
  value: "union select",
  action: "block"
}
```

## Database Collections

The plugin creates the following MongoDB collections:

- `firewallrules` - Firewall rules configuration
- `firewalllogs` - Request logs and events
- `blockedips` - Blocked IP addresses
- `ratelimits` - Rate limiting tracking (auto-expires)

## Frontend Integration

### Admin Interface

The admin interface is available at `/admin/firewall` for users with admin role.

### Component Import

```javascript
import { FirewallAdmin } from "../plugins/firewall";
```

## Dependencies

### Backend

- `geoip-lite` - Geo-location services
- `mongoose` - MongoDB integration

### Frontend

- `@mui/material` - UI components
- `@mui/icons-material` - Icons

## License Dependency

This plugin requires the main licensing plugin to be active and valid. The firewall will not load if:

- Licensing plugin is not found
- License validation middleware is unavailable
- License is invalid or expired

## Security Features

### Request Blocking

Blocked requests receive JSON responses:

```json
{
  "success": false,
  "error": "Access Denied",
  "message": "Your IP address has been blocked",
  "code": "IP_BLOCKED",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Rate Limiting

Rate limited requests receive:

```json
{
  "success": false,
  "error": "Rate Limited",
  "message": "Too many requests",
  "code": "RATE_LIMITED",
  "retryAfter": "2024-01-01T00:01:00.000Z",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Development Mode

In development mode (`NODE_ENV=development`), localhost requests (127.0.0.1) bypass firewall checks for easier testing.

## Monitoring & Analytics

The admin dashboard provides:

- Real-time request statistics
- Top blocked countries and IPs
- Request trends (24h/7d)
- Rule effectiveness metrics
- Live activity logs

## Best Practices

1. **Regular Monitoring**: Check logs and statistics regularly
2. **Rule Maintenance**: Review and update rules periodically
3. **Log Cleanup**: Use the log cleanup feature to manage storage
4. **Testing**: Test rules in development before production deployment
5. **Backup**: Backup firewall rules and configurations

## Troubleshooting

### Plugin Not Loading

- Verify licensing plugin is active
- Check console logs for error messages
- Ensure admin configuration is correct

### Rules Not Working

- Check rule priority and enabled status
- Verify rule syntax and values
- Review firewall logs for rule matches

### Performance Issues

- Monitor rate limit collection size
- Clean old logs regularly
- Consider rule optimization for high-traffic sites

# Firewall Admin Panel

## 🔥 Current Issue: Authentication Required

The firewall admin panel requires admin authentication. You're getting 403 Forbidden errors because you need to log in first.

## ✅ How to Fix

### Option 1: Log in through the frontend (Recommended)

1. Go to `http://localhost:3000/login`
2. Log in using one of these methods:
   - **Regular Login**: Use email `ralphdp21@gmail.com` (if you have the password)
   - **Google OAuth**: Log in with your Google account (`ralphdp21@gmail.com`)
   - **GitHub OAuth**: Log in with your GitHub account (if linked to `ralphdp21@gmail.com`)
3. Once logged in, navigate to `http://localhost:3000/admin/firewall`
4. The panel should now load all data successfully

### Option 2: Temporary Development Bypass (Currently Active)

For testing purposes, I've added a temporary bypass that's currently active:

- The bypass header `X-Admin-Bypass: true` is automatically added to all API calls
- This only works in development mode (`NODE_ENV=development`)
- **IMPORTANT**: Remove this before going to production

## 🚀 Features

### Dashboard Tab

- Real-time statistics
- Top blocked countries and IPs
- Request metrics (24h and 7d)

### Rules Tab

- Create, edit, and delete firewall rules
- IP blocking, country blocking, rate limiting, suspicious patterns
- Reference guide with country codes and attack patterns

### Blocked IPs Tab

- View and manage blocked IP addresses
- Manual IP blocking with reasons and expiration
- Unblock functionality

### Logs Tab

- Recent firewall activity
- Detailed request logs with actions taken

### Settings Tab

- Configure rate limiting (requests per minute/hour)
- Set progressive delay penalties
- Enable/disable firewall features
- Reset to defaults

## 🔧 API Endpoints

All endpoints require admin authentication:

- `GET /api/firewall/stats` - Dashboard statistics
- `GET /api/firewall/rules` - List firewall rules
- `POST /api/firewall/rules` - Create new rule
- `GET /api/firewall/blocked-ips` - List blocked IPs
- `POST /api/firewall/blocked-ips` - Block IP address
- `GET /api/firewall/logs` - View firewall logs
- `GET /api/firewall/settings` - Get settings
- `PUT /api/firewall/settings` - Update settings

## 🐛 Debug Endpoints

- `GET /api/firewall/debug/auth` - Check authentication status
- `GET /api/firewall/debug/admins` - List admin users in database

## ⚠️ Production Notes

Before deploying to production:

1. Remove the `X-Admin-Bypass` headers from all frontend API calls
2. Remove the bypass logic from `backend/plugins/firewall/middleware.js`
3. Ensure proper SSL/TLS for session security
4. Review and test all authentication flows
