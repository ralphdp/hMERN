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
const User = require('../models/User');

// Helper function to get callback URL
const getCallbackUrl = (provider) => {
  if (process.env.NODE_ENV === 'production') {
    return `${process.env.FRONTEND_URL}/api/auth/${provider}/callback`;
  }
  // In development, use the backend URL for callbacks
  return `http://localhost:${process.env.PORT_BACKEND}/api/auth/${provider}/callback`;
};

// Serialize user for the session
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user._id);
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  console.log('Deserializing user:', id);
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err);
  }
});

// Configure strategies based on auth config
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production'
      ? new URL('/api/auth/google/callback', process.env.FRONTEND_URL).toString()
      : `http://localhost:${process.env.PORT_BACKEND}/api/auth/google/callback`,
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile:', profile);
      console.log('Google access token:', accessToken);
      console.log('Google refresh token:', refreshToken);

      // Check if user already exists
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          user.googleAccessToken = accessToken;
          user.googleRefreshToken = refreshToken;
          await user.save();
        } else {
          // Create new user
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            googleAccessToken: accessToken,
            googleRefreshToken: refreshToken
          });
        }
      } else {
        // Update tokens
        user.googleAccessToken = accessToken;
        user.googleRefreshToken = refreshToken;
        await user.save();
      }

      return done(null, user);
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error);
    }
  }
));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: getCallbackUrl('github'),
    proxy: true
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub profile:', profile);
      
      // Check if user exists with this GitHub ID
      let user = await User.findOne({ 'githubId': profile.id });
      
      if (!user) {
        // Check if user exists with this email
        if (profile.emails && profile.emails[0]) {
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // Update existing user with GitHub ID
            user.githubId = profile.id;
            await user.save();
          }
        }
        
        if (!user) {
          // Create new user
          user = await User.create({
            githubId: profile.id,
            name: profile.displayName,
            email: profile.emails ? profile.emails[0].value : null,
            avatar: profile.photos ? profile.photos[0].value : null
          });
        }
      }
      
      return done(null, user);
    } catch (err) {
      console.error('GitHub strategy error:', err);
      return done(err);
    }
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: getCallbackUrl('facebook'),
    proxy: true,
    profileFields: ['id', 'displayName', 'photos', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Facebook profile:', profile);
      
      // Check if user exists with this Facebook ID
      let user = await User.findOne({ 'facebookId': profile.id });
      
      if (!user) {
        // Check if user exists with this email
        if (profile.emails && profile.emails[0]) {
          user = await User.findOne({ email: profile.emails[0].value });
          
          if (user) {
            // Update existing user with Facebook ID
            user.facebookId = profile.id;
            await user.save();
          }
        }
        
        if (!user) {
          // Create new user
          user = await User.create({
            facebookId: profile.id,
            name: profile.displayName,
            email: profile.emails ? profile.emails[0].value : null,
            avatar: profile.photos ? profile.photos[0].value : null
          });
        }
      }
      
      return done(null, user);
    } catch (err) {
      console.error('Facebook strategy error:', err);
      return done(err);
    }
  }
));

module.exports = passport; 