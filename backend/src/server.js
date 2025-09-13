const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

// External services configuration will be loaded from database
// Environment variables are only used as fallback during initial setup

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authConfig = require("./config/auth.config");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");
const { errorHandler } = require("./middleware/errorMiddleware");
const { connectDB } = require("./config/db");
// Passport configuration is loaded automatically by requiring it
const fs = require("fs"); // Added for plugin system

// Ensure required environment variables are setup
const requiredEnvVars = ["MONGODB_URI", "SESSION_SECRET", "FRONTEND_URL"];

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

const app = express();

// --- hMERN Hot-Loading Plugin System ---
app.plugins = {};
const pluginsDir = path.join(__dirname, "plugins");

// Initialize Hot Load Manager
let hotLoadManager;
const initializeHotLoadManager = async () => {
  try {
    const HotLoadManager = require("./utils/hotLoadManager");
    hotLoadManager = new HotLoadManager(app);
    app.hotLoadManager = hotLoadManager;

    // Initialize the system after database connection
    await hotLoadManager.initialize();
    console.log("✅ Hot Load Manager initialized successfully");
  } catch (error) {
    console.error("❌ Hot Load Manager initialization failed:", error);
    // Continue without hot-loading in case of failure
  }
};

// Helper function to load plugins configuration
const loadPluginsConfig = async () => {
  const PLUGINS_CONFIG_PATH = path.join(__dirname, "config/plugins.json");
  try {
    const configData = await fs.promises.readFile(PLUGINS_CONFIG_PATH, "utf8");
    return JSON.parse(configData);
  } catch (error) {
    console.error("Error loading plugins config:", error);
    return {};
  }
};

// Helper function to check if a plugin is enabled
const isPluginEnabled = async (pluginName) => {
  const config = await loadPluginsConfig();
  return config[pluginName]?.enabled || false;
};

console.log("=== Plugin System Initialization ===");
console.log("Plugins directory:", pluginsDir);

if (fs.existsSync(pluginsDir)) {
  console.log("Plugins directory exists, scanning for plugins...");

  // First pass: Load plugins without dependencies
  const pluginFiles = fs.readdirSync(pluginsDir);
  const loadedPlugins = new Set();
  const failedPlugins = [];

  pluginFiles.forEach((pluginName) => {
    const pluginPath = path.join(pluginsDir, pluginName);
    console.log(`Checking plugin: ${pluginName} at ${pluginPath}`);

    if (fs.statSync(pluginPath).isDirectory()) {
      try {
        const pluginIndexPath = path.join(pluginPath, "index.js");
        console.log(`Looking for index.js at: ${pluginIndexPath}`);

        if (fs.existsSync(pluginIndexPath)) {
          console.log(`Loading plugin: ${pluginName}`);
          const plugin = require(pluginIndexPath);
          if (plugin && typeof plugin.register === "function") {
            // Check if plugin has dependencies
            if (!plugin.dependencies || plugin.dependencies.length === 0) {
              const pluginInstance = plugin.register(app);
              if (pluginInstance !== false) {
                // FIXED: Store plugin instance, not module exports
                app.plugins[pluginName] = pluginInstance || plugin;
                loadedPlugins.add(pluginName);
                console.log(
                  `Successfully loaded plugin: ${plugin.name} v${plugin.version}`
                );
              } else {
                failedPlugins.push({ name: pluginName, plugin });
              }
            } else {
              failedPlugins.push({ name: pluginName, plugin });
            }
          } else {
            console.log(
              `Plugin ${pluginName} does not have a valid register function`
            );
          }
        } else {
          console.log(`No index.js found for plugin: ${pluginName}`);
        }
      } catch (error) {
        console.error(`Failed to load plugin: ${pluginName}`, error);
      }
    } else {
      console.log(`Skipping ${pluginName} - not a directory`);
    }
  });

  // Second pass: Load plugins with dependencies
  let attempts = 0;
  const maxAttempts = 10;

  while (failedPlugins.length > 0 && attempts < maxAttempts) {
    attempts++;
    console.log(`Plugin dependency resolution attempt ${attempts}...`);

    const remainingPlugins = [];

    failedPlugins.forEach(({ name: pluginName, plugin }) => {
      // Check if all dependencies are loaded
      const dependenciesMet = plugin.dependencies.every((dep) =>
        loadedPlugins.has(dep)
      );

      if (dependenciesMet) {
        console.log(
          `Dependencies met for ${pluginName}, attempting to load...`
        );
        try {
          const success = plugin.register(app);
          if (success !== false) {
            app.plugins[pluginName] = success || plugin;
            loadedPlugins.add(pluginName);
            console.log(
              `Successfully loaded plugin: ${plugin.name} v${plugin.version}`
            );
          } else {
            console.log(`Plugin ${pluginName} registration returned false`);
            remainingPlugins.push({ name: pluginName, plugin });
          }
        } catch (error) {
          console.error(`Failed to register plugin: ${pluginName}`, error);
          remainingPlugins.push({ name: pluginName, plugin });
        }
      } else {
        const missingDeps = plugin.dependencies.filter(
          (dep) => !loadedPlugins.has(dep)
        );
        console.log(
          `Plugin ${pluginName} waiting for dependencies: ${missingDeps.join(
            ", "
          )}`
        );
        remainingPlugins.push({ name: pluginName, plugin });
      }
    });

    // Update failed plugins list
    failedPlugins.length = 0;
    failedPlugins.push(...remainingPlugins);

    // If no progress was made in this iteration, break to avoid infinite loop
    if (remainingPlugins.length === failedPlugins.length) {
      break;
    }
  }

  // Report any plugins that couldn't be loaded
  if (failedPlugins.length > 0) {
    console.log(
      "The following plugins could not be loaded due to unmet dependencies:"
    );
    failedPlugins.forEach(({ name: pluginName, plugin }) => {
      const missingDeps = plugin.dependencies.filter(
        (dep) => !loadedPlugins.has(dep)
      );
      console.log(
        `  - ${pluginName}: missing dependencies [${missingDeps.join(", ")}]`
      );
    });
  }
} else {
  console.log("Plugins directory does not exist");
}

