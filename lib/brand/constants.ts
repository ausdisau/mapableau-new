/** Public marketing site — https://mapable.com.au */
export const MAPABLE_MARKETING_URL = "https://mapable.com.au";

/** MapAble PEERS community — https://peer.mapable.com.au */
export const MAPABLE_PEER_PEERS_URL = "https://peer.mapable.com.au";

export const MAPABLE_TAGLINE =
  "Enabling people with disabilities to live independent and dignified lives through innovative technology in care, transport, and employment.";

export const MAPABLE_SUPPORT_EMAIL = "support@mapable.com.au";

/** Australian Disability Ltd — PayPal donations (override in env). */
export const MAPABLE_DONATION_URL =
  process.env.NEXT_PUBLIC_DONATION_URL ?? "https://paypal.me/ausdisau";

/**
 * Official MapAble horizontal wordmark — use the exact PNG committed to the repo.
 * Render with a native <img> on a transparent background (marketing headers are light).
 */
export const MAPABLE_LOGO_SRC = "/brand/mapable-logo.png";

/** Pin + Australia mark for compact headers with separate text. */
export const MAPABLE_LOGO_MARK_SRC = "/brand/mapable-logo-mark.svg";

export const MAPABLE_LOGO_ALT = "MapAble — Empowering Independence";

/**
 * Verified organisation social profiles. Only configured URLs are rendered.
 * Never invent MapAble account URLs — leave unset until confirmed.
 */
export type MapAbleSocialLink = {
  href: string;
  label: string;
  icon: string;
};

function socialFromEnv(
  envValue: string | undefined,
  label: string,
  icon: string,
): MapAbleSocialLink | null {
  const href = envValue?.trim();
  if (!href) return null;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return { href: url.toString(), label, icon };
  } catch {
    return null;
  }
}

export const MAPABLE_SOCIAL_LINKS: MapAbleSocialLink[] = [
  socialFromEnv(process.env.NEXT_PUBLIC_FACEBOOK_URL, "Facebook", "f"),
  socialFromEnv(process.env.NEXT_PUBLIC_X_URL, "X", "𝕏"),
  socialFromEnv(process.env.NEXT_PUBLIC_INSTAGRAM_URL, "Instagram", "◎"),
  socialFromEnv(process.env.NEXT_PUBLIC_LINKEDIN_URL, "LinkedIn", "in"),
].filter((link): link is MapAbleSocialLink => link !== null);
