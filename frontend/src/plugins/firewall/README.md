# hMERN Firewall Plugin

Advanced firewall protection plugin for hMERN applications with comprehensive security features, threat intelligence, and real-time monitoring.

## Features

### 🛡️ **Core Protection**

- **IP Blocking**: Block specific IP addresses, IP ranges, and CIDR subnets
- **Enhanced Rate Limiting**: Configurable requests/minute and requests/hour with progressive delays
- **Geo-blocking**: Block requests by country/region using GeoIP-lite
- **Suspicious Request Detection**: Pattern-based threat detection with ReDoS protection
- **CIDR Support**: Block entire subnets efficiently (e.g., 192.168.1.0/24)

### 📊 **Progressive Rate Limiting**

- **Configurable Delays**: Set custom delay times for violations
- **Default Progression**: 10s → 60s → 90s → 120s → permanent block
- **Automatic Escalation**: Progressive penalties for repeated violations
- **Smart Recovery**: Time-based penalty reset system

### 🌍 **Geo-Location Features**

- **Country-based Blocking**: Block by 2-letter country codes (195+ countries supported)
- **Regional Filtering**: Advanced geographical filtering capabilities
- **Automatic Geo-tagging**: All requests tagged with country information
- **GeoIP Analytics**: Detailed country-based traffic analytics

### 🔍 **Threat Intelligence Integration**

- **Multiple Providers**: AbuseIPDB, VirusTotal, Spamhaus, Emerging Threats
- **Automatic Threat Feeds**: Import known malicious IPs automatically
- **Real-time Reputation Checks**: Query threat databases for unknown IPs
- **Smart Caching**: Cache threat intelligence results to minimize API usage
- **Free & Paid Tiers**: Support for both free and paid threat intelligence APIs

### 📈 **Real-time Monitoring & Analytics**

- **Live Request Logging**: Real-time request monitoring and logging
- **Threat Detection Alerts**: Immediate alerts for detected threats
- **Statistical Dashboards**: Comprehensive analytics and metrics
- **Traffic Trends**: 24h/7d/30d traffic trend analysis with charts
- **Top Blocked Analytics**: Top blocked countries, IPs, and attack patterns

### 📧 **Email Reporting System**

- **Preview Reports**: Send test reports with current firewall status
- **Scheduled Reports**: Daily, weekly, or monthly automated reports
- **Multiple Recipients**: Support for multiple email addresses
- **Comprehensive Metrics**: Include all key firewall statistics
- **Export Functionality**: Export reports in various formats

### 🔧 **Admin Management Interface**

- **Web-based Admin Panel**: Comprehensive interface at `/admin/firewall`
- **Tabbed Interface**: Dashboard, Rules, Blocked IPs, Logs, Settings
- **Rule Management**: Create, edit, delete, enable/disable rules with priority
- **Manual IP Management**: Block/unblock IPs manually with reasons
- **Log Viewing**: Detailed activity logs with filtering and search
- **Settings Configuration**: Configure all firewall features

### ⚡ **Performance Optimizations**

- **Rule Caching**: In-memory rule caching for 90% faster lookups
- **Smart Cache Invalidation**: Automatic cache refresh when rules change
- **Concurrent Protection**: Prevent multiple simultaneous database hits
- **Graceful Fallback**: Continue operating even during cache errors

### 🔒 **Security Enhancements**

- **ReDoS Protection**: Prevent Regular Expression Denial of Service attacks
- **Safe Pattern Matching**: Validate and sanitize regex patterns
- **IP Validation**: Secure IP detection and validation
- **Trusted Proxy Support**: Configure trusted proxy sources
- **CIDR Validation**: Proper CIDR notation validation and processing

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

### Environment Variables

Optional threat intelligence API keys in `.env`:

```bash
# Optional - Enhanced threat intelligence
ABUSEIPDB_API_KEY=your_abuseipdb_key_here
VIRUSTOTAL_API_KEY=your_virustotal_key_here
```

### Trusted Proxies

Configure trusted proxies in middleware for accurate IP detection:

```javascript
const TRUSTED_PROXIES = [
  "127.0.0.1", // localhost
  "::1", // IPv6 localhost
  "10.0.0.1", // Your load balancer
  "172.16.0.1", // Your reverse proxy
];
```

## API Endpoints

### Public Endpoints

- `GET /api/firewall/test` - Test firewall functionality
- `GET /api/firewall/health` - Health check with feature list
- `GET /api/firewall/ping` - Connectivity test

### Admin Endpoints (requires admin role)

#### Dashboard & Statistics

