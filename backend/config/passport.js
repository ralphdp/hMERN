// backend/config/passport.js

const path = require("path");
const dotenv = require("dotenv");
const crypto = require("crypto");

// Load environment variables only in development
if (process.env.NODE_ENV !== "production") {
  try {
    dotenv.config({ path: path.resolve(__dirname, "../.env") });
  } catch (error) {
    console.warn("Warning: .env file not found in development mode");
  }
}

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const User = require("../models/User");

// Helper function to get Gravatar URL
const getGravatarUrl = (email) => {
  const hash = crypto
    .createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
};

// Helper function to get callback URL
const getCallbackUrl = (provider) => {
  if (process.env.NODE_ENV === "production") {
    return `${process.env.FRONTEND_URL}/api/auth/${provider}/callback`;
  }
  // In development, use the backend URL for callbacks
  return `http://localhost:${process.env.PORT_BACKEND}api/auth/${provider}/callback`;
};

// Serialize user for the session
passport.serializeUser((user, done) => {
  console.log("Serializing user:", user._id);
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  console.log("Deserializing user:", id);
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    console.error("Deserialization error:", err);
    done(err);
  }
});

// Local Strategy for email/password login
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        console.log("Attempting local login for:", email);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
          console.log("User not found");
          return done(null, false, { message: "Invalid email or password" });
        }

        // Check if user has a password (OAuth users might not)
        if (!user.password) {
          console.log("User has no password set");
          return done(null, false, { message: "Please use OAuth login" });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          console.log("Password does not match");
          return done(null, false, { message: "Invalid email or password" });
        }

        // Always update the Gravatar URL to ensure it's current
        const hash = crypto
          .createHash("md5")
          .update(email.toLowerCase().trim())
          .digest("hex");
        const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;

        // Only update if the avatar is different or not set
        if (!user.avatar || user.avatar !== gravatarUrl) {
          user.avatar = gravatarUrl;
          await user.save();
        }

        console.log("Local login successful");
        return done(null, user);
      } catch (error) {
        console.error("Local strategy error:", error);
        return done(error);
      }
    }
  )
);

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? `${
              process.env.BACKEND_URL || process.env.FRONTEND_URL
            }/api/auth/google/callback`
          : `http://localhost:${
              process.env.PORT_BACKEND || 5050
            }/api/auth/google/callback`,
      proxy: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google profile:", profile);
        console.log("Google access token:", accessToken);
        console.log("Google refresh token:", refreshToken);

        // Get the Google avatar URL
        const googleAvatarUrl =
          profile.photos && profile.photos[0] ? profile.photos[0].value : null;
        console.log("Google avatar URL:", googleAvatarUrl);

        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Update existing user with Google ID and avatar
            user.googleId = profile.id;
            user.googleAccessToken = accessToken;
            user.googleRefreshToken = refreshToken;
            if (googleAvatarUrl) {
              user.avatar = googleAvatarUrl;
            }
            await user.save();
          } else {
            // Create new user
            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              name: profile.displayName,
              googleAccessToken: accessToken,
              googleRefreshToken: refreshToken,
              avatar: googleAvatarUrl,
            });
          }
        } else {
          // Update tokens and avatar
          user.googleAccessToken = accessToken;
          user.googleRefreshToken = refreshToken;
          if (googleAvatarUrl) {
            user.avatar = googleAvatarUrl;
          }
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("Google auth error:", error);
        return done(error);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:
        process.env.NODE_ENV === "production"
          ? `${
              process.env.BACKEND_URL || process.env.FRONTEND_URL
            }/api/auth/github/callback`
          : `http://localhost:${
              process.env.PORT_BACKEND || 5050
            }/api/auth/github/callback`,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GitHub profile:", profile);
        console.log("GitHub access token:", accessToken);
        console.log("GitHub refresh token:", refreshToken);

        // Check if user already exists
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
          // Check if user exists with same email
          const email =
            profile.emails && profile.emails[0]
              ? profile.emails[0].value
              : null;
          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Update existing user with GitHub ID
              user.githubId = profile.id;
              user.githubAccessToken = accessToken;
              user.avatar = profile.photos[0].value;
              await user.save();
            }
          }

          if (!user) {
            // Create new user
            user = await User.create({
              githubId: profile.id,
              email: email,
              name: profile.displayName,
              githubAccessToken: accessToken,
              avatar: profile.photos[0].value,
            });
          }
        } else {
          // Update token and avatar
          user.githubAccessToken = accessToken;
          user.avatar = profile.photos[0].value;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("GitHub auth error:", error);
        return done(error);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: getCallbackUrl("facebook"),
      proxy: true,
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Facebook profile:", profile);

        // Check if user exists with this Facebook ID
        let user = await User.findOne({ facebookId: profile.id });

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
              avatar: profile.photos ? profile.photos[0].value : null,
            });
          }
        }

        return done(null, user);
      } catch (err) {
        console.error("Facebook strategy error:", err);
        return done(err);
      }
    }
  )
);

module.exports = passport;