console.log("Loaded plugins:", Object.keys(app.plugins));
console.log("=== Plugin System Initialization Complete ===");

// Trust proxy for Heroku
app.set("trust proxy", 1);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [];

    if (process.env.NODE_ENV === "production") {
      allowedOrigins.push(process.env.FRONTEND_URL);
    } else {
      // Development origins
      allowedOrigins.push("http://localhost:3000");
      allowedOrigins.push("http://127.0.0.1:3000");
      allowedOrigins.push("http://localhost:5050");
      allowedOrigins.push("http://127.0.0.1:5050");
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      // In development, be more permissive for localhost
      if (
        process.env.NODE_ENV !== "production" &&
        origin &&
        origin.includes("localhost")
      ) {
        console.log("Allowing localhost origin in development:", origin);
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cookie",
    "Set-Cookie",
    "X-Admin-Bypass",
    "X-Firewall-Test",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
};

// DEBUG: Log ALL requests to see what's happening
app.use((req, res, next) => {
  if (req.originalUrl.includes("/api/")) {
    console.error(`🚨 ALL API REQUESTS: ${req.method} ${req.originalUrl}`);
    console.error(`🚨 Headers:`, req.headers);
    console.error(`🚨 Session ID:`, req.sessionID);
    console.error(`🚨 Session:`, req.session);
    console.error(`🚨 User:`, req.user ? req.user.email : "No user");
    console.error(
      `🚨 Authenticated:`,
      req.isAuthenticated ? req.isAuthenticated() : false
    );
  }
  next();
});

// Body parser middleware - Move BEFORE CORS to ensure it processes first
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cors(corsOptions));

// Generic plugin middleware application system
console.log(
  "=== SERVER: Applying plugin middleware (plugins handle their own registration) ==="
);
// Note: Plugins now self-register their middleware during loadPlugin()
// This removes hardcoded firewall dependencies from the core

// Handle preflight requests explicitly
app.options("*", cors(corsOptions));

// Additional CORS middleware for debugging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `CORS Request - Origin: ${origin}, Method: ${req.method}, URL: ${req.url}`
    );
  }
  next();
});

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://accounts.google.com",
          "https://apis.google.com",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "https://www.googleapis.com",
          "https://api.github.com",
          "https://graph.facebook.com",
          "https://www.facebook.com",
          "https://www.google-analytics.com",
        ],
        frameSrc: [
          "'self'",
          "https://accounts.google.com",
          "https://www.facebook.com",
        ],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        blockAllMixedContent: [],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