- `GET /api/firewall/stats` - Dashboard statistics and metrics
- `GET /api/firewall/traffic-trends` - Traffic trends data for charts

#### Rule Management

- `GET /api/firewall/rules` - List and filter firewall rules
- `POST /api/firewall/rules` - Create new rule
- `PUT /api/firewall/rules/:id` - Update existing rule
- `DELETE /api/firewall/rules/:id` - Delete rule
- `POST /api/firewall/rules/batch` - Batch operations on rules

#### IP Management

- `GET /api/firewall/blocked-ips` - List blocked IPs (legacy, uses rules now)
- `POST /api/firewall/blocked-ips` - Block IP manually
- `DELETE /api/firewall/blocked-ips/:id` - Unblock IP

#### Logs & Monitoring

- `GET /api/firewall/logs` - View firewall logs with filtering
- `DELETE /api/firewall/logs` - Clear old logs
- `GET /api/firewall/logs/export` - Export logs in various formats

#### Settings & Configuration

- `GET /api/firewall/settings` - Get firewall settings
- `PUT /api/firewall/settings` - Update firewall configuration
- `POST /api/firewall/settings/reset` - Reset to default settings

#### Threat Intelligence

- `GET /api/firewall/threat-intel/stats` - Threat intelligence usage statistics
- `POST /api/firewall/threat-intel/import` - Import threat feeds
- `GET /api/firewall/threat-intel/check/:ip` - Check IP reputation

#### Email Reports

- `POST /api/firewall/reports/preview` - Send preview report
- `GET /api/firewall/reports/schedule` - Get report schedule
- `PUT /api/firewall/reports/schedule` - Update report schedule

#### Testing & Debug

- `GET /api/firewall/test-bypass` - Test localhost bypass
- `GET /api/firewall/test-rate-limit` - Test rate limiting
- `POST /api/firewall/test-rule` - Test rule effectiveness

## Rule Types

### IP Block Rules

Block specific IP addresses, ranges, or CIDR subnets:

```javascript
// Single IP
{
  name: "Block Malicious IP",
  type: "ip_block",
  value: "192.168.1.100",
  action: "block"
}

// CIDR Subnet
{
  name: "Block Subnet",
  type: "ip_block",
  value: "192.168.1.0/24",
  action: "block"
}
```

### Country Block Rules

Block requests from specific countries:

```javascript
{
  name: "Block Country",
  type: "country_block",
  value: "CN",
  action: "block"
}
```

### Rate Limit Rules

Apply rate limits to specific endpoints:

```javascript
{
  name: "API Rate Limit",
  type: "rate_limit",
  value: "/api/*",
  action: "rate_limit",
  requestsPerMinute: 60,
  requestsPerHour: 500
}
```

### Suspicious Pattern Rules

Block requests matching suspicious patterns:

```javascript
{
  name: "Block SQL Injection",
  type: "suspicious_pattern",
  value: "union.*select",
  action: "block"
}
```

## Database Collections

The plugin creates the following MongoDB collections:

- `firewallrules` - Firewall rules configuration
- `firewalllogs` - Request logs and events
- `firewallsettings` - Firewall configuration settings
- `rulemetrics` - Rule effectiveness metrics
- `ratelimits` - Rate limiting tracking (auto-expires)

## Frontend Components

### Admin Interface Structure

```
firewall/
├── FirewallAdmin.jsx                 # Main admin component
├── components/
│   ├── FirewallAdminDashboard.jsx    # Dashboard with stats and charts
│   ├── FirewallAdminRules.jsx        # Rule management interface
│   ├── FirewallAdminLogs.jsx         # Activity logs and filtering
│   ├── FirewallAdminSettings.jsx     # Settings and configuration
│   ├── TrafficTrendsChart.jsx        # Traffic trends visualization
│   └── RuleSparkline.jsx             # Mini rule effectiveness charts
├── hooks/
│   ├── useFirewallStats.js           # Dashboard statistics hook
│   ├── useFirewallRules.js           # Rule management hook
│   ├── useFirewallLogs.js            # Logs management hook
│   └── useFirewallSettings.js        # Settings management hook
├── constants/
│   └── firewallConstants.js          # Country codes, patterns, examples
└── dialogs/
    └── RuleEditorDialog.jsx          # Rule creation/editing dialog
```

### Component Import

```javascript
import { FirewallAdmin } from "../plugins/firewall";
```

## Dependencies

### Backend Dependencies

- `geoip-lite` - Geo-location services
- `mongoose` - MongoDB integration
- `axios` - HTTP client for threat intelligence APIs
- `ip-address` - IP address parsing and CIDR support

