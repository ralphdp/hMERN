import React from "react";
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Public as GlobeIcon,
  Block as BanIcon,
  Flag as FlagIcon,
  NotInterested as DisabledIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import TrafficTrendsChart from "./TrafficTrendsChart";
import RuleSparkline from "./RuleSparkline";

// Memoized stat card component to prevent unnecessary re-renders
const StatCard = React.memo(
  ({ title, value, subtitle, color = "primary" }) => (
    <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
      <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardContent sx={{ flex: 1, textAlign: "center" }}>
          <Typography variant="h3" color={color}>
            {value}
          </Typography>
          <Typography variant="body1">{title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  ),
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when props haven't changed
    return (
      prevProps.title === nextProps.title &&
      prevProps.value === nextProps.value &&
      prevProps.subtitle === nextProps.subtitle &&
      prevProps.color === nextProps.color
    );
  }
);

// Memoized disabled feature card
const FeatureDisabledCard = React.memo(
  ({ title, description, getDisabledStyle }) => (
    <Grid item xs={12} sm={6} md={3} sx={{ display: "flex" }}>
      <Card
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          ...getDisabledStyle(false),
        }}
      >
        <CardContent sx={{ flex: 1, textAlign: "center" }}>
          <DisabledIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body1" color="text.disabled">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  )
);

