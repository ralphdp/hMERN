const {
  WebPerformanceSettings,
  WebPerformanceMetrics,
  WebPerformanceQueue,
} = require("./models");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// Redis client setup (optional - will be initialized if enabled)
let redisClient = null;

// Initialize Redis client if enabled
const initializeRedis = async (settings) => {
  try {
    if (
      !settings?.cachingLayers?.databaseCache?.enabled ||
      !process.env.REDIS_PUBLIC_ENDPOINT
    ) {
      return null;
    }

    const redis = require("redis");
    const client = redis.createClient({
      url: `redis://${process.env.REDIS_PUBLIC_ENDPOINT}`,
      password: settings.cachingLayers.databaseCache.redisPassword || undefined,
      socket: {
        connectTimeout: 5000,
        lazyConnect: true,
      },
    });

    client.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    await client.connect();
    console.log("Redis client connected successfully");
    return client;
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
    return null;
  }
};

// File minification utilities
const minifyCSS = (content) => {
  // Basic CSS minification
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/;\s*}/g, "}") // Remove semicolon before closing brace
    .replace(/\s*{\s*/g, "{") // Remove spaces around opening brace
    .replace(/\s*}\s*/g, "}") // Remove spaces around closing brace
    .replace(/\s*,\s*/g, ",") // Remove spaces around commas
    .replace(/\s*:\s*/g, ":") // Remove spaces around colons
    .replace(/\s*;\s*/g, ";") // Remove spaces around semicolons
    .trim();
};

const minifyJS = (content) => {
  // Basic JS minification (for production, consider using a proper minifier)
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
    .replace(/\/\/.*$/gm, "") // Remove line comments
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\s*{\s*/g, "{") // Remove spaces around braces
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*,\s*/g, ",") // Remove spaces around commas
    .replace(/\s*;\s*/g, ";") // Remove spaces around semicolons
    .trim();
};

// Image optimization utilities
const optimizeImage = async (inputPath, outputPath, settings) => {
  try {
    const sharp = require("sharp");
    const inputBuffer = fs.readFileSync(inputPath);
    const { maxWidth, maxHeight, jpegQuality, pngQuality, webpQuality } =
      settings.fileOptimization.images;

    let pipeline = sharp(inputBuffer);

    // Resize if necessary
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });

    const ext = path.extname(inputPath).toLowerCase();

    if (ext === ".jpg" || ext === ".jpeg") {
      pipeline = pipeline.jpeg({ quality: jpegQuality });
    } else if (ext === ".png") {
      pipeline = pipeline.png({ quality: pngQuality });
    } else if (ext === ".webp") {
      pipeline = pipeline.webp({ quality: webpQuality });
    }

    const outputBuffer = await pipeline.toBuffer();
    fs.writeFileSync(outputPath, outputBuffer);

    return {
      originalSize: inputBuffer.length,
      optimizedSize: outputBuffer.length,
      savings: inputBuffer.length - outputBuffer.length,
    };
  } catch (error) {
    console.error("Image optimization error:", error);
    throw error;
  }
};

// Convert image to WebP
const convertToWebP = async (inputPath, outputPath, quality = 80) => {
  try {
    const sharp = require("sharp");
    const inputBuffer = fs.readFileSync(inputPath);

    const outputBuffer = await sharp(inputBuffer).webp({ quality }).toBuffer();

    fs.writeFileSync(outputPath, outputBuffer);

    return {
      originalSize: inputBuffer.length,
      optimizedSize: outputBuffer.length,
      savings: inputBuffer.length - outputBuffer.length,
    };
  } catch (error) {
    console.error("WebP conversion error:", error);
    throw error;
  }
};

