const rateLimit = require("express-rate-limit");
const { createPluginLogger } = require("./logger");
const { getCoreSettings } = require("./coreSettings");

const logger = createPluginLogger("rate-limiting");

// ============================================
// LICENSE-AWARE RATE LIMITING CORE LOGIC
// ============================================

// Global license cache (1 hour TTL, same as licensing middleware)
let licenseCache = null;
let lastLicenseCheck = 0;
const LICENSE_CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Global rate limiting configuration cache (5 minutes TTL)
let rateLimitCache = null;
let lastConfigCheck = 0;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get license information for rate limiting decisions
 * Leverages the existing licensing middleware cache when available
 */
const getLicenseInfo = async () => {
  const now = Date.now();

  // Return cached info if valid
  if (licenseCache && now - lastLicenseCheck < LICENSE_CACHE_DURATION) {
    return licenseCache;
  }

  try {
    const isDevelopment = process.env.NODE_ENV === "development";
    const hasLicenseKey = !!process.env.HMERN_LICENSE_KEY;

    lastLicenseCheck = now;

    // In development without license key - free mode
    if (isDevelopment && !hasLicenseKey) {
      licenseCache = {
        plan: "free",
        features: [],
        development_mode: true,
        free_mode: true,
      };
      logger.config.debug("License info: Development free mode");
      return licenseCache;
    }

    // In development with license key - development mode with features
    if (isDevelopment && hasLicenseKey) {
      licenseCache = {
        plan: "development",
        features: ["firewall", "analytics", "premium_support"],
        development_mode: true,
      };
      logger.config.debug("License info: Development mode with features");
      return licenseCache;
    }

    // Production mode - default to free until we can access the licensing middleware cache
    licenseCache = {
      plan: "free",
      features: [],
      development_mode: false,
    };

    logger.config.info(
      "License info: Production mode defaulting to free plan",
      {
        hasLicenseKey,
        isDevelopment,
      }
    );

    return licenseCache;
  } catch (error) {
    logger.config.error("Error getting license info for rate limiting", {
      error: error.message,
      errorStack: error.stack,
    });

    // Safe fallback to most restrictive plan
    licenseCache = {
      plan: "free",
      features: [],
      error: true,
    };
    return licenseCache;
  }
};

/**
 * Get rate limiting tiers based on license information
 * Returns appropriate limits for different license plans
 */
const getRateLimitTiers = (licenseInfo) => {
  const { plan, features } = licenseInfo;

  logger.config.debug("Getting rate limit tiers for license", {
    plan,
    features: features?.length || 0,
    hasFirewall: features?.includes("firewall"),
    hasPremiumSupport: features?.includes("premium_support"),
  });

  // Pro plan (highest tier)
  if (plan === "pro" || features?.includes("premium_support")) {
    return {
      tier: "pro",
      core: { windowMs: 15 * 60 * 1000, max: 500 }, // 500 req/15min
      admin: { windowMs: 15 * 60 * 1000, max: 500 }, // 500 req/15min
      critical: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 req/15min
      firewall: { windowMs: 10 * 60 * 1000, max: 50 }, // 50 req/10min
    };
  }

  // Basic licensed plan (has firewall or other features)
  if (plan === "basic" || features?.includes("firewall")) {
    return {
      tier: "basic",
      core: { windowMs: 15 * 60 * 1000, max: 200 }, // 200 req/15min
      admin: { windowMs: 15 * 60 * 1000, max: 300 }, // 300 req/15min
      critical: { windowMs: 15 * 60 * 1000, max: 50 }, // 50 req/15min
      firewall: { windowMs: 10 * 60 * 1000, max: 25 }, // 25 req/10min
    };
  }

  // Development mode gets enhanced limits for testing
  if (licenseInfo.development_mode && features?.length > 0) {
    return {
      tier: "development",
      core: { windowMs: 15 * 60 * 1000, max: 300 }, // 300 req/15min
      admin: { windowMs: 15 * 60 * 1000, max: 400 }, // 400 req/15min
      critical: { windowMs: 15 * 60 * 1000, max: 75 }, // 75 req/15min
      firewall: { windowMs: 10 * 60 * 1000, max: 35 }, // 35 req/10min
    };
  }

  // Free plan (most restrictive)
  return {
    tier: "free",
    core: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 req/15min
    admin: { windowMs: 15 * 60 * 1000, max: 150 }, // 150 req/15min
    critical: { windowMs: 15 * 60 * 1000, max: 30 }, // 30 req/15min
    firewall: { windowMs: 10 * 60 * 1000, max: 15 }, // 15 req/10min
  };
};

