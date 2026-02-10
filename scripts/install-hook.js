// Install Git pre-push hook
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hookSource = join(__dirname, "..", "hooks", "pre-push.cjs");
const hookDest = join(__dirname, "..", ".git", "hooks", "pre-push");

try {
  // Create a standalone hook that doesn't need require/import
  const hookContent = `#!/usr/bin/env node

// Git pre-push hook - Auto-build before pushing
// Standalone version that works with ES modules

console.log("🔨 Auto-building project before push...");

const { spawnSync } = await import("child_process");

// Run the build
const buildResult = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
});

// Check if build succeeded
if (buildResult.status !== 0) {
  console.error("❌ Build failed! Please fix errors before pushing.");
  process.exit(1);
}

// Stage the built files
const addResult = spawnSync("git", ["add", "docs/", "public/version.json"], {
  stdio: "inherit",
  shell: false,
});

if (addResult.status !== 0) {
  console.error("❌ Failed to stage build files.");
  process.exit(1);
}

// Check if there are staged changes from the build
const diffResult = spawnSync("git", ["diff", "--cached", "--quiet", "--exit-code"], {
  shell: false,
});

if (diffResult.status !== 0) {
  console.log("📦 Adding build artifacts to commit...");
  const commitResult = spawnSync(
    "git",
    ["commit", "-m", "chore: update build artifacts [auto-generated]", "--no-verify"],
    {
      stdio: "inherit",
      shell: false,
    }
  );

  if (commitResult.status !== 0) {
    console.error("❌ Failed to commit build artifacts.");
    process.exit(1);
  }
}

console.log("✅ Build complete! Continuing with push...");
process.exit(0);
`;

  // Write standalone hook with Unix line endings
  writeFileSync(hookDest, hookContent.replace(/\r\n/g, "\n"), {
    encoding: "utf8",
    mode: 0o755,
  });

  // On Windows, use Git's bash to ensure execute permissions
  if (process.platform === "win32") {
    try {
      execSync(
        '"C:\\Program Files\\Git\\bin\\bash.exe" -c "chmod +x .git/hooks/pre-push"',
        { stdio: "ignore" },
      );
    } catch (e) {
      // Fallback if Git bash path is different - try common locations
      try {
        execSync('bash -c "chmod +x .git/hooks/pre-push"', {
          stdio: "ignore",
        });
      } catch (e2) {
        console.warn("⚠️  Could not set execute permissions via bash");
      }
    }
  }

  console.log("✅ Pre-push hook installed successfully");
} catch (error) {
  console.error("❌ Failed to install pre-push hook:", error.message);
  process.exit(1);
}
