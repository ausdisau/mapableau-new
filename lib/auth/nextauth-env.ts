const DEV_FALLBACK_SECRET = "mapable-dev-nextauth-secret-not-for-production";

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
 * Production must set NEXTAUTH_SECRET (min 16 chars) in Vercel env.
 */
export function resolveNextAuthSecret(): string | undefined {
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
      "[auth] NEXTAUTH_SECRET is missing or shorter than 16 characters — sign-in will fail until it is set in Vercel"
    );
    return undefined;
  }

  if (secret) {
    console.warn(
      "[auth] NEXTAUTH_SECRET is shorter than 16 characters; using dev fallback for JWT signing"
    );
  } else {
    console.warn(
      "[auth] NEXTAUTH_SECRET is not set; using dev-only JWT signing fallback"
    );
  }

  return DEV_FALLBACK_SECRET;
}
