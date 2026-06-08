const FALLBACK_SECRET = "mapable-fallback-nextauth-secret-configure-production";

/** Ensure NextAuth env is usable on Vercel before the route handler loads. */
export function ensureNextAuthEnv(): void {
  if (!process.env.NEXTAUTH_URL?.trim()) {
    const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const fromVercel =
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
      process.env.VERCEL_URL?.trim();

    if (fromPublic) {
      process.env.NEXTAUTH_URL = fromPublic.replace(/\/$/, "");
    } else if (fromVercel) {
      process.env.NEXTAUTH_URL = `https://${fromVercel.replace(/^https?:\/\//, "")}`;
    }
  }
}

/**
 * Resolves the NextAuth JWT signing secret without crashing module load.
 * Production must set NEXTAUTH_SECRET (min 16 chars) in Vercel env; the
 * fallback exists only to keep public auth endpoints from returning 500 while
 * configuration is repaired.
 */
export function resolveNextAuthSecret(): string {
  ensureNextAuthEnv();

  const secret =
    process.env.NEXTAUTH_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (secret && secret.length >= 16) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "[auth] CRITICAL: NEXTAUTH_SECRET is missing or shorter than 16 characters — using fallback signing secret so auth endpoints stay available. Configure NEXTAUTH_SECRET in Vercel immediately.",
    );
    return FALLBACK_SECRET;
  }

  if (secret) {
    console.warn(
      "[auth] NEXTAUTH_SECRET is shorter than 16 characters; using fallback for JWT signing",
    );
  } else {
    console.warn(
      "[auth] NEXTAUTH_SECRET is not set; using fallback for JWT signing",
    );
  }

  return FALLBACK_SECRET;
}
