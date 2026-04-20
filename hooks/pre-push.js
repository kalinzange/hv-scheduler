#!/usr/bin/env node

// Git pre-push hook — validates that the project builds before pushing.
// Does NOT auto-commit the build output: docs/ is rebuilt in CI with
// deployment secrets, so committing a local build leaks local .env values.

import { spawnSync } from "node:child_process";

console.log("Validating build before push...");

const buildResult = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
});

if (buildResult.status !== 0) {
  console.error("Build failed. Fix errors before pushing.");
  process.exit(1);
}

console.log("Build OK. Continuing with push.");
process.exit(0);
