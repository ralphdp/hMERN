const express = require('express');
const passport = require('passport');
const router = express.Router();
const authConfig = require('../config/auth.config');
const axios = require('axios');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Token = require('../models/Token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

// Get available auth providers
router.get('/providers', (req, res) => {
  try {
    const enabledProviders = Object.entries(authConfig.providers)
      .filter(([_, config]) => config.enabled)
      .map(([provider]) => provider);
    
    res.json(enabledProviders);
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({ message: 'Failed to get providers' });
  }
});

// Helper function to get the frontend URL
const getFrontendUrl = () => {
  return process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : `http://localhost:${process.env.PORT_FRONTEND}`;
};

// Helper function to handle successful authentication
const handleSuccessfulAuth = (req, res) => {
  console.log('Handling successful authentication');
  console.log('Session ID:', req.sessionID);
  console.log('User:', req.user);
  
  // Ensure session is saved before redirecting
  req.session.save((err) => {
    if (err) {
      console.error('Error saving session:', err);
      return res.redirect(`${getFrontendUrl()}/login?error=session_error`);
    }
    
    console.log('Session saved successfully');
    console.log('Redirecting to:', `${getFrontendUrl()}/dashboard`);
    res.redirect(`${getFrontendUrl()}/dashboard`);
  });
};

// Helper function to handle authentication failure
const handleAuthFailure = (req, res) => {
  console.log('Handling authentication failure');
  res.redirect(`${getFrontendUrl()}/login?error=auth_failed`);
};

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  (req, res, next) => {
    console.log('Google callback received');
    console.log('Callback URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
    next();
  },
  passport.authenticate('google', { 
    failureRedirect: process.env.NODE_ENV === 'production'
      ? new URL('/login?error=google_auth_failed', process.env.FRONTEND_URL).toString()
      : `http://localhost:${process.env.PORT_FRONTEND}/login?error=google_auth_failed`,
    failureMessage: true
  }),
  (req, res) => {
    console.log('Google authentication successful');
    console.log('User:', req.user);
    console.log('Session:', req.session);
    
    // Ensure session is saved before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect(process.env.NODE_ENV === 'production'
          ? new URL('/login?error=session_error', process.env.FRONTEND_URL).toString()
          : `http://localhost:${process.env.PORT_FRONTEND}/login?error=session_error`);
      }
      console.log('Session saved successfully');
      res.redirect(process.env.NODE_ENV === 'production'
        ? new URL('/dashboard', process.env.FRONTEND_URL).toString()
        : `http://localhost:${process.env.PORT_FRONTEND}/dashboard`);
    });
  }
);

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email']
  })
);

router.get('/github/callback',
  (req, res, next) => {
    console.log('GitHub callback received');
    console.log('Callback URL:', `${req.protocol}://${req.get('host')}${req.originalUrl}`);
    next();
  },
  passport.authenticate('github', { 
    failureRedirect: process.env.NODE_ENV === 'production'
      ? new URL('/login?error=github_auth_failed', process.env.FRONTEND_URL).toString()
      : `http://localhost:${process.env.PORT_FRONTEND}/login?error=github_auth_failed`,
    failureMessage: true
  }),
  (req, res) => {
    console.log('GitHub authentication successful');
    console.log('User:', req.user);
    console.log('Session:', req.session);
    
    // Ensure session is saved before redirecting
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect(process.env.NODE_ENV === 'production'
          ? new URL('/login?error=session_error', process.env.FRONTEND_URL).toString()
          : `http://localhost:${process.env.PORT_FRONTEND}/login?error=session_error`);
      }
      console.log('Session saved successfully');
      res.redirect(process.env.NODE_ENV === 'production'
        ? new URL('/dashboard', process.env.FRONTEND_URL).toString()
        : `http://localhost:${process.env.PORT_FRONTEND}/dashboard`);
    });
  }
);

// Facebook OAuth routes
router.get('/facebook',
  (req, res, next) => {
    console.log('Starting Facebook OAuth flow');
    passport.authenticate('facebook', { 
      scope: ['email', 'public_profile']
    })(req, res, next);
  }
);