// License-aware dynamic rate limiter configuration
const { getCoreSettings } = require("./utils/coreSettings");
const { getLicenseAwareRateConfig } = require("./utils/rateLimit");

// Create license-aware rate limiter middleware
const createDynamicRateLimiter = async () => {
  try {
    const coreSettings = await getCoreSettings();
    const licenseRateConfig = await getLicenseAwareRateConfig(coreSettings);

    console.log("Loading license-aware rate limiting configuration:", {
      licensePlan: licenseRateConfig.licenseInfo.plan,
      tier: licenseRateConfig.licenseTiers.tier,
      windowMs: licenseRateConfig.core.windowMs,
      maxRequests: licenseRateConfig.core.max,
      enabled: licenseRateConfig.settings.enabled,
      skipAdminRoutes: licenseRateConfig.settings.skipAdminRoutes,
      skipPluginRoutes: licenseRateConfig.settings.skipPluginRoutes,
      development: licenseRateConfig.licenseInfo.development_mode,
    });

    return rateLimit({
      windowMs: licenseRateConfig.core.windowMs,
      max: licenseRateConfig.core.max,
      trustProxy: licenseRateConfig.settings.trustProxy,
      skip: (req) => {
        // Skip if rate limiting is disabled
        if (!licenseRateConfig.settings.enabled) {
          return true;
        }

        // Skip rate limiting for admin routes if enabled
        // IMPORTANT: Changed logic - now admin routes get their own specific rate limiting
        // instead of being completely skipped by core rate limiting
        const isAdminRoute =
          req.originalUrl &&
          (req.originalUrl.startsWith("/api/admin") ||
            req.originalUrl.includes("/admin"));

        // Skip rate limiting for plugin APIs if enabled
        const isPluginRoute =
          licenseRateConfig.settings.skipPluginRoutes &&
          req.originalUrl &&
          (req.originalUrl.startsWith("/api/firewall") ||
            req.originalUrl.startsWith("/api/web-performance") ||
            req.originalUrl.startsWith("/api/plugin-template"));

        // Also skip if admin bypass header is present
        const hasAdminBypass = req.headers["x-admin-bypass"];

        // Check if any plugin wants to handle rate limiting
        const shouldPluginHandleRateLimit = app.shouldBypassGlobalRateLimit
          ? app.shouldBypassGlobalRateLimit(req)
          : false;

        // Admin routes are no longer automatically skipped - they get their own rate limiting
        if (isPluginRoute || hasAdminBypass || shouldPluginHandleRateLimit) {
          console.log(
            `[License-Aware Rate Limiter] Skipping core rate limit for: ${
              req.originalUrl
            } (plugin: ${isPluginRoute}, bypass: ${!!hasAdminBypass}, pluginHandling: ${shouldPluginHandleRateLimit})`
          );
          return true;
        }

        // Log when admin routes hit core rate limiting (this is the new behavior)
        if (isAdminRoute && !licenseRateConfig.settings.skipAdminRoutes) {
          console.log(
            `[License-Aware Rate Limiter] Admin route will be rate limited by core limiter: ${req.originalUrl} (plan: ${licenseRateConfig.licenseInfo.plan}, max: ${licenseRateConfig.core.max})`
          );
        }

        return false;
      },
      message: {
        error: licenseRateConfig.settings.message,
        retryAfter: `${Math.round(
          licenseRateConfig.core.windowMs / 60000
        )} minutes`,
        licensePlan: licenseRateConfig.licenseInfo.plan,
        rateLimitTier: licenseRateConfig.licenseTiers.tier,
      },
    });
  } catch (error) {
    console.error(
      "Error loading license-aware rate limiting, using emergency fallback:",
      error
    );

    // Emergency fallback to very restrictive settings
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // More restrictive than normal
      trustProxy: true,
      skip: (req) => {
        // In emergency fallback, only skip plugin routes and firewall
        const isPluginRoute =
          req.originalUrl &&
          (req.originalUrl.startsWith("/api/firewall") ||
            req.originalUrl.startsWith("/api/web-performance") ||
            req.originalUrl.startsWith("/api/plugin-template"));

        const hasAdminBypass = req.headers["x-admin-bypass"];
        const shouldPluginHandleRateLimit = app.shouldBypassGlobalRateLimit
          ? app.shouldBypassGlobalRateLimit(req)
          : false;

        return isPluginRoute || hasAdminBypass || shouldPluginHandleRateLimit;
      },
      message: {
        error: "Rate limit exceeded (emergency fallback mode)",
        retryAfter: "15 minutes",
        mode: "emergency_fallback",
      },
    });
  }
};

