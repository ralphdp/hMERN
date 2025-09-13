require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Patterns that indicate problematic model definitions
const BAD_PATTERNS = [
  // mongoose.model with only 2 parameters (missing collection name)
  /mongoose\.model\s*\(\s*['"]\w+['"],\s*\w+\s*\)/g,

  // Collection names that don't follow plugin_* or core_* convention
  /mongoose\.model\s*\(\s*['"]\w+['"],\s*\w+,\s*['"](?!(?:core_|plugin_|system_))\w+['"]\s*\)/g,
];

// Files to check
const SEARCH_DIRECTORIES = ["src", "backend/src"];

const IGNORE_PATTERNS = ["node_modules", "backups", "uploads", ".git"];

function findJSFiles(dir, basePath = "") {
  const files = [];
  const fullPath = path.join(basePath, dir);

  if (!fs.existsSync(fullPath)) {
    return files;
  }

  const items = fs.readdirSync(fullPath);

  for (const item of items) {
    const itemPath = path.join(fullPath, item);
    const relativePath = path.join(dir, item);

    // Skip ignored directories
    if (IGNORE_PATTERNS.some((pattern) => relativePath.includes(pattern))) {
      continue;
    }

    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      files.push(...findJSFiles(relativePath, basePath));
    } else if (item.endsWith(".js")) {
      files.push({ path: itemPath, relativePath });
    }
  }

  return files;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const issues = [];

  // Check for mongoose.model calls without collection name (only 2 parameters)
  const modelCallsWithoutCollection = content.match(
    /mongoose\.model\s*\(\s*['"][^'"]+['"],\s*[^,)]+\s*\)/g
  );
  if (modelCallsWithoutCollection) {
    modelCallsWithoutCollection.forEach((match) => {
      issues.push({
        type: "MISSING_COLLECTION_NAME",
        pattern: match.trim(),
        suggestion:
          "Add third parameter with proper collection name (core_* or plugin_*)",
      });
    });
  }

  // Check for models with improper collection naming
  const modelCallsWithBadNaming = content.match(
    /mongoose\.model\s*\(\s*['"][^'"]+['"],\s*[^,]+,\s*['"](?!(?:core_|plugin_|system_))[^'"]+['"]\s*\)/g
  );
  if (modelCallsWithBadNaming) {
    modelCallsWithBadNaming.forEach((match) => {
      issues.push({
        type: "BAD_COLLECTION_NAME",
        pattern: match.trim(),
        suggestion:
          "Collection name should start with core_, plugin_, or system_",
      });
    });
  }

  // Check for old collection references in queries
  const oldCollectionReferences = [
    "users",
    "tokens",
    "sessions",
    "ratelimits",
    "rulemetrics",
    "blockedips",
    "firewalllogs",
    "firewallrules",
    "firewallsettings",
    "webperformanceanalytics",
    "webperformancemetrics",
    "webperformancequeue",
    "webperformancesettings",
  ];

  oldCollectionReferences.forEach((oldName) => {
    const regex = new RegExp(`['"]${oldName}['"]`, "g");
    const matches = content.match(regex);
    if (matches) {
      issues.push({
        type: "OLD_COLLECTION_REFERENCE",
        pattern: `References to old collection "${oldName}"`,
        suggestion: `Update to use proper prefixed collection name`,
      });
    }
  });

  return issues;
}

function generateFix(issue) {
  switch (issue.type) {
    case "MISSING_COLLECTION_NAME":
      // Extract model name from pattern
      const modelMatch = issue.pattern.match(
        /mongoose\.model\s*\(\s*['"]([^'"]+)['"],/
      );
      if (modelMatch) {
        const modelName = modelMatch[1];
        let suggestedCollection;

        // Suggest appropriate collection name based on model name
        if (["User", "Token", "Session"].includes(modelName)) {
          suggestedCollection = `core_${modelName.toLowerCase()}s`;
        } else if (
          modelName.startsWith("Firewall") ||
          modelName.includes("firewall")
        ) {
          suggestedCollection = `plugin_firewall_${modelName
            .toLowerCase()
            .replace("firewall", "")
            .replace(/^_/, "")}`;
        } else if (
          modelName.includes("WebPerformance") ||
          modelName.includes("webperformance")
        ) {
          suggestedCollection = `plugin_web_performance_${modelName
            .toLowerCase()
            .replace("webperformance", "")
            .replace(/^_/, "")}`;
        } else {
          suggestedCollection = `plugin_unknown_${modelName.toLowerCase()}`;
        }

        return issue.pattern.replace(/\)$/, `, "${suggestedCollection}")`);
      }
      break;

    case "BAD_COLLECTION_NAME":
      // This requires manual review as we need context
      return "MANUAL_REVIEW_REQUIRED";

    case "OLD_COLLECTION_REFERENCE":
      return "MANUAL_REVIEW_REQUIRED";
  }

  return "MANUAL_REVIEW_REQUIRED";
}

async function main() {
  console.log("🔍 MONGOOSE MODEL ANALYSIS");
  console.log("Searching for problematic model definitions...\n");

  let totalIssues = 0;
  const problemFiles = [];

  // Find all JS files
  for (const searchDir of SEARCH_DIRECTORIES) {
    const files = findJSFiles(searchDir);

    console.log(`📁 Checking ${files.length} files in ${searchDir}/...\n`);

    for (const file of files) {
      const issues = analyzeFile(file.path);

      if (issues.length > 0) {
        console.log(`❌ ${file.relativePath}:`);
        problemFiles.push({ file: file.relativePath, issues });

        issues.forEach((issue) => {
          console.log(`   ⚠️  ${issue.type}: ${issue.pattern}`);
          console.log(`       💡 ${issue.suggestion}`);

          const fix = generateFix(issue);
          if (fix !== "MANUAL_REVIEW_REQUIRED") {
            console.log(`       🔧 Suggested fix: ${fix}`);
          }
          console.log();
        });

        totalIssues += issues.length;
      }
    }
  }

  console.log("\n📊 ANALYSIS SUMMARY");
  console.log("==================");

  if (totalIssues === 0) {
    console.log("✅ No problematic model definitions found!");
    console.log(
      "✅ All mongoose models appear to use proper collection naming."
    );
  } else {
    console.log(
      `❌ Found ${totalIssues} issues across ${problemFiles.length} files`
    );

    console.log("\n🔧 RECOMMENDED ACTIONS:");
    console.log("1. Review each file listed above");
    console.log(
      "2. Update mongoose.model calls to include proper collection names"
    );
    console.log(
      "3. Use prefixes: core_ for core models, plugin_ for plugin models"
    );
    console.log(
      "4. Run the consolidation script after fixing model definitions"
    );
    console.log(
      "5. Restart the application to ensure new model definitions are used"
    );

    console.log("\n📋 PROPER COLLECTION NAME FORMAT:");
    console.log("  - Core models: core_users, core_tokens, core_sessions");
    console.log(
      "  - Firewall plugin: plugin_firewall_rules, plugin_firewall_logs"
    );
    console.log("  - Web Performance: plugin_web_performance_metrics");
    console.log("  - Other plugins: plugin_{plugin_name}_{data_type}");
  }

  console.log("\n🚀 Next steps:");
  console.log("1. Fix any model definition issues found above");
  console.log("2. Run: node consolidate-collections.js");
  console.log("3. Restart your application");
  console.log("4. Verify collections are properly named");
}

main().catch(console.error);
