// backend/routes/auth.js

const express = require("express");
const passport = require("passport");
const router = express.Router();
const authConfig = require("../config/auth.config");
const axios = require("axios");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Token = require("../models/Token");
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

// Get available auth providers
router.get("/providers", (req, res) => {
  try {
    const enabledProviders = Object.entries(authConfig.providers)
      .filter(([_, config]) => config.enabled)
      .map(([provider]) => provider);

    res.json(enabledProviders);
  } catch (error) {
    console.error("Error getting providers:", error);
    res.status(500).json({ message: "Failed to get providers" });
  }
});

// Helper function to get the frontend URL
const getFrontendUrl = () => {
  return process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : `http://localhost:${process.env.PORT_FRONTEND || 3000}`;
};

// Helper function to handle successful authentication
const handleSuccessfulAuth = (req, res) => {
  console.log("Handling successful authentication");
  console.log("Session ID:", req.sessionID);
  console.log("User:", req.user);

  // Ensure session is saved before redirecting
  req.session.save((err) => {
    if (err) {
      console.error("Error saving session:", err);
      return res.redirect(`${getFrontendUrl()}/login?error=session_error`);
    }

    console.log("Session saved successfully");
    console.log("Redirecting to:", `${getFrontendUrl()}/dashboard`);
    res.redirect(`${getFrontendUrl()}/dashboard`);
  });
};

// Helper function to handle authentication failure
const handleAuthFailure = (req, res) => {
  console.log("Handling authentication failure");
  res.redirect(`${getFrontendUrl()}/login?error=auth_failed`);
};

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("Google callback received");
    console.log(
      "Callback URL:",
      `${req.protocol}://${req.get("host")}${req.originalUrl}`
    );
    console.log("Query params:", req.query);
    console.log("Session ID:", req.sessionID);
    console.log("Is authenticated:", req.isAuthenticated());
    next();
  },
  passport.authenticate("google", {
    failureRedirect:
      process.env.NODE_ENV === "production"
        ? new URL(
            "/login?error=google_auth_failed",
            process.env.FRONTEND_URL
          ).toString()
        : `http://localhost:${process.env.PORT_FRONTEND}/login?error=google_auth_failed`,
    failureMessage: true,
  }),
  async (req, res) => {
    try {
      console.log("Google authentication successful");
      console.log("User:", req.user);
      console.log("Session:", req.session);
      console.log("Session ID:", req.sessionID);
      console.log("Is authenticated:", req.isAuthenticated());

      // Simple redirect without complex session handling
      const redirectUrl =
        process.env.NODE_ENV === "production"
          ? `${process.env.FRONTEND_URL}/dashboard`
          : `http://localhost:${process.env.PORT_FRONTEND || 3000}/dashboard`;

      console.log("Redirecting to:", redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Error in Google callback:", error);
      res.redirect(
        process.env.NODE_ENV === "production"
          ? `${process.env.FRONTEND_URL}/login?error=server_error`
          : `http://localhost:${
              process.env.PORT_FRONTEND || 3000
            }/login?error=server_error`
      );
    }
  }
);

// GitHub OAuth routes
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/github/callback",
  (req, res, next) => {
    console.log("GitHub callback received");
    console.log(
      "Callback URL:",
      `${req.protocol}://${req.get("host")}${req.originalUrl}`
    );
    next();
  },
  passport.authenticate("github", {
    failureRedirect:
      process.env.NODE_ENV === "production"
        ? new URL(
            "/login?error=github_auth_failed",
            process.env.FRONTEND_URL
          ).toString()
        : `http://localhost:${process.env.PORT_FRONTEND}/login?error=github_auth_failed`,
    failureMessage: true,
  }),
  (req, res) => {
    console.log("GitHub authentication successful");
    console.log("User:", req.user);
    console.log("Session:", req.session);

    // Ensure session is saved before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.redirect(
          process.env.NODE_ENV === "production"
            ? new URL(
                "/login?error=session_error",
                process.env.FRONTEND_URL
              ).toString()
            : `http://localhost:${process.env.PORT_FRONTEND}/login?error=session_error`
        );
      }
      console.log("Session saved successfully");
      res.redirect(
        process.env.NODE_ENV === "production"
          ? new URL("/dashboard", process.env.FRONTEND_URL).toString()
          : `http://localhost:${process.env.PORT_FRONTEND}/dashboard`
      );
    });
  }
);