// Admin authentication middleware (reused from firewall pattern)
const requireAdmin = (req, res, next) => {
  console.log("=== Web Performance Admin Auth Check ===");
  console.log("User:", req.user);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("Session ID:", req.sessionID);

  if (!req.isAuthenticated()) {
    console.log("User not authenticated - returning 401");
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user) {
    console.log("No user object - returning 401");
    return res.status(401).json({
      success: false,
      message: "User not found in session",
    });
  }

  if (req.user.role !== "admin") {
    console.log(`User role '${req.user.role}' is not admin - returning 403`);
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  console.log("Admin access granted");
  next();
};

// Performance monitoring middleware
const performanceMonitoringMiddleware = async (req, res, next) => {
  try {
    // Quick exit for auth and essential API calls
    if (req.url.includes("/api/auth") || req.url.includes("/api/plugins")) {
      return next();
    }

    const settings = await getCachedSettings();

    if (!settings || !settings.general.enabled) {
      return next();
    }

    // Start timing
    req.startTime = Date.now();

    // Override res.end to capture response metrics
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
      // Calculate response time
      const responseTime = Date.now() - req.startTime;

      // Store metrics asynchronously (don't block response)
      setImmediate(async () => {
        try {
          await recordPerformanceMetric({
            responseTime,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
          });
        } catch (error) {
          console.error("Failed to record performance metric:", error);
        }
      });

      // Call original end
      originalEnd.call(this, chunk, encoding);
    };

    next();
  } catch (error) {
    console.error("Performance monitoring middleware error:", error);
    next();
  }
};

// Redis caching middleware
const redisCacheMiddleware = async (req, res, next) => {
  try {
    // Quick exit for auth and essential API calls
    if (req.url.includes("/api/auth") || req.url.includes("/api/plugins")) {
      return next();
    }

    const settings = await getCachedSettings();

    if (!settings?.cachingLayers?.databaseCache?.enabled || !redisClient) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Generate cache key
    const cacheKey = `web-perf:${crypto
      .createHash("md5")
      .update(req.url)
      .digest("hex")}`;

    try {
      // Try to get from cache
      const cachedResponse = await redisClient.get(cacheKey);

      if (cachedResponse) {
        const cached = JSON.parse(cachedResponse);

        // Set cached headers
        res.set(cached.headers);
        res.status(cached.status);
        res.send(cached.body);

        // Record cache hit
        await recordCacheHit(true);
        return;
      }
    } catch (cacheError) {
      console.error("Cache retrieval error:", cacheError);
    }

    // Cache miss - intercept response
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function (body) {
      // Cache the response
      setImmediate(async () => {
        try {
          const cacheData = {
            status: res.statusCode,
            headers: res.getHeaders(),
            body: body,
          };

          const ttl = settings.cachingLayers.databaseCache.defaultTTL;
          await redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheData));
        } catch (cacheError) {
          console.error("Cache storage error:", cacheError);
        }
      });

      // Record cache miss
      recordCacheHit(false);

      originalSend.call(this, body);
    };

    res.json = function (body) {
      // Cache the response
      setImmediate(async () => {
        try {
          const cacheData = {
            status: res.statusCode,
            headers: res.getHeaders(),
            body: body,
          };

          const ttl = settings.cachingLayers.databaseCache.defaultTTL;
          await redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheData));
        } catch (cacheError) {
          console.error("Cache storage error:", cacheError);
        }
      });

      // Record cache miss
      recordCacheHit(false);

      originalJson.call(this, body);
    };

    next();
  } catch (error) {
    console.error("Redis cache middleware error:", error);
    next();
  }
};

// Cache headers middleware
const cacheHeadersMiddleware = async (req, res, next) => {
  try {
    // Quick exit for auth and essential API calls
    if (req.url.includes("/api/auth") || req.url.includes("/api/plugins")) {
      return next();
    }

    const settings = await getCachedSettings();

    if (!settings || !settings.cachingLayers.browserCache.enabled) {
      return next();
    }

    const { browserCache } = settings.cachingLayers;

    // Apply cache headers based on file type
    const isStaticFile =
      /\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i.test(req.url);

    if (isStaticFile) {
      // Static files - long cache
      res.setHeader(
        "Cache-Control",
        `public, max-age=${browserCache.staticFilesTTL}`
      );
      if (browserCache.enableETag) {
        // Simple ETag based on file path and timestamp
        const etag = `"${Buffer.from(req.url + Date.now()).toString(
          "base64"
        )}"`;
        res.setHeader("ETag", etag);
      }
      if (browserCache.enableLastModified) {
        res.setHeader("Last-Modified", new Date().toUTCString());
      }
    } else if (browserCache.dynamicContentTTL > 0) {
      // Dynamic content - short cache if enabled
      res.setHeader(
        "Cache-Control",
        `public, max-age=${browserCache.dynamicContentTTL}`
      );
    }

    next();
  } catch (error) {
    console.error("Cache headers middleware error:", error);
    next();
  }
};

