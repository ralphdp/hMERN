// backend/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");

// Load admin configuration
const adminConfigPath = path.join(__dirname, "../config/admins.json");
let adminEmails = [];
try {
  if (fs.existsSync(adminConfigPath)) {
    const adminConfig = JSON.parse(fs.readFileSync(adminConfigPath, "utf8"));
    adminEmails = adminConfig.adminEmails || [];
  }
} catch (error) {
  console.error("Error loading admin config:", error);
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId && !this.githubId && !this.facebookId;
    },
  },
  googleId: String,
  githubId: String,
  facebookId: String,
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: false,
  },
  avatar: String,
  googleAccessToken: String,
  githubAccessToken: String,
  facebookAccessToken: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: function () {
      // Auto-verify OAuth users
      return !!(this.googleId || this.githubId || this.facebookId);
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Auto-upgrade admin users based on email
userSchema.pre("save", async function (next) {
  // Check if user email is in admin list and upgrade role
  if (adminEmails.includes(this.email) && this.role !== "admin") {
    console.log(`Auto-upgrading user ${this.email} to admin role`);
    this.role = "admin";
  }

  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

// Static method to upgrade existing admin users
userSchema.statics.upgradeAdminUsers = async function () {
  try {
    const result = await this.updateMany(
      { email: { $in: adminEmails }, role: { $ne: "admin" } },
      { $set: { role: "admin" } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Upgraded ${result.modifiedCount} users to admin role`);
    }
  } catch (error) {
    console.error("Error upgrading admin users:", error);
  }
};

// Create compound index for provider IDs
userSchema.index({ googleId: 1, githubId: 1, facebookId: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema, "core_users");
