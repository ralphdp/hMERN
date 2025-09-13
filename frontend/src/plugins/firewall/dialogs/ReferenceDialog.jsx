import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  Alert,
  Chip,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Flag as FlagIcon,
  Security as SecurityIcon,
  BarChart as ChartIcon,
  Code as CodeIcon,
  Add as PlusIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import {
  countryCodes,
  patternExamples,
  rateLimitExamples,
} from "../constants/firewallConstants";

const ReferenceDialog = ({ open, onClose, onRuleCreate }) => {
  const [referenceTab, setReferenceTab] = useState(0);
  const [countrySearch, setCountrySearch] = useState("");

  // Filter countries based on search
  const filteredCountries = countryCodes.filter(
    (country) =>
      !countrySearch ||
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleUseCountryCode = (country) => {
    const rule = {
      name: `Block ${country.name}`,
      type: "country_block",
      value: country.code,
      action: "block",
      enabled: true,
      priority: 100,
      description: `Block all traffic from ${country.name}`,
    };
    onRuleCreate(rule);
    onClose();
  };

  const handleUseRateLimitRule = (scenario) => {
    const rule = {
      name: scenario.name,
      type: "rate_limit",
      value: scenario.value,
      action: "rate_limit",
      enabled: true,
      priority: 50,
      description: `${scenario.description} - ${scenario.requestsPerMinute} requests/min, ${scenario.requestsPerHour} requests/hour - OVERRIDES global rate limits for this pattern`,
    };
    onRuleCreate(rule);
    onClose();
  };

  const handleUsePattern = (category, pattern) => {
    const rule = {
      name: `Block ${category.category} - ${pattern.substring(0, 20)}...`,
      type: "suspicious_pattern",
      value: pattern,
      action: "block",
      enabled: true,
      priority: 75,
      description: `Blocks requests matching ${category.category.toLowerCase()} pattern`,
    };
    onRuleCreate(rule);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh" },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SecurityIcon />
          <Typography variant="h6">Firewall Reference Guide</Typography>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          // Dark mode friendly scrollbars
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "action.hover",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "text.secondary",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "text.primary",
            },
          },
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={referenceTab}
            onChange={(e, newValue) => setReferenceTab(newValue)}
          >
            <Tab
              icon={<FlagIcon />}
              label={`Country Codes (${countryCodes.length})`}
            />
            <Tab icon={<ChartIcon />} label="Rate Limiting" />
            <Tab
              icon={<CodeIcon />}
              label={`Pattern Examples (${patternExamples.length})`}
            />
          </Tabs>
        </Box>

        {/* Country Codes Tab */}
        {referenceTab === 0 && (
          <Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                id="country-search"
                name="country-search"
                placeholder="Search by country name or code..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use these 2-letter country codes in your firewall rules. For
              example, to block all traffic from China, create a rule with type
              "Country Block" and value "CN".
            </Typography>

            <Paper
              sx={{
                maxHeight: "100%",
                overflow: "auto",
                // Dark mode friendly scrollbars
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "action.hover",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "text.secondary",
                  borderRadius: "4px",
                  "&:hover": {
                    backgroundColor: "text.primary",
                  },
                },
              }}
            >
              <List
                dense
                sx={{ maxHeight: "calc(90vh - 200px)", overflow: "auto" }}
              >
                {filteredCountries.map((country, index) => (
                  <React.Fragment key={country.code}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <FlagIcon />
                            <Typography variant="body1">
                              {country.name}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip
                          title={
                            <Typography variant="body2">
                              Use this country code
                            </Typography>
                          }
                          arrow
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleUseCountryCode(country)}
                            startIcon={<FlagIcon />}
                          >
                            Use Code
                          </Button>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredCountries.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>

            {filteredCountries.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No countries found matching "{countrySearch}"
              </Typography>
            )}
          </Box>
        )}

        {/* Rate Limiting Tab */}
        {referenceTab === 1 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              These are common rate limiting scenarios to protect your
              application from abuse. Rate limiting rules control how many
              requests can be made to specific endpoints within a given time
              period.{" "}
              <strong>
                Individual rate limit rules OVERRIDE the global rate limiting
                settings
              </strong>{" "}
              from the Settings tab for their specific URL patterns, allowing
              you to set custom limits per endpoint.
            </Typography>

            <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
              {rateLimitExamples.map((category, categoryIndex) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  key={categoryIndex}
                  sx={{ display: "flex" }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardHeader
                      title={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <ChartIcon color="primary" />
                          <Typography variant="h6">
                            {category.category}
                          </Typography>
                          <Chip
                            label={category.scenarios.length}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      }
                    />
                    <CardContent sx={{ flexGrow: 1, pt: 1 }}>
                      <List dense>
                        {category.scenarios.map((scenario, scenarioIndex) => (
                          <ListItem
                            key={scenarioIndex}
                            divider={
                              scenarioIndex < category.scenarios.length - 1
                            }
                            sx={{
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography
                                  variant="subtitle2"
                                  sx={{ fontWeight: "bold" }}
                                >
                                  {scenario.name}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    {scenario.description}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    component="code"
                                    sx={{
                                      p: 0.5,
                                      borderRadius: 1,
                                      fontSize: "0.8rem",
                                      bgcolor: "action.hover",
                                      display: "block",
                                      mb: 1,
                                    }}
                                  >
                                    Path: {scenario.value}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: 1,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <Chip
                                      label={`${scenario.requestsPerMinute}/min`}
                                      size="small"
                                      color="warning"
                                    />
                                    <Chip
                                      label={`${scenario.requestsPerHour}/hour`}
                                      size="small"
                                      color="info"
                                    />
                                  </Box>
                                </Box>
                              }
                            />
                            <Box
                              sx={{
                                alignSelf: "flex-start",
                                mt: 1,
                                mb: 3,
                              }}
                            >
                              <Tooltip
                                title={
                                  <Typography variant="body2">
                                    Use this rate limiting rule
                                  </Typography>
                                }
                                arrow
                              >
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() =>
                                    handleUseRateLimitRule(scenario)
                                  }
                                  startIcon={<ChartIcon />}
                                >
                                  Use Rule
                                </Button>
                              </Tooltip>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <HelpIcon />
                Rate Limiting Tips
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>
                    <strong>Rule Priority:</strong> Individual rate limit rules
                    override the global settings (50/min, 400/hour) for their
                    specific patterns
                  </li>
                  <li>
                    Use wildcard patterns like <code>*/api/*</code> to match
                    multiple endpoints
                  </li>
                  <li>
                    Set stricter limits for sensitive endpoints (auth, admin,
                    etc.) - they'll override the global defaults
                  </li>
                  <li>
                    Consider different limits for authenticated vs anonymous
                    users
                  </li>
                  <li>
                    Monitor your application's normal traffic patterns before
                    setting limits
                  </li>
                  <li>Rate limits are applied per IP address</li>
                  <li>
                    Higher priority rules (lower number) are processed first
                  </li>
                  <li>
                    Lower values provide stronger protection but may affect
                    legitimate users
                  </li>
                  <li>
                    Test your rate limits thoroughly before enabling in
                    production
                  </li>
                </ul>
              </Typography>
            </Box>
          </Box>
        )}

        {/* Pattern Examples Tab */}
        {referenceTab === 2 && (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              These are common patterns used to detect suspicious requests. You
              can use these regex patterns in "Suspicious Pattern" rules to
              block malicious traffic.
            </Typography>

            <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
              {patternExamples.map((category, categoryIndex) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  key={categoryIndex}
                  sx={{ display: "flex" }}
                >
                  <Card
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardHeader
                      title={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <SecurityIcon color="primary" />
                          <Typography variant="h6">
                            {category.category}
                          </Typography>
                          <Chip
                            label={category.patterns.length}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      }
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <List dense>
                        {category.patterns.map((pattern, patternIndex) => (
                          <ListItem
                            key={patternIndex}
                            divider={
                              patternIndex < category.patterns.length - 1
                            }
                          >
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  component="code"
                                  sx={{
                                    bgcolor: "action.hover",
                                    p: 0.5,
                                    borderRadius: 1,
                                    fontSize: "0.8rem",
                                  }}
                                >
                                  {pattern}
                                </Typography>
                              }
                            />
                            <ListItemSecondaryAction>
                              <Tooltip
                                title={
                                  <Typography variant="body2">
                                    Use this pattern
                                  </Typography>
                                }
                                arrow
                              >
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleUsePattern(category, pattern)
                                  }
                                >
                                  <PlusIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <HelpIcon />
                Pattern Tips
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Patterns are case-insensitive by default</li>
                  <li>
                    Use <code>.*</code> to match any characters
                  </li>
                  <li>
                    Use <code>\\.</code> to match literal dots
                  </li>
                  <li>
                    Use <code>^</code> to match start of string
                  </li>
                  <li>
                    Use <code>$</code> to match end of string
                  </li>
                  <li>Test your patterns carefully before enabling</li>
                </ul>
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReferenceDialog;