// Compression middleware (GZIP/Brotli)
const compressionMiddleware = async (req, res, next) => {
  try {
    // Quick exit for auth and essential API calls
    if (req.url.includes("/api/auth") || req.url.includes("/api/plugins")) {
      return next();
    }

    const settings = await getCachedSettings();

    if (!settings || !settings.fileOptimization.compression.enableGzip) {
      return next();
    }

    const acceptEncoding = req.headers["accept-encoding"] || "";
    const { compression } = settings.fileOptimization;

    // Check if client supports compression
    if (compression.enableBrotli && acceptEncoding.includes("br")) {
      res.setHeader("Content-Encoding", "br");
    } else if (compression.enableGzip && acceptEncoding.includes("gzip")) {
      res.setHeader("Content-Encoding", "gzip");
    }

    // Set Vary header for proper caching
    res.setHeader("Vary", "Accept-Encoding");

    next();
  } catch (error) {
    console.error("Compression middleware error:", error);
    next();
  }
};

// Lazy loading injection middleware (for HTML responses)
const lazyLoadingMiddleware = async (req, res, next) => {
  try {
    // Quick exit for auth and essential API calls
    if (req.url.includes("/api/auth") || req.url.includes("/api/plugins")) {
      return next();
    }

    const settings = await getCachedSettings();

    if (!settings || !settings.performanceFeatures.lazyLoading.enabled) {
      return next();
    }

    // Only process HTML responses
    if (req.accepts("html") && req.method === "GET") {
      const originalSend = res.send;

      res.send = function (body) {
        if (typeof body === "string" && body.includes("<img")) {
          // Inject lazy loading attributes
          body = injectLazyLoading(
            body,
            settings.performanceFeatures.lazyLoading
          );
        }

        originalSend.call(this, body);
      };
    }

    next();
  } catch (error) {
    console.error("Lazy loading middleware error:", error);
    next();
  }
};

// Critical CSS injection middleware
const criticalCSSMiddleware = async (req, res, next) => {
  try {
    // Quick exit for auth and essential API calls
    if (req.url.includes("/api/auth") || req.url.includes("/api/plugins")) {
      return next();
    }

    const settings = await getCachedSettings();

    if (!settings?.performanceFeatures?.criticalCSS?.enabled) {
      return next();
    }

    // Only process HTML responses
    if (req.accepts("html") && req.method === "GET") {
      const originalSend = res.send;

      res.send = function (body) {
        if (typeof body === "string" && body.includes("<head>")) {
          // Inject critical CSS
          body = injectCriticalCSS(
            body,
            settings.performanceFeatures.criticalCSS
          );
        }

        originalSend.call(this, body);
      };
    }

    next();
  } catch (error) {
    console.error("Critical CSS middleware error:", error);
    next();
  }
};

// Preloading middleware
const preloadingMiddleware = async (req, res, next) => {
  try {
    // Quick exit for auth and essential API calls
    if (req.url.includes("/api/auth") || req.url.includes("/api/plugins")) {
      return next();
    }

    const settings = await getCachedSettings();

    if (!settings?.performanceFeatures?.preloading?.enabled) {
      return next();
    }

    // Only process HTML responses
    if (req.accepts("html") && req.method === "GET") {
      const originalSend = res.send;

      res.send = function (body) {
        if (typeof body === "string" && body.includes("<head>")) {
          // Inject preloading tags
          body = injectPreloadingTags(
            body,
            settings.performanceFeatures.preloading
          );
        }

        originalSend.call(this, body);
      };
    }

    next();
  } catch (error) {
    console.error("Preloading middleware error:", error);
    next();
  }
};

// Helper function to inject lazy loading
const injectLazyLoading = (html, lazyLoadingSettings) => {
  if (lazyLoadingSettings.enableImageLazyLoading) {
    // Add loading="lazy" to images
    html = html.replace(/<img(?![^>]*loading=)/gi, '<img loading="lazy"');
  }

  if (lazyLoadingSettings.enableIframeLazyLoading) {
    // Add loading="lazy" to iframes
    html = html.replace(/<iframe(?![^>]*loading=)/gi, '<iframe loading="lazy"');
  }

  return html;
};

