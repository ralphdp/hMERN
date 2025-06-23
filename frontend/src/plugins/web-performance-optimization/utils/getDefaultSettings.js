import { defaultSettings } from "../constants/webPerformanceConstants";

export const getDefaultSettingsWithConfig = (config = {}) => {
  return {
    ...defaultSettings,
    cachingLayers: {
      ...defaultSettings.cachingLayers,
      staticFileCache: {
        ...defaultSettings.cachingLayers.staticFileCache,
        cloudflareR2: {
          ...defaultSettings.cachingLayers.staticFileCache.cloudflareR2,
          bucketName: config.defaultBucketName || "",
        },
      },
    },
  };
};