// Facebook OAuth routes
router.get("/facebook", (req, res, next) => {
  console.log("Starting Facebook OAuth flow");
  passport.authenticate("facebook", {
    scope: ["email", "public_profile"],
  })(req, res, next);
});

router.get("/facebook/callback", (req, res, next) => {
  console.log("Received Facebook callback with code:", req.query.code);
  passport.authenticate("facebook", {
    failureRedirect: "/login",
    failureMessage: true,
  })(req, res, (err) => {
    if (err) {
      console.error("Facebook authentication error:", err);
      return handleAuthFailure(req, res);
    }
    console.log("Facebook authentication successful");
    handleSuccessfulAuth(req, res);
  });
});

// Get current user
router.get("/user", (req, res) => {
  console.log("User check - Session:", req.session);
  console.log("User check - User:", req.user);
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

// Check authentication status
router.get("/status", (req, res) => {
  console.log("Checking auth status");
  console.log("Session ID:", req.sessionID);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("User:", req.user);

  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
  });
});

// Check authentication status (alias for /status)
router.get("/check", (req, res) => {
  console.log("Checking auth status via /check endpoint");
  console.log("Session ID:", req.sessionID);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("User:", req.user);

  if (req.isAuthenticated()) {
    res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        avatar: req.user.avatar,
        isAdmin: req.user.isAdmin ? req.user.isAdmin() : false,
      },
    });
  } else {
    res.status(401).json({
      success: false,
      isAuthenticated: false,
      message: "Not authenticated",
    });
  }
});

