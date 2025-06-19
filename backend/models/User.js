// backend/models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

// Create compound index for provider IDs
userSchema.index({ googleId: 1, githubId: 1, facebookId: 1 }, { sparse: true });

module.exports = mongoose.model("User", userSchema);