/**
 * Get license-aware rate limiting configuration
 * Combines license info with database settings for final configuration
 */
const getLicenseAwareRateConfig = async (coreSettings = null) => {
  try {
    const licenseInfo = await getLicenseInfo();
    const licenseTiers = getRateLimitTiers(licenseInfo);

    logger.config.info("Generated license-aware rate configuration", {
      licensePlan: licenseInfo.plan,
      tier: licenseTiers.tier,
      coreSettings: !!coreSettings,
      development: licenseInfo.development_mode,
    });

    // If we have database settings, they can override license defaults
    if (coreSettings?.rateLimiting) {
      const dbConfig = coreSettings.rateLimiting;

      // Use database settings if explicitly configured, otherwise use license tiers
      const finalConfig = {
        licenseInfo,
        licenseTiers,
        core: {
          windowMs:
            dbConfig.windowMs !== undefined
              ? dbConfig.windowMs
              : licenseTiers.core.windowMs,
          max:
            dbConfig.maxRequests !== undefined
              ? dbConfig.maxRequests
              : licenseTiers.core.max,
        },
        admin: {
          windowMs:
            dbConfig.adminWindowMs !== undefined
              ? dbConfig.adminWindowMs
              : licenseTiers.admin.windowMs,
          max:
            dbConfig.adminMaxRequests !== undefined
              ? dbConfig.adminMaxRequests
              : licenseTiers.admin.max,
        },
        critical: {
          windowMs:
            dbConfig.criticalWindowMs !== undefined
              ? dbConfig.criticalWindowMs
              : licenseTiers.critical.windowMs,
          max:
            dbConfig.criticalMaxRequests !== undefined
              ? dbConfig.criticalMaxRequests
              : licenseTiers.critical.max,
        },
        firewall: {
          windowMs:
            dbConfig.firewallWindowMs !== undefined
              ? dbConfig.firewallWindowMs
              : licenseTiers.firewall.windowMs,
          max:
            dbConfig.firewallMaxRequests !== undefined
              ? dbConfig.firewallMaxRequests
              : licenseTiers.firewall.max,
        },
        settings: {
          enabled: dbConfig.enabled !== undefined ? dbConfig.enabled : true,
          skipAdminRoutes:
            dbConfig.skipAdminRoutes !== undefined
              ? dbConfig.skipAdminRoutes
              : true,
          skipPluginRoutes:
            dbConfig.skipPluginRoutes !== undefined
              ? dbConfig.skipPluginRoutes
              : true,
          message:
            dbConfig.message ||
            `Rate limit exceeded for ${licenseInfo.plan} plan`,
          trustProxy:
            coreSettings.security?.trustProxy !== undefined
              ? coreSettings.security.trustProxy
              : true,
        },
      };

      return finalConfig;
    }

    // No database settings, use pure license-based configuration
    return {
      licenseInfo,
      licenseTiers,
      core: licenseTiers.core,
      admin: licenseTiers.admin,
      critical: licenseTiers.critical,
      firewall: licenseTiers.firewall,
      settings: {
        enabled: true,
        skipAdminRoutes: true,
        skipPluginRoutes: true,
        message: `Rate limit exceeded for ${licenseInfo.plan} plan`,
        trustProxy: true,
      },
    };
  } catch (error) {
    logger.config.error("Error creating license-aware rate config", {
      error: error.message,
      errorStack: error.stack,
    });

    // Safe fallback to most restrictive configuration
    return {
      licenseInfo: { plan: "free", features: [], error: true },
      licenseTiers: getRateLimitTiers({ plan: "free", features: [] }),
      core: { windowMs: 15 * 60 * 1000, max: 50 }, // Even more restrictive fallback
      admin: { windowMs: 15 * 60 * 1000, max: 75 },
      critical: { windowMs: 15 * 60 * 1000, max: 15 },
      firewall: { windowMs: 10 * 60 * 1000, max: 10 },
      settings: {
        enabled: true,
        skipAdminRoutes: false, // Don't skip anything on error
        skipPluginRoutes: false,
        message: "Rate limit exceeded (error mode)",
        trustProxy: true,
      },
    };
  }
};

