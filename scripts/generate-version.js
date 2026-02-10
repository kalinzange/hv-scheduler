// Generates public/version.json with package version and build timestamp
// Run as a prebuild step

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Auto-generate unique version using git commit hash + timestamp
let buildId = "";
try {
  buildId = execSync("git rev-parse --short HEAD").toString().trim();
} catch (error) {
  // Fallback to timestamp if git is not available
  buildId = Date.now().toString(36);
}

const now = new Date();
const versionData = {
  version: `${pkg.version}-${buildId}-${now.getTime()}`,
  buildTime: now.toISOString(),
};

const outPath = join(__dirname, "..", "public", "version.json");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(versionData, null, 2) + "\n", "utf8");

console.log("Wrote", outPath, versionData);
