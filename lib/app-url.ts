import { isSafeRedirect } from "@/lib/auth/safe-redirect";
import { MAPABLE_MARKETING_URL } from "@/lib/brand/constants";

const LOCAL_APP_URL = "http://localhost:3000";

/** Canonical app origin — env override, then production default, then local dev. */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") return MAPABLE_MARKETING_URL;
  return LOCAL_APP_URL;
}

/** Browser-safe origin (uses current host on the client). */
export function getClientAppOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return getAppBaseUrl();
}

export function getAuthCallbackPath(nextPath?: string): string {
  const query =
    nextPath && isSafeRedirect(nextPath)
      ? `?next=${encodeURIComponent(nextPath)}`
      : "";
  return `/auth/callback${query}`;
}

export function getAuthCallbackUrl(nextPath?: string): string {
  return `${getAppBaseUrl()}${getAuthCallbackPath(nextPath)}`;
}

export function getWixRedirectUri(): string {
  return (
    process.env.WIX_REDIRECT_URI?.trim() ||
    `${getAppBaseUrl()}/login/wix/callback`
  );
}

export function getWixLoginOriginUri(): string {
  return (
    process.env.WIX_LOGIN_ORIGIN_URI?.trim() || `${getAppBaseUrl()}/login`
  );
}

/** Supabase Auth redirect allow-list entries for the MapAble deployment. */
export const MAPABLE_SUPABASE_REDIRECT_URLS = [
  `${MAPABLE_MARKETING_URL}/auth/callback`,
  "https://www.mapable.com.au/auth/callback",
  `${LOCAL_APP_URL}/auth/callback`,
] as const;