/**
 * Get license plan display name for UI
 */
const getLicensePlanDisplay = (licenseInfo) => {
  if (!licenseInfo) return "Unknown";

  if (licenseInfo.development_mode) {
    return licenseInfo.free_mode
      ? "Development (Free)"
      : "Development (Licensed)";
  }

  switch (licenseInfo.plan) {
    case "pro":
      return "Pro";
    case "basic":
      return "Basic";
    case "free":
      return "Free";
    default:
      return licenseInfo.plan || "Unknown";
  }
};

// ============================================
// ADMIN RATE LIMITING SYSTEM
// ============================================

/**
 * Get cached rate limiting configuration
 */
const getCachedRateConfig = async () => {
  const now = Date.now();

  if (rateLimitCache && now - lastConfigCheck < CONFIG_CACHE_DURATION) {
    return rateLimitCache;
  }

  try {
    const coreSettings = await getCoreSettings();
    const rateConfig = await getLicenseAwareRateConfig(coreSettings);

    rateLimitCache = rateConfig;
    lastConfigCheck = now;

    logger.config.debug("Rate limiting configuration cached", {
      licensePlan: rateConfig.licenseInfo.plan,
      tier: rateConfig.licenseTiers.tier,
      cacheExpiry: new Date(now + CONFIG_CACHE_DURATION).toISOString(),
    });

    return rateConfig;
  } catch (error) {
    logger.config.error("Error caching rate configuration", {
      error: error.message,
      errorStack: error.stack,
    });

    // Return basic fallback configuration
    return {
      admin: { windowMs: 15 * 60 * 1000, max: 100 },
      critical: { windowMs: 15 * 60 * 1000, max: 20 },
      firewall: { windowMs: 10 * 60 * 1000, max: 10 },
      settings: {
        enabled: true,
        skipAdminRoutes: false,
        message: "Rate limit exceeded (fallback mode)",
        trustProxy: true,
      },
    };
  }
};

/**
 * Create a standardized rate limiter with consistent logging and error handling
 */
const createStandardRateLimiter = (config, type = "admin") => {
  const defaults = {
    windowMs: config.windowMs,
    max: config.max,
    message: {
      success: false,
      message:
        config.message ||
        `Too many ${type} requests from this IP, please try again later.`,
      retryAfter: Math.ceil(config.windowMs / 1000),
      rateLimitType: type,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.middleware.warn(`${type} rate limit exceeded`, {
        ip: req.ip,
        url: req.originalUrl,
        userAgent: req.headers["user-agent"],
        userId: req.user?.id,
        rateLimitType: type,
        method: req.method,
      });
      res.status(429).json(defaults.message);
    },
    skip: (req) => {
      // Skip rate limiting for localhost in development
      if (process.env.NODE_ENV === "development" && req.ip === "127.0.0.1") {
        return true;
      }
      return false;
    },
  };

  return rateLimit(defaults);
};

