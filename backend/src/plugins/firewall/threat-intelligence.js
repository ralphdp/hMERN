const axios = require("axios");
const { FirewallRule, BlockedIp, FirewallSettings } = require("./models");
const { createPluginLogger } = require("../../utils/logger");

const logger = createPluginLogger("threat-intelligence");

/**
 * Threat Intelligence Service
 *
 * API Limitations:
 * - AbuseIPDB: 1,000 queries/day (free tier)
 * - VirusTotal: 4 requests/minute, 500 requests/day (free tier)
 * - Spamhaus/Emerging Threats: Unlimited (public feeds)
 */
class ThreatIntelligence {
  constructor(config = {}) {
    this.config = {
      enableAutoBlocking: config.enableAutoBlocking || false,
      confidenceThreshold: config.confidenceThreshold || 75,
      cacheTTL: 3600000, // 1 hour cache
    };

    this.cache = new Map();
    this.rateLimits = {
      abuseIPDB: {
        requests: 0,
        resetTime: 0,
        limit: 1000, // Daily limit
        name: "AbuseIPDB (1,000/day)",
      },
      virusTotal: {
        requests: 0,
        resetTime: 0,
        limit: 240, // ~4/min * 60min = 240/hour realistic limit
        name: "VirusTotal (4/min, 500/day)",
      },
    };
  }

  // Load API keys from database settings
  async loadApiKeys() {
    try {
      const settings = await FirewallSettings.findOne({
        settingsId: "default",
      });

      if (!settings?.threatIntelligence) {
        return {
          abuseIPDB: null,
          virusTotal: null,
          abuseIPDBEnabled: false,
          virusTotalEnabled: false,
        };
      }

      const { threatIntelligence } = settings;

      return {
        abuseIPDB:
          threatIntelligence.abuseIPDB?.enabled &&
          threatIntelligence.abuseIPDB?.apiKey
            ? threatIntelligence.abuseIPDB.apiKey
            : null,
        virusTotal:
          threatIntelligence.virusTotal?.enabled &&
          threatIntelligence.virusTotal?.apiKey
            ? threatIntelligence.virusTotal.apiKey
            : null,
        abuseIPDBEnabled: threatIntelligence.abuseIPDB?.enabled || false,
        virusTotalEnabled: threatIntelligence.virusTotal?.enabled || false,
        autoImportFeeds: threatIntelligence.autoImportFeeds || false,
        feedUpdateInterval: threatIntelligence.feedUpdateInterval || 24,
      };
    } catch (error) {
      logger.config.error("Error loading API keys from database", {
        error: error.message,
        errorStack: error.stack,
      });
      return {
        abuseIPDB: null,
        virusTotal: null,
        abuseIPDBEnabled: false,
        virusTotalEnabled: false,
      };
    }
  }

