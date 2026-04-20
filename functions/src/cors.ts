import type * as express from "express";

// Allowed origins are read from ALLOWED_ORIGINS (comma-separated) with
// sensible defaults for local dev and the published GitHub Pages site.
// To override, set ALLOWED_ORIGINS in the function environment:
//   firebase functions:config:set ... OR via process env in CI.
const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://kalinzange.github.io",
];

function getAllowedOrigins(): string[] {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return configured.length > 0 ? configured : DEFAULT_ORIGINS;
}

/**
 * Apply strict CORS. Returns true if the request should continue; returns
 * false if the handler should stop (preflight already answered, or origin
 * is not allowed).
 */
export function applyCors(
  req: express.Request,
  res: express.Response,
): boolean {
  const origin = (req.headers.origin as string) || "";
  const allowed = getAllowedOrigins();
  const isAllowed = allowed.includes(origin);

  if (isAllowed) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    res.status(isAllowed ? 204 : 403).end();
    return false;
  }

  if (origin && !isAllowed) {
    res.status(403).json({ error: "Origin not allowed" });
    return false;
  }

  return true;
}