/**
 * Create license-aware admin rate limiter (general admin operations)
 */
const createLicenseAwareAdminRateLimit = async (options = {}) => {
  try {
    const rateConfig = await getCachedRateConfig();
    const adminConfig = { ...rateConfig.admin, ...options };

    logger.config.debug("Creating admin rate limiter", {
      licensePlan: rateConfig.licenseInfo.plan,
      tier: rateConfig.licenseTiers.tier,
      windowMs: adminConfig.windowMs,
      max: adminConfig.max,
      overrides: Object.keys(options).length > 0,
    });

    return createStandardRateLimiter(adminConfig, "admin");
  } catch (error) {
    logger.config.error("Error creating admin rate limiter, using fallback", {
      error: error.message,
    });

    // Fallback to basic admin rate limiting
    return createStandardRateLimiter(
      {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many admin requests (fallback mode)",
      },
      "admin"
    );
  }
};

/**
 * Create license-aware critical operations rate limiter
 */
const createLicenseAwareCriticalRateLimit = async (options = {}) => {
  try {
    const rateConfig = await getCachedRateConfig();
    const criticalConfig = { ...rateConfig.critical, ...options };

    logger.config.debug("Creating critical rate limiter", {
      licensePlan: rateConfig.licenseInfo.plan,
      tier: rateConfig.licenseTiers.tier,
      windowMs: criticalConfig.windowMs,
      max: criticalConfig.max,
      overrides: Object.keys(options).length > 0,
    });

    return createStandardRateLimiter(criticalConfig, "critical");
  } catch (error) {
    logger.config.error(
      "Error creating critical rate limiter, using fallback",
      {
        error: error.message,
      }
    );

    return createStandardRateLimiter(
      {
        windowMs: 15 * 60 * 1000,
        max: 20,
        message: "Too many critical operations (fallback mode)",
      },
      "critical"
    );
  }
};

/**
 * Create license-aware firewall operations rate limiter
 */
const createLicenseAwareFirewallRateLimit = async (options = {}) => {
  try {
    const rateConfig = await getCachedRateConfig();
    const firewallConfig = { ...rateConfig.firewall, ...options };

    logger.config.debug("Creating firewall rate limiter", {
      licensePlan: rateConfig.licenseInfo.plan,
      tier: rateConfig.licenseTiers.tier,
      windowMs: firewallConfig.windowMs,
      max: firewallConfig.max,
      overrides: Object.keys(options).length > 0,
    });

    return createStandardRateLimiter(firewallConfig, "firewall");
  } catch (error) {
    logger.config.error(
      "Error creating firewall rate limiter, using fallback",
      {
        error: error.message,
      }
    );

    return createStandardRateLimiter(
      {
        windowMs: 10 * 60 * 1000,
        max: 10,
        message: "Too many firewall operations (fallback mode)",
      },
      "firewall"
    );
  }
};

/**
 * Get all admin rate limiters as a pre-configured set
 * This is the main function for getting all admin rate limiting middleware
 */
