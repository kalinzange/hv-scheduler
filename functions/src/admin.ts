import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { DATABASE_ID } from "./regionConfig";

// Initialize Firebase Admin SDK once
const app = admin.initializeApp();

// Explicitly target the named database (hv-gcc-scheduler).
// admin.firestore() defaults to "(default)" — it does NOT auto-route by region.
const db = getFirestore(app, DATABASE_ID);

export { admin, db };
