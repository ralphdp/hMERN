const express = require('express');
const passport = require('passport');
const router = express.Router();
const authConfig = require('../config/auth.config');
const axios = require('axios');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
    : 'http://localhost:3000';
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
  (req, res, next) => {
    console.log('Starting GitHub OAuth flow');
    next();
  },
  passport.authenticate('github', { scope: ['user:email'] })
);

router.get('/github/callback',
  (req, res, next) => {
    console.log('Received GitHub OAuth callback');
    console.log('Query params:', req.query);
    next();
  },
  passport.authenticate('github', { failureRedirect: '/api/auth/github/failure' }),
  handleSuccessfulAuth
);

router.get('/github/failure', (req, res) => {
  console.log('GitHub OAuth failure');
  handleAuthFailure(req, res);
});

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
      avatarUrl = `https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg`;
    } else if (provider === 'github') {
      avatarUrl = `https://github.com/identicons/${id}.png`;
    } else if (provider === 'facebook') {
      avatarUrl = `https://graph.facebook.com/${id}/picture?type=large`;
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

// Local registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('Register attempt for:', email);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    console.log('User created successfully:', user._id);
    req.login(user, (err) => {
      if (err) {
        console.error('Login after register error:', err);
        return res.status(500).json({ message: 'Error logging in after registration' });
      }
      res.json(user);
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Local login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user was created through OAuth
    if (user.googleId) {
      return res.status(400).json({ 
        message: 'This account was created using Google. Please sign in with Google instead.' 
      });
    }
    if (user.githubId) {
      return res.status(400).json({ 
        message: 'This account was created using GitHub. Please sign in with GitHub instead.' 
      });
    }
    if (user.facebookId) {
      return res.status(400).json({ 
        message: 'This account was created using Facebook. Please sign in with Facebook instead.' 
      });
    }

    // If no password is set (OAuth-only account)
    if (!user.password) {
      return res.status(400).json({ 
        message: 'This account does not have a password set. Please use the OAuth provider you originally signed up with.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Invalid password for:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Password match successful for:', email);
    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Error logging in' });
      }
      console.log('Login successful, session:', req.session);
      res.json(user);
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

module.exports = router; 