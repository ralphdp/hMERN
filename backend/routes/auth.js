const express = require('express');
const passport = require('passport');
const router = express.Router();
const authConfig = require('../config/auth.config');
const axios = require('axios');

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

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    console.log('Google auth successful, session ID:', req.sessionID);
    console.log('User authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    
    // Successful authentication, redirect to frontend
    const frontendUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:${process.env.PORT_FRONTEND}`
      : process.env.FRONTEND_URL.replace(/\/$/, '');
    console.log('Redirecting to:', frontendUrl);
    res.redirect(frontendUrl);
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
    console.log('GitHub callback received with code:', req.query.code);
    passport.authenticate('github', { 
      failureRedirect: '/login',
      failureMessage: true
    })(req, res, (err) => {
      if (err) {
        console.error('GitHub authentication error:', err);
        console.error('Error stack:', err.stack);
        return res.status(500).json({ 
          message: 'Authentication failed',
          error: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
      console.log('GitHub auth successful, session ID:', req.sessionID);
      console.log('User authenticated:', req.isAuthenticated());
      console.log('User:', req.user);
      
      const frontendUrl = process.env.NODE_ENV === 'development' 
        ? `http://localhost:${process.env.PORT_FRONTEND}`
        : process.env.FRONTEND_URL.replace(/\/$/, '');
      console.log('Redirecting to:', frontendUrl);
      res.redirect(frontendUrl);
    });
  }
);

// Facebook OAuth routes
router.get('/facebook',
  passport.authenticate('facebook', { 
    scope: ['email', 'public_profile']
  })
);

router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    const frontendUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:${process.env.PORT_FRONTEND}`
      : process.env.FRONTEND_URL;
    res.redirect(frontendUrl);
  }
);

// Instagram OAuth routes
router.get('/instagram',
  passport.authenticate('instagram')
);

router.get('/instagram/callback',
  passport.authenticate('instagram', { 
    failureRedirect: '/login',
    failureMessage: true
  }),
  (req, res) => {
    const frontendUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:${process.env.PORT_FRONTEND}`
      : process.env.FRONTEND_URL;
    res.redirect(frontendUrl);
  }
);

// Get current user
router.get('/user', (req, res) => {
  console.log('Session ID:', req.sessionID);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('User:', req.user);
  
  if (req.isAuthenticated()) {
    res.json({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      googleId: req.user.googleId,
      githubId: req.user.githubId,
      facebookId: req.user.facebookId,
      instagramId: req.user.instagramId
    });
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  console.log('Logging out user:', req.user);
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error logging out' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ message: 'Error destroying session' });
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

module.exports = router; 