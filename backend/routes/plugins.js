const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");
const archiver = require("archiver");
const unzipper = require("unzipper");
const { requireAdmin } = require("../plugins/firewall/middleware");
const { addCommonFirewallRules } = require("../plugins/firewall/routes");

// Plugin configuration storage
const PLUGINS_CONFIG_PATH = path.join(__dirname, "../config/plugins.json");
const BACKEND_PLUGINS_PATH = path.join(__dirname, "../plugins");
const FRONTEND_PLUGINS_PATH = path.join(
  __dirname,
  "../../frontend/src/plugins"
);

// Ensure plugins config file exists
const initializePluginsConfig = async () => {
  try {
    await fs.access(PLUGINS_CONFIG_PATH);
  } catch {
    const defaultConfig = {};

    // Scan for existing plugins and read their metadata
    try {
      const backendPlugins = await fs.readdir(BACKEND_PLUGINS_PATH);
      const frontendPlugins = await fs.readdir(FRONTEND_PLUGINS_PATH);
      const allPlugins = [...new Set([...backendPlugins, ...frontendPlugins])];

      for (const plugin of allPlugins) {
        if (plugin.startsWith(".")) continue;

        const pluginConfig = await getPluginMetadata(plugin);
        if (pluginConfig) {
          defaultConfig[plugin] = pluginConfig;
        } else {
          // Fallback for plugins without metadata
          defaultConfig[plugin] = { enabled: false, dependsOn: ["core"] };
        }
      }
    } catch (scanError) {
      console.log("Plugin scan failed, using empty config");
    }

    await fs.writeFile(
      PLUGINS_CONFIG_PATH,
      JSON.stringify(defaultConfig, null, 2)
    );
  }
};

// Helper function to read plugin metadata
const getPluginMetadata = async (pluginName) => {
  const possiblePaths = [
    path.join(BACKEND_PLUGINS_PATH, pluginName, "plugin.json"),
    path.join(FRONTEND_PLUGINS_PATH, pluginName, "plugin.json"),
    path.join(BACKEND_PLUGINS_PATH, pluginName, "package.json"),
    path.join(FRONTEND_PLUGINS_PATH, pluginName, "package.json"),
  ];

  for (const metadataPath of possiblePaths) {
    try {
      const content = await fs.readFile(metadataPath, "utf8");
      const metadata = JSON.parse(content);

      // If it's a package.json, look for plugin config in a specific field
      if (metadataPath.includes("package.json")) {
        return metadata.pluginConfig || metadata.plugin || null;
      }

      // If it's plugin.json, return the whole thing
      return metadata;
    } catch (error) {
      // File doesn't exist or invalid JSON, try next path
      continue;
    }
  }

  return null; // No metadata found
};

// Load plugins configuration
const loadPluginsConfig = async () => {
  try {
    await initializePluginsConfig();
    const config = await fs.readFile(PLUGINS_CONFIG_PATH, "utf8");
    return JSON.parse(config);
  } catch (error) {
    console.error("Error loading plugins config:", error);
    return {};
  }
};

