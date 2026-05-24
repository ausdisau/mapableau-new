import { getAuthEnv } from "@/lib/config/auth-env";

const DEFAULT_SAFE_PATHS = [
  "/dashboard",
  "/participant",
  "/provider",
  "/worker",
  "/driver",
  "/support-coordinator",
  "/plan-manager",
  "/family",
  "/admin",
  "/onboarding",
  "/account",
];

export function validateReturnTo(
  returnTo: string | null | undefined,
  allowedPrefixes: string[] = DEFAULT_SAFE_PATHS,
): string | null {
  if (!returnTo) return null;

  const trimmed = returnTo.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return null;
  }

  const allowed = allowedPrefixes.some(
    (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}/`),
  );

  if (!allowed) return null;
  return trimmed;
}

export function resolveReturnTo(
  returnTo: string | null | undefined,
  fallback: string,
): string {
  return validateReturnTo(returnTo) ?? fallback;
}

export function rejectUnsafeReturnTo(
  returnTo: string | null | undefined,
): { safe: string | null; rejected: boolean } {
  if (!returnTo) return { safe: null, rejected: false };
  const safe = validateReturnTo(returnTo);
  if (safe) return { safe, rejected: false };
  return { safe: null, rejected: true };
}

export function getAppBaseUrl(): string {
  return getAuthEnv().APP_BASE_URL ?? "http://localhost:3000";
}
