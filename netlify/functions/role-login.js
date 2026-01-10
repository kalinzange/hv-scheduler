// Netlify Function: role-login
// Validates manager/admin master passwords using server-side env vars
// and returns a Firebase Custom Token with role claims.

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

let adminInitialized = false;

function initAdmin() {
  if (adminInitialized) return;
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!saJson) {
    throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  }
  const serviceAccount = JSON.parse(saJson);
  initializeApp({
    credential: cert(serviceAccount),
  });
  adminInitialized = true;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { role, password } = JSON.parse(event.body || "{}");
    if (!role || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid request" }),
      };
    }

    const managerPass = process.env.MANAGER_MASTER_PASS;
    const adminPass = process.env.ADMIN_MASTER_PASS;

    let grantedRole = null;
    if (role === "manager" && password === managerPass) grantedRole = "manager";
    if (role === "admin" && password === adminPass) grantedRole = "admin";

    if (!grantedRole) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    initAdmin();
    const auth = getAuth();
    // Use synthetic UIDs per role; alternatively mint per-user IDs.
    const uid = `role-${grantedRole}`;
    const token = await auth.createCustomToken(uid, { role: grantedRole });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