// Apply dynamic rate limiter
createDynamicRateLimiter()
  .then((limiter) => {
    // Apply global rate limiter unless a plugin overrides it
    const shouldSkipGlobalLimiter = app.shouldBypassGlobalRateLimit
      ? app.shouldBypassGlobalRateLimit({ originalUrl: "/global-check" })
      : false;

    if (!shouldSkipGlobalLimiter) {
      app.use(limiter);
      console.log("Dynamic global rate limiter applied");
    } else {
      console.log("Global rate limiter skipped - plugin handles rate limiting");
    }
  })
  .catch((error) => {
    console.error("Failed to create dynamic rate limiter:", error);
  });

// Additional body parsing middleware for debugging
app.use((req, res, next) => {
  // Log request details for debugging
  if (
    req.url.includes("/api/firewall/") &&
    (req.method === "POST" || req.method === "PUT")
  ) {
    console.log("=== REQUEST DEBUG ===");
    console.log("URL:", req.url);
    console.log("Method:", req.method);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Body (raw):", req.body);
    console.log("Body type:", typeof req.body);
    console.log("Body keys:", req.body ? Object.keys(req.body) : "No keys");
    console.log("======================");
  }
  next();
});

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60, // 1 day
      collectionName: "core_sessions", // Updated collection name
    }),
    cookie: {
      secure: false, // Always false for localhost development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax", // Always lax for cross-origin requests
    },
    name: "connect.sid", // Explicit session name
  })
);

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Apply firewall middleware AFTER session setup
if (app.firewallMiddleware) {
  app.use(app.firewallMiddleware);
  console.log("🔥 Firewall middleware applied AFTER session setup");
} else if (app.plugins.firewall && app.plugins.firewall.middleware) {
  const { firewallMiddleware } = app.plugins.firewall.middleware;
  app.use(firewallMiddleware);
  console.log("🔥 Firewall middleware applied AFTER session setup (fallback)");
} else if (app.getFirewallMiddleware) {
  // Legacy fallback
  app.use(app.getFirewallMiddleware());
  console.log("🔥 Firewall middleware applied AFTER session setup (legacy)");
} else {
  console.error(
    "🚨 ERROR: Firewall middleware not found! HTML pages will load even when rate limited!"
  );
}

// Debug middleware for session and authentication
app.use((req, res, next) => {
  if (req.originalUrl.includes("/api/")) {
    console.log("🔍 Session Debug:", {
      sessionID: req.sessionID,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      hasUser: !!req.user,
      userEmail: req.user?.email,
      sessionData: req.session,
      cookies: req.headers.cookie,
    });
  }
  next();
});

// Import passport configuration
require("./config/passport");

// Register firewall routes AFTER session and passport setup
console.log(
  "🔥 FIREWALL DEBUG: Registering firewall routes AFTER session setup"
);
if (app.plugins.firewall && app.registerFirewallRoutes) {
  console.log("🔥 FIREWALL DEBUG: Registering firewall routes IMMEDIATELY");
  try {
    app.registerFirewallRoutes();
    console.log(
      "🔥 FIREWALL DEBUG: ✅ Firewall routes registered SYNCHRONOUSLY"
    );
  } catch (error) {
    console.error(
      "🔥 FIREWALL DEBUG: ❌ Error registering firewall routes:",
      error
    );
  }
} else {
  console.log(
    "🔥 FIREWALL DEBUG: Firewall plugin or register function not available"
  );
}

