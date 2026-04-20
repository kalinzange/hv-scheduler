// Region/database config is generated from /firebase.json at build time.
// See functions/scripts/generate-firebase-config.cjs.
import { DATABASE_ID, REGION } from "./generated/firebaseConfig";

export const httpsOptions = {
  region: REGION,
  cors: true,
  invoker: "public",
  secrets: ["MANAGER_PASS_HASH", "ADMIN_PASS_HASH"],
};

export { REGION, DATABASE_ID };
