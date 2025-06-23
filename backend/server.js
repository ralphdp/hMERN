const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authConfig = require("./config/auth.config");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const compression = require("compression");
const { errorHandler } = require("./middleware/errorMiddleware");
const { connectDB } = require("./config/db");
const { initializePassport } = require("./config/passport");
const fs = require("fs"); // Added for plugin system
require("dotenv").config();

// Ensure required environment variables are setup
const requiredEnvVars = ["MONGODB_URI", "SESSION_SECRET", "FRONTEND_URL"];

// Check for missing environment variables
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error("Missing required environment variables:", missingEnvVars);
  process.exit(1);
}

const app = express();

// --- hMERN Plugin System ---
app.plugins = {};
const pluginsDir = path.join(__dirname, "plugins");

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
              const success = plugin.register(app);
              if (success !== false) {
                app.plugins[pluginName] = plugin;
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
            app.plugins[pluginName] = plugin;
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

// EMERGENCY FALLBACK: Force register critical routes if they weren't registered
setTimeout(() => {
  console.error("🚨 HEROKU DEBUG: Emergency fallback check running");

  // Check if admin routes exist
  const adminRouteExists = app._router.stack.some((layer) =>
    layer.regexp.source.includes("admin")
  );

  console.error("🚨 HEROKU DEBUG: Admin route exists:", adminRouteExists);

  if (!adminRouteExists && app.plugins.firewall) {
    console.error("🚨 HEROKU DEBUG: EMERGENCY: Registering admin routes now");
    const { requireAdmin } = app.plugins.firewall.middleware;
    const adminRouter = express.Router();

    adminRouter.get("/", requireAdmin, (req, res) => {
      res.json({
        success: true,
        message: "Admin dashboard access granted (EMERGENCY FALLBACK)",
        user: {
          email: req.user.email,
          role: req.user.role,
          name: req.user.name,
        },
        availablePlugins: Object.keys(app.plugins),
        timestamp: new Date().toISOString(),
      });
    });

    app.use("/api/admin", adminRouter);
    console.error("🚨 HEROKU DEBUG: EMERGENCY admin routes registered");
  }

  // Force register firewall routes if needed
  if (app.plugins.firewall && app.registerFirewallRoutes) {
    console.error(
      "🚨 HEROKU DEBUG: EMERGENCY: Registering firewall routes now"
    );
    try {
      app.registerFirewallRoutes();
      console.error("🚨 HEROKU DEBUG: EMERGENCY firewall routes registered");
    } catch (error) {
      console.error(
        "🚨 HEROKU DEBUG: EMERGENCY firewall route registration failed:",
        error
      );
    }
  }
}, 5000); // Wait 5 seconds after server start

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
  ],
};

// Body parser middleware - Move BEFORE CORS to ensure it processes first
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cors(corsOptions));

// Apply firewall middleware AFTER CORS
if (app.plugins.firewall && app.getFirewallMiddleware) {
  console.log(
    "=== SERVER: Firewall plugin detected. Applying middleware... ==="
  );
  const middleware = app.getFirewallMiddleware();
  if (typeof middleware === "function") {
    app.use(middleware);
    console.log("=== SERVER: Firewall middleware applied successfully. ===");
  } else {
    console.error(
      "=== SERVER ERROR: getFirewallMiddleware() did not return a function! ==="
    );
  }
} else {
  console.log(
    "=== SERVER: Firewall plugin not loaded or middleware not available. Skipping middleware application. ==="
  );
}

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

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  trustProxy: true,
  skip: (req) => {
    // Skip rate limiting for admin routes and plugin APIs
    const isAdminRoute =
      req.originalUrl &&
      (req.originalUrl.startsWith("/api/admin") ||
        req.originalUrl.startsWith("/api/firewall") ||
        req.originalUrl.startsWith("/api/web-performance") ||
        req.originalUrl.includes("/admin"));

    // Also skip if admin bypass header is present
    const hasAdminBypass = req.headers["x-admin-bypass"];

    if (isAdminRoute || hasAdminBypass) {
      console.log(
        `[Global Rate Limiter] Skipping rate limit for admin route: ${req.originalUrl}`
      );
      return true;
    }

    return false;
  },
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
});

// Apply conditional rate limiter
app.use(limiter);

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
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  })
);

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Debug middleware for session and authentication
app.use((req, res, next) => {
  console.log("Session ID:", req.sessionID);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("User:", req.user);
  next();
});

// Import passport configuration
require("./config/passport");

// Register firewall routes AFTER session and passport setup
console.error("🚨 HEROKU DEBUG: Starting firewall routes registration check");
if (app.plugins.firewall && app.registerFirewallRoutes) {
  console.error("🚨 HEROKU DEBUG: Firewall plugin and register function found");

  isPluginEnabled("firewall")
    .then((enabled) => {
      console.error(
        "🚨 HEROKU DEBUG: Firewall routes enabled status:",
        enabled
      );
      if (enabled) {
        console.error(
          "🚨 HEROKU DEBUG: Registering Firewall Routes After Session Setup"
        );
        app.registerFirewallRoutes();
        console.error("🚨 HEROKU DEBUG: Firewall routes registration complete");
      } else {
        console.error(
          "🚨 HEROKU DEBUG: Firewall plugin is disabled - skipping route registration"
        );
      }
    })
    .catch((error) => {
      console.error(
        "🚨 HEROKU DEBUG: Error checking firewall plugin status:",
        error
      );
      // Fallback: register routes anyway since plugin is loaded
      console.error("🚨 HEROKU DEBUG: Registering firewall routes as fallback");
      app.registerFirewallRoutes();
    });
} else {
  console.error(
    "🚨 HEROKU DEBUG: Firewall plugin or register function not available"
  );
  console.error("🚨 HEROKU DEBUG: Firewall plugin:", !!app.plugins.firewall);
  console.error(
    "🚨 HEROKU DEBUG: Register function:",
    !!app.registerFirewallRoutes
  );
}

