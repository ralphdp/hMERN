const mongoose = require("mongoose");
const { Settings } = require("./src/models/Settings");

async function migrateCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("🔗 Connected to MongoDB");

    console.log("🔧 Current Environment Variables:");
    console.log(
      "REDIS_PUBLIC_ENDPOINT:",
      process.env.REDIS_PUBLIC_ENDPOINT ? "✅ SET" : "❌ MISSING"
    );
    console.log(
      "CLOUDFLARE_R2_BUCKET:",
      process.env.CLOUDFLARE_R2_BUCKET ? "✅ SET" : "❌ MISSING"
    );
    console.log(
      "CLOUDFLARE_R2_TOKEN:",
      process.env.CLOUDFLARE_R2_TOKEN ? "✅ SET" : "❌ MISSING"
    );
    console.log(
      "CLOUDFLARE_ACCESS_KEY_ID:",
      process.env.CLOUDFLARE_ACCESS_KEY_ID ? "✅ SET" : "❌ MISSING"
    );
    console.log(
      "CLOUDFLARE_SECRET_ACCESS_KEY:",
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? "✅ SET" : "❌ MISSING"
    );
    console.log(
      "CLOUDFLARE_ENDPOINT_S3:",
      process.env.CLOUDFLARE_ENDPOINT_S3 ? "✅ SET" : "❌ MISSING"
    );
    console.log(
      "ENCRYPTION_KEY:",
      process.env.ENCRYPTION_KEY ? "✅ SET" : "❌ MISSING"
    );

    // Delete existing settings to start fresh
    await Settings.deleteOne({ settingsId: "default" });
    console.log("🗑️ Deleted existing settings");

    // Create new settings with environment variables
    const newSettings = new Settings({
      settingsId: "default",
      externalServices: {
        redis: {
          endpoint: process.env.REDIS_PUBLIC_ENDPOINT || "",
          password: process.env.REDIS_PASSWORD || "",
        },
        cloudflareR2: {
          bucket: process.env.CLOUDFLARE_R2_BUCKET || "hmern",
          token: process.env.CLOUDFLARE_R2_TOKEN || "",
          accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
          endpointS3: process.env.CLOUDFLARE_ENDPOINT_S3 || "",
        },
      },
    });

    await newSettings.save();
    console.log("💾 Saved new settings with fresh encryption");

    // Test the saved values
    const savedSettings = await Settings.findOne({ settingsId: "default" });
    const settingsObj = savedSettings.toObject();

    console.log("\n✅ Verification - Decrypted Values:");
    console.log(
      "Redis endpoint:",
      settingsObj.externalServices?.redis?.endpoint ? "✅ WORKING" : "❌ EMPTY"
    );
    console.log(
      "R2 bucket:",
      settingsObj.externalServices?.cloudflareR2?.bucket
        ? "✅ WORKING"
        : "❌ EMPTY"
    );
    console.log(
      "R2 token:",
      settingsObj.externalServices?.cloudflareR2?.token
        ? "✅ WORKING"
        : "❌ EMPTY"
    );
    console.log(
      "R2 accessKeyId:",
      settingsObj.externalServices?.cloudflareR2?.accessKeyId
        ? "✅ WORKING"
        : "❌ EMPTY"
    );
    console.log(
      "R2 secretAccessKey:",
      settingsObj.externalServices?.cloudflareR2?.secretAccessKey
        ? "✅ WORKING"
        : "❌ EMPTY"
    );
    console.log(
      "R2 endpointS3:",
      settingsObj.externalServices?.cloudflareR2?.endpointS3
        ? "✅ WORKING"
        : "❌ EMPTY"
    );

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Load environment variables
require("dotenv").config();

migrateCredentials();
