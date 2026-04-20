import * as express from "express";
import { https } from "firebase-functions";
import * as bcrypt from "bcryptjs";
import { db } from "./admin";
import { httpsOptions } from "./regionConfig";
import { applyCors } from "./cors";

interface PasswordChangeRequest {
  role: string;
  userId: number;
  oldPassword: string;
  newPassword: string;
  appId?: string;
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
export const changePassword = https.onRequest(
  httpsOptions,
  async (
    req: express.Request,
    res: express.Response<PasswordChangeResponse | ErrorResponse>,
  ) => {
    if (!applyCors(req, res)) return;

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" } as ErrorResponse);
      return;
    }

    try {
      const { role, userId, oldPassword, newPassword, appId, team } =
        req.body as PasswordChangeRequest;

      if (!role || !userId || !oldPassword || !newPassword) {
        res.status(400).json({
          error:
            "Missing required fields: role, userId, oldPassword, newPassword",
        } as ErrorResponse);
        return;
      }

      if (
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        newPassword.length > 200
      ) {
        res.status(400).json({
          error: "New password must be 8–200 characters",
        } as ErrorResponse);
        return;
      }

      const firebaseAppId = appId || process.env.APP_ID || "hv-scheduler";
      const globalStateRef = db.doc(
        `artifacts/${firebaseAppId}/public/data/shift_scheduler/global_state`,
      );
      const globalStateDoc = await globalStateRef.get();

      if (!globalStateDoc.exists) {
        res
          .status(500)
          .json({ error: "Global state not found" } as ErrorResponse);
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
        res
          .status(401)
          .json({ error: "Incorrect current password" } as ErrorResponse);
        return;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // Update only the password field for this user
      const updatedTeam = currentTeam.map((u: any) =>
        u.id === userId
          ? { ...u, password: hashedNewPassword, requirePasswordChange: false }
          : u,
      );

      // Write back to Firestore (bypasses app-level permission checks)
      await globalStateRef.update({
        team: updatedTeam,
        lastUpdated: Date.now(),
      });

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      } as PasswordChangeResponse);
    } catch (error) {
      console.error("Password change error:", error);
      res
        .status(500)
        .json({
          error: `Password change failed: ${String(error)}`,
        } as ErrorResponse);
    }
  },
);
