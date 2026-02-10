#!/usr/bin/env node

// Git pre-push hook - Auto-build before pushing
// Works on both Windows and Mac using Node.js (CommonJS)

console.log("🔨 Auto-building project before push...");

const { spawnSync } = require("child_process");

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
  shell: true,
});

if (addResult.status !== 0) {
  console.error("❌ Failed to stage build files.");
  process.exit(1);
}

// Check if there are staged changes from the build
const diffResult = spawnSync(
  "git",
  ["diff", "--cached", "--quiet", "--exit-code"],
  {
    shell: true,
  },
);

if (diffResult.status !== 0) {
  console.log("📦 Adding build artifacts to commit...");
  const commitResult = spawnSync(
    "git",
    [
      "commit",
      "-m",
      "chore: update build artifacts [auto-generated]",
      "--no-verify",
    ],
    {
      stdio: "inherit",
      shell: true,
    },
  );

  if (commitResult.status !== 0) {
    console.error("❌ Failed to commit build artifacts.");
    process.exit(1);
  }
}

console.log("✅ Build complete! Continuing with push...");
process.exit(0);