// Save plugins configuration
const savePluginsConfig = async (config) => {
  try {
    await fs.writeFile(PLUGINS_CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Error saving plugins config:", error);
    throw error;
  }
};

// Get plugin info from directories
const getPluginInfo = async (pluginName) => {
  const info = {
    name: pluginName,
    backendExists: false,
    frontendExists: false,
    backendFiles: [],
    frontendFiles: [],
  };

  try {
    const backendPath = path.join(BACKEND_PLUGINS_PATH, pluginName);
    const backendStat = await fs.stat(backendPath);
    if (backendStat.isDirectory()) {
      info.backendExists = true;
      info.backendFiles = await fs.readdir(backendPath);
    }
  } catch (error) {
    // Backend plugin doesn't exist
  }

  try {
    const frontendPath = path.join(FRONTEND_PLUGINS_PATH, pluginName);
    const frontendStat = await fs.stat(frontendPath);
    if (frontendStat.isDirectory()) {
      info.frontendExists = true;
      info.frontendFiles = await fs.readdir(frontendPath);
    }
  } catch (error) {
    // Frontend plugin doesn't exist
  }

  return info;
};

// Configure multer for plugin uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadsDir = path.join(__dirname, "../uploads/plugins");
    try {
      await fs.mkdir(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/zip" ||
      file.originalname.endsWith(".zip")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Get all plugins
router.get("/", requireAdmin, async (req, res) => {
  try {
    const config = await loadPluginsConfig();
    const plugins = [];

    // Scan for all plugin directories
    const backendPlugins = await fs.readdir(BACKEND_PLUGINS_PATH);
    const frontendPlugins = await fs.readdir(FRONTEND_PLUGINS_PATH);

    const allPluginNames = new Set([...backendPlugins, ...frontendPlugins]);

    for (const pluginName of allPluginNames) {
      if (pluginName.startsWith(".")) continue; // Skip hidden files

      const pluginInfo = await getPluginInfo(pluginName);
      const pluginConfig = config[pluginName] || { enabled: false };

      plugins.push({
        ...pluginInfo,
        enabled: pluginConfig.enabled,
        core: pluginConfig.core || false,
        dependsOn: pluginConfig.dependsOn || [],
        type: pluginConfig.type || "General",
        description: await getPluginDescription(pluginName),
      });
    }

    res.json({
      success: true,
      data: plugins,
    });
  } catch (error) {
    console.error("Error getting plugins:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving plugins",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get plugin description from README
const getPluginDescription = async (pluginName) => {
  try {
    const readmePath = path.join(
      FRONTEND_PLUGINS_PATH,
      pluginName,
      "README.md"
    );
    const content = await fs.readFile(readmePath, "utf8");
    const lines = content.split("\n");
    const descriptionLine = lines.find(
      (line) => line.startsWith("# ") || line.startsWith("## ")
    );
    return descriptionLine
      ? descriptionLine.replace(/^#+\s*/, "")
      : `${pluginName} plugin`;
  } catch {
    return `${pluginName} plugin`;
  }
};

// Enable/disable plugin
router.post("/:pluginName/toggle", requireAdmin, async (req, res) => {
  try {
    const { pluginName } = req.params;
    const { enabled } = req.body;

    const config = await loadPluginsConfig();

    // Special handling for licensing plugin
    if (pluginName === "licensing" && !enabled) {
      // Disable all plugins that depend on licensing
      for (const [name, pluginConfig] of Object.entries(config)) {
        if (
          pluginConfig.dependsOn &&
          pluginConfig.dependsOn.includes("licensing")
        ) {
          config[name].enabled = false;
        }
      }
    }

    // Check dependencies when enabling a plugin
    if (enabled && config[pluginName] && config[pluginName].dependsOn) {
      for (const dependency of config[pluginName].dependsOn) {
        // Special case: "core" dependency is always satisfied
        if (dependency === "core") {
          continue;
        }

        if (!config[dependency] || !config[dependency].enabled) {
          return res.status(400).json({
            success: false,
            message: `Cannot enable ${pluginName}: dependency ${dependency} is not enabled`,
          });
        }
      }
    }

    if (!config[pluginName]) {
      config[pluginName] = {};
    }

    config[pluginName].enabled = enabled;
    await savePluginsConfig(config);

    res.json({
      success: true,
      message: `Plugin ${pluginName} ${
        enabled ? "enabled" : "disabled"
      } successfully`,
    });
  } catch (error) {
    console.error("Error toggling plugin:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling plugin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Upload new plugin
router.post(
  "/upload",
  requireAdmin,
  upload.single("plugin"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No plugin file uploaded",
        });
      }

      const zipPath = req.file.path;
      const extractPath = path.join(
        __dirname,
        "../uploads/extracted",
        Date.now().toString()
      );

      // Create extraction directory
      await fs.mkdir(extractPath, { recursive: true });

      // Extract zip file
      await new Promise((resolve, reject) => {
        fs.createReadStream(zipPath)
          .pipe(unzipper.Extract({ path: extractPath }))
          .on("close", resolve)
          .on("error", reject);
      });

      // Find plugin structure in extracted files
      const extractedItems = await fs.readdir(extractPath);
      let pluginName = null;
      let backendPath = null;
      let frontendPath = null;

      // Look for backend and frontend folders
      for (const item of extractedItems) {
        const itemPath = path.join(extractPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          if (item === "backend" || item === "server") {
            backendPath = itemPath;
          } else if (item === "frontend" || item === "client") {
            frontendPath = itemPath;
          } else {
            // Assume it's a plugin directory
            pluginName = item;
          }
        }
      }

      if (!pluginName) {
        // Try to determine plugin name from package.json or directory structure
        if (backendPath) {
          const backendContents = await fs.readdir(backendPath);
          if (backendContents.length > 0) {
            pluginName = req.file.originalname.replace(/\.zip$/, "");
          }
        }
      }

      if (!pluginName) {
        return res.status(400).json({
          success: false,
          message: "Could not determine plugin name from uploaded file",
        });
      }

      // Copy backend files if they exist
      if (backendPath) {
        const targetBackendPath = path.join(BACKEND_PLUGINS_PATH, pluginName);
        await copyDirectory(backendPath, targetBackendPath);
      }

      // Copy frontend files if they exist
      if (frontendPath) {
        const targetFrontendPath = path.join(FRONTEND_PLUGINS_PATH, pluginName);
        await copyDirectory(frontendPath, targetFrontendPath);
      }

      // If no backend/frontend folders, treat the whole thing as a plugin
      if (!backendPath && !frontendPath) {
        const pluginDir = path.join(extractPath, extractedItems[0]);
        const stat = await fs.stat(pluginDir);

        if (stat.isDirectory()) {
          // Check if it contains typical backend files
          const contents = await fs.readdir(pluginDir);
          const hasBackendFiles = contents.some(
            (file) =>
              file.endsWith(".js") &&
              (file.includes("route") ||
                file.includes("index") ||
                file.includes("middleware"))
          );

          if (hasBackendFiles) {
            const targetBackendPath = path.join(
              BACKEND_PLUGINS_PATH,
              pluginName
            );
            await copyDirectory(pluginDir, targetBackendPath);
          } else {
            const targetFrontendPath = path.join(
              FRONTEND_PLUGINS_PATH,
              pluginName
            );
            await copyDirectory(pluginDir, targetFrontendPath);
          }
        }
      }

      // Add to plugins config
      const config = await loadPluginsConfig();
      if (!config[pluginName]) {
        config[pluginName] = {
          enabled: false,
          core: false,
          dependsOn: [],
        };
      }
      await savePluginsConfig(config);

      // Cleanup
      await fs.rm(extractPath, { recursive: true, force: true });
      await fs.unlink(zipPath);

      res.json({
        success: true,
        message: `Plugin ${pluginName} uploaded successfully`,
        pluginName,
      });
    } catch (error) {
      console.error("Error uploading plugin:", error);
      res.status(500).json({
        success: false,
        message: "Error uploading plugin",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Helper function to copy directory recursively
const copyDirectory = async (src, dest) => {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
};

// Download plugin as zip
router.get("/:pluginName/download", requireAdmin, async (req, res) => {
  try {
    const { pluginName } = req.params;

    const pluginInfo = await getPluginInfo(pluginName);

    if (!pluginInfo.backendExists && !pluginInfo.frontendExists) {
      return res.status(404).json({
        success: false,
        message: "Plugin not found",
      });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pluginName}-plugin.zip"`
    );

    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.pipe(res);

    // Add backend files if they exist
    if (pluginInfo.backendExists) {
      const backendPath = path.join(BACKEND_PLUGINS_PATH, pluginName);
      archive.directory(backendPath, `backend/${pluginName}`);
    }

    // Add frontend files if they exist
    if (pluginInfo.frontendExists) {
      const frontendPath = path.join(FRONTEND_PLUGINS_PATH, pluginName);
      archive.directory(frontendPath, `frontend/${pluginName}`);
    }

    await archive.finalize();
  } catch (error) {
    console.error("Error downloading plugin:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading plugin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Delete plugin
router.delete("/:pluginName", requireAdmin, async (req, res) => {
  try {
    const { pluginName } = req.params;
    const { retainData } = req.query; // Get retain data flag from query params

    const config = await loadPluginsConfig();

    // Check if plugin is core
    if (config[pluginName] && config[pluginName].core) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete core plugins",
      });
    }

    // Check if other plugins depend on this one
    const dependentPlugins = Object.entries(config).filter(
      ([name, pluginConfig]) =>
        pluginConfig.dependsOn && pluginConfig.dependsOn.includes(pluginName)
    );

    if (dependentPlugins.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${pluginName}: other plugins depend on it: ${dependentPlugins
          .map(([name]) => name)
          .join(", ")}`,
      });
    }

    // Remove backend files
    const backendPath = path.join(BACKEND_PLUGINS_PATH, pluginName);
    try {
      await fs.rm(backendPath, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }

    // Remove frontend files
    const frontendPath = path.join(FRONTEND_PLUGINS_PATH, pluginName);
    try {
      await fs.rm(frontendPath, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }

    // Handle database data deletion based on retainData flag
    if (retainData !== "true") {
      await deletePluginDatabaseData(pluginName);
    }

    // Remove from config
    delete config[pluginName];
    await savePluginsConfig(config);

    const message =
      retainData === "true"
        ? `Plugin ${pluginName} deleted successfully (database data retained)`
        : `Plugin ${pluginName} deleted successfully (including database data)`;

    res.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Error deleting plugin:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting plugin",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Helper function to delete plugin database data
const deletePluginDatabaseData = async (pluginName) => {
  try {
    const mongoose = require("mongoose");

    // Get all collections in the database
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    const collectionNames = collections.map((col) => col.name);

    console.log(
      `Found ${collectionNames.length} collections in database:`,
      collectionNames
    );

    // Find collections related to this plugin
    const pluginCollections = findPluginRelatedCollections(
      pluginName,
      collectionNames
    );

    if (pluginCollections.length === 0) {
      console.log(`No collections found related to plugin: ${pluginName}`);
      return;
    }

    console.log(
      `Found ${pluginCollections.length} collections related to ${pluginName}:`,
      pluginCollections
    );

    // Drop plugin-related collections
    let droppedCount = 0;
    for (const collectionName of pluginCollections) {
      try {
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`✓ Dropped collection: ${collectionName}`);
        droppedCount++;
      } catch (error) {
        console.log(
          `✗ Failed to drop collection ${collectionName}:`,
          error.message
        );
      }
    }

    console.log(
      `Successfully dropped ${droppedCount}/${pluginCollections.length} collections for plugin: ${pluginName}`
    );
  } catch (error) {
    console.error(
      `Error deleting database data for plugin ${pluginName}:`,
      error
    );
    // Don't throw error as this is not critical - file deletion is more important
  }
};

// Helper function to find collections related to a plugin
const findPluginRelatedCollections = (pluginName, allCollections) => {
  const pluginLower = pluginName.toLowerCase();
  const relatedCollections = [];

  for (const collectionName of allCollections) {
    const collectionLower = collectionName.toLowerCase();

    // Skip system collections
    if (
      collectionName.startsWith("system.") ||
      collectionName === "sessions" ||
      collectionName === "users" ||
      collectionName === "tokens"
    ) {
      continue;
    }

    // Collection name patterns that indicate relation to the plugin
    const isRelated =
      // Exact match
      collectionLower === pluginLower ||
      // Starts with plugin name
      collectionLower.startsWith(pluginLower) ||
      // Contains plugin name (for compound names)
      collectionLower.includes(pluginLower) ||
      // Plugin name with common suffixes
      collectionLower === `${pluginLower}s` ||
      collectionLower === `${pluginLower}es` ||
      collectionLower === `${pluginLower}ies` ||
      collectionLower === `${pluginLower}_data` ||
      collectionLower === `${pluginLower}_settings` ||
      collectionLower === `${pluginLower}_config` ||
      collectionLower === `${pluginLower}_logs` ||
      collectionLower === `${pluginLower}_cache` ||
      // Common plugin-related patterns
      collectionLower.startsWith(`${pluginLower}_`) ||
      collectionLower.endsWith(`_${pluginLower}`) ||
      // For firewall specifically - known patterns
      (pluginLower === "firewall" &&
        (collectionLower.includes("blocked") ||
          collectionLower.includes("ratelimit") ||
          (collectionLower.includes("rule") &&
            collectionLower.includes("firewall"))));

    if (isRelated) {
      relatedCollections.push(collectionName);
    }
  }

  return relatedCollections;
};

module.exports = router;
