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
} from "@mui/material";
import {
  Public as GlobeIcon,
  Block as BanIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";
import TrafficTrendsChart from "./TrafficTrendsChart";

const FirewallAdminDashboard = ({ stats }) => {
  return (
    <>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="primary">
                {stats.rules?.total || 0}
              </Typography>
              <Typography variant="body1">Total Rules</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.rules?.active || 0} active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="primary">
                {stats.blockedIPs?.total || 0}
              </Typography>
              <Typography variant="body1">Blocked IPs</Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.blockedIPs?.active || 0} active,{" "}
                {stats.blockedIPs?.permanent || 0} permanent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="primary">
                {stats.requests?.last24h?.allowed || 0}
              </Typography>
              <Typography variant="body1">Allowed (24h)</Typography>
              <Typography variant="body2" color="text.secondary">
                Total: {stats.requests?.last24h?.total || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h3" color="primary">
                {stats.requests?.last24h?.blocked || 0}
              </Typography>
              <Typography variant="body1">Blocked (24h)</Typography>
              <Typography variant="body2" color="text.secondary">
                Last 7d: {stats.requests?.last7d || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Traffic Trends Chart */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <TrafficTrendsChart />
        </Grid>
      </Grid>

      {/* Top Blocked Countries & IPs */}
      {stats.topBlockedCountries?.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <GlobeIcon sx={{ mr: 1 }} />
                    Top Blocked Countries
                  </Box>
                }
              />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Country</TableCell>
                        <TableCell>Blocks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topBlockedCountries
                        .slice(0, 5)
                        .map((country, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
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
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <BanIcon sx={{ mr: 1 }} />
                    Top Blocked IPs
                  </Box>
                }
              />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>IP Address</TableCell>
                        <TableCell>Blocks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.topBlockedIPs?.slice(0, 5).map((ip, index) => (
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
        </Grid>
      )}
    </>
  );
};

export default FirewallAdminDashboard;