// Register web performance routes AFTER session and passport setup
console.log(
  "🚀 WEB PERFORMANCE DEBUG: Starting web performance routes registration check"
);
if (
  app.plugins["web-performance-optimization"] &&
  app.registerWebPerformanceRoutes
) {
  console.log(
    "🚀 WEB PERFORMANCE DEBUG: Registering web performance routes IMMEDIATELY"
  );
  try {
    app.registerWebPerformanceRoutes();
    console.log(
      "🚀 WEB PERFORMANCE DEBUG: ✅ Web Performance routes registered SYNCHRONOUSLY"
    );
  } catch (error) {
    console.error(
      "🚀 WEB PERFORMANCE DEBUG: ❌ Error registering web performance routes:",
      error
    );
  }
} else {
  console.log(
    "🚀 WEB PERFORMANCE DEBUG: Web Performance plugin or register function not available"
  );
}

// Register plugin template routes AFTER session and passport setup
console.log(
  "🔧 PLUGIN TEMPLATE DEBUG: Starting plugin template routes registration check"
);
if (app.plugins["plugin-template"] && app.registerPluginTemplateRoutes) {
  console.log(
    "🔧 PLUGIN TEMPLATE DEBUG: Registering plugin template routes IMMEDIATELY"
  );
  try {
    app.registerPluginTemplateRoutes();
    console.log(
      "🔧 PLUGIN TEMPLATE DEBUG: ✅ Plugin Template routes registered SYNCHRONOUSLY"
    );
  } catch (error) {
    console.error(
      "🔧 PLUGIN TEMPLATE DEBUG: ❌ Error registering plugin template routes:",
      error
    );
  }
} else {
  console.log(
    "🔧 PLUGIN TEMPLATE DEBUG: Plugin Template plugin or register function not available"
  );
}

// CRITICAL: API Route Protection - MUST come before static file serving
app.use("/api/*", (req, res, next) => {
  // Log all API requests for debugging
  console.error(`🚨 API REQUEST: ${req.method} ${req.originalUrl}`);

  // Check if this is a known API route
  const knownRoutes = [
    "/api/auth",
    "/api/contact",
    "/api/plugins",
    "/api/admin",
    "/api/firewall", // Plugin routes
    "/api/web-performance",
    "/api/plugin-template",
    "/api/debug",
    "/api/emergency",
    "/api/system", // Add system routes
  ];
  const isKnownRoute = knownRoutes.some((route) =>
    req.originalUrl.startsWith(route)
  );

  if (!isKnownRoute) {
    console.error(`🚨 UNKNOWN API ROUTE: ${req.originalUrl}`);
    return res.status(404).json({
      error: "API endpoint not found",
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      availableRoutes: knownRoutes,
    });
  }

  // Log plugin route attempts for debugging
  const pluginRoutes = [
    "/api/firewall",
    "/api/web-performance",
    "/api/plugin-template",
  ];
  const isPluginRoute = pluginRoutes.some((route) =>
    req.originalUrl.startsWith(route)
  );

  if (isPluginRoute) {
    console.error(`🔧 PLUGIN ROUTE ATTEMPT: ${req.method} ${req.originalUrl}`);
    console.error(
      `🔧 User:`,
      req.user ? { id: req.user._id, email: req.user.email } : "No user"
    );
    console.error(`🔧 Session:`, req.sessionID);
    console.error(
      `🔧 Authenticated:`,
      req.isAuthenticated ? req.isAuthenticated() : false
    );
  }

  // If we get here, it should be handled by a registered route
  // If not, Express will handle the 404
  next();
});

// Import routes
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contact");
const pluginsRoutes = require("./routes/plugins");

// Add a simple system status endpoint that bypasses all middleware
app.get("/api/system/status", async (req, res) => {
  try {
    // Load plugins config directly
    const path = require("path");
    const fs = require("fs").promises;
    const PLUGINS_CONFIG_PATH = path.join(__dirname, "config/plugins.json");

    let config = {};
    try {
      const configContent = await fs.readFile(PLUGINS_CONFIG_PATH, "utf8");
      config = JSON.parse(configContent);
    } catch (error) {
      console.log("Could not load plugins config:", error.message);
    }

    const basicStatus = {};
    for (const [pluginName, pluginConfig] of Object.entries(config)) {
      basicStatus[pluginName] = {
        enabled: pluginConfig.enabled || false,
        type: pluginConfig.type || "General",
      };
    }

    // Enhanced plugin status - let plugins provide their own detailed status
    for (const [pluginName, pluginInfo] of Object.entries(basicStatus)) {
      if (
        pluginInfo.enabled &&
        app.plugins[pluginName] &&
        app.plugins[pluginName].getPluginStatus
      ) {
        try {
          const detailedStatus = await app.plugins[
            pluginName
          ].getPluginStatus();
          basicStatus[pluginName] = { ...pluginInfo, ...detailedStatus };
        } catch (error) {
          console.log(
            `Could not load ${pluginName} detailed status:`,
            error.message
          );
        }
      }
    }

    res.json({
      success: true,
      data: basicStatus,
    });
  } catch (error) {
    console.error("Error getting system status:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving system status",
    });
  }
});

