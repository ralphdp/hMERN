const path = require('path');
const dotenv = require('dotenv');

// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  try {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
  } catch (error) {
    console.warn('Warning: .env file not found in development mode');
  }
}

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const User = require('../models/User');
const authConfig = require('./auth.config');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Get callback URL based on environment
const getCallbackUrl = (provider) => {
  const baseUrl = process.env.NODE_ENV === 'development'
    ? `http://localhost:${process.env.PORT_BACKEND}`
    : process.env.FRONTEND_URL.replace(/\/$/, '');
  const callbackUrl = `${baseUrl}/api/auth/${provider}/callback`;
  console.log(`Generated callback URL for ${provider}:`, callbackUrl);
  return callbackUrl;
};

// Helper function to create user or find existing user
const findOrCreateUser = async (provider, profile) => {
  const query = {};
  query[`${provider}Id`] = profile.id;
  
  let user = await User.findOne(query);
  
  if (!user) {
    const userData = {
      [provider + 'Id']: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName || profile.username,
      avatar: profile.photos?.[0]?.value
    };
    
    user = await User.create(userData);
  }
  
  return user;
};

// Configure strategies based on auth config
if (authConfig.providers.google.enabled && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: getCallbackUrl('google'),
    proxy: true,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        // Get the avatar URL and ensure it's using HTTPS
        const avatarUrl = profile.photos?.[0]?.value;
        // Remove the size parameter and use a larger size
        const secureAvatarUrl = avatarUrl?.replace(/=s\d+-c$/, '=s200-c');

        // Create new user if doesn't exist
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          avatar: secureAvatarUrl
        });
      } else if (user.avatar?.includes('=s96-c')) {
        // Update existing user's avatar to use larger size if needed
        user.avatar = user.avatar.replace(/=s\d+-c$/, '=s200-c');
        await user.save();
      }

      // Ensure session is saved
      if (req.session) {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
          }
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

if (authConfig.providers.github.enabled && process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  console.log('Configuring GitHub strategy with callback URL:', getCallbackUrl('github'));
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: getCallbackUrl('github'),
    proxy: true,
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub profile received:', JSON.stringify(profile, null, 2));
      
      if (!profile || !profile.id) {
        console.error('Invalid GitHub profile received:', profile);
        return done(new Error('Invalid GitHub profile data'), null);
      }

      let user = await User.findOne({ githubId: profile.id });
      console.log('Existing user found:', user ? 'yes' : 'no');

      if (!user) {
        console.log('Creating new user from GitHub profile');
        const userData = {
          githubId: profile.id,
          name: profile.displayName || profile.username,
          avatar: profile.photos?.[0]?.value || `/api/auth/avatar/github/${profile.id}`
        };

        // Only add email if it exists
        if (profile.emails?.[0]?.value) {
          userData.email = profile.emails[0].value;
        }

        console.log('User data to create:', userData);
        
        user = await User.create(userData);
        console.log('New user created:', user);
      }

      // Ensure session is saved
      if (req.session) {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return done(err, null);
          }
          console.log('Session saved successfully');
        });
      } else {
        console.warn('No session object found in request');
      }

      return done(null, user);
    } catch (err) {
      console.error('GitHub strategy error:', err);
      console.error('Error stack:', err.stack);
      return done(err, null);
    }
  }));
}

if (authConfig.providers.facebook.enabled && process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: getCallbackUrl('facebook'),
    proxy: true,
    profileFields: ['id']  // Only request the ID
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ facebookId: profile.id });

      if (!user) {
        // Create user with just the Facebook ID
        user = await User.create({
          facebookId: profile.id,
          name: `Facebook User ${profile.id}`,  // Generate a default name
          avatar: `/api/auth/avatar/facebook/${profile.id}`
        });
      }

      return done(null, user);
    } catch (err) {
      console.error('Facebook strategy error:', err);
      return done(err, null);
    }
  }));
}

if (authConfig.providers.instagram.enabled && process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET) {
  passport.use(new InstagramStrategy({
    clientID: process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    callbackURL: getCallbackUrl('instagram'),
    proxy: true
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ instagramId: profile.id });

      if (!user) {
        user = await User.create({
          instagramId: profile.id,
          name: profile.displayName,
          avatar: profile._json.data.profile_picture
        });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

module.exports = passport; 