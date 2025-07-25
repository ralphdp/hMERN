// backend/config/auth.config.js

module.exports = {
  providers: {
    google: {
      enabled: true,
      strategy: "passport-google-oauth20",
      scope: ["profile", "email"],
    },
    github: {
      enabled: true,
      strategy: "passport-github2",
      scope: ["user:email"],
    },
    facebook: {
      enabled: false,
      strategy: "passport-facebook",
      scope: [],
    },
  },
};
