/**
 * Wix marketing site integration (https://mapabl.au).
 * Used for CORS, iframe embeds, and deep links from Velo / HTML iframes.
 */

/** Primary Wix-hosted marketing domain for MapAble (Pymble). */
export const MAPABLE_WIX_SITE_URL = "https://www.mapabl.au";

/** Alternate host without www. */
export const MAPABLE_WIX_SITE_URL_ALT = "https://mapabl.au";

const DEFAULT_WIX_FRAME_ANCESTORS = [
  "'self'",
  "https://mapabl.au",
  "https://www.mapabl.au",
  "https://*.wix.com",
  "https://*.wixsite.com",
  "https://*.editorx.com",
] as const;

/** Origins allowed to call MapAble public APIs from the browser (Wix Velo fetch). */
const DEFAULT_WIX_API_ORIGINS = [
  MAPABLE_WIX_SITE_URL,
  MAPABLE_WIX_SITE_URL_ALT,
  "https://mapable.com.au",
  "https://www.mapable.com.au",
] as const;

function parseOriginList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function getWixApiAllowedOrigins(): string[] {
  const extra = parseOriginList(process.env.WIX_ALLOWED_ORIGINS);
  return [...new Set([...DEFAULT_WIX_API_ORIGINS, ...extra])];
}

export function getWixFrameAncestors(): string {
  const extra = parseOriginList(process.env.WIX_FRAME_ANCESTORS);
  const parts = [...DEFAULT_WIX_FRAME_ANCESTORS, ...extra];
  return [...new Set(parts)].join(" ");
}

export function getMapableAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.MAPABLE_APP_URL ??
    "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getWixEmbedProviderFinderUrl(): string {
  return `${getMapableAppUrl()}/embed/provider-finder`;
}
