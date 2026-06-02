import { createNeonAuth } from "@neondatabase/auth/next/server";

import { isNeonAuthEnabled } from "@/lib/auth/auth-provider";

function requireNeonAuthConfig(): { baseUrl: string; cookieSecret: string } {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim();
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
  if (!baseUrl || !cookieSecret) {
    throw new Error(
      "NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET are required when Neon Auth is enabled"
    );
  }
  if (cookieSecret.length < 32) {
    throw new Error("NEON_AUTH_COOKIE_SECRET must be at least 32 characters");
  }
  return { baseUrl, cookieSecret };
}

let neonAuthSingleton: ReturnType<typeof createNeonAuth> | null = null;

export function getNeonAuth() {
  if (!neonAuthSingleton) {
    const { baseUrl, cookieSecret } = requireNeonAuthConfig();
    neonAuthSingleton = createNeonAuth({
      baseUrl,
      cookies: { secret: cookieSecret },
    });
  }
  return neonAuthSingleton;
}

/** Neon Auth API route handler — mount at `app/api/auth/[...path]/route.ts`. */
export function getNeonAuthHandler() {
  return getNeonAuth().handler();
}

/** Route protection when Neon Auth is the active backend. */
export function getNeonAuthMiddleware(loginUrl = "/login") {
  return getNeonAuth().middleware({ loginUrl });
}

export function neonAuthConfigured(): boolean {
  return isNeonAuthEnabled();
}
