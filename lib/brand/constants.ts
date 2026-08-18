/** Public marketing site — https://mapable.com.au */
export const MAPABLE_MARKETING_URL = "https://mapable.com.au";

/** MapAble PEERS community — https://peer.mapable.com.au */
export const MAPABLE_PEER_PEERS_URL = "https://peer.mapable.com.au";

/** Short brand suite tagline (Canva MapAble brand kit). */
export const MAPABLE_BRAND_TAGLINE = "Empowering Independence";

export const MAPABLE_TAGLINE =
  "Enabling people with disabilities to live independent and dignified lives through innovative technology in care, transport, and employment.";

export const MAPABLE_SUPPORT_EMAIL = "support@mapable.com.au";

/** Australian Disability Ltd — PayPal donations (override in env). */
export const MAPABLE_DONATION_URL =
  process.env.NEXT_PUBLIC_DONATION_URL ?? "https://paypal.me/ausdisau";

/**
 * @deprecated Legacy raster lockup (icon + wordmark + baked-in tagline).
 * Prefer MAPABLE_LOGO_WORDMARK_SRC for headers and JSON-LD once migrated.
 */
export const MAPABLE_LOGO_SRC = "/brand/mapable-logo.png";

/** Canonical marketing lockup: mark + MapAble wordmark, no baked-in tagline. */
export const MAPABLE_LOGO_WORDMARK_SRC = "/brand/mapable-wordmark.svg";

/** Pin + landscape mark for compact headers, favicons, and decorative use. */
export const MAPABLE_LOGO_MARK_SRC = "/brand/mapable-mark.svg";

/** @deprecated Previous SVG mark retained until runtime references are gone. */
export const MAPABLE_LOGO_MARK_LEGACY_SRC = "/brand/mapable-logo-mark.svg";

export const MAPABLE_LOGO_ALT = "MapAble — Empowering Independence";
