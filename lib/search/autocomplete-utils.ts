import type {
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
} from "@/types/search";

/** Client-safe helpers (no Prisma). */

export function flattenSuggestions(
  groups: AutocompleteGroupedResult,
): AutocompleteSuggestion[] {
  return [
    ...groups.providers,
    ...groups.services,
    ...groups.locations,
    ...groups.accessibilityFeatures,
    ...groups.languages,
    ...groups.popularSearches,
  ];
}

export function buildLiveRegionMessage(
  loading: boolean,
  count: number,
  query: string,
): string {
  if (loading) return "Loading suggestions.";
  if (query.trim().length < 2) {
    return "Type at least 2 characters for suggestions.";
  }
  if (count === 0) return `No suggestions found for ${query}.`;
  return `${count} suggestion${count === 1 ? "" : "s"} available.`;
}
