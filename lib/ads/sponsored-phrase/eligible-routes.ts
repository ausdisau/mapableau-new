/**
 * Closed allowlist for the sponsored-phrase pilot.
 * Unsupported surfaces must never resolve a fill.
 */

export const SPONSORED_PHRASE_ELIGIBLE_ROUTES = new Set<string>(["/"]);

export const SPONSORED_PHRASE_ELIGIBLE_TOPIC_KEYS = new Set<string>([
  "whats-on-general",
]);

/** Paths that must never activate a sponsored phrase. */
export const SPONSORED_PHRASE_EXCLUDED_ROUTE_PREFIXES = [
  "/search",
  "/marketplace",
  "/evidence",
  "/help",
  "/emergency",
  "/safeguarding",
  "/consent",
  "/telehealth",
  "/access",
  "/providers",
  "/provider-finder",
] as const;

export function normalizeRoutePath(routePath: string): string {
  const trimmed = routePath.trim();
  if (!trimmed) return "/";
  const withoutQuery = trimmed.split("?")[0]!.split("#")[0]!;
  if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery || "/";
}

export function isSponsoredPhraseRouteEligible(routePath: string): boolean {
  const path = normalizeRoutePath(routePath);
  for (const prefix of SPONSORED_PHRASE_EXCLUDED_ROUTE_PREFIXES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return false;
    }
  }
  return SPONSORED_PHRASE_ELIGIBLE_ROUTES.has(path);
}

export function isSponsoredPhraseTopicEligible(topicKey: string): boolean {
  return SPONSORED_PHRASE_ELIGIBLE_TOPIC_KEYS.has(topicKey);
}
