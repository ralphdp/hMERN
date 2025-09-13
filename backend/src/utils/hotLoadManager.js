const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const crypto = require("crypto");
const EventEmitter = require("events");

const PluginRegistry = require("../models/PluginRegistry");
const PluginActivity = require("../models/PluginActivity");

class HotLoadManager extends EventEmitter {
  constructor(app) {
    super();
    this.app = app;
    this.pluginDir = path.join(__dirname, "../plugins");
    this.loadedPlugins = new Map();
    this.watchers = new Map();
    this.isInitialized = false;
    this.rollbackPoints = new Map(); // Store plugin states for rollback
    this.healthMonitor = null;

    // WebSocket connections for real-time updates
    this.wsConnections = new Set();

    // Plugin loading queue for dependency resolution
    this.loadingQueue = [];
    this.isProcessingQueue = false;

    // Security and permissions
    this.sandbox = {
      filesystem: this.createFileSystemSandbox(),
      database: this.createDatabaseSandbox(),
      network: this.createNetworkSandbox(),
    };
  }

  // ===== INITIALIZATION =====

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    console.log("🔥 HotLoadManager: Initializing...");

    try {
      // Create plugins directory if it doesn't exist
      await this.ensurePluginDirectory();

      // Sync database with filesystem
      await this.syncDatabaseWithFileSystem();

      // Load all enabled plugins
      await this.loadAllPlugins();

      // Start file watching
      this.startFileWatching();

      // Start health monitoring
      this.startHealthMonitoring();

      // Setup WebSocket server for real-time updates
      this.setupWebSocket();

      this.isInitialized = true;
      console.log("✅ HotLoadManager: Initialized successfully");

      this.emit("initialized");
    } catch (error) {
      console.error("❌ HotLoadManager: Initialization failed:", error);
      throw error;
    }
  }

  async ensurePluginDirectory() {
    try {
      await fs.access(this.pluginDir);
    } catch {
      await fs.mkdir(this.pluginDir, { recursive: true });
      console.log("📁 Created plugins directory");
    }
  }

  // ===== PLUGIN LIFECYCLE MANAGEMENT =====

  async loadAllPlugins() {
    console.log("🔄 Loading all enabled plugins...");

    const plugins = await PluginRegistry.getLoadOrder();

    for (const plugin of plugins) {
      if (plugin.state !== "active" && plugin.enabled) {
        await this.loadPlugin(plugin.name);
      }
    }

    console.log(`✅ Loaded ${this.loadedPlugins.size} plugins`);
  }

  async loadPlugin(pluginName, options = {}) {
    const { force = false, skipDependencies = false } = options;

    console.log(`🔌 Loading plugin: ${pluginName}`);

    try {
      // Get plugin registry entry
      let pluginEntry = await PluginRegistry.findOne({ name: pluginName });

      if (!pluginEntry) {
        // Auto-discover plugin if not in registry
        pluginEntry = await this.discoverPlugin(pluginName);
        if (!pluginEntry) {
          throw new Error(`Plugin ${pluginName} not found`);
        }
      }

      // Check if already loaded and not forcing reload
      if (this.loadedPlugins.has(pluginName) && !force) {
        console.log(`⚠️ Plugin ${pluginName} already loaded`);
        return this.loadedPlugins.get(pluginName);
      }

      // Check dependencies
      if (!skipDependencies) {
        await this.checkDependencies(pluginEntry);
      }

      // Create rollback point
      await this.createRollbackPoint(pluginName);

      // Update state to loading
      pluginEntry.state = "loading";
      await pluginEntry.save();

      // Load the actual plugin
      const plugin = await this.loadPluginModule(pluginEntry);

      // Verify plugin integrity
      await this.verifyPluginIntegrity(pluginEntry);

      // Apply sandbox permissions
      this.applySandbox(plugin, pluginEntry);

      // Register plugin with app
      await this.registerPlugin(plugin, pluginEntry);

      // Update registry
      pluginEntry.state = "active";
      pluginEntry.loadedAt = new Date();
      pluginEntry.lastActivity = new Date();
      pluginEntry.errorCount = 0;
      await pluginEntry.save();

      // Store in memory
      this.loadedPlugins.set(pluginName, plugin);

      // Log activity
      await PluginActivity.logActivity({
        type: "plugin_hot_reloaded",
        pluginName,
        action: `Plugin loaded successfully`,
        status: "success",
        details: {
          version: pluginEntry.version,
          loadTime:
            Date.now() - (pluginEntry.loadedAt?.getTime() || Date.now()),
        },
      });

      // Emit success event
      this.emit("pluginLoaded", { pluginName, plugin });
      this.broadcastWebSocket("pluginLoaded", { pluginName, state: "active" });

      console.log(`✅ Plugin ${pluginName} loaded successfully`);
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginName}:`, error);

      // Attempt rollback
      await this.rollbackPlugin(pluginName, error);

      // Log failure
      await PluginActivity.logActivity({
        type: "plugin_failed",
        pluginName,
        action: `Plugin load failed`,
        status: "failure",
        error: {
          message: error.message,
          stack: error.stack,
        },
      });

      throw error;
    }
  }

  async unloadPlugin(pluginName, options = {}) {
    const { skipCleanup = false } = options;

    console.log(`🔌 Unloading plugin: ${pluginName}`);

    try {
      const plugin = this.loadedPlugins.get(pluginName);
      if (!plugin) {
        console.log(`⚠️ Plugin ${pluginName} not loaded`);
        return;
      }

      // Get plugin registry entry
      const pluginEntry = await PluginRegistry.findOne({ name: pluginName });
      if (pluginEntry) {
        pluginEntry.state = "maintenance";
        await pluginEntry.save();
      }

      // Cleanup plugin resources
      if (!skipCleanup) {
        await this.cleanupPlugin(plugin, pluginEntry);
      }

      // Remove from memory
      this.loadedPlugins.delete(pluginName);

      // Update registry
      if (pluginEntry) {
        pluginEntry.state = "disabled";
        pluginEntry.enabled = false;
        await pluginEntry.save();
      }

      // Log activity
      await PluginActivity.logActivity({
        type: "plugin_disabled",
        pluginName,
        action: `Plugin unloaded`,
        status: "success",
      });

      // Emit event
      this.emit("pluginUnloaded", { pluginName });
      this.broadcastWebSocket("pluginUnloaded", {
        pluginName,
        state: "disabled",
      });

      console.log(`✅ Plugin ${pluginName} unloaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to unload plugin ${pluginName}:`, error);
      throw error;
    }
  }

  async reloadPlugin(pluginName) {
    console.log(`🔄 Reloading plugin: ${pluginName}`);

    try {
      // Unload first
      await this.unloadPlugin(pluginName, { skipCleanup: false });

      // Wait a moment for cleanup
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Reload
      await this.loadPlugin(pluginName, { force: true });

      console.log(`✅ Plugin ${pluginName} reloaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to reload plugin ${pluginName}:`, error);

      // Attempt recovery from rollback point
      await this.rollbackPlugin(pluginName, error);
      throw error;
    }
  }

  // ===== FILE WATCHING =====

  startFileWatching() {
    console.log("👁️\u00A0\u00A0Starting file watching...");

    // Watch plugins directory
    const pluginWatcher = chokidar.watch(this.pluginDir, {
      ignored: /node_modules|\.git|\.DS_Store/,
      persistent: true,
      ignoreInitial: true,
    });

    pluginWatcher.on("addDir", async (dirPath) => {
      const pluginName = path.basename(dirPath);
      if (path.dirname(dirPath) === this.pluginDir) {
        console.log(`📁 New plugin directory detected: ${pluginName}`);
        await this.handleNewPlugin(pluginName);
      }
    });

    pluginWatcher.on("unlinkDir", async (dirPath) => {
      const pluginName = path.basename(dirPath);
      if (path.dirname(dirPath) === this.pluginDir) {
        console.log(`📁 Plugin directory removed: ${pluginName}`);
        await this.handleRemovedPlugin(pluginName);
      }
    });

    // Watch individual plugin files
    const fileWatcher = chokidar.watch(path.join(this.pluginDir, "*/"), {
      ignored: /node_modules|\.git|\.DS_Store/,
      persistent: true,
      ignoreInitial: true,
    });

    fileWatcher.on("change", async (filePath) => {
      const pluginName = this.getPluginNameFromPath(filePath);
      if (pluginName) {
        console.log(`📝 Plugin file changed: ${filePath}`);
        await this.handleFileChange(pluginName, filePath);
      }
    });

    fileWatcher.on("add", async (filePath) => {
      const pluginName = this.getPluginNameFromPath(filePath);
      if (pluginName && path.basename(filePath) === "plugin.json") {
        console.log(`📄 Plugin metadata added: ${filePath}`);
        await this.handleMetadataChange(pluginName);
      }
    });

    this.watchers.set("plugins", pluginWatcher);
    this.watchers.set("files", fileWatcher);

    console.log("✅ File watching started");
  }

  stopFileWatching() {
    console.log("👁️ Stopping file watching...");

    for (const [name, watcher] of this.watchers) {
      watcher.close();
      console.log(`🔴 Stopped ${name} watcher`);
    }

    this.watchers.clear();
  }

  // ===== PLUGIN DISCOVERY =====

  async discoverPlugin(pluginName) {
    const pluginPath = path.join(this.pluginDir, pluginName);

    try {
      const stat = await fs.stat(pluginPath);
      if (!stat.isDirectory()) {
        return null;
      }

      // Look for plugin.json
      const metadataPath = path.join(pluginPath, "plugin.json");
      let metadata = {};

      try {
        const metadataContent = await fs.readFile(metadataPath, "utf8");
        metadata = JSON.parse(metadataContent);
      } catch {
        console.log(
          `⚠️ No plugin.json found for ${pluginName}, using defaults`
        );
      }

      // Check for backend/frontend presence
      const hasBackend = fsSync.existsSync(path.join(pluginPath, "index.js"));
      const hasFrontend = fsSync.existsSync(
        path.join(__dirname, "../../frontend/src/plugins", pluginName)
      );

      // Create registry entry
      const pluginEntry = new PluginRegistry({
        name: pluginName,
        displayName: metadata.displayName || pluginName,
        version: metadata.version || "1.0.0",
        description: metadata.description || "",
        author: metadata.author || "Unknown",
        dependencies: metadata.dependencies || [],
        loadPriority:
          metadata.loadPriority || (pluginName === "licensing" ? 0 : 100),
        backendPath: hasBackend ? pluginPath : null,
        frontendPath: hasFrontend
          ? path.join(__dirname, "../../frontend/src/plugins", pluginName)
          : null,
        hasBackend,
        hasFrontend,
        permissions: metadata.permissions || this.getDefaultPermissions(),
        enabled: false, // Discovered plugins start disabled
        state: "disabled",
      });

      await pluginEntry.save();

      await PluginActivity.logActivity({
        type: "plugin_installed",
        pluginName,
        action: "Plugin discovered and registered",
        status: "success",
      });

      console.log(`📦 Discovered plugin: ${pluginName}`);
      return pluginEntry;
    } catch (error) {
      console.error(`❌ Failed to discover plugin ${pluginName}:`, error);
      return null;
    }
  }

  // ===== SECURITY & SANDBOX =====

  createFileSystemSandbox() {
    return {
      allowedPaths: new Map(),

      checkAccess: (pluginName, filePath, operation) => {
        const plugin = this.loadedPlugins.get(pluginName);
        if (!plugin) return false;

        const pluginEntry = PluginRegistry.findOne({ name: pluginName });
        if (!pluginEntry) return false;

        // Check if path is within allowed directories
        const normalizedPath = path.resolve(filePath);
        const pluginDir = path.resolve(this.pluginDir, pluginName);
        const sharedDir = path.resolve(__dirname, "../uploads/shared");

        // Allow access to own directory
        if (normalizedPath.startsWith(pluginDir)) {
          return (
            pluginEntry.hasPermission("filesystem", "read_own") ||
            pluginEntry.hasPermission("filesystem", "write_own")
          );
        }

        // Allow access to shared directory if has permission
        if (normalizedPath.startsWith(sharedDir)) {
          return (
            pluginEntry.hasPermission("filesystem", "read_shared") ||
            pluginEntry.hasPermission("filesystem", "write_shared")
          );
        }

        return false;
      },

      logAccess: async (pluginName, filePath, operation, allowed) => {
        await PluginActivity.logActivity({
          type: allowed ? "file_read" : "permission_violation",
          pluginName,
          action: `File ${operation}: ${filePath}`,
          status: allowed ? "success" : "failure",
          filesystem: {
            operation,
            path: filePath,
          },
          severity: allowed ? "low" : "high",
        });
      },
    };
  }

  createDatabaseSandbox() {
    return {
      allowedCollections: new Map(),

      checkCollectionAccess: async (pluginName, collectionName, operation) => {
        const pluginEntry = await PluginRegistry.findOne({ name: pluginName });
        if (!pluginEntry) return false;

        // Check if collection belongs to plugin
        if (collectionName.startsWith(`plugin_${pluginName}_`)) {
          return (
            pluginEntry.hasPermission("database", "read_own") ||
            pluginEntry.hasPermission("database", "write_own")
          );
        }

        // Check core collection access
        const coreCollections = [
          "core_users",
          "core_settings_config",
          "core_tokens",
        ];
        if (coreCollections.includes(collectionName)) {
          return (
            pluginEntry.hasPermission("database", "read_core") &&
            (operation === "read" ||
              pluginEntry.hasPermission("database", "write_core"))
          );
        }

        return false;
      },

      logDatabaseOperation: async (
        pluginName,
        operation,
        collectionName,
        query
      ) => {
        await PluginActivity.logActivity({
          type: "database_operation",
          pluginName,
          action: `Database ${operation} on ${collectionName}`,
          status: "success",
          database: {
            operation,
            collection: collectionName,
            query,
          },
        });
      },
    };
  }

  createNetworkSandbox() {
    return {
      rateLimits: new Map(),

      checkNetworkAccess: async (pluginName, url, method) => {
        const pluginEntry = await PluginRegistry.findOne({ name: pluginName });
        if (!pluginEntry) return false;

        return pluginEntry.hasPermission("network", "http_requests");
      },

      logNetworkRequest: async (
        pluginName,
        url,
        method,
        responseTime,
        dataTransferred
      ) => {
        await PluginActivity.logActivity({
          type: "network_request",
          pluginName,
          action: `Network ${method} to ${url}`,
          status: "success",
          network: {
            destination: url,
            method,
            responseTime,
            dataTransferred,
          },
        });
      },
    };
  }

  // ===== HEALTH MONITORING =====

  startHealthMonitoring() {
    console.log("❤️\u00A0\u00A0Starting health monitoring...");

    this.healthMonitor = setInterval(async () => {
      for (const [pluginName, plugin] of this.loadedPlugins) {
        await this.checkPluginHealth(pluginName);
      }
    }, 60000); // Check every minute

    console.log("✅ Health monitoring started");
  }

  async checkPluginHealth(pluginName) {
    try {
      const plugin = this.loadedPlugins.get(pluginName);
      if (!plugin) return;

      const pluginEntry = await PluginRegistry.findOne({ name: pluginName });
      if (!pluginEntry) return;

      // Basic health metrics
      const memUsage = process.memoryUsage();
      const metrics = {
        memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        cpuUsage: process.cpuUsage ? process.cpuUsage().user / 1000000 : 0,
        responseTime: await this.measureResponseTime(plugin),
      };

      await pluginEntry.updateHealthStatus(metrics);

      // Check for critical health issues
      if (metrics.memoryUsage > 500 || metrics.cpuUsage > 80) {
        await PluginActivity.logActivity({
          type: "health_check_failed",
          pluginName,
          action: "Critical health metrics detected",
          status: "warning",
          severity: "critical",
          details: metrics,
        });

        // Consider auto-restart for critical issues
        if (metrics.memoryUsage > 1000) {
          console.log(
            `🚨 Plugin ${pluginName} consuming too much memory, restarting...`
          );
          await this.reloadPlugin(pluginName);
        }
      }
    } catch (error) {
      console.error(`❌ Health check failed for ${pluginName}:`, error);

      const pluginEntry = await PluginRegistry.findOne({ name: pluginName });
      if (pluginEntry) {
        await pluginEntry.recordError(error);
      }
    }
  }

  async measureResponseTime(plugin) {
    // Basic response time measurement
    const start = Date.now();

    try {
      // Call a simple plugin method if available
      if (plugin.healthCheck && typeof plugin.healthCheck === "function") {
        await plugin.healthCheck();
      }
    } catch (error) {
      // Ignore errors for response time measurement
    }

    return Date.now() - start;
  }

  // ===== UTILITY METHODS =====

  getPluginNameFromPath(filePath) {
    const relativePath = path.relative(this.pluginDir, filePath);
    const parts = relativePath.split(path.sep);
    return parts[0];
  }

  getDefaultPermissions() {
    return {
      filesystem: ["read_own", "write_own"],
      database: ["read_own", "write_own"],
      network: ["http_requests"],
      ui: ["admin_panel"],
      system: [],
    };
  }

  // ===== IMPLEMENTATION METHODS =====

  async syncDatabaseWithFileSystem() {
    console.log("🔄 Syncing database with filesystem...");

    try {
      // Get all plugin directories
      const pluginDirs = await fs.readdir(this.pluginDir);
      const validPluginDirs = [];

      for (const dir of pluginDirs) {
        const dirPath = path.join(this.pluginDir, dir);
        const stat = await fs.stat(dirPath);
        if (stat.isDirectory() && !dir.startsWith(".")) {
          validPluginDirs.push(dir);
        }
      }

      // Discover plugins not in database
      for (const pluginName of validPluginDirs) {
        const existing = await PluginRegistry.findOne({ name: pluginName });
        if (!existing) {
          await this.discoverPlugin(pluginName);
        }
      }

      // Mark plugins as removed if directory doesn't exist
      const dbPlugins = await PluginRegistry.find({});
      for (const plugin of dbPlugins) {
        if (!validPluginDirs.includes(plugin.name)) {
          plugin.state = "maintenance";
          plugin.enabled = false;
          await plugin.save();
          console.log(`📭 Plugin ${plugin.name} marked as removed`);
        }
      }

      console.log("✅ Database sync completed");
    } catch (error) {
      console.error("❌ Database sync failed:", error);
    }
  }

  async checkDependencies(pluginEntry) {
    if (!pluginEntry.dependencies || pluginEntry.dependencies.length === 0) {
      return true;
    }

    for (const dep of pluginEntry.dependencies) {
      const depName = typeof dep === "string" ? dep : dep.name;
      const depPlugin = await PluginRegistry.findOne({ name: depName });

      if (!depPlugin || !depPlugin.enabled || depPlugin.state !== "active") {
        throw new Error(`Dependency ${depName} is not available`);
      }
    }

    return true;
  }

  async createRollbackPoint(pluginName) {
    try {
      const plugin = this.loadedPlugins.get(pluginName);
      if (plugin) {
        this.rollbackPoints.set(pluginName, {
          plugin: { ...plugin },
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error(
        `Failed to create rollback point for ${pluginName}:`,
        error
      );
    }
  }

  async loadPluginModule(pluginEntry) {
    if (!pluginEntry.hasBackend) {
      throw new Error(`Plugin ${pluginEntry.name} has no backend module`);
    }

    const pluginIndexPath = path.join(pluginEntry.backendPath, "index.js");

    // Clear require cache to allow hot-reloading
    delete require.cache[require.resolve(pluginIndexPath)];

    const pluginModule = require(pluginIndexPath);

    if (!pluginModule.register && !pluginModule.loadPlugin) {
      throw new Error(
        `Plugin ${pluginEntry.name} has no register or loadPlugin function`
      );
    }

    return pluginModule;
  }

  async verifyPluginIntegrity(pluginEntry) {
    // Basic integrity check - could be enhanced with SHA-256 verification
    if (pluginEntry.hasBackend) {
      const indexPath = path.join(pluginEntry.backendPath, "index.js");
      try {
        await fs.access(indexPath);
      } catch {
        throw new Error(`Plugin ${pluginEntry.name} index.js is missing`);
      }
    }

    // Calculate and store checksum
    if (pluginEntry.hasBackend) {
      const checksum = await this.calculatePluginChecksum(
        pluginEntry.backendPath
      );
      pluginEntry.checksum = checksum;
      await pluginEntry.save();
    }
  }

  async calculatePluginChecksum(pluginPath) {
    const hash = crypto.createHash("sha256");

    try {
      const files = await fs.readdir(pluginPath);
      files.sort(); // Ensure consistent order

      for (const file of files) {
        if (!file.startsWith(".") && file.endsWith(".js")) {
          const filePath = path.join(pluginPath, file);
          const content = await fs.readFile(filePath, "utf8");
          hash.update(content);
        }
      }
    } catch (error) {
      console.error(`Error calculating checksum for ${pluginPath}:`, error);
    }

    return hash.digest("hex");
  }

  applySandbox(plugin, pluginEntry) {
    // Apply filesystem sandbox
    if (plugin.fs) {
      const originalReadFile = plugin.fs.readFile;
      plugin.fs.readFile = async (filePath, ...args) => {
        if (
          !this.sandbox.filesystem.checkAccess(
            pluginEntry.name,
            filePath,
            "read"
          )
        ) {
          throw new Error(
            `Permission denied: ${pluginEntry.name} cannot read ${filePath}`
          );
        }
        return originalReadFile(filePath, ...args);
      };
    }
  }

  async registerPlugin(plugin, pluginEntry) {
    try {
      // Call plugin's register function
      if (plugin.register) {
        await plugin.register(this.app);
      } else if (plugin.loadPlugin) {
        await plugin.loadPlugin(this.app);
      }

      // Store in app.plugins
      this.app.plugins[pluginEntry.name] = plugin;

      // Record registered routes
      if (plugin.routes) {
        pluginEntry.routes = []; // Reset routes
        // This would be enhanced to track actual registered routes
      }

      await pluginEntry.save();

      console.log(`🔗 Plugin ${pluginEntry.name} registered with app`);
    } catch (error) {
      throw new Error(
        `Failed to register plugin ${pluginEntry.name}: ${error.message}`
      );
    }
  }

  async cleanupPlugin(plugin, pluginEntry) {
    try {
      // Call plugin cleanup if available
      if (plugin.cleanup) {
        await plugin.cleanup();
      }

      // Remove from app.plugins
      delete this.app.plugins[pluginEntry.name];

      // Clear require cache
      if (pluginEntry.hasBackend) {
        const indexPath = path.join(pluginEntry.backendPath, "index.js");
        delete require.cache[require.resolve(indexPath)];
      }

      console.log(`🧹 Plugin ${pluginEntry.name} cleaned up`);
    } catch (error) {
      console.error(`Error cleaning up plugin ${pluginEntry.name}:`, error);
    }
  }

  async rollbackPlugin(pluginName, error) {
    try {
      console.log(`🔙 Rolling back plugin ${pluginName}...`);

      const rollbackPoint = this.rollbackPoints.get(pluginName);
      if (rollbackPoint) {
        // Restore previous version
        this.loadedPlugins.set(pluginName, rollbackPoint.plugin);

        await PluginActivity.logActivity({
          type: "plugin_recovered",
          pluginName,
          action: "Plugin rolled back to previous version",
          status: "success",
          details: {
            rollbackTimestamp: rollbackPoint.timestamp,
            originalError: error.message,
          },
        });
      } else {
        // No rollback point, disable plugin
        await this.unloadPlugin(pluginName);

        const pluginEntry = await PluginRegistry.findOne({ name: pluginName });
        if (pluginEntry) {
          pluginEntry.state = "failed";
          await pluginEntry.recordError(error);
        }
      }

      console.log(`✅ Plugin ${pluginName} rollback completed`);
    } catch (rollbackError) {
      console.error(`❌ Rollback failed for ${pluginName}:`, rollbackError);
    }
  }

  async handleNewPlugin(pluginName) {
    try {
      console.log(`🆕 Handling new plugin: ${pluginName}`);
      await this.discoverPlugin(pluginName);
      this.broadcastWebSocket("pluginDiscovered", { pluginName });
    } catch (error) {
      console.error(`Error handling new plugin ${pluginName}:`, error);
    }
  }

  async handleRemovedPlugin(pluginName) {
    try {
      console.log(`🗑️ Handling removed plugin: ${pluginName}`);

      if (this.loadedPlugins.has(pluginName)) {
        await this.unloadPlugin(pluginName);
      }

      const pluginEntry = await PluginRegistry.findOne({ name: pluginName });
      if (pluginEntry) {
        pluginEntry.state = "maintenance";
        pluginEntry.enabled = false;
        await pluginEntry.save();
      }

      this.broadcastWebSocket("pluginRemoved", { pluginName });
    } catch (error) {
      console.error(`Error handling removed plugin ${pluginName}:`, error);
    }
  }

  async handleFileChange(pluginName, filePath) {
    try {
      console.log(
        `📝 Handling file change in plugin ${pluginName}: ${filePath}`
      );

      // Auto-reload if plugin is currently loaded
      if (this.loadedPlugins.has(pluginName)) {
        await this.reloadPlugin(pluginName);
      }
    } catch (error) {
      console.error(`Error handling file change for ${pluginName}:`, error);
    }
  }

  async handleMetadataChange(pluginName) {
    try {
      console.log(`📄 Handling metadata change for plugin: ${pluginName}`);

      // Re-discover plugin to update metadata
      const existingPlugin = await PluginRegistry.findOne({ name: pluginName });
      if (existingPlugin) {
        await existingPlugin.remove();
      }

      await this.discoverPlugin(pluginName);
    } catch (error) {
      console.error(`Error handling metadata change for ${pluginName}:`, error);
    }
  }

  setupWebSocket() {
    try {
      const WebSocket = require("ws");
      const wss = new WebSocket.Server({ port: 8080 });

      wss.on("connection", (ws) => {
        console.log("📡 WebSocket client connected");
        this.wsConnections.add(ws);

        ws.on("close", () => {
          this.wsConnections.delete(ws);
        });
      });

      console.log("✅ WebSocket server started on port 8080");
    } catch (error) {
      console.error("❌ WebSocket setup failed:", error);
    }
  }

  broadcastWebSocket(event, data) {
    const message = JSON.stringify({ event, data, timestamp: new Date() });

    for (const ws of this.wsConnections) {
      if (ws.readyState === ws.OPEN) {
        try {
          ws.send(message);
        } catch (error) {
          console.error("Error sending WebSocket message:", error);
          this.wsConnections.delete(ws);
        }
      }
    }
  }
}

module.exports = HotLoadManager;
