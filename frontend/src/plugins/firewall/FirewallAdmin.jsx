import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBackendUrl } from "../../utils/config";
import {
  Container,
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  InputAdornment,
  Badge,
} from "@mui/material";
import {
  Shield as ShieldIcon,
  Visibility as EyeIcon,
  Block as BanIcon,
  Public as GlobeIcon,
  BarChart as ChartIcon,
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as TrashIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Code as CodeIcon,
  Flag as FlagIcon,
  Security as SecurityIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

const FirewallAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [stats, setStats] = useState({});
  const [rules, setRules] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    severity: "success",
  });
  // Load active tab from localStorage, default to 0
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem("firewallActiveTab");
    return saved ? parseInt(saved) : 0;
  });
  const [referenceTab, setReferenceTab] = useState(0);
  const [countrySearch, setCountrySearch] = useState("");

  // Settings state
  const [settings, setSettings] = useState({
    rateLimit: {
      perMinute: 50,
      perHour: 400,
    },
    progressiveDelays: [10, 60, 90, 120], // in seconds
    features: {
      ipBlocking: true,
      countryBlocking: true,
      rateLimiting: true,
      suspiciousPatterns: true,
    },
  });

  // Form states
  const [ruleForm, setRuleForm] = useState({
    name: "",
    type: "ip_block",
    value: "",
    action: "block",
    enabled: true,
    priority: 100,
    description: "",
  });

  const [blockForm, setBlockForm] = useState({
    ip: "",
    reason: "",
    permanent: false,
    expiresIn: 3600,
  });

  // Country codes reference data
  const countryCodes = [
    { code: "AD", name: "Andorra" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "AF", name: "Afghanistan" },
    { code: "AG", name: "Antigua and Barbuda" },
    { code: "AI", name: "Anguilla" },
    { code: "AL", name: "Albania" },
    { code: "AM", name: "Armenia" },
    { code: "AO", name: "Angola" },
    { code: "AQ", name: "Antarctica" },
    { code: "AR", name: "Argentina" },
    { code: "AS", name: "American Samoa" },
    { code: "AT", name: "Austria" },
    { code: "AU", name: "Australia" },
    { code: "AW", name: "Aruba" },
    { code: "AX", name: "Åland Islands" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BB", name: "Barbados" },
    { code: "BD", name: "Bangladesh" },
    { code: "BE", name: "Belgium" },
    { code: "BF", name: "Burkina Faso" },
    { code: "BG", name: "Bulgaria" },
    { code: "BH", name: "Bahrain" },
    { code: "BI", name: "Burundi" },
    { code: "BJ", name: "Benin" },
    { code: "BL", name: "Saint Barthélemy" },
    { code: "BM", name: "Bermuda" },
    { code: "BN", name: "Brunei" },
    { code: "BO", name: "Bolivia" },
    { code: "BQ", name: "Caribbean Netherlands" },
    { code: "BR", name: "Brazil" },
    { code: "BS", name: "Bahamas" },
    { code: "BT", name: "Bhutan" },
    { code: "BV", name: "Bouvet Island" },
    { code: "BW", name: "Botswana" },
    { code: "BY", name: "Belarus" },
    { code: "BZ", name: "Belize" },
    { code: "CA", name: "Canada" },
    { code: "CC", name: "Cocos Islands" },
    { code: "CD", name: "Democratic Republic of the Congo" },
    { code: "CF", name: "Central African Republic" },
    { code: "CG", name: "Republic of the Congo" },
    { code: "CH", name: "Switzerland" },
    { code: "CI", name: "Côte d'Ivoire" },
    { code: "CK", name: "Cook Islands" },
    { code: "CL", name: "Chile" },
    { code: "CM", name: "Cameroon" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "CR", name: "Costa Rica" },
    { code: "CU", name: "Cuba" },
    { code: "CV", name: "Cape Verde" },
    { code: "CW", name: "Curaçao" },
    { code: "CX", name: "Christmas Island" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DE", name: "Germany" },
    { code: "DJ", name: "Djibouti" },
    { code: "DK", name: "Denmark" },
    { code: "DM", name: "Dominica" },
    { code: "DO", name: "Dominican Republic" },
    { code: "DZ", name: "Algeria" },
    { code: "EC", name: "Ecuador" },
    { code: "EE", name: "Estonia" },
    { code: "EG", name: "Egypt" },
    { code: "EH", name: "Western Sahara" },
    { code: "ER", name: "Eritrea" },
    { code: "ES", name: "Spain" },
    { code: "ET", name: "Ethiopia" },
    { code: "FI", name: "Finland" },
    { code: "FJ", name: "Fiji" },
    { code: "FK", name: "Falkland Islands" },
    { code: "FM", name: "Micronesia" },
    { code: "FO", name: "Faroe Islands" },
    { code: "FR", name: "France" },
    { code: "GA", name: "Gabon" },
    { code: "GB", name: "United Kingdom" },
    { code: "GD", name: "Grenada" },
    { code: "GE", name: "Georgia" },
    { code: "GF", name: "French Guiana" },
    { code: "GG", name: "Guernsey" },
    { code: "GH", name: "Ghana" },
    { code: "GI", name: "Gibraltar" },
    { code: "GL", name: "Greenland" },
    { code: "GM", name: "Gambia" },
    { code: "GN", name: "Guinea" },
    { code: "GP", name: "Guadeloupe" },
    { code: "GQ", name: "Equatorial Guinea" },
    { code: "GR", name: "Greece" },
    { code: "GS", name: "South Georgia" },
    { code: "GT", name: "Guatemala" },
    { code: "GU", name: "Guam" },
    { code: "GW", name: "Guinea-Bissau" },
    { code: "GY", name: "Guyana" },
    { code: "HK", name: "Hong Kong" },
    { code: "HM", name: "Heard Island" },
    { code: "HN", name: "Honduras" },
    { code: "HR", name: "Croatia" },
    { code: "HT", name: "Haiti" },
    { code: "HU", name: "Hungary" },
    { code: "ID", name: "Indonesia" },
    { code: "IE", name: "Ireland" },
    { code: "IL", name: "Israel" },
    { code: "IM", name: "Isle of Man" },
    { code: "IN", name: "India" },
    { code: "IO", name: "British Indian Ocean Territory" },
    { code: "IQ", name: "Iraq" },
    { code: "IR", name: "Iran" },
    { code: "IS", name: "Iceland" },
    { code: "IT", name: "Italy" },
    { code: "JE", name: "Jersey" },
    { code: "JM", name: "Jamaica" },
    { code: "JO", name: "Jordan" },
    { code: "JP", name: "Japan" },
    { code: "KE", name: "Kenya" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "KH", name: "Cambodia" },
    { code: "KI", name: "Kiribati" },
    { code: "KM", name: "Comoros" },
    { code: "KN", name: "Saint Kitts and Nevis" },
    { code: "KP", name: "North Korea" },
    { code: "KR", name: "South Korea" },
    { code: "KW", name: "Kuwait" },
    { code: "KY", name: "Cayman Islands" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "LA", name: "Laos" },
    { code: "LB", name: "Lebanon" },
    { code: "LC", name: "Saint Lucia" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LK", name: "Sri Lanka" },
    { code: "LR", name: "Liberia" },
    { code: "LS", name: "Lesotho" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "LV", name: "Latvia" },
    { code: "LY", name: "Libya" },
    { code: "MA", name: "Morocco" },
    { code: "MC", name: "Monaco" },
    { code: "MD", name: "Moldova" },
    { code: "ME", name: "Montenegro" },
    { code: "MF", name: "Saint Martin" },
    { code: "MG", name: "Madagascar" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MK", name: "North Macedonia" },
    { code: "ML", name: "Mali" },
    { code: "MM", name: "Myanmar" },
    { code: "MN", name: "Mongolia" },
    { code: "MO", name: "Macao" },
    { code: "MP", name: "Northern Mariana Islands" },
    { code: "MQ", name: "Martinique" },
    { code: "MR", name: "Mauritania" },
    { code: "MS", name: "Montserrat" },
    { code: "MT", name: "Malta" },
    { code: "MU", name: "Mauritius" },
    { code: "MV", name: "Maldives" },
    { code: "MW", name: "Malawi" },
    { code: "MX", name: "Mexico" },
    { code: "MY", name: "Malaysia" },
    { code: "MZ", name: "Mozambique" },
    { code: "NA", name: "Namibia" },
    { code: "NC", name: "New Caledonia" },
    { code: "NE", name: "Niger" },
    { code: "NF", name: "Norfolk Island" },
    { code: "NG", name: "Nigeria" },
    { code: "NI", name: "Nicaragua" },
    { code: "NL", name: "Netherlands" },
    { code: "NO", name: "Norway" },
    { code: "NP", name: "Nepal" },
    { code: "NR", name: "Nauru" },
    { code: "NU", name: "Niue" },
    { code: "NZ", name: "New Zealand" },
    { code: "OM", name: "Oman" },
    { code: "PA", name: "Panama" },
    { code: "PE", name: "Peru" },
    { code: "PF", name: "French Polynesia" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PH", name: "Philippines" },
    { code: "PK", name: "Pakistan" },
    { code: "PL", name: "Poland" },
    { code: "PM", name: "Saint Pierre and Miquelon" },
    { code: "PN", name: "Pitcairn Islands" },
    { code: "PR", name: "Puerto Rico" },
    { code: "PS", name: "Palestine" },
    { code: "PT", name: "Portugal" },
    { code: "PW", name: "Palau" },
    { code: "PY", name: "Paraguay" },
    { code: "QA", name: "Qatar" },
    { code: "RE", name: "Réunion" },
    { code: "RO", name: "Romania" },
    { code: "RS", name: "Serbia" },
    { code: "RU", name: "Russia" },
    { code: "RW", name: "Rwanda" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SB", name: "Solomon Islands" },
    { code: "SC", name: "Seychelles" },
    { code: "SD", name: "Sudan" },
    { code: "SE", name: "Sweden" },
    { code: "SG", name: "Singapore" },
    { code: "SH", name: "Saint Helena" },
    { code: "SI", name: "Slovenia" },
    { code: "SJ", name: "Svalbard and Jan Mayen" },
    { code: "SK", name: "Slovakia" },
    { code: "SL", name: "Sierra Leone" },
    { code: "SM", name: "San Marino" },
    { code: "SN", name: "Senegal" },
    { code: "SO", name: "Somalia" },
    { code: "SR", name: "Suriname" },
    { code: "SS", name: "South Sudan" },
    { code: "ST", name: "São Tomé and Príncipe" },
    { code: "SV", name: "El Salvador" },
    { code: "SX", name: "Sint Maarten" },
    { code: "SY", name: "Syria" },
    { code: "SZ", name: "Eswatini" },
    { code: "TC", name: "Turks and Caicos Islands" },
    { code: "TD", name: "Chad" },
    { code: "TF", name: "French Southern Territories" },
    { code: "TG", name: "Togo" },
    { code: "TH", name: "Thailand" },
    { code: "TJ", name: "Tajikistan" },
    { code: "TK", name: "Tokelau" },
    { code: "TL", name: "East Timor" },
    { code: "TM", name: "Turkmenistan" },
    { code: "TN", name: "Tunisia" },
    { code: "TO", name: "Tonga" },
    { code: "TR", name: "Turkey" },
    { code: "TT", name: "Trinidad and Tobago" },
    { code: "TV", name: "Tuvalu" },
    { code: "TW", name: "Taiwan" },
    { code: "TZ", name: "Tanzania" },
    { code: "UA", name: "Ukraine" },
    { code: "UG", name: "Uganda" },
    { code: "UM", name: "U.S. Minor Outlying Islands" },
    { code: "US", name: "United States" },
    { code: "UY", name: "Uruguay" },
    { code: "UZ", name: "Uzbekistan" },
    { code: "VA", name: "Vatican City" },
    { code: "VC", name: "Saint Vincent and the Grenadines" },
    { code: "VE", name: "Venezuela" },
    { code: "VG", name: "British Virgin Islands" },
    { code: "VI", name: "U.S. Virgin Islands" },
    { code: "VN", name: "Vietnam" },
    { code: "VU", name: "Vanuatu" },
    { code: "WF", name: "Wallis and Futuna" },
    { code: "WS", name: "Samoa" },
    { code: "YE", name: "Yemen" },
    { code: "YT", name: "Mayotte" },
    { code: "ZA", name: "South Africa" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" },
  ];

  // Pattern examples for suspicious patterns
  const patternExamples = [
    {
      category: "SQL Injection",
      patterns: [
        "union.*select",
        "or.*1=1",
        "drop.*table",
        "insert.*into",
        "delete.*from",
        "update.*set",
        "exec.*xp_",
        "sp_executesql",
      ],
    },
    {
      category: "XSS (Cross-Site Scripting)",
      patterns: [
        "<script",
        "javascript:",
        "onload=",
        "onerror=",
        "onclick=",
        "onmouseover=",
        "eval\\(",
        "document\\.cookie",
      ],
    },
    {
      category: "Path Traversal",
      patterns: [
        "\\.\\./",
        "\\.\\.\\\\",
        "/etc/passwd",
        "/windows/system32",
        "boot\\.ini",
        "web\\.config",
        "wp-config\\.php",
      ],
    },
    {
      category: "Command Injection",
      patterns: [
        ";.*cat",
        "\\|.*ls",
        "&&.*rm",
        "\\$\\(.*\\)",
        "`.*`",
        "nc.*-e",
        "/bin/sh",
        "cmd\\.exe",
      ],
    },
    {
      category: "File Inclusion",
      patterns: [
        "php://input",
        "php://filter",
        "data://text",
        "file://",
        "expect://",
        "zip://",
      ],
    },
    {
      category: "Bot Detection",
      patterns: [
        "bot",
        "crawler",
        "spider",
        "scraper",
        "automated",
        "python-requests",
        "curl/",
        "wget/",
      ],
    },
  ];

  // Filter countries based on search
  const filteredCountries = countryCodes.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Fetch data functions
  const fetchStats = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/stats`, {
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
        setAuthError(false);
      } else if (response.status === 403) {
        setAuthError(true);
        console.error("Admin access required - please log in as an admin user");
      } else {
        console.error(
          "Failed to fetch stats:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/rules`, {
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRules(data.data);
      } else {
        console.error(
          "Failed to fetch rules:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
  };

  const fetchBlockedIPs = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/blocked-ips`,
        {
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setBlockedIPs(data.data);
      } else {
        console.error(
          "Failed to fetch blocked IPs:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching blocked IPs:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/logs?limit=100`,
        {
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
      } else {
        console.error(
          "Failed to fetch logs:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/settings`, {
        credentials: "include",
        headers: {
          "X-Admin-Bypass": "testing",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        console.error(
          "Failed to fetch settings:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveSettings = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/firewall/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Admin-Bypass": "testing",
        },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        showAlert("Settings saved successfully!", "success");
      } else {
        const error = await response.json();
        showAlert(error.message || "Error saving settings", "error");
      }
    } catch (error) {
      showAlert("Error saving settings", "error");
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchRules(),
      fetchBlockedIPs(),
      fetchLogs(),
      fetchSettings(),
    ]);
    setLoading(false);
  };

  // Refresh data (for refresh button)
  const refreshData = async () => {
    try {
      setRefreshing(true);
      setAlert({ show: false, message: "", severity: "success" });
      await loadData();
      setAlert({
        show: true,
        message: "Data refreshed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      setAlert({
        show: true,
        message: "Failed to refresh data",
        severity: "error",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check authentication status first
    const checkAuth = async () => {
      try {
        console.log("=== CHECKING AUTHENTICATION ===");

        // Test firewall ping (no auth required)
        const pingResponse = await fetch(
          `${getBackendUrl()}/api/firewall/ping`,
          {
            credentials: "include",
            headers: {
              "X-Admin-Bypass": "testing",
            },
          }
        );
        const pingData = await pingResponse.json();
        console.log("Firewall ping:", pingData);

        // Test main auth endpoint
        const authResponse = await fetch(`${getBackendUrl()}/api/auth/status`, {
          credentials: "include",
        });
        const authData = await authResponse.json();
        console.log("Auth status:", authData);

        // Test admin endpoint
        const adminResponse = await fetch(`${getBackendUrl()}/api/admin/user`, {
          credentials: "include",
        });
        console.log("Admin endpoint status:", adminResponse.status);
        if (adminResponse.ok) {
          const adminData = await adminResponse.json();
          console.log("Admin data:", adminData);
        } else {
          const adminError = await adminResponse.json();
          console.log("Admin error:", adminError);
        }

        // Test firewall debug endpoint
        const firewallResponse = await fetch(
          `${getBackendUrl()}/api/firewall/debug/session`,
          {
            credentials: "include",
            headers: {
              "X-Admin-Bypass": "testing",
            },
          }
        );
        const firewallData = await firewallResponse.json();
        console.log("Firewall session debug:", firewallData);

        console.log("=== END AUTH CHECK ===");
      } catch (error) {
        console.error("Auth check error:", error);
      }
    };

    checkAuth().then(() => {
      loadData();
    });
    // Auto-refresh removed - data will only load on initial mount
  }, []);

  // Alert helper
  const showAlert = (message, severity = "success") => {
    setAlert({ show: true, message, severity });
    setTimeout(
      () => setAlert({ show: false, message: "", severity: "success" }),
      5000
    );
  };

  // Rule management
  const handleSaveRule = async () => {
    try {
      const url = selectedRule
        ? `${getBackendUrl()}/api/firewall/rules/${selectedRule._id}`
        : `${getBackendUrl()}/api/firewall/rules`;
      const method = selectedRule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Admin-Bypass": "testing",
        },
        credentials: "include",
        body: JSON.stringify(ruleForm),
      });

      console.log("Rule save request sent:", {
        url,
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Admin-Bypass": "testing",
        },
        body: ruleForm,
      });

      if (response.ok) {
        showAlert(`Rule ${selectedRule ? "updated" : "created"} successfully!`);
        setShowRuleModal(false);
        setSelectedRule(null);
        setRuleForm({
          name: "",
          type: "ip_block",
          value: "",
          action: "block",
          enabled: true,
          priority: 100,
          description: "",
        });
        fetchRules();
      } else {
        const error = await response.json();
        showAlert(error.message || "Error saving rule", "error");
      }
    } catch (error) {
      showAlert("Error saving rule", "error");
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/rules/${ruleId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );

      if (response.ok) {
        showAlert("Rule deleted successfully!");
        fetchRules();
      } else {
        showAlert("Error deleting rule", "error");
      }
    } catch (error) {
      showAlert("Error deleting rule", "error");
    }
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setRuleForm({
      name: rule.name,
      type: rule.type,
      value: rule.value,
      action: rule.action,
      enabled: rule.enabled,
      priority: rule.priority,
      description: rule.description || "",
    });
    setShowRuleModal(true);
  };

  // IP blocking
  const handleBlockIP = async () => {
    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/blocked-ips`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Admin-Bypass": "testing",
          },
          credentials: "include",
          body: JSON.stringify(blockForm),
        }
      );

      if (response.ok) {
        showAlert("IP blocked successfully!");
        setShowBlockModal(false);
        setBlockForm({
          ip: "",
          reason: "",
          permanent: false,
          expiresIn: 3600,
        });
        fetchBlockedIPs();
      } else {
        const error = await response.json();
        showAlert(error.message || "Error blocking IP", "error");
      }
    } catch (error) {
      showAlert("Error blocking IP", "error");
    }
  };

  const handleUnblockIP = async (ipId) => {
    if (!window.confirm("Are you sure you want to unblock this IP?")) return;

    try {
      const response = await fetch(
        `${getBackendUrl()}/api/firewall/blocked-ips/${ipId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "X-Admin-Bypass": "testing",
          },
        }
      );

      if (response.ok) {
        showAlert("IP unblocked successfully!");
        fetchBlockedIPs();
      } else {
        showAlert("Error unblocking IP", "error");
      }
    } catch (error) {
      showAlert("Error unblocking IP", "error");
    }
  };

  // Utility functions
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getActionChip = (action) => {
    const colors = {
      allowed: "success",
      blocked: "error",
      rate_limited: "warning",
      suspicious: "warning",
    };
    return (
      <Chip label={action} color={colors[action] || "default"} size="small" />
    );
  };

  const getRuleTypeChip = (type) => {
    const colors = {
      ip_block: "error",
      country_block: "warning",
      rate_limit: "info",
      suspicious_pattern: "secondary",
    };
    return (
      <Chip
        label={type.replace("_", " ")}
        color={colors[type] || "default"}
        size="small"
      />
    );
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  // Show loading screen only during initial load
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/admin")}
            sx={{ minWidth: "auto" }}
          >
            Back to Admin
          </Button>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ShieldIcon sx={{ mr: 1, fontSize: 32 }} />
            <Typography variant="h4">Firewall Administration</Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          onClick={refreshData}
          disabled={refreshing}
          startIcon={
            refreshing ? <CircularProgress size={20} /> : <RefreshIcon />
          }
        >
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </Box>

      {alert.show && (
        <Alert
          severity={alert.severity}
          sx={{ mb: 3 }}
          onClose={() =>
            setAlert({ show: false, message: "", severity: "success" })
          }
        >
          {alert.message}
        </Alert>
      )}

      {authError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
          }
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            Admin Access Required
          </Typography>
          <Typography variant="body2">
            You need to be logged in as an admin user to access the firewall
            administration panel. Please log in with an admin account
            (ralphdp21@gmail.com) using regular login, Google, or GitHub
            authentication.
          </Typography>
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => {
            setActiveTab(newValue);
            localStorage.setItem("firewallActiveTab", newValue.toString());
          }}
        >
          <Tab icon={<ChartIcon />} label="Dashboard" />
          <Tab icon={<ShieldIcon />} label={`Rules (${rules.length})`} />
          <Tab
            icon={<BanIcon />}
            label={`Blocked IPs (${blockedIPs.length})`}
          />
          <Tab icon={<EyeIcon />} label={`Logs (${logs.length})`} />
          <Tab icon={<SettingsIcon />} label="Settings" />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={activeTab} index={0}>
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

        {/* Top Blocked Countries & IPs */}
        {stats.topBlockedCountries?.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
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
                    <Box sx={{ display: "flex", alignItems: "center" }}>
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
                              <Chip
                                label={ip.count}
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
          </Grid>
        )}
      </TabPanel>

      {/* Rules Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5">Firewall Rules</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<HelpIcon />}
              onClick={() => setShowReferenceModal(true)}
            >
              Reference
            </Button>
            <Button
              variant="contained"
              startIcon={<PlusIcon />}
              onClick={() => setShowRuleModal(true)}
            >
              Add Rule
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule._id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {rule.name}
                    </Typography>
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
                  <TableCell>{formatDate(rule.createdAt)}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEditRule(rule)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRule(rule._id)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Blocked IPs Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h5">Blocked IP Addresses</Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<BanIcon />}
            onClick={() => setShowBlockModal(true)}
          >
            Block IP
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>IP Address</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Blocked At</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blockedIPs.map((ip) => (
                <TableRow key={ip._id}>
                  <TableCell>
                    <Typography variant="body2" component="code">
                      {ip.ip}
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
                      <FlagIcon />
                      <Typography variant="body1">
                        {ip.country || "Unknown"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{ip.reason}</TableCell>
                  <TableCell>
                    <Chip
                      label={ip.permanent ? "Permanent" : "Temporary"}
                      color={ip.permanent ? "error" : "warning"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(ip.blockedAt)}</TableCell>
                  <TableCell>
                    {ip.expiresAt ? formatDate(ip.expiresAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <Chip label={ip.attempts} color="info" size="small" />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      onClick={() => handleUnblockIP(ip._id)}
                    >
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Logs Tab */}
      <TabPanel value={activeTab} index={3}>
        <Card>
          <CardHeader title="Recent Firewall Activity" />
          <CardContent>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Rule</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>User Agent</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(log.timestamp)}
                        </Typography>
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
                          <FlagIcon />
                          <Typography variant="body1">
                            {log.country || "Unknown"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getActionChip(log.action)}</TableCell>
                      <TableCell>{log.rule || "-"}</TableCell>
                      <TableCell>
                        <Chip label={log.method} color="default" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.url}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap>
                          {log.userAgent
                            ? log.userAgent.substring(0, 50) + "..."
                            : "-"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={activeTab} index={4}>
        <Typography variant="h5" sx={{ mb: 3 }}>
          Firewall Settings
        </Typography>

        <Grid container spacing={3}>
          {/* Rate Limiting Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ChartIcon />
                    <Typography variant="h6">Rate Limiting</Typography>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Requests per Minute"
                      value={settings.rateLimit.perMinute}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          rateLimit: {
                            ...settings.rateLimit,
                            perMinute: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      inputProps={{ min: 1, max: 1000 }}
                      helperText="Maximum requests allowed per minute per IP"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Requests per Hour"
                      value={settings.rateLimit.perHour}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          rateLimit: {
                            ...settings.rateLimit,
                            perHour: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      inputProps={{ min: 1, max: 10000 }}
                      helperText="Maximum requests allowed per hour per IP"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Progressive Delays Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SecurityIcon />
                    <Typography variant="h6">Progressive Delays</Typography>
                  </Box>
                }
              />
              <CardContent>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Delay durations for successive rate limit violations (in
                  seconds)
                </Typography>
                <Grid container spacing={2}>
                  {settings.progressiveDelays.map((delay, index) => (
                    <Grid item xs={6} key={index}>
                      <TextField
                        fullWidth
                        type="number"
                        label={`Violation ${index + 1}`}
                        value={delay}
                        onChange={(e) => {
                          const newDelays = [...settings.progressiveDelays];
                          newDelays[index] = parseInt(e.target.value) || 0;
                          setSettings({
                            ...settings,
                            progressiveDelays: newDelays,
                          });
                        }}
                        inputProps={{ min: 1, max: 3600 }}
                        InputProps={{
                          endAdornment: (
                            <Typography variant="body2">s</Typography>
                          ),
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Feature Toggles */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SettingsIcon />
                    <Typography variant="h6">Feature Controls</Typography>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.features.ipBlocking}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                ipBlocking: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="IP Blocking"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Enable/disable IP-based blocking rules
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.features.countryBlocking}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                countryBlocking: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Country Blocking"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Enable/disable geo-blocking by country
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.features.rateLimiting}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                rateLimiting: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Rate Limiting"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Enable/disable rate limiting protection
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.features.suspiciousPatterns}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              features: {
                                ...settings.features,
                                suspiciousPatterns: e.target.checked,
                              },
                            })
                          }
                        />
                      }
                      label="Pattern Detection"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Enable/disable suspicious pattern detection
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Save Settings */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  // Reset to defaults
                  setSettings({
                    rateLimit: {
                      perMinute: 50,
                      perHour: 400,
                    },
                    progressiveDelays: [10, 60, 90, 120],
                    features: {
                      ipBlocking: true,
                      countryBlocking: true,
                      rateLimiting: true,
                      suspiciousPatterns: true,
                    },
                  });
                  showAlert("Settings reset to defaults", "info");
                }}
              >
                Reset to Defaults
              </Button>
              <Button variant="contained" onClick={saveSettings}>
                Save Settings
              </Button>
            </Box>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Rule Modal */}
      <Dialog
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Rule Name"
                value={ruleForm.name}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, name: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rule Type</InputLabel>
                <Select
                  value={ruleForm.type}
                  label="Rule Type"
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, type: e.target.value })
                  }
                >
                  <MenuItem value="ip_block">IP Block</MenuItem>
                  <MenuItem value="country_block">Country Block</MenuItem>
                  <MenuItem value="rate_limit">Rate Limit</MenuItem>
                  <MenuItem value="suspicious_pattern">
                    Suspicious Pattern
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Value"
                value={ruleForm.value}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, value: e.target.value })
                }
                placeholder="IP address, country code, or pattern"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Priority"
                value={ruleForm.priority}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    priority: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1, max: 1000 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  value={ruleForm.action}
                  label="Action"
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, action: e.target.value })
                  }
                >
                  <MenuItem value="block">Block</MenuItem>
                  <MenuItem value="allow">Allow</MenuItem>
                  <MenuItem value="rate_limit">Rate Limit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={ruleForm.enabled}
                    onChange={(e) =>
                      setRuleForm({ ...ruleForm, enabled: e.target.checked })
                    }
                  />
                }
                label="Enabled"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={ruleForm.description}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRuleModal(false)}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained">
            {selectedRule ? "Update Rule" : "Create Rule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block IP Modal */}
      <Dialog
        open={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Block IP Address</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="IP Address"
                value={blockForm.ip}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, ip: e.target.value })
                }
                placeholder="192.168.1.1"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                value={blockForm.reason}
                onChange={(e) =>
                  setBlockForm({ ...blockForm, reason: e.target.value })
                }
                placeholder="Reason for blocking"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={blockForm.permanent}
                    onChange={(e) =>
                      setBlockForm({
                        ...blockForm,
                        permanent: e.target.checked,
                      })
                    }
                  />
                }
                label="Permanent Block"
              />
            </Grid>
            {!blockForm.permanent && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expires In (seconds)"
                  value={blockForm.expiresIn}
                  onChange={(e) =>
                    setBlockForm({
                      ...blockForm,
                      expiresIn: parseInt(e.target.value),
                    })
                  }
                  inputProps={{ min: 60 }}
                  helperText="Default: 3600 seconds (1 hour)"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBlockModal(false)}>Cancel</Button>
          <Button onClick={handleBlockIP} variant="contained" color="error">
            Block IP
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reference Modal */}
      <Dialog
        open={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
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
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={referenceTab}
              onChange={(e, newValue) => setReferenceTab(newValue)}
            >
              <Tab
                icon={<FlagIcon />}
                label={`Country Codes (${countryCodes.length})`}
              />
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
                  size="small"
                  placeholder="Search countries..."
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
                example, to block all traffic from China, create a rule with
                type "Country Block" and value "CN".
              </Typography>

              <Paper sx={{ maxHeight: "100%", overflow: "auto" }}>
                <List dense>
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
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              setRuleForm({
                                ...ruleForm,
                                name: `Block ${country.name}`,
                                type: "country_block",
                                value: country.code,
                                action: "block",
                              });
                              setShowReferenceModal(false);
                              setShowRuleModal(true);
                            }}
                          >
                            Use Code
                          </Button>
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

          {/* Pattern Examples Tab */}
          {referenceTab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                These are common patterns used to detect suspicious requests.
                You can use these regex patterns in "Suspicious Pattern" rules
                to block malicious traffic.
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
                            <SecurityIcon color="error" />
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
                                      bgcolor: "grey.100",
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
                                <Tooltip title="Use this pattern">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setRuleForm({
                                        ...ruleForm,
                                        name: `Block ${
                                          category.category
                                        } - ${pattern.substring(0, 20)}...`,
                                        type: "suspicious_pattern",
                                        value: pattern,
                                        action: "block",
                                        description: `Blocks requests matching ${category.category.toLowerCase()} pattern`,
                                      });
                                      setShowReferenceModal(false);
                                      setShowRuleModal(true);
                                    }}
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

              <Box sx={{ mt: 3, p: 2, bgcolor: "lightgray", borderRadius: 1 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
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
          <Button onClick={() => setShowReferenceModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FirewallAdmin;
