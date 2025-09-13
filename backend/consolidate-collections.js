require("dotenv").config();
const mongoose = require("mongoose");

// Collection mapping: OLD -> NEW
const COLLECTION_MIGRATIONS = {
  // Core collections
  users: "core_users",
  tokens: "core_tokens",
  sessions: "core_sessions",

  // Firewall collections
  ratelimits: "plugin_firewall_rate_limits",
  rulemetrics: "plugin_firewall_rule_metrics",
  blockedips: "plugin_firewall_blocked_ips",
  firewalllogs: "plugin_firewall_logs",
  firewallrules: "plugin_firewall_rules",
  firewallsettings: "plugin_firewall_settings",
  firewallconfig: "plugin_firewall_configs",

  // Web Performance collections
  webperformanceanalytics: "plugin_web_performance_analytics",
  webperformancemetrics: "plugin_web_performance_metrics",
  webperformancequeue: "plugin_web_performance_queue",
  webperformancesettings: "plugin_web_performance_settings",
};

async function consolidateCollections() {
  try {
    console.log("🔧 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map((c) => c.name);

    console.log("\n📋 Current collections:");
    existingNames.forEach((name) => console.log(`  - ${name}`));

    console.log("\n🚀 Starting collection consolidation...\n");

    for (const [oldName, newName] of Object.entries(COLLECTION_MIGRATIONS)) {
      try {
        // Check if old collection exists
        if (!existingNames.includes(oldName)) {
          console.log(`⏭️  Skipping ${oldName} - collection doesn't exist`);
          continue;
        }

        // Check if new collection already exists
        const newExists = existingNames.includes(newName);

        console.log(`🔄 Processing: ${oldName} -> ${newName}`);

        const oldCollection = db.collection(oldName);
        const documentCount = await oldCollection.countDocuments();

        if (documentCount === 0) {
          console.log(`   📭 ${oldName} is empty - dropping directly`);
          await oldCollection.drop();
          console.log(`   ✅ Dropped empty collection: ${oldName}`);
          continue;
        }

        console.log(`   📊 Found ${documentCount} documents in ${oldName}`);

        if (newExists) {
          console.log(`   ⚠️  Target collection ${newName} already exists`);

          // Check if new collection has data
          const newCollection = db.collection(newName);
          const newCount = await newCollection.countDocuments();

          if (newCount > 0) {
            console.log(
              `   📋 ${newName} has ${newCount} documents - merging data`
            );

            // Get sample document from old collection to check structure
            const sampleOld = await oldCollection.findOne();
            const sampleNew = await newCollection.findOne();

            console.log(
              `   🔍 Old structure: ${Object.keys(sampleOld || {}).join(", ")}`
            );
            console.log(
              `   🔍 New structure: ${Object.keys(sampleNew || {}).join(", ")}`
            );

            // Insert all documents from old to new (with upsert to handle duplicates)
            const documents = await oldCollection.find().toArray();
            for (const doc of documents) {
              try {
                // Remove the _id field to avoid conflicts, let MongoDB generate new ones
                const { _id, ...docWithoutId } = doc;
                await newCollection.insertOne(docWithoutId);
              } catch (error) {
                if (error.code === 11000) {
                  console.log(
                    `   ⚠️  Duplicate document skipped in ${newName}`
                  );
                } else {
                  console.error(
                    `   ❌ Error inserting document: ${error.message}`
                  );
                }
              }
            }

            console.log(
              `   ✅ Merged ${documentCount} documents into ${newName}`
            );
          } else {
            console.log(
              `   📤 Moving ${documentCount} documents to ${newName}`
            );

            // Move all documents
            const documents = await oldCollection.find().toArray();
            await newCollection.insertMany(documents);

            console.log(`   ✅ Moved ${documentCount} documents to ${newName}`);
          }
        } else {
          console.log(`   📦 Creating new collection ${newName}`);

          // Simply rename the collection
          await oldCollection.rename(newName);

          console.log(`   ✅ Renamed ${oldName} to ${newName}`);
          continue; // Skip dropping since we renamed
        }

        // Drop the old collection
        console.log(`   🗑️  Dropping old collection: ${oldName}`);
        await oldCollection.drop();
        console.log(`   ✅ Dropped old collection: ${oldName}`);
      } catch (error) {
        console.error(`   ❌ Error processing ${oldName}: ${error.message}`);
      }

      console.log(); // Empty line for readability
    }

    // Final cleanup: check for any other non-prefixed collections
    console.log("🧹 Checking for other problematic collections...");

    const finalCollections = await db.listCollections().toArray();
    const problematicCollections = finalCollections
      .map((c) => c.name)
      .filter(
        (name) =>
          !name.startsWith("core_") &&
          !name.startsWith("plugin_") &&
          !name.startsWith("system_") &&
          name !== "plugin_activities" && // This one might be okay
          name !== "core_settings" // This one might be okay
      );

    if (problematicCollections.length > 0) {
      console.log(
        "\n⚠️  Found collections that don't follow naming convention:"
      );
      problematicCollections.forEach((name) => {
        console.log(`  - ${name}`);
      });
      console.log(
        "\nConsider reviewing these collections and adding them to the migration script if needed."
      );
    } else {
      console.log("✅ All collections now follow proper naming convention!");
    }

    console.log("\n🎉 Collection consolidation completed successfully!");

    // Show final collection list
    const finalNames = (await db.listCollections().toArray())
      .map((c) => c.name)
      .sort();
    console.log("\n📋 Final collections:");
    finalNames.forEach((name) => console.log(`  - ${name}`));

    process.exit(0);
  } catch (error) {
    console.error("💥 Error during collection consolidation:", error);
    process.exit(1);
  }
}

// Add warning and confirmation
console.log("⚠️  COLLECTION CONSOLIDATION SCRIPT");
console.log("⚠️  This will modify your MongoDB collections!");
console.log("⚠️  Make sure you have a backup before proceeding.\n");

console.log("🎯 This script will:");
console.log("  1. Migrate data from old collections to plugin-prefixed ones");
console.log("  2. Drop old collections that don't follow naming convention");
console.log("  3. Ensure all data is preserved in the new format\n");

consolidateCollections();
