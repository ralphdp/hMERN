import React from "react";
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  Checkbox,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Grid,
  ButtonGroup,
} from "@mui/material";
import {
  Flag as FlagIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ArrowDropDown as ArrowDropDownIcon,
  FileDownload as FileDownloadIcon,
  CheckBox as CheckBoxIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarTodayIcon,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import FirewallLocalStorage from "../../../utils/localStorage";
import createLogger from "../../../utils/logger";

// Initialize logger for firewall logs component
const logger = createLogger("FirewallAdminLogs");

const FirewallAdminLogs = ({
  logs,
  formatDate,
  getActionChip,
  fetchLogs,
  isFeatureEnabled,
  getDisabledStyle,
}) => {
  // Initialize state from localStorage
  const [searchTerm, setSearchTerm] = React.useState(() =>
    FirewallLocalStorage.getSearchTerm("logs")
  );
  const [page, setPage] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsCurrentPage", 0)
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(
    () => FirewallLocalStorage.getTableSettings("logs").pageSize
  );

  // Sorting state
  const [sortBy, setSortBy] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsSortBy", "timestamp")
  );
  const [sortDirection, setSortDirection] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsSortDirection", "desc")
  );

  // Button states
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [exportingCsv, setExportingCsv] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [filtersAnchorEl, setFiltersAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const filtersOpen = Boolean(filtersAnchorEl);

  // Selection state
  const [selectedLogs, setSelectedLogs] = React.useState([]);

  // Filter state
  const [actionFilter, setActionFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsActionFilter", "all")
  );
  const [countryFilter, setCountryFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsCountryFilter", "all")
  );
  const [ruleFilter, setRuleFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsRuleFilter", "all")
  );
  const [methodFilter, setMethodFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsMethodFilter", "all")
  );

  // Date filter state
  const [dateFilter, setDateFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("logsDateFilter", "all")
  );
  const [startDate, setStartDate] = React.useState(() => {
    const saved = FirewallLocalStorage.getPreference("logsStartDate", null);
    return saved ? dayjs(saved) : null;
  });
  const [endDate, setEndDate] = React.useState(() => {
    const saved = FirewallLocalStorage.getPreference("logsEndDate", null);
    return saved ? dayjs(saved) : null;
  });

  // Date preset buttons
  const datePresets = [
    { label: "Last 24h", value: "24h" },
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 90 days", value: "90d" },
    { label: "Custom range", value: "custom" },
    { label: "All time", value: "all" },
  ];

  // Custom date formatting function matching "6/21/2025, 6:45:38 PM"
  const formatCustomDate = (date) => {
    if (!date) return "";
    const d = dayjs(date);
    return d.format("M/D/YYYY, h:mm:ss A");
  };

  // Save search term to localStorage when it changes
  React.useEffect(() => {
    FirewallLocalStorage.setSearchTerm("logs", searchTerm);
  }, [searchTerm]);

  // Save filter preferences to localStorage
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("logsActionFilter", actionFilter);
  }, [actionFilter]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference("logsCountryFilter", countryFilter);
  }, [countryFilter]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference("logsRuleFilter", ruleFilter);
  }, [ruleFilter]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference("logsMethodFilter", methodFilter);
  }, [methodFilter]);

  // Save table settings to localStorage when they change
  React.useEffect(() => {
    FirewallLocalStorage.setTableSettings("logs", { pageSize: rowsPerPage });
  }, [rowsPerPage]);

  // Save current page to localStorage when it changes
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("logsCurrentPage", page);
  }, [page]);

  // Save sort preferences to localStorage
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("logsSortBy", sortBy);
    FirewallLocalStorage.setPreference("logsSortDirection", sortDirection);
  }, [sortBy, sortDirection]);

  // Save date filter preferences to localStorage
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("logsDateFilter", dateFilter);
  }, [dateFilter]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference(
      "logsStartDate",
      startDate ? startDate.toISOString() : null
    );
  }, [startDate]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference(
      "logsEndDate",
      endDate ? endDate.toISOString() : null
    );
  }, [endDate]);

  // Menu handlers
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Filters menu handlers
  const handleFiltersClick = (event) => {
    setFiltersAnchorEl(event.currentTarget);
  };

  const handleFiltersClose = () => {
    setFiltersAnchorEl(null);
  };

  // Count active filters (excluding search and date)
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (actionFilter !== "all") count++;
    if (countryFilter !== "all") count++;
    if (ruleFilter !== "all") count++;
    if (methodFilter !== "all") count++;
    return count;
  }, [actionFilter, countryFilter, ruleFilter, methodFilter]);

  // Selection handlers
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // Select all logs on current page
      const currentPageIds = paginatedLogs.map((log) => log._id);
      setSelectedLogs((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      // Deselect all logs on current page
      const currentPageIds = paginatedLogs.map((log) => log._id);
      setSelectedLogs((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const handleSelectLog = (logId) => {
    setSelectedLogs((prev) =>
      prev.includes(logId)
        ? prev.filter((id) => id !== logId)
        : [...prev, logId]
    );
  };

  // CSV Export functionality
  const handleExportCsv = async (exportType = "all") => {
    setExportingCsv(true);
    handleClose();

    try {
      // CSV headers
      const headers = [
        "Timestamp",
        "IP Address",
        "Country",
        "Action",
        "Rule",
        "Method",
        "URL",
        "User Agent",
      ];

      // Determine which logs to export
      let logsToExport = filteredAndSortedLogs;
      if (exportType === "selected") {
        logsToExport = filteredAndSortedLogs.filter((log) =>
          selectedLogs.includes(log._id)
        );
      }

      // Convert logs to CSV format
      const csvData = logsToExport.map((log) => [
        formatDate(log.timestamp),
        log.ip,
        log.country || "Unknown",
        log.action,
        log.rule || "-",
        log.method,
        log.url || "",
        log.userAgent || "",
      ]);

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map((row) =>
          row
            .map((field) =>
              // Escape quotes and wrap in quotes if needed
              typeof field === "string" &&
              (field.includes(",") ||
                field.includes('"') ||
                field.includes("\n"))
                ? `"${field.replace(/"/g, '""')}"`
                : field
            )
            .join(",")
        )
        .join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      const filename =
        exportType === "selected"
          ? `firewall-logs-selected-${
              new Date().toISOString().split("T")[0]
            }.csv`
          : `firewall-logs-${new Date().toISOString().split("T")[0]}.csv`;
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.debug("CSV export completed", {
        count: logsToExport.length,
        type: exportType,
      });
    } catch (error) {
      logger.error("CSV export failed", { error: error.message });
    } finally {
      setExportingCsv(false);
    }
  };

  // Handle sorting
  const handleSort = (column) => {
    const isAsc = sortBy === column && sortDirection === "asc";
    const newDirection = isAsc ? "desc" : "asc";
    logger.debug("Log column sort changed", {
      column,
      currentSort: `${sortBy}/${sortDirection}`,
      newSort: `${column}/${newDirection}`,
    });
    setSortDirection(newDirection);
    setSortBy(column);
  };

  // Sort comparator function
  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    let aVal = a[orderBy];
    let bVal = b[orderBy];

    // Debug first few comparisons (reduced logging for performance)
    if (Math.random() < 0.01) {
      // Only log 1% of comparisons to avoid spam
      logger.debug("Log sort comparison", { orderBy, aVal, bVal });
    }

    // Handle different data types
    switch (orderBy) {
      case "ip":
      case "country":
      case "action":
      case "rule":
      case "method":
      case "url":
      case "userAgent":
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
        break;
      case "timestamp":
        aVal = new Date(aVal);
        bVal = new Date(bVal);
        break;
      default:
        break;
    }

    if (bVal < aVal) {
      return -1;
    }
    if (bVal > aVal) {
      return 1;
    }
    return 0;
  };

  // Get unique values for filter dropdowns
  const uniqueCountries = React.useMemo(() => {
    const countries = [
      ...new Set(logs.map((log) => log.country).filter(Boolean)),
    ];
    return countries.sort();
  }, [logs]);

  const uniqueRules = React.useMemo(() => {
    const rules = [...new Set(logs.map((log) => log.rule).filter(Boolean))];
    return rules.sort();
  }, [logs]);

  const uniqueMethods = React.useMemo(() => {
    const methods = [...new Set(logs.map((log) => log.method).filter(Boolean))];
    return methods.sort();
  }, [logs]);

  // Filter and sort logs
  const filteredAndSortedLogs = React.useMemo(() => {
    let filtered = logs;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.ip.toLowerCase().includes(searchLower) ||
          (log.country && log.country.toLowerCase().includes(searchLower)) ||
          log.action.toLowerCase().includes(searchLower) ||
          (log.rule && log.rule.toLowerCase().includes(searchLower)) ||
          log.method.toLowerCase().includes(searchLower) ||
          (log.url && log.url.toLowerCase().includes(searchLower)) ||
          (log.userAgent && log.userAgent.toLowerCase().includes(searchLower))
      );
    }

    // Apply action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Apply country filter
    if (countryFilter !== "all") {
      filtered = filtered.filter((log) => log.country === countryFilter);
    }

    // Apply rule filter
    if (ruleFilter !== "all") {
      filtered = filtered.filter((log) => log.rule === ruleFilter);
    }

    // Apply method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((log) => log.method === methodFilter);
    }

    // Apply date filter
    if (dateFilter !== "all" && (startDate || endDate)) {
      filtered = filtered.filter((log) => {
        const logDate = dayjs(log.timestamp);
        const start = startDate ? startDate.startOf("day") : null;
        const end = endDate ? endDate.endOf("day") : null;

        return (
          (!start || logDate.isAfter(start) || logDate.isSame(start, "day")) &&
          (!end || logDate.isBefore(end) || logDate.isSame(end, "day"))
        );
      });
    }

    // Apply sorting - create new array to ensure React detects the change
    const sorted = [...filtered].sort(getComparator(sortDirection, sortBy));
    logger.debug("Log sort applied", {
      sortBy,
      sortDirection,
      filteredCount: filtered.length,
      firstItemIp: sorted[0]?.ip,
      firstItemValue: sorted[0]?.[sortBy],
    });
    return sorted;
  }, [
    logs,
    searchTerm,
    actionFilter,
    countryFilter,
    ruleFilter,
    methodFilter,
    sortBy,
    sortDirection,
    dateFilter,
    startDate,
    endDate,
  ]);

  // Paginate filtered and sorted logs
  const paginatedLogs = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const result = filteredAndSortedLogs.slice(startIndex, endIndex);

    // Debug logging for pagination verification
    logger.debug("Log pagination applied", {
      totalLogs: logs.length,
      filteredCount: filteredAndSortedLogs.length,
      currentPage: page + 1,
      showingCount: result.length,
      range: `${startIndex + 1}-${Math.min(
        endIndex,
        filteredAndSortedLogs.length
      )}`,
    });

    return result;
  }, [filteredAndSortedLogs, page, rowsPerPage, logs.length]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
    setSelectedLogs([]); // Clear selections when searching
  };

  // Handle filters
  const handleActionFilterChange = (event) => {
    setActionFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleCountryFilterChange = (event) => {
    setCountryFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleRuleFilterChange = (event) => {
    setRuleFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleMethodFilterChange = (event) => {
    setMethodFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleDateFilterChange = (event) => {
    const value = event.target.value;
    setDateFilter(value);
    setPage(0); // Reset to first page when filtering

    // Handle preset date ranges
    if (value === "all") {
      setStartDate(null);
      setEndDate(null);
    } else if (value === "24h") {
      setStartDate(dayjs().subtract(24, "hour"));
      setEndDate(dayjs());
    } else if (value === "7d") {
      setStartDate(dayjs().subtract(7, "day"));
      setEndDate(dayjs());
    } else if (value === "30d") {
      setStartDate(dayjs().subtract(30, "day"));
      setEndDate(dayjs());
    } else if (value === "90d") {
      setStartDate(dayjs().subtract(90, "day"));
      setEndDate(dayjs());
    }
  };

  const handleStartDateChange = (newValue) => {
    setStartDate(newValue);
    setPage(0); // Reset to first page when filtering
    // When user manually changes date, switch to custom mode
    if (dateFilter !== "custom" && dateFilter !== "all") {
      setDateFilter("custom");
    }
  };

  const handleEndDateChange = (newValue) => {
    setEndDate(newValue);
    setPage(0); // Reset to first page when filtering
    // When user manually changes date, switch to custom mode
    if (dateFilter !== "custom" && dateFilter !== "all") {
      setDateFilter("custom");
    }
  };

  const clearAllFilters = () => {
    setActionFilter("all");
    setCountryFilter("all");
    setRuleFilter("all");
    setMethodFilter("all");
    setDateFilter("all");
    setStartDate(null);
    setEndDate(null);
    setSearchTerm("");
    setPage(0);
  };

  // Smart page boundary check - reset to valid page if current page is out of bounds
  React.useEffect(() => {
    if (filteredAndSortedLogs.length > 0) {
      const maxPage = Math.ceil(filteredAndSortedLogs.length / rowsPerPage) - 1;
      if (page > maxPage) {
        logger.debug("Page out of bounds, resetting", {
          currentPage: page,
          maxPage,
          resetTo: maxPage >= 0 ? maxPage : 0,
        });
        setPage(maxPage >= 0 ? maxPage : 0);
      }
    }
  }, [filteredAndSortedLogs.length, rowsPerPage, page]);

  const isLoading = isRefreshing || exportingCsv;

  // Selection state calculations
  const currentPageIds = paginatedLogs.map((log) => log._id);
  const selectedCurrentPageIds = selectedLogs.filter((id) =>
    currentPageIds.includes(id)
  );
  const isAllSelected =
    selectedCurrentPageIds.length === paginatedLogs.length &&
    paginatedLogs.length > 0;
  const isIndeterminate =
    selectedCurrentPageIds.length > 0 &&
    selectedCurrentPageIds.length < paginatedLogs.length;

  return (
    <>
      {/* Header with buttons - matching Rules page layout */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5">Recent Firewall Activity</Typography>
          {selectedLogs.length > 0 && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CheckBoxIcon />}
              size="small"
              sx={{
                color: "text.secondary",
                borderColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[600]
                    : theme.palette.grey[400],
                "&:hover": {
                  borderColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[500]
                      : theme.palette.grey[600],
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[800]
                      : theme.palette.grey[50],
                },
              }}
            >
              {selectedLogs.length} log{selectedLogs.length !== 1 ? "s" : ""}{" "}
              selected
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={
              isRefreshing ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RefreshIcon />
              )
            }
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await fetchLogs();
                setSelectedLogs([]); // Clear selections after refresh
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isLoading}
            aria-label="Refresh firewall logs"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          {/* Only show Actions button if logExport feature is enabled */}
          {isFeatureEnabled && isFeatureEnabled("logExport") && (
            <Button
              variant="contained"
              endIcon={<ArrowDropDownIcon />}
              onClick={handleClick}
              disabled={isLoading}
              aria-label="Open logs actions menu"
            >
              Actions
            </Button>
          )}
          <Button
            variant="contained"
            color="secondary"
            endIcon={<ArrowDropDownIcon />}
            onClick={handleFiltersClick}
            disabled={isLoading}
            aria-label="Open filters menu"
            sx={{
              position: "relative",
            }}
          >
            Filters
            {activeFiltersCount > 0 && (
              <Chip
                label={activeFiltersCount}
                size="small"
                color="primary"
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  minWidth: 20,
                  height: 20,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Button>
          {/* Only show Actions menu if logExport feature is enabled */}
          {isFeatureEnabled && isFeatureEnabled("logExport") && (
            <Menu
              id="logs-actions-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "logs-actions-button",
              }}
            >
              {/* CSV Export */}
              <MenuItem
                onClick={() => handleExportCsv("all")}
                disabled={exportingCsv || filteredAndSortedLogs.length === 0}
                aria-label="Export all currently displayed logs to a CSV file"
              >
                <ListItemIcon>
                  {exportingCsv ? (
                    <CircularProgress size={20} />
                  ) : (
                    <FileDownloadIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText>
                  {exportingCsv ? "Exporting CSV..." : "Export All Logs to CSV"}
                </ListItemText>
              </MenuItem>
              {selectedLogs.length > 0 && (
                <MenuItem
                  onClick={() => handleExportCsv("selected")}
                  disabled={exportingCsv}
                  aria-label="Export selected logs to a CSV file"
                >
                  <ListItemIcon>
                    {exportingCsv ? (
                      <CircularProgress size={20} />
                    ) : (
                      <FileDownloadIcon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText>
                    {exportingCsv
                      ? "Exporting CSV..."
                      : `Export Selected (${selectedLogs.length}) to CSV`}
                  </ListItemText>
                </MenuItem>
              )}
            </Menu>
          )}
          <Menu
            id="logs-filters-menu"
            anchorEl={filtersAnchorEl}
            open={filtersOpen}
            onClose={handleFiltersClose}
            MenuListProps={{
              "aria-labelledby": "logs-filters-button",
            }}
            PaperProps={{
              sx: { minWidth: 200 },
            }}
          >
            <MenuItem sx={{ padding: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select
                  value={actionFilter}
                  onChange={(e) => {
                    setTimeout(() => handleActionFilterChange(e), 100);
                  }}
                  label="Action"
                >
                  <MenuItem value="all">All Actions</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="allowed">Allowed</MenuItem>
                  <MenuItem value="rate_limited">Rate Limited</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem sx={{ padding: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Country</InputLabel>
                <Select
                  value={countryFilter}
                  onChange={(e) => {
                    setTimeout(() => handleCountryFilterChange(e), 100);
                  }}
                  label="Country"
                >
                  <MenuItem value="all">All Countries</MenuItem>
                  {uniqueCountries.map((country) => (
                    <MenuItem key={country} value={country}>
                      {country}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem sx={{ padding: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Rule</InputLabel>
                <Select
                  value={ruleFilter}
                  onChange={(e) => {
                    setTimeout(() => handleRuleFilterChange(e), 100);
                  }}
                  label="Rule"
                >
                  <MenuItem value="all">All Rules</MenuItem>
                  {uniqueRules.map((rule) => (
                    <MenuItem key={rule} value={rule}>
                      {rule}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem sx={{ padding: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Method</InputLabel>
                <Select
                  value={methodFilter}
                  onChange={(e) => {
                    setTimeout(() => handleMethodFilterChange(e), 100);
                  }}
                  label="Method"
                >
                  <MenuItem value="all">All Methods</MenuItem>
                  {uniqueMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
            <Divider />
            <MenuItem sx={{ padding: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  onChange={(e) => {
                    setTimeout(() => handleDateFilterChange(e), 100);
                  }}
                  label="Date Range"
                >
                  {datePresets.map((preset) => (
                    <MenuItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </MenuItem>
            {dateFilter === "custom" && (
              <>
                <MenuItem sx={{ padding: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="Start Date & Time"
                      value={startDate}
                      onChange={handleStartDateChange}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </MenuItem>
                <MenuItem sx={{ padding: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label="End Date & Time"
                      value={endDate}
                      onChange={handleEndDateChange}
                      slotProps={{
                        textField: {
                          size: "small",
                          fullWidth: true,
                        },
                      }}
                    />
                  </LocalizationProvider>
                </MenuItem>
              </>
            )}
            {(activeFiltersCount > 0 || dateFilter !== "all") && (
              <>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setActionFilter("all");
                    setCountryFilter("all");
                    setRuleFilter("all");
                    setMethodFilter("all");
                    setDateFilter("all");
                    setStartDate(null);
                    setEndDate(null);
                    handleFiltersClose();
                  }}
                >
                  <ListItemIcon>
                    <ClearIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Clear All Filters</ListItemText>
                </MenuItem>
              </>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              id="logs-search"
              name="logs-search"
              fullWidth
              size="small"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            {/* Empty space for future controls */}
          </Grid>
        </Grid>
        {(searchTerm ||
          actionFilter !== "all" ||
          countryFilter !== "all" ||
          ruleFilter !== "all" ||
          methodFilter !== "all" ||
          dateFilter !== "all") && (
          <Box
            sx={{
              mt: 1,
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Chip
              icon={<FilterListIcon />}
              label={`${filteredAndSortedLogs.length} of ${logs.length}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {dateFilter !== "all" && (
              <Chip
                label={`Date: ${
                  dateFilter === "24h"
                    ? "Last 24h"
                    : dateFilter === "7d"
                    ? "Last 7 days"
                    : dateFilter === "30d"
                    ? "Last 30 days"
                    : dateFilter === "90d"
                    ? "Last 90 days"
                    : dateFilter === "custom"
                    ? `Custom (${
                        startDate ? formatCustomDate(startDate) : "Start"
                      } - ${endDate ? formatCustomDate(endDate) : "End"})`
                    : "All time"
                }`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            {(searchTerm ||
              actionFilter !== "all" ||
              countryFilter !== "all" ||
              ruleFilter !== "all" ||
              methodFilter !== "all") && (
              <Typography variant="body2" color="text.secondary">
                {searchTerm && `"${searchTerm}"`}
                {actionFilter !== "all" &&
                  (searchTerm ? " • " : "") + `Action: ${actionFilter}`}
                {countryFilter !== "all" &&
                  (searchTerm || actionFilter !== "all" ? " • " : "") +
                    `Country: ${countryFilter}`}
                {ruleFilter !== "all" &&
                  (searchTerm ||
                  actionFilter !== "all" ||
                  countryFilter !== "all"
                    ? " • "
                    : "") + `Rule: ${ruleFilter}`}
                {methodFilter !== "all" &&
                  (searchTerm ||
                  actionFilter !== "all" ||
                  countryFilter !== "all" ||
                  ruleFilter !== "all"
                    ? " • "
                    : "") + `Method: ${methodFilter}`}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          // Theme-aware scrollbar styling
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
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
          "&::-webkit-scrollbar-corner": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {/* Checkbox column - Only show if bulk actions are enabled */}
              {isFeatureEnabled && isFeatureEnabled("bulkActions") && (
                <TableCell padding="checkbox">
                  <Checkbox
                    id="select-all-logs"
                    name="select-all-logs"
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              <TableCell>
                <TableSortLabel
                  active={sortBy === "timestamp"}
                  direction={sortBy === "timestamp" ? sortDirection : "asc"}
                  onClick={() => handleSort("timestamp")}
                >
                  Time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "ip"}
                  direction={sortBy === "ip" ? sortDirection : "asc"}
                  onClick={() => handleSort("ip")}
                >
                  IP
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "country"}
                  direction={sortBy === "country" ? sortDirection : "asc"}
                  onClick={() => handleSort("country")}
                >
                  Country
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "action"}
                  direction={sortBy === "action" ? sortDirection : "asc"}
                  onClick={() => handleSort("action")}
                >
                  Action
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "rule"}
                  direction={sortBy === "rule" ? sortDirection : "asc"}
                  onClick={() => handleSort("rule")}
                >
                  Rule
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "method"}
                  direction={sortBy === "method" ? sortDirection : "asc"}
                  onClick={() => handleSort("method")}
                >
                  Method
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "url"}
                  direction={sortBy === "url" ? sortDirection : "asc"}
                  onClick={() => handleSort("url")}
                >
                  URL
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "userAgent"}
                  direction={sortBy === "userAgent" ? sortDirection : "asc"}
                  onClick={() => handleSort("userAgent")}
                >
                  User Agent
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm
                      ? `No logs found matching "${searchTerm}"`
                      : "No Activity Logs"}
                  </Typography>
                  {!searchTerm && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Firewall activity will appear here once users interact
                      with your site
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log._id}>
                  {/* Checkbox column - Only show if bulk actions are enabled */}
                  {isFeatureEnabled && isFeatureEnabled("bulkActions") && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        id={`select-log-${log._id}`}
                        name={`select-log-${log._id}`}
                        checked={selectedLogs.includes(log._id)}
                        onChange={() => handleSelectLog(log._id)}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ maxWidth: 120 }}>
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          {formatDate(log.timestamp)}
                        </Typography>
                      }
                      placement="top"
                      arrow
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "help",
                        }}
                      >
                        {formatDate(log.timestamp)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" component="code">
                      {log.ip}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <FlagIcon fontSize="small" />
                      <Typography variant="body2">
                        {log.country || "Unknown"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{getActionChip(log.action)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{log.rule || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={log.method} color="default" size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Tooltip
                      title={<Typography variant="body2">{log.url}</Typography>}
                      placement="top"
                      arrow
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                          cursor: "help",
                          fontWeight: "bold",
                        }}
                      >
                        {log.url}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Full URL:</strong> {log.url || "N/A"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>User Agent:</strong>{" "}
                            {log.userAgent || "N/A"}
                          </Typography>
                        </Box>
                      }
                      placement="top"
                      arrow
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "block",
                          cursor: "help",
                        }}
                      >
                        {log.userAgent
                          ? log.userAgent.substring(0, 50) + "..."
                          : "-"}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredAndSortedLogs.length > 0 && (
        <TablePagination
          component="div"
          count={filteredAndSortedLogs.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Logs per page:"
          showFirstButton
          showLastButton
          SelectProps={{
            inputProps: {
              "aria-label": "rows per page",
              id: "logs-rows-per-page",
              name: "logs-rows-per-page",
            },
          }}
        />
      )}
    </>
  );
};

export default FirewallAdminLogs;