const getAdminRateLimiters = async () => {
  try {
    const [adminLimiter, criticalLimiter, firewallLimiter] = await Promise.all([
      createLicenseAwareAdminRateLimit(),
      createLicenseAwareCriticalRateLimit(),
      createLicenseAwareFirewallRateLimit(),
    ]);

    const rateConfig = await getCachedRateConfig();

    logger.config.info("Generated complete admin rate limiter set", {
      licensePlan: rateConfig.licenseInfo.plan,
      tier: rateConfig.licenseTiers.tier,
      adminMax: rateConfig.admin.max,
      criticalMax: rateConfig.critical.max,
      firewallMax: rateConfig.firewall.max,
    });

    return {
      admin: adminLimiter,
      critical: criticalLimiter,
      firewall: firewallLimiter,

      // Legacy compatibility - these are the same as above
      adminRateLimit: adminLimiter,
      strictAdminRateLimit: criticalLimiter,
      criticalAdminRateLimit: criticalLimiter,
      firewallAdminRateLimit: firewallLimiter,

      // Configuration info for debugging
      config: rateConfig,
    };
  } catch (error) {
    logger.config.error("Error getting admin rate limiters, using fallbacks", {
      error: error.message,
      errorStack: error.stack,
    });

    // Return fallback rate limiters
    const fallbackLimiter = createStandardRateLimiter(
      {
        windowMs: 15 * 60 * 1000,
        max: 50,
        message: "Rate limit exceeded (emergency fallback)",
      },
      "fallback"
    );

    return {
      admin: fallbackLimiter,
      critical: criticalLimiter,
      firewall: firewallLimiter,
      adminRateLimit: fallbackLimiter,
      strictAdminRateLimit: fallbackLimiter,
      criticalAdminRateLimit: fallbackLimiter,
      firewallAdminRateLimit: fallbackLimiter,
      config: null,
    };
  }
};

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Invalidate the license cache (useful when license status changes)
 */
const invalidateLicenseCache = () => {
  licenseCache = null;
  lastLicenseCheck = 0;
  logger.config.info("License cache invalidated");
};

/**
 * Invalidate the rate limiting configuration cache
 * Useful when settings change or license status updates
 */
const invalidateRateLimitCache = () => {
  rateLimitCache = null;
  lastConfigCheck = 0;
  logger.config.info("Rate limiting configuration cache invalidated");
};

/**
 * Invalidate all caches
 */
const invalidateAllCaches = () => {
  invalidateLicenseCache();
  invalidateRateLimitCache();
  logger.config.info("All rate limiting caches invalidated");
};

// ============================================
// BACKWARD COMPATIBILITY FALLBACK INSTANCES
// ============================================

/**
 * Pre-configured instances for immediate use (backward compatibility)
 * These are created synchronously but will use fallback values until cache is populated
 */
const createFallbackRateLimiter = (
  max,
  windowMs = 15 * 60 * 1000,
  type = "admin"
) => {
  return createStandardRateLimiter(
    {
      windowMs,
      max,
      message: `Too many ${type} requests (using fallback limits)`,
    },
    type
  );
};

// Backward compatibility exports - these use fallback values initially
const adminRateLimit = createFallbackRateLimiter(100, 15 * 60 * 1000, "admin");
const strictAdminRateLimit = createFallbackRateLimiter(
  20,
  15 * 60 * 1000,
  "strict"
);
const criticalAdminRateLimit = createFallbackRateLimiter(
  10,
  15 * 60 * 1000,
  "critical"
);
const firewallAdminRateLimit = createFallbackRateLimiter(
  15,
  10 * 60 * 1000,
  "firewall"
);

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // License-aware core functions
  getLicenseInfo,
  getRateLimitTiers,
  getLicenseAwareRateConfig,
  getLicensePlanDisplay,

  // Admin rate limiting functions (recommended)
  getAdminRateLimiters,
  createLicenseAwareAdminRateLimit,
  createLicenseAwareCriticalRateLimit,
  createLicenseAwareFirewallRateLimit,
  getCachedRateConfig,

  // Cache management
  invalidateLicenseCache,
  invalidateRateLimitCache,
  invalidateAllCaches,

  // Legacy compatibility (deprecated but maintained for backward compatibility)
  createAdminRateLimit: createLicenseAwareAdminRateLimit,
  createStrictAdminRateLimit: createLicenseAwareCriticalRateLimit,
  createCriticalAdminRateLimit: createLicenseAwareCriticalRateLimit,
  createFirewallAdminRateLimit: createLicenseAwareFirewallRateLimit,

  // Pre-configured instances (fallback values, prefer getAdminRateLimiters())
  adminRateLimit,
  strictAdminRateLimit,
  criticalAdminRateLimit,
  firewallAdminRateLimit,
};
