import { https } from "firebase-functions";
import { admin } from "./admin";
import { db } from "./admin";
import { httpsOptions } from "./regionConfig";

interface PurgeOffsetsRequest {
  appId?: string;
}

/**
 * Migration function to remove offset field from all team members in Firestore
 * Run once to clean up existing data after offset feature removal
 *
 * Triggered manually via: firebase functions:call purgeOffsets
 * Or via HTTP POST to the deployed function endpoint
 */
export const purgeOffsets = https.onCall(httpsOptions, async (request) => {
  const data = request.data as PurgeOffsetsRequest;

  // Restrict to authenticated admin users only
  const userRole = (request.auth?.token as any)?.role;
  if (!request.auth || userRole !== "admin") {
    throw new https.HttpsError(
      "permission-denied",
      "Only admin users can run this migration",
    );
  }

  const firebaseAppId = data.appId || "hv-scheduler";

  try {
    console.log(`[Purge] Starting offset purge for app: ${firebaseAppId}`);

    // Get the global state document
    const globalStateRef = db.doc(
      `artifacts/${firebaseAppId}/public/data/shift_scheduler/global_state`,
    );

    const globalStateSnap = await globalStateRef.get();

    if (!globalStateSnap.exists) {
      console.log("[Purge] No global state document found");
      return {
        success: true,
        message: "No global state document found",
        teamsUpdated: 0,
      };
    }

    const globalState = globalStateSnap.data();
    if (!globalState || !globalState.team || !Array.isArray(globalState.team)) {
      console.log("[Purge] No team array found in global state");
      return {
        success: true,
        message: "No team array found",
        teamsUpdated: 0,
      };
    }

    // Remove offset from each team member
    const cleanedTeam = globalState.team.map((emp: any) => {
      const { offset, ...cleanedEmp } = emp;
      if (offset !== undefined) {
        console.log(
          `[Purge] Removing offset (${offset}) from employee ID ${emp.id}`,
        );
      }
      return cleanedEmp;
    });

    // Count how many had offsets
    const recordsWithOffsets = globalState.team.filter(
      (emp: any) => emp.offset !== undefined && emp.offset !== null,
    ).length;

    // Update global state with cleaned team
    const { Timestamp } = admin.firestore;
    await globalStateRef.update({
      team: cleanedTeam,
      lastOffsetPurge: Timestamp.now(),
    });

    console.log(
      `[Purge] Successfully purged offsets. Records updated: ${recordsWithOffsets}`,
    );

    return {
      success: true,
      message: `Successfully purged offsets from ${recordsWithOffsets} team member(s)`,
      teamsUpdated: recordsWithOffsets,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("[Purge] Error during offset purge:", error);
    throw new https.HttpsError(
      "internal",
      `Migration failed: ${error.message}`,
    );
  }
});
