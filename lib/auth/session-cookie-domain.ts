/**
 * Shared session cookie domain for mapable.com.au family hosts
 * (apex + business.mapable.com.au Provider Center).
 *
 * Localhost and Vercel preview hosts stay host-only so cookies do not leak
 * across unrelated deployments.
 */

const MAPABLE_FAMILY_HOST_RE = /(^|\.)mapable\.com\.au$/i;

type EnvLike = Record<string, string | undefined>;

export function resolveMapAbleSessionCookieDomain(
  env: EnvLike = process.env,
): string | undefined {
  if (env.MAPABLE_SESSION_COOKIE_DOMAIN === "") {
    return undefined;
  }
  if (env.MAPABLE_SESSION_COOKIE_DOMAIN) {
    return env.MAPABLE_SESSION_COOKIE_DOMAIN;
  }

  const candidates = [
    env.NEXT_PUBLIC_APP_URL,
    env.NEXTAUTH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const hostname = new URL(candidate).hostname.toLowerCase();
      if (MAPABLE_FAMILY_HOST_RE.test(hostname)) {
        return ".mapable.com.au";
      }
    } catch {
      // ignore invalid URLs
    }
  }

  return undefined;
}

/** NextAuth cookie options when a shared parent domain is active. */
export function buildSharedSessionCookieOptions(env: EnvLike = process.env) {
  const domain = resolveMapAbleSessionCookieDomain(env);
  if (!domain) return undefined;

  const useSecureCookies = Boolean(
    env.NODE_ENV === "production" ||
      env.VERCEL ||
      env.NEXTAUTH_URL?.startsWith("https://"),
  );

  const prefix = useSecureCookies ? "__Secure-" : "";

  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: useSecureCookies,
    domain,
  };

  return {
    sessionToken: {
      name: `${prefix}next-auth.session-token`,
      options: { ...base },
    },
    callbackUrl: {
      name: `${prefix}next-auth.callback-url`,
      options: { ...base, httpOnly: false },
    },
    csrfToken: {
      name: `${prefix}next-auth.csrf-token`,
      options: { ...base, httpOnly: false },
    },
  };
}
