import * as functions from "firebase-functions";
import * as bcrypt from "bcryptjs";
import { admin } from "./admin";

interface PasswordChangeRequest {
  role: string;
  userId: number;
  oldPassword: string;
  newPassword: string;
  team?: Array<{ id: number; name: string; password?: string }>;
}

interface PasswordChangeResponse {
  success: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Cloud Function to allow users to change their own password
 * This bypasses normal Firestore security rules for password-only changes
 */
export const changePassword = functions.https.onRequest(
  async (
    req: functions.https.Request,
    res: functions.Response<PasswordChangeResponse | ErrorResponse>
  ) => {
    // CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("X-Content-Type-Options", "nosniff");

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" } as ErrorResponse);
      return;
    }

    try {
      const { role, userId, oldPassword, newPassword, team } =
        req.body as PasswordChangeRequest;

      if (!role || !userId || !oldPassword || !newPassword) {
        res.status(400).json({
          error: "Missing required fields: role, userId, oldPassword, newPassword",
        } as ErrorResponse);
        return;
      }

      if (newPassword.length < 3) {
        res
          .status(400)
          .json({ error: "New password must be at least 3 characters" } as ErrorResponse);
        return;
      }

      // Get current team data from Firestore
      const db = admin.firestore();
      const globalStateDoc = await db.collection("global_state").doc("state").get();

      if (!globalStateDoc.exists) {
        res.status(500).json({ error: "Global state not found" } as ErrorResponse);
        return;
      }

      const globalState = globalStateDoc.data();
      const currentTeam = globalState?.team || team || [];

      // Find the user in the team
      const userToChange = currentTeam.find((u: any) => u.id === userId);

      if (!userToChange) {
        res.status(404).json({ error: "User not found" } as ErrorResponse);
        return;
      }

      // Verify old password (handle both hashed and plain text)
      const storedPassword = userToChange.password || "1234";
      const isHashed = storedPassword.startsWith("$2");
      let passwordMatches = false;

      if (isHashed) {
        passwordMatches = await bcrypt.compare(oldPassword, storedPassword);
      } else {
        passwordMatches = oldPassword === storedPassword;
      }

      if (!passwordMatches) {
        res.status(401).json({ error: "Incorrect current password" } as ErrorResponse);
        return;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update only the password field for this user
      const updatedTeam = currentTeam.map((u: any) =>
        u.id === userId ? { ...u, password: hashedNewPassword, requirePasswordChange: false } : u
      );

      // Write back to Firestore (bypasses app-level permission checks)
      await db.collection("global_state").doc("state").update({
        team: updatedTeam,
      });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      } as PasswordChangeResponse);
    } catch (error) {
      console.error("Password change error:", error);
      res
        .status(500)
        .json({ error: `Password change failed: ${String(error)}` } as ErrorResponse);
    }
  }
);