// Helper function to inject critical CSS
const injectCriticalCSS = (html, criticalCSSSettings) => {
  if (!criticalCSSSettings.enableAutomaticExtraction) {
    return html;
  }

  // Simple critical CSS injection - in production, use a proper critical CSS extractor
  const criticalCSS = `
    <style>
      /* Critical CSS - Above the fold styles */
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .header, .hero, .main-content { display: block; }
      .footer { margin-top: 2rem; }
    </style>
  `;

  return html.replace(/<\/head>/, criticalCSS + "</head>");
};

// Helper function to inject preloading tags
const injectPreloadingTags = (html, preloadingSettings) => {
  let preloadTags = "";

  if (preloadingSettings.enableDNSPrefetch) {
    preloadTags += '<link rel="dns-prefetch" href="//fonts.googleapis.com">\n';
    preloadTags += '<link rel="dns-prefetch" href="//fonts.gstatic.com">\n';
  }

  if (preloadingSettings.enablePreconnect) {
    preloadTags +=
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n';
    preloadTags +=
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n';
  }

  if (preloadingSettings.preloadFonts) {
    preloadTags +=
      '<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>\n';
  }

  if (preloadingSettings.preloadCriticalImages) {
    preloadTags += '<link rel="preload" href="/images/hero.jpg" as="image">\n';
  }

  return html.replace(/<\/head>/, preloadTags + "</head>");
};

// Helper function to record performance metrics
const recordPerformanceMetric = async (metricData) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's metrics document
    let metrics = await WebPerformanceMetrics.findOne({ date: today });

    if (!metrics) {
      metrics = new WebPerformanceMetrics({ date: today });
    }

    // Update average response time
    const currentCount =
      metrics.caching.cacheHits + metrics.caching.cacheMisses;
    const newCount = currentCount + 1;
    const currentAvg = metrics.caching.avgResponseTime || 0;

    metrics.caching.avgResponseTime =
      (currentAvg * currentCount + metricData.responseTime) / newCount;

    // Increment cache misses (since this is a new request)
    metrics.caching.cacheMisses += 1;

    await metrics.save();
  } catch (error) {
    console.error("Failed to record performance metric:", error);
  }
};

// Helper function to record cache hits/misses
const recordCacheHit = async (isHit) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let metrics = await WebPerformanceMetrics.findOne({ date: today });

    if (!metrics) {
      metrics = new WebPerformanceMetrics({ date: today });
    }

    if (isHit) {
      metrics.caching.cacheHits += 1;
    } else {
      metrics.caching.cacheMisses += 1;
    }

    await metrics.save();
  } catch (error) {
    console.error("Failed to record cache metric:", error);
  }
};

// Process optimization queue
const processOptimizationQueue = async () => {
  try {
    const pendingTasks = await WebPerformanceQueue.find({ status: "pending" })
      .sort({ priority: -1, createdAt: 1 })
      .limit(5);

    for (const task of pendingTasks) {
      try {
        // Mark as processing
        task.status = "processing";
        task.attempts += 1;
        await task.save();

        let result = null;
        const settings = await getCachedSettings();

        switch (task.taskType) {
          case "minify_css":
            result = await processMinifyCSS(task.filePath, settings);
            break;
          case "minify_js":
            result = await processMinifyJS(task.filePath, settings);
            break;
          case "optimize_image":
            result = await processOptimizeImage(task.filePath, settings);
            break;
          case "upload_to_r2":
            result = await processUploadToR2(task.filePath, settings);
            break;
        }

        // Mark as completed
        task.status = "completed";
        task.result = result;
        task.completedAt = new Date();
        await task.save();

        // Update metrics
        await updateOptimizationMetrics(task.taskType, result);
      } catch (error) {
        console.error(`Task ${task._id} failed:`, error);

        task.status = task.attempts >= task.maxAttempts ? "failed" : "pending";
        task.error = error.message;
        await task.save();
      }
    }
  } catch (error) {
    console.error("Error processing optimization queue:", error);
  }
};

