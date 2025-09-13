const mongoose = require("mongoose");
const crypto = require("crypto");

// Encryption utilities
const encryptCredential = (text) => {
  if (!text || !process.env.ENCRYPTION_KEY) {
    console.log("🔒 [ENCRYPTION] Skipping encryption - no text or key");
    return text;
  }

  try {
    const algorithm = "aes-256-cbc";
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, "salt", 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Prepend IV to encrypted text
    const result = iv.toString("hex") + ":" + encrypted;
    console.log("🔒 [ENCRYPTION] Encrypted credential successfully");
    return result;
  } catch (error) {
    console.error("🔒 [ENCRYPTION] Error encrypting credential:", error);
    return text; // Return original text if encryption fails
  }
};

const decryptCredential = (encryptedText) => {
  if (!encryptedText || !process.env.ENCRYPTION_KEY) {
    console.log("🔓 [DECRYPTION] Skipping decryption - no text or key");
    return encryptedText;
  }

  try {
    // Check if this is new format (with IV) or old format
    if (encryptedText.includes(":")) {
      // New format with IV
      const algorithm = "aes-256-cbc";
      const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, "salt", 32);

      const parts = encryptedText.split(":");
      const iv = Buffer.from(parts[0], "hex");
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      console.log(
        "🔓 [DECRYPTION] Decrypted credential successfully (new format)"
      );
      return decrypted;
    } else {
      // Legacy format - use old method for backward compatibility
      console.log("🔓 [DECRYPTION] Using legacy decryption method");
      const decipher = crypto.createDecipher(
        "aes-256-cbc",
        process.env.ENCRYPTION_KEY
      );
      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");

      console.log(
        "🔓 [DECRYPTION] Decrypted credential successfully (legacy format)"
      );
      return decrypted;
    }
  } catch (error) {
    console.error(
      "🔓 [DECRYPTION] Error decrypting credential:",
      error.message
    );
    return encryptedText; // Return as-is if decryption fails
  }
};

// Core Settings Schema for External Services and Global Configuration
const settingsSchema = new mongoose.Schema({
  settingsId: {
    type: String,
    default: "default",
    unique: true,
  },

  // External Services Credentials (encrypted)
  externalServices: {
    redis: {
      endpoint: {
        type: String,
        default: "",
        set: encryptCredential,
        get: decryptCredential,
      },
      password: {
        type: String,
        default: "",
        set: encryptCredential,
        get: decryptCredential,
      },
    },
    cloudflareR2: {
      bucket: {
        type: String,
        default: "hmern",
      },
      token: {
        type: String,
        default: "",
        set: encryptCredential,
        get: decryptCredential,
      },
      accessKeyId: {
        type: String,
        default: "",
        set: encryptCredential,
        get: decryptCredential,
      },
      secretAccessKey: {
        type: String,
        default: "",
        set: encryptCredential,
        get: decryptCredential,
      },
      endpointS3: {
        type: String,
        default: "",
        set: encryptCredential,
        get: decryptCredential,
      },
    },
    // Future services can be added here (e.g., AWS, Google Cloud, etc.)
  },

  // Global Application Settings
  global: {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    debugMode: {
      type: Boolean,
      default: false,
    },
    environment: {
      type: String,
      enum: ["development", "staging", "production"],
      default: "development",
    },
  },

  // Security Settings
  security: {
    encryptionEnabled: {
      type: Boolean,
      default: true,
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
    },
    sessionTimeout: {
      type: Number,
      default: 86400, // 24 hours in seconds
    },
  },

  // Plugin-specific settings can extend this model
  plugins: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: String,
    default: "system",
  },
});

// Ensure getters are called when converting to JSON
settingsSchema.set("toJSON", { getters: true });
settingsSchema.set("toObject", { getters: true });

// Update the updatedAt field before saving
settingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Note: settingsId already has unique: true which creates an index

const Settings = mongoose.model(
  "Settings",
  settingsSchema,
  "core_settings_config"
);

module.exports = {
  Settings,
  encryptCredential,
  decryptCredential,
};
