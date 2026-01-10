import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as bcrypt from "bcryptjs";

admin.initializeApp();

interface LoginRequest {
  role: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

interface ErrorResponse {
  error: string;
}

// In-memory rate limiting (resets on function cold start - use Redis in production)
const attemptCache = new Map<string, { count: number; resetTime: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const attempt = attemptCache.get(ip);

  if (!attempt) {
    attemptCache.set(ip, { count: 1, resetTime: now + LOCKOUT_DURATION_MS });
    return { allowed: true };
  }

  if (now > attempt.resetTime) {
    attemptCache.set(ip, { count: 1, resetTime: now + LOCKOUT_DURATION_MS });
    return { allowed: true };
  }

  if (attempt.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      message: `Too many attempts. Try again in ${Math.ceil(
        (attempt.resetTime - now) / 1000 / 60
      )} minutes.`,
    };
  }

  attempt.count++;
  return { allowed: true };
}

export const roleLogin = functions.https.onRequest(
  async (
    req: functions.https.Request,
    res: functions.Response<LoginResponse | ErrorResponse>
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
      // Extract client IP for rate limiting
      const clientIp =
        ((req.headers["x-forwarded-for"] as string) || "")
          ?.split(",")[0]
          ?.trim() ||
        req.socket.remoteAddress ||
        "unknown";

      // Check rate limiting
      const rateLimitCheck = checkRateLimit(clientIp);
      if (!rateLimitCheck.allowed) {
        res.status(429).json({
          error: rateLimitCheck.message || "Too many login attempts",
        } as ErrorResponse);
        return;
      }

      // Parse and validate request body
      let body: unknown;
      try {
        body = req.body;
        if (typeof body !== "object" || body === null) {
          body = JSON.parse(req.body || "{}");
        }
      } catch {
        res.status(400).json({ error: "Invalid JSON" } as ErrorResponse);
        return;
      }

      const { role, password } = body as LoginRequest;

      // Input validation
      if (!role || !password) {
        res
          .status(400)
          .json({ error: "Missing role or password" } as ErrorResponse);
        return;
      }

      if (typeof role !== "string" || typeof password !== "string") {
        res
          .status(400)
          .json({ error: "Invalid request format" } as ErrorResponse);
        return;
      }

      if (!["manager", "admin"].includes(role)) {
        res.status(400).json({ error: "Invalid role" } as ErrorResponse);
        return;
      }

      if (password.length < 1 || password.length > 500) {
        res
          .status(400)
          .json({ error: "Invalid password format" } as ErrorResponse);
        return;
      }

      // Get environment variables (hashed passwords)
      const managerHashEnv = process.env.MANAGER_PASS_HASH;
      const adminHashEnv = process.env.ADMIN_PASS_HASH;

      if (!managerHashEnv || !adminHashEnv) {
        functions.logger.error(
          "Missing password hashes in environment configuration"
        );
        res
          .status(500)
          .json({ error: "Server configuration error" } as ErrorResponse);
        return;
      }

      // Compare password with stored hash
      let isValid = false;
      let grantedRole: string | null = null;

      try {
        if (role === "manager") {
          isValid = await bcrypt.compare(password, managerHashEnv);
          if (isValid) grantedRole = "manager";
        } else if (role === "admin") {
          isValid = await bcrypt.compare(password, adminHashEnv);
          if (isValid) grantedRole = "admin";
        }
      } catch (bcryptError) {
        functions.logger.error("Bcrypt comparison error:", bcryptError);
        res.status(500).json({ error: "Server error" } as ErrorResponse);
        return;
      }

      // Authentication failed
      if (!isValid) {
        functions.logger.warn(
          `Failed login attempt for role: ${role} from IP: ${clientIp}`
        );
        res.status(401).json({ error: "Invalid credentials" } as ErrorResponse);
        return;
      }

      // Create Firebase custom token with role claim
      const uid = `role-${grantedRole}`;
      const customToken = await admin.auth().createCustomToken(uid, {
        role: grantedRole,
        loginTime: Date.now(),
      });

      functions.logger.info(
        `Successful ${grantedRole} login from IP: ${clientIp}`
      );

      res.status(200).json({ token: customToken } as LoginResponse);
    } catch (error) {
      functions.logger.error("Unexpected error in roleLogin:", error);
      res.status(500).json({ error: "Server error" } as ErrorResponse);
    }
  }
);
