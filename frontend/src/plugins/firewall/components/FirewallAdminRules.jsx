import React from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  Tooltip,
  TextField,
  InputAdornment,
  TablePagination,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  Grid,
  ButtonGroup,
} from "@mui/material";
import {
  Help as HelpIcon,
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as TrashIcon,
  AutoFixHigh as AutoFixHighIcon,
  CloudDownload as CloudDownloadIcon,
  ArrowDropDown as ArrowDropDownIcon,
  DeleteSweep as DeleteSweepIcon,
  Search as SearchIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  DateRange as DateRangeIcon,
  CalendarToday as CalendarTodayIcon,
} from "@mui/icons-material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import RuleSparkline from "./RuleSparkline";
import FirewallLocalStorage from "../../../utils/localStorage";

const FirewallAdminRules = ({
  rules,
  getRuleTypeChip,
  formatDate,
  handleEditRule,
  handleAddNewRule,
  handleDeleteRule,
  deleteRuleWithoutRefresh,
  fetchRules,
  fetchStats,
  setShowRuleModal,
  setShowReferenceModal,
  handleAddCommonRules,
  addingCommonRules,
  handleImportThreatFeeds,
  importingThreats,
}) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [filtersAnchorEl, setFiltersAnchorEl] = React.useState(null);
  const [selectedRules, setSelectedRules] = React.useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = React.useState(false);
  const [singleDeleteDialogOpen, setSingleDeleteDialogOpen] =
    React.useState(false);
  const [ruleToDelete, setRuleToDelete] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = React.useState(false);
  const [exportingCsv, setExportingCsv] = React.useState(false);
  const [importingCsv, setImportingCsv] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const open = Boolean(anchorEl);
  const filtersOpen = Boolean(filtersAnchorEl);

  // Notification modal state
  const [notificationModal, setNotificationModal] = React.useState({
    open: false,
    title: "",
    message: "",
    severity: "info", // "info", "warning", "error", "success"
  });

  // Helper function to show notifications
  const showNotification = (title, message, severity = "info") => {
    setNotificationModal({
      open: true,
      title,
      message,
      severity,
    });
  };

  const closeNotification = () => {
    setNotificationModal({
      open: false,
      title: "",
      message: "",
      severity: "info",
    });
  };

  // Initialize state from localStorage
  const [searchTerm, setSearchTerm] = React.useState(() =>
    FirewallLocalStorage.getSearchTerm("rules")
  );
  const [page, setPage] = React.useState(() =>
    FirewallLocalStorage.getPreference("rulesCurrentPage", 0)
  );
  const [rowsPerPage, setRowsPerPage] = React.useState(
    () => FirewallLocalStorage.getTableSettings("rules").pageSize
  );

  // Sorting state
  const [sortBy, setSortBy] = React.useState(() =>
    FirewallLocalStorage.getPreference("rulesSortBy", "createdAt")
  );
  const [sortDirection, setSortDirection] = React.useState(() =>
    FirewallLocalStorage.getPreference("rulesSortDirection", "desc")
  );

  // Filter state
  const [typeFilter, setTypeFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("rulesTypeFilter", "all")
  );
  const [actionFilter, setActionFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("rulesActionFilter", "all")
  );
  const [statusFilter, setStatusFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("rulesStatusFilter", "all")
  );

  // Date filter state
  const [dateFilter, setDateFilter] = React.useState(() =>
    FirewallLocalStorage.getPreference("rulesDateFilter", "all")
  );
  const [startDate, setStartDate] = React.useState(() => {
    const saved = FirewallLocalStorage.getPreference("rulesStartDate", null);
    return saved ? dayjs(saved) : null;
  });
  const [endDate, setEndDate] = React.useState(() => {
    const saved = FirewallLocalStorage.getPreference("rulesEndDate", null);
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

  // Sparkline settings from localStorage
  const [sparklineSettings, setSparklineSettings] = React.useState(() =>
    FirewallLocalStorage.getSparklineSettings()
  );

  // Save search term to localStorage when it changes
  React.useEffect(() => {
    FirewallLocalStorage.setSearchTerm("rules", searchTerm);
  }, [searchTerm]);

  // Save table settings to localStorage when they change
  React.useEffect(() => {
    FirewallLocalStorage.setTableSettings("rules", { pageSize: rowsPerPage });
  }, [rowsPerPage]);

  // Save current page to localStorage when it changes
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("rulesCurrentPage", page);
  }, [page]);

  // Save sort preferences to localStorage
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("rulesSortBy", sortBy);
    FirewallLocalStorage.setPreference("rulesSortDirection", sortDirection);
  }, [sortBy, sortDirection]);

  // Save filter preferences to localStorage
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("rulesTypeFilter", typeFilter);
  }, [typeFilter]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference("rulesActionFilter", actionFilter);
  }, [actionFilter]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference("rulesStatusFilter", statusFilter);
  }, [statusFilter]);

  // Save date filter preferences to localStorage
  React.useEffect(() => {
    FirewallLocalStorage.setPreference("rulesDateFilter", dateFilter);
  }, [dateFilter]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference(
      "rulesStartDate",
      startDate ? startDate.toISOString() : null
    );
  }, [startDate]);

  React.useEffect(() => {
    FirewallLocalStorage.setPreference(
      "rulesEndDate",
      endDate ? endDate.toISOString() : null
    );
  }, [endDate]);

  console.log(
    "[FirewallAdminRules] Component rendered. handleAddCommonRules prop type:",
    typeof handleAddCommonRules
  );

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
    if (typeFilter !== "all") count++;
    if (actionFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    return count;
  }, [typeFilter, actionFilter, statusFilter]);

  // Single rule delete (with confirmation)
  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
    setSingleDeleteDialogOpen(true);
  };

  const confirmSingleDelete = async () => {
    if (ruleToDelete) {
      setIsProcessing(true);
      try {
        console.log(`[SingleDelete] Deleting rule: ${ruleToDelete._id}`);
        await deleteRuleWithoutRefresh(ruleToDelete._id);
        console.log(`[SingleDelete] Rule deleted, refreshing rules list...`);
        await fetchRules();
        // Refresh dashboard stats to show updated counts
        await fetchStats();
        console.log(`[SingleDelete] Rules list and stats refreshed`);
      } catch (error) {
        console.error(`[SingleDelete] Failed to delete rule:`, error);
      } finally {
        setIsProcessing(false);
      }
    }
    setSingleDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  // Bulk operations
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      // Select all rules on current page
      const currentPageIds = paginatedRules.map((rule) => rule._id);
      setSelectedRules((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      // Deselect all rules on current page
      const currentPageIds = paginatedRules.map((rule) => rule._id);
      setSelectedRules((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const handleSelectRule = (ruleId) => {
    setSelectedRules((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleteDialogOpen(false);
    setIsProcessing(true);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process deletions sequentially to avoid rate limiting
    for (let i = 0; i < selectedRules.length; i++) {
      const ruleId = selectedRules[i];
      console.log(`Deleting rule ${i + 1}/${selectedRules.length}: ${ruleId}`);

      try {
        await deleteRuleWithoutRefresh(ruleId);
        successCount++;
        // Small delay between requests to be gentle on the server
        if (i < selectedRules.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
        }
      } catch (error) {
        console.error(`Failed to delete rule ${ruleId}:`, error);
        errorCount++;
        errors.push(error.message || "Unknown error");
        // Continue with other deletions even if one fails
      }
    }

    // Refresh the rules list once at the end
    console.log(
      `[BulkDelete] Refreshing rules list after deleting ${successCount} rules...`
    );
    await fetchRules();
    // Refresh dashboard stats to show updated counts
    await fetchStats();
    console.log(`[BulkDelete] Rules list and stats refreshed`);

    // Show summary alert
    if (successCount > 0 && errorCount === 0) {
      // All deletions successful
      console.log(`[BulkDelete] SUCCESS: Deleted ${successCount} rules`);
    } else if (successCount > 0 && errorCount > 0) {
      // Some deletions failed
      console.log(
        `[BulkDelete] PARTIAL: Deleted ${successCount} rules successfully, ${errorCount} failed. Errors: ${errors.join(
          ", "
        )}`
      );
    } else {
      // All deletions failed
      console.log(
        `[BulkDelete] FAILED: All deletions failed. Errors: ${errors.join(
          ", "
        )}`
      );
    }

    setSelectedRules([]);
    setIsProcessing(false);
  };

  // Handle sorting
  const handleSort = (column) => {
    const isAsc = sortBy === column && sortDirection === "asc";
    const newDirection = isAsc ? "desc" : "asc";
    console.log(
      `[Rules Sort] Clicked column: ${column}, current: ${sortBy}/${sortDirection}, new: ${column}/${newDirection}`
    );
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

    // Debug first few comparisons
    if (Math.random() < 0.1) {
      // Only log 10% of comparisons to avoid spam
      console.log(`[Rules Sort] Comparing ${orderBy}: "${aVal}" vs "${bVal}"`);
    }

    // Handle different data types
    switch (orderBy) {
      case "name":
      case "type":
      case "value":
      case "action":
        aVal = (aVal || "").toString().toLowerCase();
        bVal = (bVal || "").toString().toLowerCase();
        break;
      case "priority":
        aVal = parseInt(aVal) || 0;
        bVal = parseInt(bVal) || 0;
        break;
      case "enabled":
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
        break;
      case "createdAt":
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

  // Filter and sort rules
  const filteredAndSortedRules = React.useMemo(() => {
    let filtered = rules;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (rule) =>
          rule.name.toLowerCase().includes(searchLower) ||
          rule.type.toLowerCase().includes(searchLower) ||
          rule.value.toLowerCase().includes(searchLower) ||
          rule.action.toLowerCase().includes(searchLower) ||
          (rule.description &&
            rule.description.toLowerCase().includes(searchLower))
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((rule) => rule.type === typeFilter);
    }

    // Apply action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((rule) => rule.action === actionFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      const isEnabled = statusFilter === "enabled";
      filtered = filtered.filter((rule) => rule.enabled === isEnabled);
    }

    // Apply date filter (filter by createdAt field)
    if (dateFilter !== "all" && (startDate || endDate)) {
      filtered = filtered.filter((rule) => {
        const ruleDate = dayjs(rule.createdAt);
        const start = startDate ? startDate.startOf("day") : null;
        const end = endDate ? endDate.endOf("day") : null;

        return (
          (!start ||
            ruleDate.isAfter(start) ||
            ruleDate.isSame(start, "day")) &&
          (!end || ruleDate.isBefore(end) || ruleDate.isSame(end, "day"))
        );
      });
    }

    // Apply sorting - create new array to ensure React detects the change
    const sorted = [...filtered].sort(getComparator(sortDirection, sortBy));
    console.log(
      `[Rules Sort] Applied sort by ${sortBy} ${sortDirection}, first item:`,
      sorted[0]?.name,
      sorted[0]?.[sortBy]
    );
    return sorted;
  }, [
    rules,
    searchTerm,
    typeFilter,
    actionFilter,
    statusFilter,
    sortBy,
    sortDirection,
    dateFilter,
    startDate,
    endDate,
  ]);

  // Paginate filtered and sorted rules
  const paginatedRules = React.useMemo(() => {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const result = filteredAndSortedRules.slice(startIndex, endIndex);

    // Debug logging for pagination verification
    console.log(
      `[Rules Pagination] Total rules: ${rules.length}, Filtered: ${
        filteredAndSortedRules.length
      }, Page: ${page + 1}, Showing: ${result.length} (${
        startIndex + 1
      }-${Math.min(endIndex, filteredAndSortedRules.length)})`
    );

    return result;
  }, [filteredAndSortedRules, page, rowsPerPage, rules.length]);

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
  };

  // Handle filters
  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleActionFilterChange = (event) => {
    setActionFilter(event.target.value);
    setPage(0); // Reset to first page when filtering
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
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
    setTypeFilter("all");
    setActionFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
    setStartDate(null);
    setEndDate(null);
    setSearchTerm("");
    setPage(0);
  };

  // Smart page boundary check - reset to valid page if current page is out of bounds
  React.useEffect(() => {
    if (filteredAndSortedRules.length > 0) {
      const maxPage =
        Math.ceil(filteredAndSortedRules.length / rowsPerPage) - 1;
      if (page > maxPage) {
        console.log(
          `[Rules] Page ${page} is out of bounds, resetting to ${maxPage}`
        );
        setPage(maxPage >= 0 ? maxPage : 0);
      }
    }
  }, [filteredAndSortedRules.length, rowsPerPage, page]);

  const isAllSelected =
    selectedRules.length === paginatedRules.length && paginatedRules.length > 0;
  const isIndeterminate =
    selectedRules.length > 0 && selectedRules.length < paginatedRules.length;

  const isLoading =
    isRefreshing ||
    isProcessing ||
    addingCommonRules ||
    importingThreats ||
    exportingCsv ||
    importingCsv;

  // Delete all rules functionality
  const handleDeleteAllRules = () => {
    setDeleteAllDialogOpen(true);
  };

  const confirmDeleteAllRules = async () => {
    setDeleteAllDialogOpen(false);
    setIsProcessing(true);

    const totalRules = filteredAndSortedRules.length;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    console.log(`[DeleteAll] Starting deletion of all ${totalRules} rules...`);

    // Process deletions sequentially to avoid rate limiting
    for (let i = 0; i < filteredAndSortedRules.length; i++) {
      const rule = filteredAndSortedRules[i];
      console.log(
        `Deleting rule ${i + 1}/${totalRules}: ${rule._id} (${rule.name})`
      );

      try {
        await deleteRuleWithoutRefresh(rule._id);
        successCount++;
        // Small delay between requests to be gentle on the server
        if (i < filteredAndSortedRules.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
        }
      } catch (error) {
        console.error(`Failed to delete rule ${rule._id}:`, error);
        errorCount++;
        errors.push(`${rule.name}: ${error.message || "Unknown error"}`);
        // Continue with other deletions even if one fails
      }
    }

    // Refresh the rules list once at the end
    console.log(
      `[DeleteAll] Refreshing rules list after deleting ${successCount}/${totalRules} rules...`
    );
    await fetchRules();
    // Refresh dashboard stats to show updated counts
    await fetchStats();
    console.log(`[DeleteAll] Rules list and stats refreshed`);

    // Show summary alert
    if (successCount > 0 && errorCount === 0) {
      // All deletions successful
      console.log(`[DeleteAll] SUCCESS: Deleted all ${successCount} rules`);
    } else if (successCount > 0 && errorCount > 0) {
      // Some deletions failed
      console.log(
        `[DeleteAll] PARTIAL: Deleted ${successCount}/${totalRules} rules successfully, ${errorCount} failed. Errors: ${errors
          .slice(0, 3)
          .join(", ")}${errors.length > 3 ? "..." : ""}`
      );
    } else {
      // All deletions failed
      console.log(
        `[DeleteAll] FAILED: All deletions failed. Errors: ${errors
          .slice(0, 3)
          .join(", ")}${errors.length > 3 ? "..." : ""}`
      );
    }

    setSelectedRules([]);
    setIsProcessing(false);
  };

  // CSV Export functionality
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      // CSV headers
      const headers = [
        "name",
        "type",
        "value",
        "action",
        "priority",
        "enabled",
        "description",
      ];

      // Convert rules to CSV rows
      const csvRows = [
        headers.join(","), // Header row
        ...filteredAndSortedRules.map((rule) =>
          [
            `"${(rule.name || "").replace(/"/g, '""')}"`,
            `"${rule.type || ""}"`,
            `"${(rule.value || "").replace(/"/g, '""')}"`,
            `"${rule.action || ""}"`,
            rule.priority || 0,
            rule.enabled ? "true" : "false",
            `"${(rule.description || "").replace(/"/g, '""')}"`,
          ].join(",")
        ),
      ];

      // Create CSV content
      const csvContent = csvRows.join("\n");

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      // Generate filename with timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19);
      const filename = `firewall-rules-${timestamp}.csv`;
      link.setAttribute("download", filename);

      // Trigger download
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(
        `[CSV Export] Successfully exported ${filteredAndSortedRules.length} rules to ${filename}`
      );
    } catch (error) {
      console.error("[CSV Export] Failed to export rules:", error);
    } finally {
      setExportingCsv(false);
    }
  };

  // CSV Import functionality
  const handleImportCsv = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input
    event.target.value = "";

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showNotification("Invalid File", "Please select a CSV file", "error");
      return;
    }

    setImportingCsv(true);
    try {
      const csvText = await file.text();
      const lines = csvText.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        showNotification(
          "Invalid CSV",
          "CSV file must contain at least a header row and one data row",
          "error"
        );
        return;
      }

      // Parse CSV (simple implementation)
      const headers = lines[0]
        .split(",")
        .map((h) => h.replace(/"/g, "").trim().toLowerCase());
      const dataRows = lines.slice(1);

      // Validate headers
      const requiredHeaders = ["name", "type", "value", "action"];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h)
      );
      if (missingHeaders.length > 0) {
        showNotification(
          "Missing CSV Columns",
          `CSV file is missing required columns: ${missingHeaders.join(", ")}`,
          "error"
        );
        return;
      }

      // Parse and validate rules
      const newRules = [];
      const errors = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const values = row.split(",").map((v) => v.replace(/"/g, "").trim());

        if (values.length !== headers.length) {
          errors.push(`Row ${i + 2}: Column count mismatch`);
          continue;
        }

        const rule = {};
        headers.forEach((header, index) => {
          rule[header] = values[index];
        });

        // Validate required fields
        if (!rule.name || !rule.type || !rule.value || !rule.action) {
          errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        // Convert data types
        rule.priority = parseInt(rule.priority) || 0;
        rule.enabled = rule.enabled === "true";

        // Validate action
        if (!["allow", "block"].includes(rule.action.toLowerCase())) {
          errors.push(
            `Row ${i + 2}: Invalid action "${
              rule.action
            }". Must be "allow" or "block"`
          );
          continue;
        }

        // Validate type
        const validTypes = [
          "ip",
          "country",
          "user-agent",
          "path",
          "rate-limit",
        ];
        if (!validTypes.includes(rule.type.toLowerCase())) {
          errors.push(
            `Row ${i + 2}: Invalid type "${
              rule.type
            }". Must be one of: ${validTypes.join(", ")}`
          );
          continue;
        }

        newRules.push({
          name: rule.name,
          type: rule.type.toLowerCase(),
          value: rule.value,
          action: rule.action.toLowerCase(),
          priority: rule.priority,
          enabled: rule.enabled,
          description: rule.description || "",
        });
      }

      if (errors.length > 0) {
        showNotification(
          "CSV Import Failed",
          `CSV import failed with errors:\n\n${errors.slice(0, 10).join("\n")}${
            errors.length > 10 ? "\n... and more" : ""
          }`,
          "error"
        );
        return;
      }

      if (newRules.length === 0) {
        showNotification(
          "No Rules Found",
          "No valid rules found in CSV file",
          "warning"
        );
        return;
      }

      // Import rules via API
      console.log(`[CSV Import] Importing ${newRules.length} rules...`);

      let successCount = 0;
      let failureCount = 0;
      const importErrors = [];

      for (let i = 0; i < newRules.length; i++) {
        const rule = newRules[i];
        try {
          const response = await fetch("/api/firewall/rules", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(rule),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            failureCount++;
            importErrors.push(
              `${rule.name}: ${errorData.message || "Unknown error"}`
            );
          }
        } catch (error) {
          failureCount++;
          importErrors.push(`${rule.name}: ${error.message}`);
        }

        // Small delay between requests
        if (i < newRules.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Refresh rules list
      await fetchRules();
      // Refresh dashboard stats to show updated counts
      await fetchStats();

      // Show results
      if (successCount > 0 && failureCount === 0) {
        console.log(`[CSV Import] SUCCESS: Imported ${successCount} rules`);
        showNotification(
          "Import Successful",
          `Successfully imported ${successCount} rules from CSV file`,
          "success"
        );
      } else if (successCount > 0 && failureCount > 0) {
        console.log(
          `[CSV Import] PARTIAL: Imported ${successCount} rules, ${failureCount} failed`
        );
        showNotification(
          "Partial Import Success",
          `Imported ${successCount} rules successfully, ${failureCount} failed.\n\nErrors:\n${importErrors
            .slice(0, 5)
            .join("\n")}${importErrors.length > 5 ? "\n... and more" : ""}`,
          "warning"
        );
      } else {
        console.log(`[CSV Import] FAILED: All imports failed`);
        showNotification(
          "Import Failed",
          `Failed to import rules.\n\nErrors:\n${importErrors
            .slice(0, 5)
            .join("\n")}${importErrors.length > 5 ? "\n... and more" : ""}`,
          "error"
        );
      }
    } catch (error) {
      console.error("[CSV Import] Failed to process CSV file:", error);
      showNotification(
        "CSV Processing Failed",
        "Failed to process CSV file. Please check the file format and try again.",
        "error"
      );
    } finally {
      setImportingCsv(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="h5">Firewall Rules</Typography>
          {selectedRules.length > 0 && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={handleBulkDelete}
                size="small"
                disabled={isLoading}
                aria-label={`Delete ${selectedRules.length} selected firewall rules`}
              >
                Delete {selectedRules.length} Selected
              </Button>
              {isAllSelected && (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleDeleteAllRules}
                  size="small"
                  disabled={isLoading}
                  aria-label={`Delete all ${filteredAndSortedRules.length} filtered rules`}
                  sx={{
                    backgroundColor: "error.dark",
                    "&:hover": {
                      backgroundColor: "error.main",
                    },
                  }}
                >
                  Delete All {filteredAndSortedRules.length}{" "}
                  {searchTerm ? "Filtered" : ""} Rules
                </Button>
              )}
            </>
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
                await fetchRules();
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isLoading}
            aria-label="Refresh firewall rules"
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button
            variant="contained"
            startIcon={
              isLoading ? <CircularProgress size={16} color="inherit" /> : null
            }
            endIcon={<ArrowDropDownIcon />}
            onClick={handleClick}
            disabled={isLoading}
            aria-label="Open firewall actions menu"
          >
            {isLoading ? "Processing..." : "Actions"}
          </Button>
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
          <Menu
            id="firewall-actions-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              "aria-labelledby": "firewall-actions-button",
            }}
          >
            <MenuItem
              onClick={() => {
                handleClose();
                handleAddNewRule();
              }}
              aria-label="Add a new firewall rule"
            >
              <ListItemIcon>
                <PlusIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Add Rule</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleClose();
                handleAddCommonRules();
              }}
              disabled={addingCommonRules}
              aria-label="Add a set of common firewall rules for quick setup"
            >
              <ListItemIcon>
                {addingCommonRules ? (
                  <CircularProgress size={20} />
                ) : (
                  <AutoFixHighIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {addingCommonRules
                  ? "Adding Common Rules..."
                  : "Add Common Rules"}
              </ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleClose();
                handleImportThreatFeeds();
              }}
              disabled={importingThreats}
              aria-label="Import threat intelligence feeds from documented sources"
            >
              <ListItemIcon>
                {importingThreats ? (
                  <CircularProgress size={20} />
                ) : (
                  <Tooltip
                    title="Imports threat intelligence from Spamhaus DROP and Emerging Threats feeds (as documented in README.md). Free unlimited feeds - no API keys required."
                    placement="left"
                  >
                    <CloudDownloadIcon fontSize="small" />
                  </Tooltip>
                )}
              </ListItemIcon>
              <ListItemText>
                {importingThreats
                  ? "Importing Threat Feeds..."
                  : "Import Threat Feeds"}
              </ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                handleClose();
                setShowReferenceModal(true);
              }}
            >
              <ListItemIcon>
                <HelpIcon />
              </ListItemIcon>
              <ListItemText>Reference Guide</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => handleClose(handleExportCsv)}
              disabled={exportingCsv || filteredAndSortedRules.length === 0}
              aria-label="Export all currently displayed rules to a CSV file"
            >
              <ListItemIcon>
                {exportingCsv ? (
                  <CircularProgress size={20} />
                ) : (
                  <FileDownloadIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {exportingCsv ? "Exporting CSV..." : "Export Rules to CSV"}
              </ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => handleClose(handleImportCsv)}
              disabled={importingCsv}
              aria-label="Import firewall rules from a CSV file"
            >
              <ListItemIcon>
                {importingCsv ? (
                  <CircularProgress size={20} />
                ) : (
                  <FileUploadIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText>
                {importingCsv ? "Importing CSV..." : "Import Rules from CSV"}
              </ListItemText>
            </MenuItem>
          </Menu>
          <Menu
            id="rules-filters-menu"
            anchorEl={filtersAnchorEl}
            open={filtersOpen}
            onClose={handleFiltersClose}
            MenuListProps={{
              "aria-labelledby": "rules-filters-button",
            }}
            PaperProps={{
              sx: { minWidth: 200 },
            }}
          >
            <MenuItem sx={{ padding: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  onChange={(e) => {
                    setTimeout(() => handleTypeFilterChange(e), 100);
                  }}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="ip_block">IP Block</MenuItem>
                  <MenuItem value="country_block">Country Block</MenuItem>
                  <MenuItem value="suspicious_pattern">Pattern Block</MenuItem>
                  <MenuItem value="rate_limit">Rate Limit</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
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
                  <MenuItem value="block">Block</MenuItem>
                  <MenuItem value="allow">Allow</MenuItem>
                  <MenuItem value="rate_limit">Rate Limit</MenuItem>
                </Select>
              </FormControl>
            </MenuItem>
            <MenuItem sx={{ padding: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setTimeout(() => handleStatusFilterChange(e), 100);
                  }}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="enabled">Enabled</MenuItem>
                  <MenuItem value="disabled">Disabled</MenuItem>
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
                    setTypeFilter("all");
                    setActionFilter("all");
                    setStatusFilter("all");
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
          {/* Hidden file input for CSV import */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileUpload}
            id="csv-import-input"
            name="csv-import-input"
            aria-label="CSV file import dialog"
          />
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Field */}
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              id="rules-search"
              name="rules-search"
              fullWidth
              size="small"
              placeholder="Search rules..."
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
          typeFilter !== "all" ||
          actionFilter !== "all" ||
          statusFilter !== "all" ||
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
              label={`${filteredAndSortedRules.length} of ${rules.length}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            {dateFilter !== "all" && (
              <Chip
                label={`Created: ${
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
              typeFilter !== "all" ||
              actionFilter !== "all" ||
              statusFilter !== "all") && (
              <Typography variant="body2" color="text.secondary">
                {searchTerm && `"${searchTerm}"`}
                {typeFilter !== "all" &&
                  (searchTerm ? " • " : "") +
                    `Type: ${typeFilter.replace("_", " ")}`}
                {actionFilter !== "all" &&
                  (searchTerm || typeFilter !== "all" ? " • " : "") +
                    `Action: ${actionFilter}`}
                {statusFilter !== "all" &&
                  (searchTerm || typeFilter !== "all" || actionFilter !== "all"
                    ? " • "
                    : "") + `Status: ${statusFilter}`}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  id="select-all-rules"
                  name="select-all-rules"
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "name"}
                  direction={sortBy === "name" ? sortDirection : "asc"}
                  onClick={() => handleSort("name")}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "type"}
                  direction={sortBy === "type" ? sortDirection : "asc"}
                  onClick={() => handleSort("type")}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "value"}
                  direction={sortBy === "value" ? sortDirection : "asc"}
                  onClick={() => handleSort("value")}
                >
                  Value
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
                  active={sortBy === "priority"}
                  direction={sortBy === "priority" ? sortDirection : "asc"}
                  onClick={() => handleSort("priority")}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "enabled"}
                  direction={sortBy === "enabled" ? sortDirection : "asc"}
                  onClick={() => handleSort("enabled")}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              {sparklineSettings.enabled && (
                <TableCell align="center">Activity Trend</TableCell>
              )}
              <TableCell>
                <TableSortLabel
                  active={sortBy === "createdAt"}
                  direction={sortBy === "createdAt" ? sortDirection : "asc"}
                  onClick={() => handleSort("createdAt")}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={sparklineSettings.enabled ? 10 : 9}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body1" color="text.secondary">
                    {searchTerm
                      ? `No rules found matching "${searchTerm}"`
                      : "No Rules Added"}
                  </Typography>
                  {!searchTerm && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Click "Actions" to add your first firewall rule
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRules.map((rule) => (
                <TableRow key={rule._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      id={`select-rule-${rule._id}`}
                      name={`select-rule-${rule._id}`}
                      checked={selectedRules.includes(rule._id)}
                      onChange={() => handleSelectRule(rule._id)}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Tooltip
                      title={
                        <Typography variant="body2">{rule.name}</Typography>
                      }
                      placement="top"
                      arrow
                    >
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          cursor: "help",
                        }}
                      >
                        {rule.name}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{getRuleTypeChip(rule.type)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" component="code">
                      {rule.value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.action}
                      color={rule.action === "block" ? "error" : "success"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{rule.priority}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.enabled ? "Enabled" : "Disabled"}
                      color={rule.enabled ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  {sparklineSettings.enabled && (
                    <TableCell align="center">
                      <RuleSparkline
                        ruleId={rule._id}
                        ruleName={rule.name}
                        timeRange={sparklineSettings.timeRange}
                        width={80}
                        height={25}
                        showTrend={true}
                        showTooltip={true}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ maxWidth: 120 }}>
                    <Tooltip
                      title={
                        <Typography variant="body2">
                          {formatDate(rule.createdAt)}
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
                        {formatDate(rule.createdAt)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditRule(rule)}
                      aria-label={`Edit rule ${rule.name}`}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(rule)}
                      aria-label={`Delete rule ${rule.name}`}
                    >
                      <TrashIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {filteredAndSortedRules.length > 0 && (
        <TablePagination
          component="div"
          count={filteredAndSortedRules.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Rules per page:"
          showFirstButton
          showLastButton
          SelectProps={{
            inputProps: {
              "aria-label": "rows per page",
              id: "rules-rows-per-page",
              name: "rules-rows-per-page",
            },
          }}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        aria-labelledby="bulk-delete-dialog-title"
        aria-describedby="bulk-delete-dialog-description"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmBulkDelete();
          }
        }}
      >
        <DialogTitle id="bulk-delete-dialog-title">
          Delete Multiple Rules
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="bulk-delete-dialog-description">
            Are you sure you want to delete {selectedRules.length} selected
            rules? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setBulkDeleteDialogOpen(false)}
            color="primary"
            aria-label="Cancel bulk rule deletion"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmBulkDelete}
            color="error"
            variant="contained"
            autoFocus
            aria-label="Confirm deletion of selected rules"
          >
            Delete {selectedRules.length} Rules
          </Button>
        </DialogActions>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog
        open={singleDeleteDialogOpen}
        onClose={() => setSingleDeleteDialogOpen(false)}
        aria-labelledby="single-delete-dialog-title"
        aria-describedby="single-delete-dialog-description"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmSingleDelete();
          }
        }}
      >
        <DialogTitle id="single-delete-dialog-title">Delete Rule</DialogTitle>
        <DialogContent>
          <DialogContentText id="single-delete-dialog-description">
            Are you sure you want to delete the rule "{ruleToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSingleDeleteDialogOpen(false)}
            color="primary"
            aria-label="Cancel rule deletion"
          >
            Cancel
          </Button>
          <Button
            onClick={confirmSingleDelete}
            color="error"
            variant="contained"
            autoFocus
            aria-label={`Confirm deletion of rule ${ruleToDelete?.name}`}
          >
            Delete Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete All Rules Confirmation Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
        aria-labelledby="delete-all-rules-dialog-title"
        aria-describedby="delete-all-rules-dialog-description"
        maxWidth="sm"
        fullWidth
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmDeleteAllRules();
          }
        }}
      >
        <DialogTitle
          id="delete-all-rules-dialog-title"
          sx={{
            backgroundColor: "error.main",
            color: "error.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <DeleteSweepIcon />
          ⚠️ Delete All {filteredAndSortedRules.length} Rules
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <DialogContentText
            id="delete-all-rules-dialog-description"
            component="div"
            sx={{
              mt: 2,
            }}
          >
            <Typography
              variant="body1"
              gutterBottom
              sx={{ fontWeight: "bold", color: "error.main" }}
            >
              This will permanently delete ALL {filteredAndSortedRules.length}{" "}
              {searchTerm ? "filtered" : "firewall"} rules!
            </Typography>
            <Typography variant="body2" paragraph>
              This action cannot be undone.{" "}
              {searchTerm
                ? `All rules matching "${searchTerm}" will be removed:`
                : "All of the following will be removed:"}
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" variant="body2">
                Manual IP blocks and rules
              </Typography>
              <Typography component="li" variant="body2">
                Imported threat intelligence rules
              </Typography>
              <Typography component="li" variant="body2">
                Common security rules
              </Typography>
              <Typography component="li" variant="body2">
                Rate limiting rules
              </Typography>
              <Typography component="li" variant="body2">
                Country and pattern blocking rules
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 2, fontWeight: "bold" }}>
              Your firewall will have NO protection after this operation!
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.grey[800]
                    : theme.palette.info.light,
                color: (theme) =>
                  theme.palette.mode === "dark"
                    ? theme.palette.info.light
                    : theme.palette.info.dark,
                borderRadius: 1,
                border: (theme) =>
                  `1px solid ${
                    theme.palette.mode === "dark"
                      ? theme.palette.grey[700]
                      : theme.palette.info.main
                  }`,
              }}
            >
              <strong>After deletion:</strong> You can quickly restore
              protection using "Actions" → "Add Common Rules" or "Import Threat
              Feeds"
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            p: 3,
            backgroundColor: (theme) =>
              theme.palette.mode === "dark"
                ? theme.palette.background.paper
                : theme.palette.grey[50],
          }}
        >
          <Button
            onClick={() => setDeleteAllDialogOpen(false)}
            variant="outlined"
            color="primary"
            size="large"
            aria-label="Cancel deleting all rules"
          >
            Cancel - Keep Rules
          </Button>
          <Button
            onClick={confirmDeleteAllRules}
            variant="contained"
            color="error"
            size="large"
            startIcon={<DeleteSweepIcon />}
            autoFocus
            aria-label="Confirm deleting all rules"
            sx={{
              backgroundColor: "error.dark",
              "&:hover": {
                backgroundColor: "error.main",
              },
            }}
          >
            Yes, Delete All {filteredAndSortedRules.length} Rules
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Modal */}
      <Dialog
        open={notificationModal.open}
        onClose={closeNotification}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {notificationModal.severity === "error" && (
              <TrashIcon color="error" />
            )}
            {notificationModal.severity === "warning" && (
              <AutoFixHighIcon color="warning" />
            )}
            {notificationModal.severity === "success" && (
              <PlusIcon color="success" />
            )}
            {notificationModal.severity === "info" && <HelpIcon color="info" />}
            <Typography variant="h6">{notificationModal.title}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ whiteSpace: "pre-line" }}>
            {notificationModal.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeNotification}
            variant="contained"
            color="primary"
            autoFocus
            aria-label="Close notification"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FirewallAdminRules;
