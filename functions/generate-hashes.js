/**
 * Generate bcrypt password hashes for Firebase Functions environment variables
 *
 * Usage:
 *   node generate-hashes.js "ManagerPassword123" "AdminPassword456"
 *
 * Or with interactive prompts:
 *   node generate-hashes.js
 */

const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function generateHash(password, label) {
  if (!password || password.length < 3) {
    console.error(`❌ ${label} password is too short (minimum 3 characters)`);
    return null;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    return hash;
  } catch (err) {
    console.error(`❌ Failed to hash ${label} password:`, err.message);
    return null;
  }
}

async function main() {
  console.log("🔐 Firebase Functions Password Hash Generator\n");

  let managerPass = process.argv[2];
  let adminPass = process.argv[3];

  // Interactive mode if no arguments provided
  if (!managerPass || !adminPass) {
    console.log("Interactive mode (or pass passwords as arguments)\n");
    managerPass = await question("Enter Manager password: ");
    adminPass = await question("Enter Admin password: ");
  }

  console.log("\n⏳ Generating hashes...\n");

  const managerHash = await generateHash(managerPass, "Manager");
  const adminHash = await generateHash(adminPass, "Admin");

  if (managerHash && adminHash) {
    console.log("✅ Success! Copy these values:\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("For .env file (local development):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`MANAGER_PASS_HASH=${managerHash}`);
    console.log(`ADMIN_PASS_HASH=${adminHash}`);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("For Firebase (run these commands):");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("firebase functions:secrets:set MANAGER_PASS_HASH");
    console.log(`  (paste when prompted): ${managerHash}`);
    console.log("\nfirebase functions:secrets:set ADMIN_PASS_HASH");
    console.log(`  (paste when prompted): ${adminHash}`);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(
      "⚠️  Security note: These hashes are safe to store in environment"
    );
    console.log("    variables, but keep your plain-text passwords secret!\n");
  }

  rl.close();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  rl.close();
  process.exit(1);
});
