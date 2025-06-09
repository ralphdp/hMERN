const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: String,
  githubId: String,
  facebookId: String,
  instagramId: String,
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for provider IDs
userSchema.index({ googleId: 1, githubId: 1, facebookId: 1, instagramId: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema); 