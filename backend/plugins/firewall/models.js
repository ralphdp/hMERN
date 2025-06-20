const mongoose = require("mongoose");

// Firewall Rules Schema
const firewallRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["ip_block", "country_block", "rate_limit", "suspicious_pattern"],
    required: true,
  },
  value: {
    type: String,
    required: true, // IP address, country code, pattern, etc.
  },
  action: {
    type: String,
    enum: ["block", "allow", "rate_limit"],
    default: "block",
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 100,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Firewall Logs Schema
const firewallLogSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  userAgent: String,
  method: String,
  url: String,
  headers: Object,
  country: String,
  region: String,
  city: String,
  action: {
    type: String,
    enum: ["allowed", "blocked", "rate_limited", "suspicious"],
    required: true,
  },
  rule: String, // Rule name that triggered the action
  reason: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Blocked IPs Schema
const blockedIpSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  reason: {
    type: String,
    required: true,
  },
  blockedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
  permanent: {
    type: Boolean,
    default: false,
  },
  attempts: {
    type: Number,
    default: 1,
  },
  lastAttempt: {
    type: Date,
    default: Date.now,
  },
  country: String,
  region: String,
  city: String,
});

// Rate Limit Tracking Schema
const rateLimitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true,
  },
  requests: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      url: String,
      method: String,
    },
  ],
  violations: {
    type: Number,
    default: 0,
  },
  lastViolation: Date,
  delayUntil: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Auto-delete after 1 hour
  },
});

// Create indexes for performance
firewallRuleSchema.index({ type: 1, enabled: 1 });
firewallRuleSchema.index({ priority: 1 });
firewallLogSchema.index({ timestamp: -1 });
firewallLogSchema.index({ ip: 1, timestamp: -1 });
blockedIpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
rateLimitSchema.index({ ip: 1 });

const FirewallRule = mongoose.model("FirewallRule", firewallRuleSchema);
const FirewallLog = mongoose.model("FirewallLog", firewallLogSchema);
const BlockedIp = mongoose.model("BlockedIp", blockedIpSchema);
const RateLimit = mongoose.model("RateLimit", rateLimitSchema);

module.exports = {
  FirewallRule,
  FirewallLog,
  BlockedIp,
  RateLimit,
};