### Frontend Dependencies

- `@mui/material` - UI components and theming
- `@mui/icons-material` - Icons
- `@mui/x-charts` - Charts and data visualization
- `recharts` - Additional charting components

## Threat Intelligence

### Supported Providers

**Free Threat Feeds (No API Keys Required):**

- **Spamhaus DROP List**: Known spam sources and compromised computers
- **Emerging Threats**: Known compromised hosts and botnets

**API-based Providers (Require API Keys):**

- **AbuseIPDB**: Community-driven threat intelligence (1,000 free queries/day)
- **VirusTotal**: Google-owned threat detection (500 free queries/day)

### Setup Instructions

1. **Free Threat Feeds**: Work immediately, no configuration needed
2. **API Providers**: Add API keys to `.env` file
3. **Import Feeds**: Use admin interface to import threat intelligence
4. **Monitor Usage**: Check API usage statistics to avoid limits

## Security Features

### Request Blocking

Blocked requests receive standardized JSON responses:

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

## Email Reporting

### Report Types

- **Preview Reports**: Send immediate test reports
- **Scheduled Reports**: Daily, weekly, or monthly automated reports
- **Alert Reports**: Immediate notifications for threats

### Report Contents

- **Executive Summary**: Key metrics and trends
- **Traffic Statistics**: Request volumes and patterns
- **Threat Analysis**: Blocked threats and attack patterns
- **Rule Effectiveness**: Rule performance metrics
- **Geographic Analysis**: Country-based traffic data
- **Performance Metrics**: System performance and cache statistics

### Configuration

```javascript
// Email report settings
{
  enabled: true,
  emails: ["admin@example.com", "security@example.com"],
  frequency: "weekly", // daily, weekly, monthly
  time: "09:00",
  includeCharts: true,
  includeDetails: true
}
```

## Development Mode

In development mode (`NODE_ENV=development`):

- Localhost requests (127.0.0.1) bypass firewall checks
- Enhanced logging and debugging
- Test endpoints available
- Admin bypass headers accepted

## Best Practices

### Rule Management

1. **Priority System**: Use priority to control rule execution order
2. **Rule Testing**: Test rules before enabling in production
3. **Regular Review**: Periodically review and update rules
4. **Source Tracking**: Tag rules by source (manual, threat_intel, etc.)

### Performance Optimization

1. **CIDR Blocks**: Use CIDR notation instead of multiple single IP rules
2. **Pattern Efficiency**: Keep regex patterns simple and specific
3. **Cache Monitoring**: Monitor rule cache hit rates
4. **Log Cleanup**: Regular cleanup of old logs to manage storage

### Security Hardening

1. **Trusted Proxies**: Configure proper trusted proxy sources
2. **API Rate Limits**: Monitor threat intelligence API usage
3. **Regular Updates**: Keep threat feeds updated
4. **Monitoring**: Set up real-time alerts for critical threats

## Troubleshooting

### Common Issues

**Plugin Not Loading:**

- Verify licensing plugin is active
- Check console logs for error messages
- Ensure admin configuration is correct

**Rules Not Working:**

- Check rule priority and enabled status
- Verify rule syntax and values
- Review firewall logs for rule matches

**Performance Issues:**

- Monitor rule cache performance
- Clean old logs regularly
- Optimize complex regex patterns

**Threat Intelligence Issues:**

- Check API key configuration
- Monitor API usage limits
- Verify network connectivity

### Debug Tools

- **Debug Endpoints**: Use `/api/firewall/debug-test` for connectivity
- **Test Endpoints**: Use test endpoints to verify functionality
- **Logs Analysis**: Review detailed logs for troubleshooting
- **Performance Metrics**: Monitor cache hit rates and response times

## Migration & Compatibility

### Upgrading from Previous Versions

- ✅ All existing IP rules continue to work
- ✅ Pattern rules unchanged (with added safety)
- ✅ No configuration changes required
- ✅ Enhanced features available immediately

### Recommended Upgrades

- Convert IP prefix rules to CIDR notation
- Review and test complex regex patterns
- Configure trusted proxies for accurate IP detection
- Set up threat intelligence feeds
- Enable email reporting for monitoring

## License Dependency

This plugin requires the main licensing plugin to be active and valid. The firewall will not load if:

- Licensing plugin is not found
- License validation middleware is unavailable
- License is invalid or expired

## Additional Documentation

- **[Threat Intelligence Integration](./THREAT_INTELLIGENCE.md)** - Comprehensive threat intelligence setup
- **[Security Enhancements](./SECURITY_ENHANCEMENTS.md)** - Advanced security features and best practices
