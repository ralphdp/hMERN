const axios = require("axios");
const { FirewallRule, BlockedIp, FirewallSettings } = require("./models");

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
      console.error(
        "[ThreatIntel] Error loading API keys from database:",
        error
      );
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
      console.error(`AbuseIPDB query failed for ${ip}:`, error.message);

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

    const results = [];

    for (const feed of feeds) {
      try {
        console.log(`[ThreatIntel] Downloading ${feed.name}...`);
        const response = await axios.get(feed.url, {
          timeout: 30000,
          headers: {
            "User-Agent": "hMERN-Firewall/1.0",
          },
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          },
        });

        if (!response.data) {
          results.push({
            name: feed.name,
            success: false,
            error: "Empty response from server",
          });
          continue;
        }

        const ips = this.parseFeed(response.data, feed.type);

        if (ips.length > 0) {
          results.push({
            name: feed.name,
            description: feed.description,
            ips: ips.slice(0, 1000), // Limit to prevent database overload
            success: true,
            count: ips.length,
          });
          console.log(`[ThreatIntel] ${feed.name}: ${ips.length} IPs loaded`);
        } else {
          console.log(`[ThreatIntel] ${feed.name}: No valid IPs found in feed`);
          results.push({
            name: feed.name,
            success: false,
            error: "No valid IPs found in feed",
          });
        }
      } catch (error) {
        console.error(
          `[ThreatIntel] Failed to download ${feed.name}:`,
          error.message
        );

        let errorMsg = error.message;
        if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
          errorMsg = `Network error: Cannot reach ${feed.url}`;
        } else if (error.response?.status) {
          errorMsg = `HTTP ${error.response.status}: ${error.response.statusText}`;
        }

        results.push({
          name: feed.name,
          success: false,
          error: errorMsg,
        });
      }
    }

    return results;
  }

  // Parse different threat feed formats
  parseFeed(data, type) {
    if (!data || typeof data !== "string") {
      console.error("[ThreatIntel] Invalid feed data - not a string");
      return [];
    }

    try {
      if (type === "spamhaus") {
        return data
          .split("\n")
          .filter((line) => line && !line.startsWith(";") && line.trim())
          .map((line) => line.split(";")[0].trim())
          .filter((ip) => ip && (ip.includes(".") || ip.includes(":")))
          .filter((ip) => this.isValidIPOrCIDR(ip))
          .slice(0, 2000); // Increased limit for Spamhaus feeds
      }

      // Simple IP list format - handle various comment styles
      return data
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line &&
            !line.startsWith("#") &&
            !line.startsWith(";") &&
            !line.startsWith("//") &&
            !line.toLowerCase().startsWith("remark")
        )
        .filter((ip) => this.isValidIPOrCIDR(ip))
        .slice(0, 1500); // Reasonable limit for simple lists
    } catch (error) {
      console.error(`[ThreatIntel] Error parsing ${type} feed:`, error.message);
      return [];
    }
  }

  // Basic IP/CIDR validation
  isValidIPOrCIDR(ip) {
    // Basic validation for IPv4 addresses and CIDR notation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    return ipv4Regex.test(ip);
  }

  // Import threat feeds as firewall rules
  async importThreatFeeds() {
    try {
      const feeds = await this.updateThreatFeeds();
      let imported = 0;
      let errors = 0;
      const details = [];

      for (const feed of feeds) {
        if (!feed.success || !feed.ips) {
          details.push(`${feed.name}: Failed - ${feed.error}`);
          continue;
        }

        let feedImported = 0;
        // Import top threat IPs (limit to prevent overwhelming the database)
        for (const ip of feed.ips.slice(0, 100)) {
          try {
            await FirewallRule.create({
              name: `Threat Feed: ${feed.name} - ${ip}`,
              type: "ip_block",
              value: ip,
              action: "block",
              priority: 25, // Higher priority than common rules
              source: "threat_intel", // Mark as threat intelligence
              permanent: true, // Threat intel rules are permanent
              autoCreated: true, // Auto-created by system
              description: `Auto-imported from ${feed.name}: ${feed.description}`,
              enabled: true,
            });
            imported++;
            feedImported++;
          } catch (error) {
            // Skip duplicates (error code 11000)
            if (error.code !== 11000) {
              console.error(`Failed to import rule for ${ip}:`, error.message);
              errors++;
            }
          }
        }

        details.push(`${feed.name}: ${feedImported} rules imported`);
      }

      return {
        success: true,
        imported,
        errors,
        details,
        feeds: feeds.map((f) => ({
          name: f.name,
          success: f.success,
          count: f.count || 0,
        })),
      };
    } catch (error) {
      console.error(
        "[ThreatIntel] Failed to import threat feeds:",
        error.message
      );
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
    console.log(
      `[ThreatIntel] Cache cleanup completed. Size: ${this.cache.size}`
    );
  }
}

module.exports = ThreatIntelligence;
