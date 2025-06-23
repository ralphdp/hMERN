export const defaultSettings = {
  general: {
    enabled: false,
    enableAnalytics: false,
  },
  fileOptimization: {
    minification: {
      enableCSSMinification: false,
      enableJSMinification: false,
      enableConcatenation: false,
      preserveComments: false,
      removeUnusedCSS: false,
    },
    images: {
      enableOptimization: false,
      enableWebPConversion: false,
      jpegQuality: 80,
      pngQuality: 80,
      webpQuality: 80,
      maxWidth: 1920,
      maxHeight: 1080,
    },
    compression: {
      enableGzip: true,
      enableBrotli: false,
      compressionLevel: 6,
      threshold: 1024,
    },
  },
  cachingLayers: {
    databaseCache: {
      enabled: false,
      defaultTTL: 300,
      maxMemory: "100mb",
    },
    fragmentCache: {
      enabled: false,
      defaultTTL: 600,
      enableFragmentCaching: false,
      enableObjectCaching: false,
    },
    staticFileCache: {
      enabled: false,
      cloudflareR2: {
        token: "",
        accessKeyId: "",
        secretAccessKey: "",
        endpointS3: "",
        bucketName: "", // Will be set from backend config
      },
      cacheTTL: 86400,
      enableVersioning: true,
    },
    browserCache: {
      enabled: true,
      staticFilesTTL: 31536000,
      dynamicContentTTL: 0,
      enableETag: true,
      enableLastModified: true,
    },
  },
  performanceFeatures: {
    lazyLoading: {
      enabled: false,
      enableImageLazyLoading: false,
      enableIframeLazyLoading: false,
      threshold: 100,
    },
    criticalCSS: {
      enabled: false,
      inlineThreshold: 14000,
      enableAutomaticExtraction: false,
    },
    preloading: {
      enabled: false,
      enableDNSPrefetch: false,
      enablePreconnect: false,
      enableResourceHints: false,
      preloadFonts: false,
      preloadCriticalImages: false,
    },
  },
  emailReports: {
    enabled: false,
    emails: [],
    frequency: "weekly", // daily, weekly, monthly
    time: "09:00", // 24h format
    // Core Performance Metrics
    includeCoreWebVitals: true,
    includeFileOptimization: true,
    includeCachePerformance: true,
    includeProcessingQueue: true,
    // Activity & Analysis
    includeRecentActivities: true,
    includeFeatureStatus: true,
    // Charts & Visualizations
    includePerformanceTrends: true,
    includeSparklines: true,
    // Executive Summary
    includeExecutiveSummary: true,
    includeRecommendations: true,
  },
};