// Process CSS minification
const processMinifyCSS = async (filePath, settings) => {
  const content = fs.readFileSync(filePath, "utf8");
  const minified = minifyCSS(content);

  const outputPath = filePath.replace(".css", ".min.css");
  fs.writeFileSync(outputPath, minified);

  return {
    originalSize: content.length,
    optimizedSize: minified.length,
    savings: content.length - minified.length,
    outputPath,
  };
};

// Process JS minification
const processMinifyJS = async (filePath, settings) => {
  const content = fs.readFileSync(filePath, "utf8");
  const minified = minifyJS(content);

  const outputPath = filePath.replace(".js", ".min.js");
  fs.writeFileSync(outputPath, minified);

  return {
    originalSize: content.length,
    optimizedSize: minified.length,
    savings: content.length - minified.length,
    outputPath,
  };
};

// Process image optimization
const processOptimizeImage = async (filePath, settings) => {
  const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, ".optimized$1");
  return await optimizeImage(filePath, outputPath, settings);
};

// Process R2 upload
const processUploadToR2 = async (filePath, settings) => {
  // This would implement actual R2 upload using AWS SDK
  // For now, return a placeholder
  return {
    originalSize: fs.statSync(filePath).size,
    optimizedSize: fs.statSync(filePath).size,
    savings: 0,
    outputPath: `r2://bucket/${path.basename(filePath)}`,
  };
};

// Update optimization metrics
const updateOptimizationMetrics = async (taskType, result) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let metrics = await WebPerformanceMetrics.findOne({ date: today });

    if (!metrics) {
      metrics = new WebPerformanceMetrics({ date: today });
    }

    switch (taskType) {
      case "minify_css":
        metrics.optimization.cssMinified += 1;
        break;
      case "minify_js":
        metrics.optimization.jsMinified += 1;
        break;
      case "optimize_image":
        metrics.optimization.imagesOptimized += 1;
        if (result.outputPath?.includes(".webp")) {
          metrics.optimization.webpConverted += 1;
        }
        break;
    }

    metrics.optimization.totalSizeSaved += result.savings || 0;
    await metrics.save();
  } catch (error) {
    console.error("Failed to update optimization metrics:", error);
  }
};

// File validation helper
const validateFileAccess = (filePath, allowedDirectory) => {
  try {
    const resolvedPath = path.resolve(filePath);
    const allowedPath = path.resolve(allowedDirectory);

    // Ensure the file is within the allowed directory
    if (!resolvedPath.startsWith(allowedPath)) {
      return false;
    }

    // Check if file exists
    return fs.existsSync(resolvedPath);
  } catch (error) {
    return false;
  }
};

// Settings cache (to avoid repeated DB queries)
let settingsCache = null;
let settingsCacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedSettings = async () => {
  const now = Date.now();

  if (!settingsCache || now > settingsCacheExpiry) {
    settingsCache = await WebPerformanceSettings.findOne({
      settingsId: "default",
    });
    settingsCacheExpiry = now + CACHE_TTL;

    // Initialize Redis if settings changed
    if (settingsCache?.cachingLayers?.databaseCache?.enabled && !redisClient) {
      redisClient = await initializeRedis(settingsCache);
    }
  }

  return settingsCache;
};

const invalidateSettingsCache = () => {
  settingsCache = null;
  settingsCacheExpiry = 0;

  // Close Redis connection if disabled
  if (redisClient) {
    redisClient.quit().catch(console.error);
    redisClient = null;
  }
};

// Start queue processor
setInterval(processOptimizationQueue, 30000); // Process every 30 seconds

module.exports = {
  requireAdmin,
  performanceMonitoringMiddleware,
  redisCacheMiddleware,
  cacheHeadersMiddleware,
  compressionMiddleware,
  lazyLoadingMiddleware,
  criticalCSSMiddleware,
  preloadingMiddleware,
  validateFileAccess,
  getCachedSettings,
  invalidateSettingsCache,
  recordPerformanceMetric,
  processOptimizationQueue,
  minifyCSS,
  minifyJS,
  optimizeImage,
  convertToWebP,
};