// Register admin routes
const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/plugins", pluginsRoutes);

// REMOVED: Manual firewall route mounting - plugin now registers itself properly
console.log("🔥 Firewall routes are now self-registered by the plugin");

// TEST: Direct firewall session test (bypassing router module)
app.get("/api/firewall-session-test", (req, res) => {
  console.log("🔥 DIRECT SESSION TEST:", {
    hasUser: !!req.user,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    sessionId: req.sessionID,
    userEmail: req.user?.email,
  });

  res.json({
    success: true,
    message: "Direct session test route",
    hasUser: !!req.user,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    sessionId: req.sessionID,
    userEmail: req.user?.email,
    timestamp: new Date().toISOString(),
  });
});

// --- Example of using the loaded licensing plugin ---
if (app.plugins.licensing && app.plugins.licensing.middleware) {
  const { validateLicense } = app.plugins.licensing.middleware;

  // Example of a new route that requires a valid license
  const premiumRouter = express.Router();
  premiumRouter.get("/", (req, res) => {
    // req.licenseInfo is available here thanks to the middleware
    res.json({
      message: "Success! You are accessing a license-protected feature.",
      licenseDetails: req.licenseInfo,
    });
  });

  app.use("/api/premium-feature", validateLicense, premiumRouter);
  console.log("Protected route /api/premium-feature is active.");
} else {
  console.log(
    "🔧 Licensing plugin middleware not available - skipping premium routes"
  );
}
// --- End Example ---

// --- ENHANCED: License-Aware Admin Routes ---
console.error(
  "🚨 HEROKU DEBUG: Starting SYNCHRONOUS license-aware admin routes registration"
);

// Import the new license-aware admin rate limiting
const { getAdminRateLimiters } = require("./utils/rateLimit");

// Generic admin middleware - check if any plugin provides enhanced admin middleware
const createFallbackAdminMiddleware = () => {
  return (req, res, next) => {
    if (!req.user || !req.user.isAdmin || !req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }
    next();
  };
};

// Use plugin-provided admin middleware if available, otherwise fallback
let requireAdmin = app.firewallRequireAdmin || createFallbackAdminMiddleware();
console.log(
  "Admin middleware configured:",
  app.firewallRequireAdmin ? "Plugin-provided" : "Fallback"
);

// Setup license-aware admin rate limiting
const setupAdminRateLimiting = async () => {
  try {
    const adminLimiters = await getAdminRateLimiters();

    console.error("🚨 ADMIN RATE LIMITING: License-aware limiters configured", {
      licensePlan: adminLimiters.config?.licenseInfo?.plan || "unknown",
      tier: adminLimiters.config?.licenseTiers?.tier || "unknown",
      adminMax: adminLimiters.config?.admin?.max || "fallback",
      criticalMax: adminLimiters.config?.critical?.max || "fallback",
      firewallMax: adminLimiters.config?.firewall?.max || "fallback",
    });

    return adminLimiters;
  } catch (error) {
    console.error("🚨 Error setting up admin rate limiting:", error);
    return null;
  }
};

// Admin routes - only accessible to admin users with license-aware rate limiting
const adminRouter = express.Router();

// Apply license-aware rate limiting to admin routes
setupAdminRateLimiting()
  .then((adminLimiters) => {
    if (adminLimiters) {
      // Apply general admin rate limiting to all admin routes
      adminRouter.use(adminLimiters.admin);
      console.error("🚨 ADMIN RATE LIMITING: Applied to all admin routes");
    } else {
      console.error(
        "🚨 ADMIN RATE LIMITING: Using fallback (no license-aware limiting)"
      );
    }
  })
  .catch((error) => {
    console.error("🚨 Error applying admin rate limiting:", error);
  });

