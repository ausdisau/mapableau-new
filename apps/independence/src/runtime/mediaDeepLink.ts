/**
 * Deep-link helpers for the media SoR (AccessiBooks / DisabilityFour+).
 * Platform Independence Suite must not embed a media catalogue — open media apps
 * via configured public base URLs only. See docs/amalgamation/access-media/SSO_DEEP_LINK.md
 */

export function getAccessiBooksBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_ACCESSIBOOKS_URL ?? "").trim().replace(/\/+$/, "");
}

export function getDisabilityFourBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_DISABILITYFOUR_URL ?? "").trim().replace(/\/+$/, "");
}

export function isAccessiBooksConfigured(): boolean {
  return getAccessiBooksBaseUrl().length > 0;
}

/** Continue-listening deep link into the media SoR AccessiBooks app. */
export function accessiBooksContinueUrl(path = "/"): string | null {
  const base = getAccessiBooksBaseUrl();
  if (!base) return null;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalised}`;
}
