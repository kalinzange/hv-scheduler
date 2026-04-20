// Install Git pre-push hook
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hookDest = join(__dirname, "..", ".git", "hooks", "pre-push");

try {
  const hookContent = `#!/usr/bin/env node

  const { spawnSync } = await import("child_process");

  console.log("🔨 Validating build before push...");

  const buildResult = spawnSync("npm", ["run", "build"], {
    stdio: "inherit",
    shell: true,
  });

  if (buildResult.status !== 0) {
    console.error("❌ Build failed. Fix errors before pushing.");
    process.exit(1);
  }

  console.log("✅ Build OK. Continuing with push.");
  process.exit(0);
  `;

  writeFileSync(hookDest, hookContent.replace(/\r\n/g, "\n"), {
    encoding: "utf8",
    mode: 0o755,
  });

  if (process.platform === "win32") {
    try {
      execSync(
        '"C:\\Program Files\\Git\\bin\\bash.exe" -c "chmod +x .git/hooks/pre-push"',
        { stdio: "ignore" },
      );
    } catch (e) {
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
