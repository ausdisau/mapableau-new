/**
 * MapAble Search UI state and pure helpers.
 * Deep Search spending stays disabled until a reviewed reservation system exists.
 */

import type {
  MapAbleSearchHit,
  MapAbleSearchResponse,
  MapAbleVertical,
} from "@/lib/search/mapable-search-core";

export type SearchPresentation = "web" | "conversation";
export type SearchTier = "quick" | "deep";
export type SearchCategory =
  | "all"
  | "places"
  | "providers"
  | "care"
  | "transport"
  | "jobs";

export interface SearchSelection {
  query: string;
  presentation: SearchPresentation;
  tier: SearchTier;
  category: SearchCategory;
}

export type SearchEvidenceStatus =
  | "verified"
  | "reported"
  | "historical"
  | "disputed"
  | "unknown";

export type SearchUiStatus =
  | "idle"
  | "loading"
  | "results"
  | "no_match"
  | "partial_data"
  | "service_unavailable"
  | "rate_limited"
  | "retry";

export const SEARCH_QUERY_MAX = 180;

export const SEARCH_CATEGORIES: ReadonlyArray<{
  id: SearchCategory;
  label: string;
  href: string;
}> = [
  { id: "places", label: "Places", href: "/accessibility-map" },
  { id: "providers", label: "Providers", href: "/provider-finder" },
  { id: "care", label: "Care", href: "/care" },
  { id: "transport", label: "Transport", href: "/transport" },
  { id: "jobs", label: "Jobs", href: "/employment" },
] as const;

/** Credits and Deep Search spend remain unavailable in this slice. */
export const deepSearchAvailable = false;

export function createDefaultSearchSelection(
  overrides: Partial<SearchSelection> = {},
): SearchSelection {
  return {
    query: "",
    presentation: "web",
    tier: "quick",
    category: "all",
    ...overrides,
  };
}

export function validateSearchQuery(raw: string): {
  ok: boolean;
  query: string;
  error?: string;
} {
  const query = raw
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (query.length > SEARCH_QUERY_MAX) {
    return {
      ok: false,
      query: query.slice(0, SEARCH_QUERY_MAX),
      error: `Keep your search under ${SEARCH_QUERY_MAX} characters.`,
    };
  }
  return { ok: true, query };
}

export function isSearchCategory(value: string): value is SearchCategory {
  return (
    value === "all" ||
    value === "places" ||
    value === "providers" ||
    value === "care" ||
    value === "transport" ||
    value === "jobs"
  );
}

export function isSearchPresentation(
  value: string,
): value is SearchPresentation {
  return value === "web" || value === "conversation";
}

export function isSearchTier(value: string): value is SearchTier {
  return value === "quick" || value === "deep";
}

/** Presentation and tier are independent — changing one never resets the other. */
export function withPresentation(
  selection: SearchSelection,
  presentation: SearchPresentation,
): SearchSelection {
  return { ...selection, presentation };
}

export function withTier(
  selection: SearchSelection,
  tier: SearchTier,
): SearchSelection {
  return { ...selection, tier };
}

export function withCategory(
  selection: SearchSelection,
  category: SearchCategory,
): SearchSelection {
  return { ...selection, category };
}

export function categoryToVertical(category: SearchCategory): MapAbleVertical {
  return category;
}

export function parseSearchSelectionFromParams(
  params: Record<string, string | string[] | undefined>,
): SearchSelection {
  const qRaw = typeof params.q === "string" ? params.q : "";
  const { query } = validateSearchQuery(qRaw);
  const categoryRaw =
    typeof params.vertical === "string" ? params.vertical : "all";
  const presentationCandidate =
    typeof params.presentation === "string"
      ? params.presentation
      : typeof params.view === "string"
        ? params.view
        : "web";
  const tierRaw = typeof params.tier === "string" ? params.tier : "quick";

  return createDefaultSearchSelection({
    query,
    category: isSearchCategory(categoryRaw) ? categoryRaw : "all",
    presentation: isSearchPresentation(presentationCandidate)
      ? presentationCandidate
      : "web",
    tier: isSearchTier(tierRaw) ? tierRaw : "quick",
  });
}

export function resolveSearchUiStatus(input: {
  loading?: boolean;
  httpStatus?: number | null;
  response?: MapAbleSearchResponse | null;
  error?: string | null;
  retryRequested?: boolean;
}): SearchUiStatus {
  if (input.loading) return "loading";
  if (input.retryRequested) return "retry";
  if (input.httpStatus === 429) return "rate_limited";
  if (input.httpStatus != null && input.httpStatus >= 500) {
    return "service_unavailable";
  }
  if (input.error && !input.response) return "service_unavailable";
  if (!input.response) return "idle";
  if (input.response.sourceState === "partial") return "partial_data";
  if (input.response.resultCount === 0) return "no_match";
  return "results";
}

/**
 * Map discovery hits to a visible evidence status.
 * Imported outlets and navigation modules stay unknown unless a verified claim exists.
 */
export function evidenceStatusForHit(
  hit: MapAbleSearchHit,
): SearchEvidenceStatus {
  if (hit.kind === "provider_outlet") return "unknown";
  if (hit.provenance === "mapable_navigation") return "reported";
  return "unknown";
}

export type OrganicSearchHit = MapAbleSearchHit;

export type SearchAdSlot = {
  id: string;
  label: "Advertisement";
  paidForBy: string;
  href: string;
  summary: string;
};

/**
 * Organic results never consult advertiser bids, campaigns or ad slots.
 * Ads may only render in separately labelled regions.
 */
export function organicResultsIgnoringAds(
  hits: OrganicSearchHit[],
  _ads: SearchAdSlot[] = [],
): OrganicSearchHit[] {
  return [...hits];
}

export function buildMapAbleSearchUrl(selection: SearchSelection): string {
  const params = new URLSearchParams();
  if (selection.query) params.set("q", selection.query);
  if (selection.category !== "all") params.set("vertical", selection.category);
  if (selection.presentation !== "web") {
    params.set("presentation", selection.presentation);
  }
  if (selection.tier !== "quick") params.set("tier", selection.tier);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