// CRITICAL: Add admin route logging
adminRouter.use((req, res, next) => {
  console.error(`🚨 ADMIN ROUTE HIT: ${req.method} ${req.originalUrl}`);
  console.error(`🚨 IP: ${req.ip}`);
  console.error(
    `🚨 User:`,
    req.user
      ? {
          id: req.user._id,
          email: req.user.email,
          role: req.user.role,
        }
      : "No user"
  );
  console.error(
    `🚨 Authenticated:`,
    req.isAuthenticated ? req.isAuthenticated() : false
  );
  next();
});

// Admin dashboard (general admin operation)
adminRouter.get("/", requireAdmin, (req, res) => {
  console.error("🚨 ADMIN DASHBOARD: Successful access");
  res.json({
    success: true,
    message: "Admin dashboard access granted",
    user: {
      email: req.user.email,
      role: req.user.role,
      name: req.user.name,
    },
    availablePlugins: Object.keys(app.plugins),
    timestamp: new Date().toISOString(),
  });
});

// Admin user info (general admin operation)
adminRouter.get("/user", requireAdmin, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      isAdmin: req.user.isAdmin(),
      createdAt: req.user.createdAt,
    },
  });
});

// Debug endpoint for Heroku troubleshooting
app.get("/api/debug/heroku", (req, res) => {
  console.error("🚨 HEROKU DEBUG: Debug endpoint hit");
  res.json({
    success: true,
    message: "Heroku debug endpoint working",
    timestamp: new Date().toISOString(),
    user: req.user
      ? {
          email: req.user.email,
          role: req.user.role,
          isAdmin: req.user.isAdmin ? req.user.isAdmin() : false,
        }
      : null,
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    sessionId: req.sessionID,
    plugins: Object.keys(app.plugins),
    nodeEnv: process.env.NODE_ENV,
  });
});

// Test admin route without authentication
app.get("/api/debug/admin-test", (req, res) => {
  console.error("🚨 HEROKU DEBUG: Admin test endpoint hit");
  res.json({
    success: true,
    message: "Admin test endpoint working (no auth required)",
    timestamp: new Date().toISOString(),
  });
});

// EMERGENCY: Test user session
app.get("/api/debug/session", (req, res) => {
  console.error("🚨 SESSION DEBUG:", {
    sessionID: req.sessionID,
    hasUser: !!req.user,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    sessionData: req.session,
    cookies: req.headers.cookie,
  });

  res.json({
    success: true,
    message: "Session debug info",
    sessionID: req.sessionID,
    hasUser: !!req.user,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    timestamp: new Date().toISOString(),
  });
});

// EMERGENCY: Direct admin route test
app.get("/api/admin-direct", (req, res) => {
  console.error("🚨 EMERGENCY ADMIN DIRECT: Route hit");
  console.error("🚨 User:", req.user);
  console.error(
    "🚨 Authenticated:",
    req.isAuthenticated ? req.isAuthenticated() : false
  );

  res.json({
    success: true,
    message: "Emergency direct admin route working",
    user: req.user
      ? {
          email: req.user.email,
          role: req.user.role,
        }
      : null,
    authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    timestamp: new Date().toISOString(),
  });
});

// EMERGENCY: Direct plugin test route (bypasses all middleware)
app.get("/api/plugin-direct", (req, res) => {
  console.error("🔥 EMERGENCY PLUGIN DIRECT: Route hit");
  console.error("🔥 This bypasses all plugin middleware");

  res.json({
    success: true,
    message: "🔥 EMERGENCY: Direct plugin route working (bypasses middleware)",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    plugins: Object.keys(app.plugins),
    pluginFunctions: Object.keys(app.plugins).map((name) => ({
      name,
      hasGetStatus: !!app.plugins[name]?.getPluginStatus,
      hasRegisterWithCore: !!app.plugins[name]?.registerWithCore,
    })),
  });
});