router.get('/facebook/callback',
  (req, res, next) => {
    console.log('Received Facebook callback with code:', req.query.code);
    passport.authenticate('facebook', { 
      failureRedirect: '/login',
      failureMessage: true
    })(req, res, (err) => {
      if (err) {
        console.error('Facebook authentication error:', err);
        return handleAuthFailure(req, res);
      }
      console.log('Facebook authentication successful');
      handleSuccessfulAuth(req, res);
    });
  }
);

// Get current user
router.get('/user', (req, res) => {
  console.log('User check - Session:', req.session);
  console.log('User check - User:', req.user);
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  console.log('Checking auth status');
  console.log('Session ID:', req.sessionID);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user
  });
});

// Logout route
router.get('/logout', (req, res) => {
  console.log('Logging out user');
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ error: 'Error during logout' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Error destroying session' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

// Add avatar proxy route
router.get('/avatar/:provider/:id', async (req, res) => {
  try {
    const { provider, id } = req.params;
    let avatarUrl;

    if (provider === 'google') {
      // For Google, we should use the stored avatar URL from the user's profile
      const user = await User.findOne({ googleId: id });
      if (user && user.avatar) {
        return res.redirect(user.avatar);
      }
      // Fallback to Gravatar if no Google avatar is found
      const hash = crypto.createHash('md5').update(user.email.toLowerCase().trim()).digest('hex');
      avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
    } else if (provider === 'github') {
      const user = await User.findOne({ githubId: id });
      if (user && user.avatar) {
        return res.redirect(user.avatar);
      }
      avatarUrl = `https://github.com/identicons/${id}.png`;
    } else if (provider === 'facebook') {
      const user = await User.findOne({ facebookId: id });
      if (user && user.avatar) {
        return res.redirect(user.avatar);
      }
      avatarUrl = `https://graph.facebook.com/${id}/picture?type=large`;
    } else if (provider === 'gravatar') {
      // If it's a Gravatar URL, just redirect to it
      avatarUrl = `https://www.gravatar.com/avatar/${id}?d=mp&s=200`;
      return res.redirect(avatarUrl);
    } else {
      return res.status(400).json({ message: 'Invalid provider' });
    }

    const response = await axios.get(avatarUrl, {
      responseType: 'arraybuffer'
    });
    
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(response.data);
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(500).json({ message: 'Failed to fetch avatar' });
  }
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate Gravatar URL
    const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
    const avatar = `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;

    // Create new user with avatar
    const user = await User.create({
      name,
      email,
      password,
      avatar,
      isVerified: false
    });

    // Generate verification token
    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex'),
      type: 'verification'
    });
    await token.save();

    // Send verification email
    await sendVerificationEmail(user.email, token.token);

    res.status(201).json({ 
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Verify email route
router.get('/verify-email/:token', async (req, res) => {
  try {
    console.log('Verifying email with token:', req.params.token);
    
    const token = await Token.findOne({
      token: req.params.token,
      type: 'verification'
    });

    if (!token) {
      console.log('Token not found');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired verification token' 
      });
    }

    const user = await User.findById(token.userId);
    if (!user) {
      console.log('User not found for token');
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.isVerified) {
      console.log('User already verified');
      return res.status(400).json({ 
        success: false,
        message: 'Email already verified' 
      });
    }

    user.isVerified = true;
    await user.save();
    await token.deleteOne();

    console.log('Email verified successfully for user:', user.email);
    res.json({ 
      success: true,
      message: 'Email verified successfully' 
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verifying email' 
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Delete any existing verification tokens
    await Token.deleteMany({ userId: user._id, type: 'verification' });

    // Create new verification token
    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex'),
      type: 'verification'
    });
    await token.save();

    // Send verification email
    await sendVerificationEmail(user.email, token.token);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Error sending verification email' });
  }
});

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete any existing password reset tokens
    await Token.deleteMany({ userId: user._id, type: 'password-reset' });

    // Create new password reset token
    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString('hex'),
      type: 'password-reset'
    });
    await token.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, token.token);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ message: 'Error sending password reset email' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const token = await Token.findOne({
      token: req.params.token,
      type: 'password-reset'
    });

    if (!token) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(token.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password;
    await user.save();
    await token.deleteOne();

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: info.message });
    }

    // Check if email is verified for local login
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in',
        needsVerification: true
      });
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.json({ 
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });
    });
  })(req, res, next);
});

module.exports = router; 