// Logout route
router.get("/logout", (req, res) => {
  console.log("Logging out user");
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return res.status(500).json({ error: "Error during logout" });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Error destroying session" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

// Add avatar proxy route
router.get("/avatar/:provider/:id", async (req, res) => {
  try {
    const { provider, id } = req.params;
    let avatarUrl;

    if (provider === "google") {
      // For Google, we should use the stored avatar URL from the user's profile
      const user = await User.findOne({ googleId: id });
      if (user && user.avatar) {
        return res.redirect(user.avatar);
      }
      // Fallback to Gravatar if no Google avatar is found
      const hash = crypto
        .createHash("md5")
        .update(user.email.toLowerCase().trim())
        .digest("hex");
      avatarUrl = `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
    } else if (provider === "github") {
      const user = await User.findOne({ githubId: id });
      if (user && user.avatar) {
        return res.redirect(user.avatar);
      }
      avatarUrl = `https://github.com/identicons/${id}.png`;
    } else if (provider === "facebook") {
      const user = await User.findOne({ facebookId: id });
      if (user && user.avatar) {
        return res.redirect(user.avatar);
      }
      avatarUrl = `https://graph.facebook.com/${id}/picture?type=large`;
    } else if (provider === "gravatar") {
      // If it's a Gravatar URL, just redirect to it
      avatarUrl = `https://www.gravatar.com/avatar/${id}?d=mp&s=200`;
      return res.redirect(avatarUrl);
    } else {
      return res.status(400).json({ message: "Invalid provider" });
    }

    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(response.data);
  } catch (error) {
    console.error("Avatar proxy error:", error);
    res.status(500).json({ message: "Failed to fetch avatar" });
  }
});

// Register route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Generate Gravatar URL
    const hash = crypto
      .createHash("md5")
      .update(email.toLowerCase().trim())
      .digest("hex");
    const avatar = `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;

    // Create new user with avatar
    const user = await User.create({
      name,
      email,
      password,
      avatar,
      isVerified: false,
    });

    // Generate verification token
    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
      type: "verification",
    });
    await token.save();

    // Send verification email
    await sendVerificationEmail(user.email, token.token);

    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error registering user" });
  }
});

// Verify email route
router.get("/verify-email/:token", async (req, res) => {
  try {
    console.log("Verifying email with token:", req.params.token);

    const token = await Token.findOne({
      token: req.params.token,
      type: "verification",
    });

    if (!token) {
      console.log("Token not found");
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token",
      });
    }

    const user = await User.findById(token.userId);
    if (!user) {
      console.log("User not found for token");
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      console.log("User already verified");
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    user.isVerified = true;
    await user.save();
    await token.deleteOne();

    console.log("Email verified successfully for user:", user.email);
    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying email",
    });
  }
});

// Resend verification email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Delete any existing verification tokens
    await Token.deleteMany({ userId: user._id, type: "verification" });

    // Create new verification token
    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
      type: "verification",
    });
    await token.save();

    // Send verification email
    await sendVerificationEmail(user.email, token.token);

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: "Error sending verification email" });
  }
});

// Request password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete any existing password reset tokens
    await Token.deleteMany({ userId: user._id, type: "password-reset" });

    // Create new password reset token
    const token = new Token({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
      type: "password-reset",
    });
    await token.save();

    // Send password reset email
    await sendPasswordResetEmail(user.email, token.token);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ message: "Error sending password reset email" });
  }
});

// Reset password
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    const token = await Token.findOne({
      token: req.params.token,
      type: "password-reset",
    });

    if (!token) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(token.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    await user.save();
    await token.deleteOne();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Local login route
router.post("/login", async (req, res, next) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error during login" });
    }

    if (!user) {
      return res
        .status(401)
        .json({ message: info.message || "Invalid credentials" });
    }

    try {
      // Ensure user data is fully loaded with avatar
      const freshUser = await User.findById(user._id);
      if (!freshUser) {
        throw new Error("User not found after authentication");
      }

      // Update Gravatar URL if needed
      const hash = crypto
        .createHash("md5")
        .update(freshUser.email.toLowerCase().trim())
        .digest("hex");
      const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;

      if (!freshUser.avatar || freshUser.avatar !== gravatarUrl) {
        freshUser.avatar = gravatarUrl;
        await freshUser.save();
      }

      // Log in the user with fresh data
      req.login(freshUser, (err) => {
        if (err) {
          console.error("Error during login:", err);
          return res.status(500).json({ message: "Error during login" });
        }

        // Ensure session is saved
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ message: "Error saving session" });
          }

          console.log("Login successful, user data:", freshUser);
          res.json({
            message: "Login successful",
            user: freshUser,
          });
        });
      });
    } catch (error) {
      console.error("Error in login process:", error);
      res.status(500).json({ message: "Error during login process" });
    }
  })(req, res, next);
});

// Test endpoint to check authentication state
router.get("/test", (req, res) => {
  console.log("=== AUTH TEST ENDPOINT ===");
  console.log("Session ID:", req.sessionID);
  console.log("Session:", req.session);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("User:", req.user);
  console.log("Headers:", req.headers);
  console.log("========================");

  res.json({
    sessionId: req.sessionID,
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    session: req.session,
    headers: req.headers,
  });
});

// === CORE SETTINGS MANAGEMENT ===

// Get external services credentials (admin only)
router.get("/settings/credentials", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { settingsService } = require("../services/settingsService");
    const credentials = await settingsService.getCredentials();

    // Return actual credentials for display (frontend will handle masking if needed)
    res.json({
      success: true,
      data: {
        redis: {
          endpoint: credentials.redis.endpoint || "",
          hasPassword: !!credentials.redis.password,
        },
        cloudflareR2: {
          bucket: credentials.cloudflareR2.bucket || "",
          token: credentials.cloudflareR2.token || "",
          hasToken: !!credentials.cloudflareR2.token,
          accessKeyId: credentials.cloudflareR2.accessKeyId || "",
          hasAccessKeyId: !!credentials.cloudflareR2.accessKeyId,
          secretAccessKey: credentials.cloudflareR2.secretAccessKey || "",
          hasSecretAccessKey: !!credentials.cloudflareR2.secretAccessKey,
          endpointS3: credentials.cloudflareR2.endpointS3 || "",
        },
      },
    });
  } catch (error) {
    console.error("Error getting settings credentials:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving settings credentials",
    });
  }
});

// Update external services credentials (admin only)
router.put("/settings/credentials", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { redis, cloudflareR2 } = req.body;

    // Validate input
    if (!redis && !cloudflareR2) {
      return res.status(400).json({
        success: false,
        message: "At least one service configuration is required",
      });
    }

    const { settingsService } = require("../services/settingsService");
    const updatedCredentials = await settingsService.updateCredentials({
      redis,
      cloudflareR2,
    });

    res.json({
      success: true,
      message: "Settings credentials updated successfully",
      data: {
        redis: {
          endpoint: updatedCredentials.redis.endpoint || "",
          hasPassword: !!updatedCredentials.redis.password,
        },
        cloudflareR2: {
          bucket: updatedCredentials.cloudflareR2.bucket || "",
          token: updatedCredentials.cloudflareR2.token || "",
          hasToken: !!updatedCredentials.cloudflareR2.token,
          accessKeyId: updatedCredentials.cloudflareR2.accessKeyId || "",
          hasAccessKeyId: !!updatedCredentials.cloudflareR2.accessKeyId,
          secretAccessKey:
            updatedCredentials.cloudflareR2.secretAccessKey || "",
          hasSecretAccessKey: !!updatedCredentials.cloudflareR2.secretAccessKey,
          endpointS3: updatedCredentials.cloudflareR2.endpointS3 || "",
        },
      },
    });
  } catch (error) {
    console.error("Error updating settings credentials:", error);
    res.status(500).json({
      success: false,
      message: "Error updating settings credentials",
    });
  }
});

// Test external services connections (admin only)
router.post("/settings/test-redis", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { endpoint } = req.body;
    const { settingsService } = require("../services/settingsService");

    // Use provided endpoint or get from database
    let testEndpoint = endpoint;
    if (!testEndpoint) {
      const credentials = await settingsService.getCachedCredentials();
      testEndpoint = credentials.redis.endpoint;
    }

    if (!testEndpoint) {
      return res.status(400).json({
        success: false,
        message: "Redis endpoint is required for testing",
      });
    }

    // Test Redis connection
    const redis = require("redis");
    const client = redis.createClient({
      url: testEndpoint,
      socket: { reconnectStrategy: false },
    });

    try {
      await client.connect();
      await client.ping();
      await client.disconnect();

      res.json({
        success: true,
        message: "Redis connection successful",
        data: {
          testResult: {
            title: "Redis Connection Test Successful",
            message: `Successfully connected to Redis at ${testEndpoint}`,
            severity: "success",
            details: { endpoint: testEndpoint },
            testResults: { connectivity: true },
          },
        },
      });
    } catch (redisError) {
      res.status(400).json({
        success: false,
        message: `Redis connection failed: ${redisError.message}`,
        data: {
          testResult: {
            title: "Redis Connection Test Failed",
            message: `Failed to connect to Redis: ${redisError.message}`,
            severity: "error",
            details: { endpoint: testEndpoint },
            testResults: {
              connectivity: false,
              connectivityError: redisError.message,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error testing Redis connection:", error);
    res.status(500).json({
      success: false,
      message: "Error testing Redis connection",
    });
  }
});

// Test Cloudflare R2 connection (admin only)
router.post("/settings/test-r2", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { bucket, token, accessKeyId, secretAccessKey, endpointS3 } =
      req.body;
    const { settingsService } = require("../services/settingsService");

    // Use provided credentials or get from database
    let testCredentials = {
      bucket,
      token,
      accessKeyId,
      secretAccessKey,
      endpointS3,
    };

    // Fill in missing credentials from database
    if (!bucket || !token || !accessKeyId || !secretAccessKey || !endpointS3) {
      const credentials = await settingsService.getCachedCredentials();
      testCredentials = {
        bucket: bucket || credentials.cloudflareR2.bucket,
        token: token || credentials.cloudflareR2.token,
        accessKeyId: accessKeyId || credentials.cloudflareR2.accessKeyId,
        secretAccessKey:
          secretAccessKey || credentials.cloudflareR2.secretAccessKey,
        endpointS3: endpointS3 || credentials.cloudflareR2.endpointS3,
      };
    }

    // Validate required credentials
    if (
      !testCredentials.bucket ||
      !testCredentials.accessKeyId ||
      !testCredentials.secretAccessKey ||
      !testCredentials.endpointS3
    ) {
      return res.status(400).json({
        success: false,
        message: "Cloudflare R2 credentials are required for testing",
        data: {
          testResult: {
            title: "Cloudflare R2 Connection Test Failed",
            message:
              "Missing required credentials (bucket, accessKeyId, secretAccessKey, endpointS3)",
            severity: "error",
            testResults: { connectivity: false },
          },
        },
      });
    }

    // Test R2 connection using AWS SDK v3
    const {
      S3Client,
      ListBucketsCommand,
      HeadBucketCommand,
    } = require("@aws-sdk/client-s3");

    const s3Client = new S3Client({
      region: "auto", // Cloudflare R2 uses "auto" region
      endpoint: testCredentials.endpointS3,
      credentials: {
        accessKeyId: testCredentials.accessKeyId,
        secretAccessKey: testCredentials.secretAccessKey,
      },
      forcePathStyle: true, // Required for R2
    });

    let testResults = { connectivity: false };
    let bucketsFound = 0;
    let buckets = [];

    try {
      // Test 1: List buckets to test general connectivity
      try {
        const listCommand = new ListBucketsCommand({});
        const listResult = await s3Client.send(listCommand);
        testResults.listBuckets = true;
        testResults.connectivity = true;
        bucketsFound = listResult.Buckets.length;
        buckets = listResult.Buckets.map((b) => b.Name);
      } catch (listError) {
        testResults.listBuckets = false;
        testResults.listBucketsError = listError.message;
      }

      // Test 2: Head bucket operation on the specific bucket
      try {
        const headCommand = new HeadBucketCommand({
          Bucket: testCredentials.bucket,
        });
        await s3Client.send(headCommand);
        testResults.headBucket = true;
        testResults.connectivity = true;
      } catch (headError) {
        testResults.headBucket = false;
        testResults.headBucketError = headError.message;
      }

      // Determine overall success
      const success =
        testResults.connectivity &&
        (testResults.listBuckets || testResults.headBucket);

      res.json({
        success,
        message: success
          ? `Successfully connected to Cloudflare R2. Found ${bucketsFound} buckets.`
          : "Failed to connect to Cloudflare R2",
        data: {
          testResult: {
            title: success
              ? "Cloudflare R2 Connection Test Successful"
              : "Cloudflare R2 Connection Test Failed",
            message: success
              ? `Successfully connected to Cloudflare R2. Bucket "${testCredentials.bucket}" is accessible.`
              : `Failed to connect to Cloudflare R2: ${
                  testResults.listBucketsError ||
                  testResults.headBucketError ||
                  "Unknown error"
                }`,
            severity: success ? "success" : "error",
            details: {
              bucketName: testCredentials.bucket,
              accessKeyId: testCredentials.accessKeyId,
              endpoint: testCredentials.endpointS3,
            },
            testResults,
            bucketsFound,
            buckets: buckets.slice(0, 10), // Limit to first 10 buckets for display
          },
        },
      });
    } catch (r2Error) {
      res.status(400).json({
        success: false,
        message: `Cloudflare R2 connection failed: ${r2Error.message}`,
        data: {
          testResult: {
            title: "Cloudflare R2 Connection Test Failed",
            message: `Failed to connect to Cloudflare R2: ${r2Error.message}`,
            severity: "error",
            details: {
              bucketName: testCredentials.bucket,
              accessKeyId: testCredentials.accessKeyId,
              endpoint: testCredentials.endpointS3,
            },
            testResults: {
              connectivity: false,
              connectivityError: r2Error.message,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error testing Cloudflare R2 connection:", error);
    res.status(500).json({
      success: false,
      message: "Error testing Cloudflare R2 connection",
    });
  }
});

// Get external services status (admin only)
router.get("/settings/status", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { settingsService } = require("../services/settingsService");
    const status = await settingsService.getExternalServicesStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error getting external services status:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving external services status",
    });
  }
});

// === CORE APPLICATION SETTINGS ===

// Get core settings (admin only)
router.get("/settings/core", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { getCoreSettings } = require("../utils/coreSettings");
    const settings = await getCoreSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error getting core settings:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving core settings",
    });
  }
});

// Update core settings (admin only)
router.put("/settings/core", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { rateLimiting, security } = req.body;

    // Validate required fields
    if (!rateLimiting && !security) {
      return res.status(400).json({
        success: false,
        message: "At least one settings section is required",
      });
    }

    // Validate rate limiting settings if provided
    if (rateLimiting) {
      if (
        rateLimiting.windowMs &&
        (rateLimiting.windowMs < 60000 || rateLimiting.windowMs > 3600000)
      ) {
        return res.status(400).json({
          success: false,
          message: "Window time must be between 1 minute and 1 hour",
        });
      }

      if (
        rateLimiting.maxRequests &&
        (rateLimiting.maxRequests < 10 || rateLimiting.maxRequests > 10000)
      ) {
        return res.status(400).json({
          success: false,
          message: "Max requests must be between 10 and 10,000",
        });
      }
    }

    const { updateCoreSettings } = require("../utils/coreSettings");
    const updatedSettings = await updateCoreSettings(
      { rateLimiting, security },
      req.user.email
    );

    res.json({
      success: true,
      message: "Core settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating core settings:", error);
    res.status(500).json({
      success: false,
      message: "Error updating core settings",
    });
  }
});

// Test rate limiting settings (admin only)
router.post("/settings/test-rate-limit", async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { getCoreSettings } = require("../utils/coreSettings");
    const settings = await getCoreSettings();

    // Simulate rate limit configuration test
    const rateLimitConfig = settings.rateLimiting;

    res.json({
      success: true,
      message: "Rate limiting configuration test completed",
      data: {
        testResult: {
          title: "Rate Limiting Configuration Test",
          message: `Current settings: ${
            rateLimitConfig.maxRequests
          } requests per ${Math.round(
            rateLimitConfig.windowMs / 60000
          )} minutes`,
          severity: "info",
          details: {
            windowMs: rateLimitConfig.windowMs,
            maxRequests: rateLimitConfig.maxRequests,
            enabled: rateLimitConfig.enabled,
            skipAdminRoutes: rateLimitConfig.skipAdminRoutes,
            skipPluginRoutes: rateLimitConfig.skipPluginRoutes,
          },
          testResults: {
            configurationValid: true,
            adminRoutesSkipped: rateLimitConfig.skipAdminRoutes,
            pluginRoutesSkipped: rateLimitConfig.skipPluginRoutes,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error testing rate limiting:", error);
    res.status(500).json({
      success: false,
      message: "Error testing rate limiting configuration",
    });
  }
});

module.exports = router;
