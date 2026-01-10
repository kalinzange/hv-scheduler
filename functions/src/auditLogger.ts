import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

admin.initializeApp();

interface AuditLog {
  id: string;
  timestamp: number;
  uid: string;
  role: string;
  action: "write" | "delete";
  path: string;
  changes: Record<string, unknown>;
  changeHash: string;
}

export const onGlobalStateUpdate = functions.firestore
  .document("artifacts/{appId}/public/data/shift_scheduler/global_state")
  .onWrite(async (change: any, context: any) => {
    try {
      const { appId } = context.params as { appId: string };

      if (!change.after.exists) {
        functions.logger.info("Document deleted");
        return;
      }

      const before = change.before?.data() || {};
      const after = change.after.data() || {};

      // Detect what changed
      const changes: Record<string, unknown> = {};
      const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

      for (const key of allKeys) {
        const beforeVal = before[key];
        const afterVal = after[key];

        if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
          changes[key] = {
            before: beforeVal,
            after: afterVal,
          };
        }
      }

      if (Object.keys(changes).length === 0) {
        return; // No actual changes
      }

      // Get auth context (if available)
      const uid = context.authType === "ADMIN" ? "admin-console" : "unknown";
      const role = context.authType === "ADMIN" ? "admin" : "unknown";

      // Create audit log entry
      const logId = crypto.randomUUID();
      const logEntry: AuditLog = {
        id: logId,
        timestamp: admin.firestore.Timestamp.now().toMillis(),
        uid,
        role,
        action: "write",
        path: change.after.ref.path,
        changes,
        changeHash: crypto
          .createHash("sha256")
          .update(JSON.stringify(changes))
          .digest("hex"),
      };

      // Write to audit log collection
      await admin
        .firestore()
        .collection("artifacts")
        .doc(appId)
        .collection("private")
        .doc("audit_logs")
        .collection("logs")
        .doc(logId)
        .set(logEntry);

      functions.logger.info(
        `Audit log created: ${logId} for changes in ${
          Object.keys(changes).length
        } fields`
      );
    } catch (error) {
      functions.logger.error("Error writing audit log:", error);
      // Don't fail the write if audit logging fails
    }
  });
