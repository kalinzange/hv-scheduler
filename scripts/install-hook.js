// Install Git pre-push hook — copies hooks/pre-push.js to .git/hooks/pre-push
// so there's only one source of truth for the hook content.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const hookSource = join(__dirname, "..", "hooks", "pre-push.js");
const hookDest = join(__dirname, "..", ".git", "hooks", "pre-push");

try {
  const hookContent = readFileSync(hookSource, "utf8");

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
    } catch {
      try {
        execSync('bash -c "chmod +x .git/hooks/pre-push"', {
          stdio: "ignore",
        });
      } catch {
        console.warn("Could not set execute permissions via bash");
      }
    }
  }

  console.log("Pre-push hook installed successfully");
} catch (error) {
  console.error("Failed to install pre-push hook:", error.message);
  process.exit(1);
}