// Serve static files in production - with rate limiting applied FIRST
if (process.env.NODE_ENV === "production") {
  // Custom static file serving with rate limit check BEFORE serving any files
  app.use(async (req, res, next) => {
    // Skip API routes - they have their own middleware
    if (req.originalUrl.startsWith("/api/")) {
      return next();
    }

    // Check firewall rate limiting BEFORE serving ANY static files
    if (app.firewallMiddleware) {
      console.log(
        `🔥 Checking rate limits for static file: ${req.originalUrl}`
      );

      // Apply firewall middleware directly - it will handle the response if rate limited
      return app.firewallMiddleware(req, res, () => {
        // If not rate limited, continue to static file serving
        next();
      });
    } else {
      // Fallback if middleware not available
      next();
    }
  });

  // Now serve static files (only reached if not rate limited)
  app.use(express.static(path.join(__dirname, "../../frontend/build")));

  // Catch-all for HTML routes (also only reached if not rate limited)
  app.get("*", (req, res) => {
    // Double-check this isn't an API route that fell through
    if (req.originalUrl.startsWith("/api/")) {
      console.error(
        `🚨 API ROUTE FELL THROUGH TO CATCH-ALL: ${req.originalUrl}`
      );
      return res.status(404).json({
        error: "API endpoint not found",
        path: req.originalUrl,
        fallthrough: true,
      });
    }

    // Serve the React app (rate limiting already checked above)
    res.sendFile(path.join(__dirname, "../../frontend/build", "index.html"));
  });
} else {
  // Development mode - also apply rate limiting to all routes
  app.use(async (req, res, next) => {
    // Skip API routes - they have their own middleware
    if (req.originalUrl.startsWith("/api/")) {
      return next();
    }

    // Check firewall rate limiting BEFORE serving anything in development too
    if (app.firewallMiddleware) {
      console.log(`🔥 DEV: Checking rate limits for: ${req.originalUrl}`);

      // Apply firewall middleware directly - it will handle the response if rate limited
      return app.firewallMiddleware(req, res, () => {
        // If not rate limited, continue
        next();
      });
    } else {
      // Fallback if middleware not available
      next();
    }
  });

  // Catch-all for development (only reached if not rate limited)
  app.get("*", (req, res, next) => {
    // Skip API routes
    if (req.originalUrl.startsWith("/api/")) {
      return next();
    }

    // In development, let the React dev server handle it (rate limiting already checked above)
    next();
  });
}

// Permissions Policy
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), cross-origin-isolated=(), display-capture=(), document-domain=(), encrypted-media=(), execution-while-not-rendered=(), execution-while-out-of-viewport=(), fullscreen=(), geolocation=(), gyroscope=(), keyboard-map=(), magnetometer=(), microphone=(), midi=(), navigation-override=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), sync-xhr=(), usb=(), web-share=(), xr-spatial-tracking=()"
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// Connect to MongoDB with retry logic
const connectWithRetry = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("Connected to MongoDB");

    // Upgrade admin users after successful MongoDB connection
    const User = require("./models/User");
    try {
      await User.upgradeAdminUsers();
    } catch (error) {
      console.error("Error upgrading admin users:", error);
    }

    // Initialize Hot Load Manager after database connection
    try {
      await initializeHotLoadManager();
    } catch (error) {
      console.error("Hot Load Manager initialization failed:", error);
      // Continue without hot-loading if it fails
    }
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectWithRetry, 5000);
  }
};

// Start server immediately
const PORT = process.env.PORT || 5050;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on("error", (error) => {
  console.error("Server error:", error);
  if (error.code === "EADDRINUSE") {
    console.log("Port is already in use, trying another port...");
    server.close();
    const newServer = app.listen(0, () => {
      console.log(`Server running on port ${newServer.address().port}`);
    });
  }
});

// Start MongoDB connection
connectWithRetry();

// Emergency rate limit reset endpoint (temporary for debugging)
app.post("/api/emergency/reset-rate-limits", async (req, res) => {
  try {
    if (process.env.NODE_ENV !== "production") {
      return res
        .status(403)
        .json({ error: "Only available in production for emergency" });
    }

    // Clear rate limit collection
    const mongoose = require("mongoose");
    await mongoose.connection.db
      .collection("plugin_firewall_rate_limits")
      .deleteMany({});

    console.log("🚨 EMERGENCY: All rate limits cleared");

    res.json({
      success: true,
      message: "Emergency rate limit reset completed",
    });
  } catch (error) {
    console.error("Emergency reset failed:", error);
    res.status(500).json({ error: "Emergency reset failed" });
  }
});

module.exports = app;