  // Check if IP is in cache and still valid
  getCachedResult(ip) {
    const cached = this.cache.get(ip);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  // Cache IP reputation result
  setCachedResult(ip, data) {
    this.cache.set(ip, {
      data,
      timestamp: Date.now(),
    });

    // Simple cache cleanup - keep only 5000 most recent entries
    if (this.cache.size > 5000) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, 1000).forEach(([key]) => this.cache.delete(key));
    }
  }

  // Check rate limits for services
  checkRateLimit(service) {
    const limit = this.rateLimits[service];
    if (!limit) return true;

    const now = Date.now();
    // Reset daily counter at midnight
    if (now > limit.resetTime) {
      limit.requests = 0;
      limit.resetTime = now + 24 * 60 * 60 * 1000; // Next day
    }

    return limit.requests < limit.limit;
  }

  // Increment rate limit counter
  incrementRateLimit(service) {
    if (this.rateLimits[service]) {
      this.rateLimits[service].requests++;
    }
  }

  // Query AbuseIPDB for IP reputation
  async queryAbuseIPDB(ip) {
    const apiKeys = await this.loadApiKeys();

    if (!apiKeys.abuseIPDB) {
      return {
        error: "AbuseIPDB API key not configured or disabled",
        hint: "Configure and enable AbuseIPDB in the Firewall Settings panel",
      };
    }

    if (!this.checkRateLimit("abuseIPDB")) {
      return {
        error: "AbuseIPDB rate limit exceeded (1,000/day)",
        hint: "Upgrade to paid plan or wait until tomorrow",
      };
    }

    // Check cache first
    const cached = this.getCachedResult(`abuseipdb:${ip}`);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    try {
      this.incrementRateLimit("abuseIPDB");

      const response = await axios.get(
        "https://api.abuseipdb.com/api/v2/check",
        {
          headers: {
            Key: apiKeys.abuseIPDB,
            Accept: "application/json",
          },
          params: {
            ipAddress: ip,
            maxAgeInDays: 90,
            verbose: true,
          },
          timeout: 10000,
        }
      );

      const data = response.data.data;
      const result = {
        service: "AbuseIPDB",
        ip,
        isBlacklisted:
          data.abuseConfidencePercentage > this.config.confidenceThreshold,
        confidence: data.abuseConfidencePercentage,
        usageType: data.usageType,
        isp: data.isp,
        countryCode: data.countryCode,
        totalReports: data.totalReports,
        categories: data.categories || [],
        lastReportedAt: data.lastReportedAt,
        isPublic: data.isPublic,
        remainingQueries:
          this.rateLimits.abuseIPDB.limit - this.rateLimits.abuseIPDB.requests,
      };

      // Cache the result
      this.setCachedResult(`abuseipdb:${ip}`, result);

      return result;
    } catch (error) {
      logger.config.error("AbuseIPDB query failed", {
        ip,
        error: error.message,
        errorStack: error.stack,
      });

      if (error.response?.status === 429) {
        return {
          error: "AbuseIPDB rate limit exceeded",
          hint: "Too many requests. Wait before trying again.",
        };
      }

      return {
        error: `AbuseIPDB query failed: ${error.message}`,
        hint: "Check your API key and network connection",
      };
    }
  }

  // Download and parse free threat feeds
  async updateThreatFeeds() {
    try {
      // Threat intelligence services as documented in README.md:
      // 1. Spamhaus DROP - Known spam sources and compromised computers (free, unlimited)
      // 2. Emerging Threats - Known compromised hosts and botnets (free, unlimited)
      // 3. AbuseIPDB - Community-driven threat intelligence (1,000/day free, API key required)
      // 4. VirusTotal - Google-owned service (4/min, 500/day free, API key required)
      //
      // This function uses only the free unlimited feeds (Spamhaus + Emerging Threats)
      // For API-based services, use queryAbuseIPDB() method with proper API keys
      const feeds = [
        {
          name: "Spamhaus DROP",
          url: "https://www.spamhaus.org/drop/drop.txt",
          type: "spamhaus",
          description: "Known spam sources and compromised computers",
        },
        {
          name: "Spamhaus EDROP",
          url: "https://www.spamhaus.org/drop/edrop.txt",
          type: "spamhaus",
          description: "Extended spam sources list",
        },
        {
          name: "Emerging Threats Compromised",
          url: "https://rules.emergingthreats.net/fwrules/emerging-Block-IPs.txt",
          type: "simple",
          description: "Known compromised hosts",
        },
      ];

      logger.config.info("Starting threat feed download", {
        feedsCount: feeds.length,
        feedNames: feeds.map((f) => f?.name || "Unknown"),
        axiosAvailable: typeof axios !== "undefined",
        axiosType: typeof axios,
      });

      const results = [];

      for (const feed of feeds) {
        // Ensure feed object is valid
        if (!feed || typeof feed !== "object") {
          logger.config.warn("Invalid feed object encountered", { feed });
          continue;
        }

        const feedName = feed.name || "Unknown Feed";
        const feedUrl = feed.url || "Unknown URL";

        logger.config.debug("Processing feed", {
          feedName,
          feedUrl,
          feedType: feed.type,
        });

        try {
          logger.config.debug("Downloading threat feed", { feedName, feedUrl });

          const response = await axios.get(feedUrl, {
            timeout: 30000,
            headers: {
              "User-Agent": "hMERN-Firewall/1.0",
            },
            maxRedirects: 5,
            validateStatus: function (status) {
              return status >= 200 && status < 300;
            },
          });

          logger.config.debug("Threat feed response received", {
            feedName,
            status: response?.status,
            hasData: !!response?.data,
            dataLength: response?.data ? String(response.data).length : 0,
          });

          if (!response || !response.data) {
            results.push({
              name: feedName,
              success: false,
              error: "Empty response from server",
            });
            continue;
          }

          const ips = this.parseFeed(response.data, feed.type);

          if (Array.isArray(ips) && ips.length > 0) {
            results.push({
              name: feedName,
              description: feed.description || "No description",
              ips: ips.slice(0, 1000), // Limit to prevent database overload
              success: true,
              count: ips.length,
            });
            logger.config.debug("Threat feed loaded successfully", {
              feedName,
              ipsLoaded: ips.length,
            });
          } else {
            logger.config.warn("No valid IPs found in threat feed", {
              feedName,
            });
            results.push({
              name: feedName,
              success: false,
              error: "No valid IPs found in feed",
            });
          }
        } catch (error) {
          // Enhanced error handling - ensure error object exists and is safe to access
          let errorMessage, errorCode, errorStack;

          // First, log the raw error to understand what we're dealing with
          logger.config.error("Raw error caught in threat feed download", {
            feedName,
            errorType: typeof error,
            errorConstructor: error?.constructor?.name,
            isNull: error === null,
            isUndefined: error === undefined,
            errorKeys: error ? Object.keys(error) : [],
          });

          try {
            errorMessage =
              error && typeof error === "object" && error.message
                ? error.message
                : typeof error === "string"
                ? error
                : "Unknown error occurred";
            errorCode = (error && error.code) || "UNKNOWN";
            errorStack = (error && error.stack) || "No stack trace available";
          } catch (safetyError) {
            // Fallback if even the safe access fails
            logger.config.error("Critical error during error property access", {
              feedName,
              safetyError: safetyError?.message,
              safetyErrorStack: safetyError?.stack,
            });
            errorMessage = "Critical error during error processing";
            errorCode = "UNKNOWN";
            errorStack = "No stack trace available";
          }

          logger.config.error("Failed to download threat feed", {
            feedName,
            error: errorMessage,
            errorStack,
            errorCode,
          });

          let errorMsg = errorMessage;
          try {
            if (errorCode === "ENOTFOUND" || errorCode === "ECONNREFUSED") {
              errorMsg = `Network error: Cannot reach ${feedUrl}`;
            } else if (error && error.response && error.response.status) {
              errorMsg = `HTTP ${error.response.status}: ${
                error.response.statusText || "Unknown"
              }`;
            }
          } catch (errorProcessingError) {
            logger.config.error("Error while processing error details", {
              feedName,
              originalError: errorMessage,
              processingError: "Error processing failed",
            });
            errorMsg = `Feed download failed: ${errorMessage}`;
          }

          results.push({
            name: feedName,
            success: false,
            error: errorMsg,
          });
        }
      }

      // Ensure we always return a valid array with defined objects
      const validResults = results.filter(
        (result) => result != null && typeof result === "object"
      );

      logger.config.info("Threat feed download completed", {
        totalFeeds: feeds.length,
        totalResults: results.length,
        validResults: validResults.length,
        successfulFeeds: validResults.filter((r) => r.success).length,
      });

      return validResults;
    } catch (globalError) {
      // Enhanced safety for global error handling
      let safeErrorMessage = "Unknown critical error";
      let safeErrorStack = "No stack trace";

      try {
        if (globalError && typeof globalError === "object") {
          safeErrorMessage = globalError.message || "Unknown critical error";
          safeErrorStack = globalError.stack || "No stack trace";
        } else if (typeof globalError === "string") {
          safeErrorMessage = globalError;
        }
      } catch (errorInErrorHandling) {
        safeErrorMessage = "Error occurred while processing global error";
        safeErrorStack = "Could not access error details";
      }

      logger.config.error("Critical error in updateThreatFeeds", {
        error: safeErrorMessage,
        errorStack: safeErrorStack,
        globalErrorType: typeof globalError,
        globalErrorConstructor: globalError?.constructor?.name,
      });

      // Return a safe empty array with error information
      return [
        {
          name: "Error",
          success: false,
          error: `Critical error during feed update: ${safeErrorMessage}`,
        },
      ];
    }
  }

  // Parse different threat feed formats
  parseFeed(data, type) {
    try {
      if (!data || typeof data !== "string") {
        logger.config.error("Invalid feed data - not a string", {
          dataType: typeof data,
          dataLength: data ? String(data).length : 0,
        });
        return [];
      }

      if (!type || typeof type !== "string") {
        logger.config.error("Invalid feed type", {
          type,
          typeOfType: typeof type,
        });
        return [];
      }

      const safeType = type.toLowerCase().trim();

      if (safeType === "spamhaus") {
        try {
          return data
            .split("\n")
            .filter((line) => line && !line.startsWith(";") && line.trim())
            .map((line) => {
              try {
                return line.split(";")[0].trim();
              } catch (lineError) {
                logger.api.warn("Error processing spamhaus line", {
                  line,
                  error: lineError?.message || "Unknown line error",
                });
                return "";
              }
            })
            .filter((ip) => ip && (ip.includes(".") || ip.includes(":")))
            .filter((ip) => {
              try {
                return this.isValidIPOrCIDR(ip);
              } catch (validationError) {
                logger.api.warn("Error validating IP", {
                  ip,
                  error: validationError?.message || "Unknown validation error",
                });
                return false;
              }
            })
            .slice(0, 2000); // Increased limit for Spamhaus feeds
        } catch (spamhausError) {
          logger.api.error("Error parsing Spamhaus feed", {
            error: spamhausError?.message || "Unknown Spamhaus error",
            errorStack: spamhausError?.stack || "No stack trace",
          });
          return [];
        }
      }

      // Simple IP list format - handle various comment styles
      try {
        return data
          .split("\n")
          .map((line) => {
            try {
              return line.trim();
            } catch (trimError) {
              logger.api.warn("Error trimming line", {
                line,
                error: trimError?.message || "Unknown trim error",
              });
              return "";
            }
          })
          .filter((line) => {
            try {
              return (
                line &&
                !line.startsWith("#") &&
                !line.startsWith(";") &&
                !line.startsWith("//") &&
                !line.toLowerCase().startsWith("remark")
              );
            } catch (filterError) {
              logger.api.warn("Error filtering line", {
                line,
                error: filterError?.message || "Unknown filter error",
              });
              return false;
            }
          })
          .filter((ip) => {
            try {
              return this.isValidIPOrCIDR(ip);
            } catch (validationError) {
              logger.api.warn("Error validating IP in simple format", {
                ip,
                error: validationError?.message || "Unknown validation error",
              });
              return false;
            }
          })
          .slice(0, 1500); // Reasonable limit for simple lists
      } catch (simpleFormatError) {
        logger.api.error("Error parsing simple format feed", {
          error: simpleFormatError?.message || "Unknown simple format error",
          errorStack: simpleFormatError?.stack || "No stack trace",
        });
        return [];
      }
    } catch (globalError) {
      logger.api.error("Critical error parsing threat feed", {
        feedType: type,
        error: globalError?.message || "Unknown critical error",
        errorStack: globalError?.stack || "No stack trace",
      });
      return [];
    }
  }

  // Basic IP/CIDR validation
  isValidIPOrCIDR(ip) {
    try {
      // Safety checks
      if (!ip || typeof ip !== "string") {
        return false;
      }

      const cleanIp = ip.trim();
      if (cleanIp.length === 0 || cleanIp.length > 18) {
        return false;
      }

      // Basic validation for IPv4 addresses and CIDR notation
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

      if (!ipv4Regex.test(cleanIp)) {
        return false;
      }

      // Additional validation - check octets are valid (0-255)
      const parts = cleanIp.split("/")[0].split(".");
      for (const part of parts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0 || num > 255) {
          return false;
        }
      }

      // If CIDR notation, validate the prefix length
      if (cleanIp.includes("/")) {
        const prefixLength = parseInt(cleanIp.split("/")[1], 10);
        if (isNaN(prefixLength) || prefixLength < 0 || prefixLength > 32) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.api.warn("Error validating IP/CIDR", {
        ip,
        error: error?.message || "Unknown validation error",
      });
      return false;
    }
  }

  // Import threat feeds as firewall rules with smart duplicate detection
  async importThreatFeeds() {
    try {
      const feeds = await this.updateThreatFeeds();

      // Safety check: ensure feeds is a valid array with defined objects
      if (!Array.isArray(feeds)) {
        logger.config.error("updateThreatFeeds did not return an array", {
          feedsType: typeof feeds,
          feeds,
        });
        return {
          success: false,
          error: "Internal error: threat feeds did not load properly",
          hint: "Check network connectivity and firewall rule limits",
        };
      }

      // Filter out any undefined or null feed objects
      const validFeeds = feeds.filter((feed) => feed != null);
      if (validFeeds.length !== feeds.length) {
        logger.config.warn("Some feeds were undefined/null and filtered out", {
          originalCount: feeds.length,
          validCount: validFeeds.length,
        });
      }

      let imported = 0;
      let duplicatesSkipped = 0;
      let errors = 0;
      const details = [];

      // Pre-fetch all existing threat intelligence rules for efficient duplicate checking
      const existingThreatRules = await FirewallRule.find({
        $or: [
          { source: "threat_intel" },
          { type: "ip_block", autoCreated: true },
          { name: { $regex: /threat feed|threat intelligence/i } },
        ],
      }).select("value name source");

      const existingIPs = new Set(
        existingThreatRules.map((rule) => rule.value)
      );

      logger.config.info(
        "Starting threat feed import with smart duplicate detection",
        {
          existingThreatRulesCount: existingThreatRules.length,
          existingUniqueIPs: existingIPs.size,
          feedsToProcess: validFeeds.length,
        }
      );

      for (const feed of validFeeds) {
        // Double-check feed validity with comprehensive safety checks
        if (!feed || typeof feed !== "object") {
          logger.config.warn("Invalid feed object in processing loop", {
            feed,
          });
          continue;
        }

        const feedName = feed.name || "Unknown Feed";
        const feedSuccess = feed.success === true;
        const feedIps = Array.isArray(feed.ips) ? feed.ips : [];
        const feedError = feed.error || "Unknown feed error";

        if (!feedSuccess || feedIps.length === 0) {
          details.push(`${feedName}: Failed - ${feedError}`);
          logger.config.warn("Feed failed or has no IPs", {
            feedName,
            success: feedSuccess,
            hasIps: feedIps.length > 0,
            ipsCount: feedIps.length,
            error: feedError,
          });
          continue;
        }

        let feedImported = 0;
        let feedDuplicates = 0;
        let feedErrors = 0;

        // Import top threat IPs (limit to prevent overwhelming the database)
        const ipsToProcess = feedIps.slice(0, 100);

        for (const ip of ipsToProcess) {
          try {
            // Validate IP before processing
            if (!ip || typeof ip !== "string" || ip.trim().length === 0) {
              logger.api.warn("Invalid IP encountered in feed", {
                ip,
                feedName,
                ipType: typeof ip,
              });
              feedErrors++;
              errors++;
              continue;
            }

            const cleanIp = ip.trim();

            // Smart duplicate detection - check if IP already exists
            if (existingIPs.has(cleanIp)) {
              duplicatesSkipped++;
              feedDuplicates++;
              logger.api.debug("Skipping duplicate IP", {
                ip: cleanIp,
                feedName,
              });
              continue;
            }

            // Create new rule for non-duplicate IP
            const newRule = await FirewallRule.create({
              name: `Threat Feed: ${feedName} - ${cleanIp}`,
              type: "ip_block",
              value: cleanIp,
              action: "block",
              priority: 25, // Higher priority than common rules
              source: "threat_intel", // Mark as threat intelligence
              permanent: true, // Threat intel rules are permanent
              autoCreated: true, // Auto-created by system
              description: `Auto-imported from ${feedName}: ${
                feed.description || "Threat intelligence feed"
              }`,
              enabled: true,
            });

            // Add to our existing IPs set to prevent duplicates within this import
            existingIPs.add(cleanIp);

            imported++;
            feedImported++;

            logger.api.debug("Successfully imported new threat IP", {
              ip: cleanIp,
              feedName,
              ruleId: newRule._id,
            });
          } catch (error) {
            // Safe error handling
            const errorMessage = error?.message || "Unknown error";
            const errorCode = error?.code || "UNKNOWN";
            const errorStack = error?.stack || "No stack trace";

            // Handle database errors (e.g., constraint violations, validation errors)
            if (errorCode === 11000) {
              // Duplicate key error - count as duplicate even though our pre-check missed it
              duplicatesSkipped++;
              feedDuplicates++;
              logger.api.debug("Database duplicate detected for IP", {
                ip,
                feedName,
              });
            } else {
              logger.config.error("Failed to import rule for IP", {
                ip,
                feedName,
                error: errorMessage,
                errorStack,
                errorCode,
              });
              errors++;
              feedErrors++;
            }
          }
        }

        // Create detailed status for this feed
        let feedStatus = `${feedName}: ${feedImported} imported`;
        if (feedDuplicates > 0) {
          feedStatus += `, ${feedDuplicates} duplicates skipped`;
        }
        if (feedErrors > 0) {
          feedStatus += `, ${feedErrors} errors`;
        }
        feedStatus += ` (${ipsToProcess.length} total processed)`;

        details.push(feedStatus);

        logger.config.info("Feed processing completed", {
          feedName,
          imported: feedImported,
          duplicates: feedDuplicates,
          errors: feedErrors,
          totalProcessed: ipsToProcess.length,
        });
      }

      // Check if all feeds failed
      const successfulFeeds = validFeeds.filter((f) => f.success);
      const failedFeeds = validFeeds.filter((f) => !f.success);

      logger.config.info("Threat feed processing summary", {
        totalFeeds: validFeeds.length,
        successfulFeeds: successfulFeeds.length,
        failedFeeds: failedFeeds.length,
        failedFeedNames: failedFeeds.map((f) => f?.name || "Unknown"),
        imported,
        duplicatesSkipped,
        errors,
      });

      // If all feeds failed and nothing was imported, return an error
      if (successfulFeeds.length === 0 && imported === 0) {
        logger.config.error("All threat feeds failed to download or parse", {
          failedFeeds: failedFeeds.map((f) => ({
            name: f?.name || "Unknown feed",
            error: f?.error || "Unknown error",
          })),
        });

        return {
          success: false,
          imported: 0,
          duplicatesSkipped: 0,
          errors: failedFeeds.length,
          details,
          feeds: validFeeds.map((f) => ({
            name: f?.name || "Unknown feed",
            success: f?.success || false,
            count: f?.count || 0,
            error: f?.error || "Unknown error",
          })),
          error: `All ${validFeeds.length} threat feeds failed to download. Common causes: network connectivity issues, DNS resolution problems, or feed URLs changed. Check server internet connection and firewall settings.`,
          hint: "Verify network connectivity and ensure the server can access external threat intelligence sources",
        };
      }

      const result = {
        success: true,
        imported,
        duplicatesSkipped,
        errors,
        details,
        feeds: validFeeds.map((f) => ({
          name: f?.name || "Unknown feed",
          success: f?.success || false,
          count: f?.count || 0,
          error: f?.error || undefined,
        })),
        summary: {
          totalProcessed: validFeeds.reduce(
            (sum, f) => sum + (f?.ips?.length || 0),
            0
          ),
          imported,
          duplicatesSkipped,
          errors,
          existingThreatRules: existingThreatRules.length,
          successfulFeeds: successfulFeeds.length,
          failedFeeds: failedFeeds.length,
        },
      };

      logger.config.info("Threat feed import completed", result.summary);

      return result;
    } catch (error) {
      logger.config.error("Failed to import threat feeds", {
        error: error.message,
        errorStack: error.stack,
      });
      return {
        success: false,
        error: error.message,
        hint: "Check network connectivity and firewall rule limits",
      };
    }
  }

  // Get threat intelligence statistics and API usage
  async getStats() {
    const apiKeys = await this.loadApiKeys();

    return {
      cacheSize: this.cache.size,
      rateLimits: Object.fromEntries(
        Object.entries(this.rateLimits).map(([key, value]) => [
          key,
          {
            name: value.name,
            used: value.requests,
            limit: value.limit,
            remaining: value.limit - value.requests,
            resetTime: new Date(value.resetTime).toISOString(),
          },
        ])
      ),
      config: {
        hasAbuseIPDB: !!apiKeys.abuseIPDB,
        hasVirusTotal: !!apiKeys.virusTotal,
        abuseIPDBEnabled: apiKeys.abuseIPDBEnabled,
        virusTotalEnabled: apiKeys.virusTotalEnabled,
        autoImportFeeds: apiKeys.autoImportFeeds,
        feedUpdateInterval: apiKeys.feedUpdateInterval,
        autoBlocking: this.config.enableAutoBlocking,
        threshold: this.config.confidenceThreshold,
      },
    };
  }

  // Clean up old cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL) {
        this.cache.delete(key);
      }
    }
    logger.config.debug("Cache cleanup completed", {
      cacheSize: this.cache.size,
    });
  }
}

module.exports = ThreatIntelligence;