// Memoized top blocked countries card
const TopBlockedCountriesCard = React.memo(
  ({ countries, isEnabled, getDisabledStyle }) => {
    if (!isEnabled) {
      return (
        <Grid item xs={12} md={6} sx={{ display: "flex" }}>
          <Card
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              ...getDisabledStyle(false),
            }}
          >
            <CardHeader
              title={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <GlobeIcon sx={{ mr: 1, color: "text.disabled" }} />
                  <Typography color="text.disabled">
                    Geo Blocking Disabled
                  </Typography>
                </Box>
              }
            />
            <CardContent sx={{ flex: 1, textAlign: "center" }}>
              <DisabledIcon
                sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
              />
              <Typography variant="body2" color="text.secondary">
                Enable Geo Blocking in Configuration tab to see blocked
                countries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      );
    }

    if (!countries?.length) return null;

    return (
      <Grid item xs={12} md={6} sx={{ display: "flex" }}>
        <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
          <CardHeader
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <GlobeIcon sx={{ mr: 1 }} />
                Top Blocked Countries
              </Box>
            }
          />
          <CardContent sx={{ flex: 1 }}>
            <TableContainer
              sx={{
                "&::-webkit-scrollbar": { width: "8px", height: "8px" },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "action.hover",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "text.secondary",
                  borderRadius: "4px",
                  "&:hover": { backgroundColor: "text.primary" },
                },
                "&::-webkit-scrollbar-corner": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Country</TableCell>
                    <TableCell>Blocks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {countries.slice(0, 5).map((country, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <FlagIcon />
                          <Typography variant="body1">
                            {country._id || "Unknown"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={country.count}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    );
  }
);

// Memoized top blocked IPs card
const TopBlockedIPsCard = React.memo(({ ips, isEnabled, getDisabledStyle }) => {
  if (!isEnabled) {
    return (
      <Grid item xs={12} md={6} sx={{ display: "flex" }}>
        <Card
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            ...getDisabledStyle(false),
          }}
        >
          <CardHeader
            title={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <BanIcon sx={{ mr: 1, color: "text.disabled" }} />
                <Typography color="text.disabled">
                  IP Blocking Disabled
                </Typography>
              </Box>
            }
          />
          <CardContent sx={{ flex: 1, textAlign: "center" }}>
            <DisabledIcon
              sx={{ fontSize: 48, color: "text.disabled", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Enable IP Blocking in Configuration tab to see blocked IPs
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    );
  }

  if (!ips?.length) return null;

  return (
    <Grid item xs={12} md={6} sx={{ display: "flex" }}>
      <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <BanIcon sx={{ mr: 1 }} />
              Top Blocked IPs
            </Box>
          }
        />
        <CardContent sx={{ flex: 1 }}>
          <TableContainer
            sx={{
              "&::-webkit-scrollbar": { width: "8px", height: "8px" },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "action.hover",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "text.secondary",
                borderRadius: "4px",
                "&:hover": { backgroundColor: "text.primary" },
              },
              "&::-webkit-scrollbar-corner": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>IP Address</TableCell>
                  <TableCell>Blocks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ips.slice(0, 5).map((ip, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" component="code">
                        {ip._id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={ip.count} color="error" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Grid>
  );
});

// Memoized feature status alert
const FeatureStatusAlert = React.memo(({ isFeatureEnabled }) => {
  const disabledFeatures = [];
  if (!isFeatureEnabled("ipBlocking")) disabledFeatures.push("IP Blocking");
  if (!isFeatureEnabled("countryBlocking"))
    disabledFeatures.push("Geo Blocking");
  if (!isFeatureEnabled("rateLimiting")) disabledFeatures.push("Rate Limiting");
  if (!isFeatureEnabled("suspiciousPatterns"))
    disabledFeatures.push("Threat Intelligence");

  if (disabledFeatures.length === 0) return null;

  return (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <Typography variant="body2">
        <strong>Some firewall features are disabled:</strong>{" "}
        {disabledFeatures.join(", ")}. Enable them in the Configuration tab to
        see full protection.
      </Typography>
    </Alert>
  );
});

// New Recent Activity Card
const RecentActivityCard = React.memo(({ stats }) => {
  const recentLogs = stats.recentLogs || [];

  return (
    <Grid item xs={12} md={6} sx={{ display: "flex" }}>
      <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TimelineIcon sx={{ mr: 1 }} />
              Recent Security Events
            </Box>
          }
          action={
            <Tooltip title="Refresh">
              <IconButton size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent sx={{ flex: 1 }}>
          {recentLogs.length > 0 ? (
            <TableContainer sx={{ maxHeight: 250 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Country</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentLogs.slice(0, 5).map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          color={
                            log.action === "blocked"
                              ? "error"
                              : log.action === "allowed"
                              ? "success"
                              : "warning"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" component="code">
                          {log.ip}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {log.country || "Unknown"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No recent activity to display
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
});

// New Rule Performance Card
const RulePerformanceCard = React.memo(({ rules, stats }) => {
  const topRules = React.useMemo(() => {
    if (!rules || !Array.isArray(rules)) return [];

    return rules
      .filter((rule) => rule.enabled)
      .map((rule) => ({
        ...rule,
        hitCount: stats.ruleMetrics?.[rule._id]?.hits || 0,
        efficiency: stats.ruleMetrics?.[rule._id]?.efficiency || 0,
      }))
      .sort((a, b) => b.hitCount - a.hitCount)
      .slice(0, 5);
  }, [rules, stats.ruleMetrics]);

  return (
    <Grid item xs={12} md={6} sx={{ display: "flex" }}>
      <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SpeedIcon sx={{ mr: 1 }} />
              Top Performing Rules
            </Box>
          }
        />
        <CardContent sx={{ flex: 1 }}>
          {topRules.length > 0 ? (
            <TableContainer sx={{ maxHeight: 250 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Rule</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Hits</TableCell>
                    <TableCell>Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topRules.map((rule, index) => (
                    <TableRow key={rule._id}>
                      <TableCell>
                        <Tooltip title={rule.description || rule.value}>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 120 }}
                          >
                            {rule.name}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.type.replace("_", " ")}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {rule.hitCount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <RuleSparkline
                          ruleId={rule._id}
                          ruleName={rule.name}
                          width={60}
                          height={20}
                          showTrend={true}
                          showTooltip={false}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No rule performance data available
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
});

// New Security Alerts Card
const SecurityAlertsCard = React.memo(({ stats }) => {
  const alerts = stats.securityAlerts || [];

  return (
    <Grid item xs={12} md={6} sx={{ display: "flex" }}>
      <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningIcon sx={{ mr: 1 }} />
              Security Alerts
              {alerts.length > 0 && (
                <Chip label={alerts.length} color="warning" size="small" />
              )}
            </Box>
          }
        />
        <CardContent sx={{ flex: 1 }}>
          {alerts.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {alerts.slice(0, 4).map((alert, index) => (
                <Alert
                  key={index}
                  severity={alert.severity || "warning"}
                  size="small"
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="body2">{alert.message}</Typography>
                </Alert>
              ))}
            </Box>
          ) : (
            <Box sx={{ textAlign: "center", py: 4, color: "success.main" }}>
              <CheckCircleIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2" color="success.main">
                No security alerts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                All systems operating normally
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Grid>
  );
});

// New System Health Card
const SystemHealthCard = React.memo(({ stats }) => {
  const healthMetrics = [
    {
      label: "Response Time",
      value: stats.performance?.avgResponseTime || 0,
      unit: "ms",
      status:
        (stats.performance?.avgResponseTime || 0) < 100
          ? "good"
          : (stats.performance?.avgResponseTime || 0) < 500
          ? "warning"
          : "error",
      target: "< 100ms",
    },
    {
      label: "Memory Usage",
      value: stats.performance?.memoryUsage || 0,
      unit: "%",
      status:
        (stats.performance?.memoryUsage || 0) < 70
          ? "good"
          : (stats.performance?.memoryUsage || 0) < 85
          ? "warning"
          : "error",
      target: "< 70%",
    },
    {
      label: "Active Rules",
      value: stats.rules?.active || 0,
      unit: "",
      status: "good",
      target: `${stats.rules?.total || 0} total`,
    },
    {
      label: "Cache Hit Rate",
      value: stats.performance?.cacheHitRate || 0,
      unit: "%",
      status:
        (stats.performance?.cacheHitRate || 0) > 80
          ? "good"
          : (stats.performance?.cacheHitRate || 0) > 60
          ? "warning"
          : "error",
      target: "> 80%",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "good":
        return "success.main";
      case "warning":
        return "warning.main";
      case "error":
        return "error.main";
      default:
        return "text.secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "good":
        return <CheckCircleIcon color="success" />;
      case "warning":
        return <WarningIcon color="warning" />;
      case "error":
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon color="disabled" />;
    }
  };

  return (
    <Grid item xs={12} md={6} sx={{ display: "flex" }}>
      <Card sx={{ width: "100%", display: "flex", flexDirection: "column" }}>
        <CardHeader
          title={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SecurityIcon sx={{ mr: 1 }} />
              System Health
            </Box>
          }
        />
        <CardContent sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {healthMetrics.map((metric, index) => (
              <Box key={index}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {getStatusIcon(metric.status)}
                    <Typography variant="body2" fontWeight="medium">
                      {metric.label}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={getStatusColor(metric.status)}
                  >
                    {metric.value}
                    {metric.unit}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      metric.unit === "%"
                        ? metric.value
                        : Math.min((metric.value / 1000) * 100, 100)
                    }
                    sx={{
                      flex: 1,
                      height: 4,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: getStatusColor(metric.status),
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {metric.target}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
});

const FirewallAdminDashboard = React.memo(
  ({
    stats,
    rules,
    config,
    isFeatureEnabled,
    getFeatureTooltip,
    getDisabledStyle,
    getRuleTypeEnabled,
  }) => {
    // Memoized calculations for performance
    const dashboardData = React.useMemo(() => {
      const totalRules = rules ? rules.length : stats.rules?.total || 0;

      // Calculate actual active rules based on both rule.enabled AND feature enabled
      const actualActiveRules = (() => {
        if (!rules || !Array.isArray(rules)) return 0;

        return rules.filter((rule) => {
          // Rule must be enabled
          if (!rule.enabled) return false;

          // AND the corresponding feature must be enabled
          const isRuleTypeEnabled = getRuleTypeEnabled
            ? getRuleTypeEnabled(rule.type)
            : true;
          return isRuleTypeEnabled;
        }).length;
      })();

      return { totalRules, actualActiveRules };
    }, [rules, getRuleTypeEnabled, stats.rules?.total]);

    // Memoized feature status calculations
    const featureStatus = React.useMemo(() => {
      return {
        ipBlocking: isFeatureEnabled("ipBlocking"),
        countryBlocking: isFeatureEnabled("countryBlocking"),
        rateLimiting: isFeatureEnabled("rateLimiting"),
        suspiciousPatterns: isFeatureEnabled("suspiciousPatterns"),
      };
    }, [isFeatureEnabled]);

    const { totalRules, actualActiveRules } = dashboardData;

    return (
      <>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <StatCard
            title="Total Rules"
            value={totalRules}
            subtitle={`${actualActiveRules} active`}
          />

          {/* Blocked IPs Card - Only show if IP Blocking is enabled */}
          {featureStatus.ipBlocking ? (
            <StatCard
              title="Blocked IPs"
              value={stats.blockedIPs?.total || 0}
              subtitle={`${stats.blockedIPs?.active || 0} active, ${
                stats.blockedIPs?.permanent || 0
              } permanent`}
            />
          ) : (
            <FeatureDisabledCard
              title="IP Blocking Disabled"
              description="Enable in Configuration tab"
              getDisabledStyle={getDisabledStyle}
            />
          )}

          <StatCard
            title="Allowed (24h)"
            value={stats.requests?.last24h?.allowed || 0}
            subtitle={`Total: ${stats.requests?.last24h?.total || 0}`}
          />

          <StatCard
            title="Blocked (24h)"
            value={stats.requests?.last24h?.blocked || 0}
            subtitle={`Last 7d: ${stats.requests?.last7d || 0}`}
          />
        </Grid>

        {/* Feature Status Alert */}
        <FeatureStatusAlert isFeatureEnabled={isFeatureEnabled} />

        {/* Traffic Trends Chart */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sx={{ display: "flex" }}>
            <TrafficTrendsChart config={config} />
          </Grid>
        </Grid>

        {/* Recent Activity and Rule Performance */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <RecentActivityCard stats={stats} />
          <RulePerformanceCard rules={rules} stats={stats} />
        </Grid>

        {/* Security Alerts and System Health */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <SecurityAlertsCard stats={stats} />
          <SystemHealthCard stats={stats} />
        </Grid>

        {/* Top Blocked Countries & IPs - Conditional based on features */}
        {(stats.topBlockedCountries?.length > 0 ||
          stats.topBlockedIPs?.length > 0 ||
          !featureStatus.countryBlocking ||
          !featureStatus.ipBlocking) && (
          <Grid container spacing={3}>
            <TopBlockedCountriesCard
              countries={stats.topBlockedCountries}
              isEnabled={featureStatus.countryBlocking}
              getDisabledStyle={getDisabledStyle}
            />

            <TopBlockedIPsCard
              ips={stats.topBlockedIPs}
              isEnabled={featureStatus.ipBlocking}
              getDisabledStyle={getDisabledStyle}
            />
          </Grid>
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for optimal re-rendering
    return (
      prevProps.stats === nextProps.stats &&
      prevProps.rules === nextProps.rules &&
      prevProps.config === nextProps.config &&
      prevProps.isFeatureEnabled === nextProps.isFeatureEnabled &&
      prevProps.getDisabledStyle === nextProps.getDisabledStyle &&
      prevProps.getRuleTypeEnabled === nextProps.getRuleTypeEnabled
    );
  }
);

export default FirewallAdminDashboard;