// Register web performance routes AFTER session and passport setup
if (
  app.plugins["web-performance-optimization"] &&
  app.registerWebPerformanceRoutes
) {
  isPluginEnabled("web-performance-optimization").then((enabled) => {
    if (enabled) {
      console.log(
        "=== Registering Web Performance Routes After Session Setup ==="
      );
      app.registerWebPerformanceRoutes();
    } else {
      console.log(
        "=== Web Performance plugin is disabled - skipping route registration ==="
      );
    }
  });
}

// Import routes
const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contact");
const pluginsRoutes = require("./routes/plugins");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/plugins", pluginsRoutes);

// --- Example of using the loaded licensing plugin ---
if (app.plugins.licensing) {
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
}
// --- End Example ---

// --- Admin Routes (only if firewall plugin is loaded and enabled) ---
console.error("🚨 HEROKU DEBUG: Starting admin routes registration check");
console.error(
  "🚨 HEROKU DEBUG: app.plugins.firewall exists:",
  !!app.plugins.firewall
);

if (app.plugins.firewall) {
  console.error(
    "🚨 HEROKU DEBUG: Firewall plugin found, attempting to register admin routes"
  );

  isPluginEnabled("firewall")
    .then((enabled) => {
      console.error(
        "🚨 HEROKU DEBUG: Firewall plugin enabled status:",
        enabled
      );
      if (enabled) {
        console.error("🚨 HEROKU DEBUG: Registering Admin Routes");
        const { requireAdmin } = app.plugins.firewall.middleware;

        // Admin routes - only accessible to admin users
        const adminRouter = express.Router();

        // Add comprehensive logging middleware to admin routes
        adminRouter.use((req, res, next) => {
          console.error(
            `🚨 HEROKU DEBUG: Admin route hit: ${req.method} ${req.originalUrl}`
          );
          console.error(
            `🚨 HEROKU DEBUG: User:`,
            req.user
              ? {
                  id: req.user._id,
                  email: req.user.email,
                  role: req.user.role,
                }
              : "No user"
          );
          console.error(
            `🚨 HEROKU DEBUG: Authenticated:`,
            req.isAuthenticated ? req.isAuthenticated() : false
          );
          next();
        });

        // Admin dashboard
        adminRouter.get("/", requireAdmin, (req, res) => {
          console.error(
            "🚨 HEROKU DEBUG: Admin dashboard endpoint hit successfully"
          );
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

        // Admin user info
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

        app.use("/api/admin", adminRouter);
        console.error("🚨 HEROKU DEBUG: Admin routes registered at /api/admin");
        console.error("🚨 HEROKU DEBUG: Available admin endpoints:");
        console.error("🚨 HEROKU DEBUG:   - GET /api/admin - Admin dashboard");
        console.error(
          "🚨 HEROKU DEBUG:   - GET /api/admin/user - Admin user info"
        );
        console.error("🚨 HEROKU DEBUG: Admin Routes Registration Complete");
      } else {
        console.error(
          "🚨 HEROKU DEBUG: Firewall plugin disabled - admin routes not registered"
        );
      }
    })
    .catch((error) => {
      console.error(
        "🚨 HEROKU DEBUG: Error checking firewall plugin status for admin routes:",
        error
      );
      // Fallback: register admin routes anyway
      console.error("🚨 HEROKU DEBUG: Registering admin routes as fallback");
      const { requireAdmin } = app.plugins.firewall.middleware;

      const adminRouter = express.Router();

      // Add logging middleware
      adminRouter.use((req, res, next) => {
        console.error(
          `🚨 HEROKU DEBUG FALLBACK: Admin route hit: ${req.method} ${req.originalUrl}`
        );
        next();
      });

      adminRouter.get("/", requireAdmin, (req, res) => {
        console.error("🚨 HEROKU DEBUG FALLBACK: Admin dashboard endpoint hit");
        res.json({
          success: true,
          message: "Admin dashboard access granted (fallback)",
          user: {
            email: req.user.email,
            role: req.user.role,
            name: req.user.name,
          },
          availablePlugins: Object.keys(app.plugins),
          timestamp: new Date().toISOString(),
        });
      });

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

      app.use("/api/admin", adminRouter);
      console.error("🚨 HEROKU DEBUG: Admin routes registered as fallback");
    });
} else {
  console.error(
    "🚨 HEROKU DEBUG: Firewall plugin not loaded - admin routes not registered"
  );
}
// --- End Admin Routes ---

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

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
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
      useNewUrlParser: true,
      useUnifiedTopology: true,
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
    app.listen(0, () => {
      console.log(`Server running on port ${server.address().port}`);
    });
  }
});

// Start MongoDB connection
connectWithRetry();

module.exports = app;
