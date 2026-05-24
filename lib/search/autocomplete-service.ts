import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
} from "@/types/search";
import { AUTOCOMPLETE_MAX_SUGGESTIONS } from "@/types/search";

import { searchLocations } from "@/lib/search/location-autocomplete-adapter";
import {
  searchOutletLocations,
  searchOutletProviders,
} from "@/lib/search/outlet-autocomplete-index";
import { searchProviders } from "@/lib/search/provider-autocomplete";
import {
  searchAccessibilityFeatures,
  searchLanguages,
  searchPopularSearches,
  searchServiceCategories,
} from "@/lib/search/service-autocomplete";
import { getStaticPredictiveSuggestions } from "@/lib/search/static-predictive-suggestions";

export type AutocompleteSearchInput = {
  query: string;
  context: AutocompleteContext;
  field?: AutocompleteField;
  /** When true, return default suggestions even with an empty query. */
  predictive?: boolean;
};

function perGroupLimit(
  field: AutocompleteField,
  context: AutocompleteContext,
): number {
  if (field !== "all") return AUTOCOMPLETE_MAX_SUGGESTIONS;
  return context === "provider_finder" ? 4 : 3;
}

function shouldInclude(
  field: AutocompleteField,
  target: AutocompleteField,
): boolean {
  return field === "all" || field === target;
}

function mergeSuggestions(
  primary: AutocompleteSuggestion[],
  fallback: AutocompleteSuggestion[],
  limit: number,
): AutocompleteSuggestion[] {
  const seen = new Set<string>();
  const merged: AutocompleteSuggestion[] = [];

  for (const item of [...primary, ...fallback]) {
    const key = `${item.type}:${item.value.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
}

function mergeGroups(
  primary: AutocompleteGroupedResult,
  fallback: AutocompleteGroupedResult,
  limits: Partial<Record<keyof AutocompleteGroupedResult, number>>,
): AutocompleteGroupedResult {
  return {
    providers: mergeSuggestions(
      primary.providers,
      fallback.providers,
      limits.providers ?? AUTOCOMPLETE_MAX_SUGGESTIONS,
    ),
    services: mergeSuggestions(
      primary.services,
      fallback.services,
      limits.services ?? AUTOCOMPLETE_MAX_SUGGESTIONS,
    ),
    locations: mergeSuggestions(
      primary.locations,
      fallback.locations,
      limits.locations ?? AUTOCOMPLETE_MAX_SUGGESTIONS,
    ),
    accessibilityFeatures: mergeSuggestions(
      primary.accessibilityFeatures,
      fallback.accessibilityFeatures,
      limits.accessibilityFeatures ?? AUTOCOMPLETE_MAX_SUGGESTIONS,
    ),
    languages: mergeSuggestions(
      primary.languages,
      fallback.languages,
      limits.languages ?? AUTOCOMPLETE_MAX_SUGGESTIONS,
    ),
    popularSearches: mergeSuggestions(
      primary.popularSearches,
      fallback.popularSearches,
      limits.popularSearches ?? AUTOCOMPLETE_MAX_SUGGESTIONS,
    ),
  };
}

export async function searchPredictiveSuggestions(
  input: Omit<AutocompleteSearchInput, "query"> & { query?: string },
): Promise<AutocompleteGroupedResult> {
  return searchAutocomplete({
    ...input,
    query: input.query ?? "",
    predictive: true,
  });
}

export async function searchAutocomplete(
  input: AutocompleteSearchInput,
): Promise<AutocompleteGroupedResult> {
  const { query, context, field = "all", predictive = false } = input;
  const limit = perGroupLimit(field, context);
  const trimmed = query.trim();

  const empty: AutocompleteGroupedResult = {
    providers: [],
    services: [],
    locations: [],
    accessibilityFeatures: [],
    languages: [],
    popularSearches: [],
  };

  if (!predictive && trimmed.length < 2) return empty;

  const staticFallback = getStaticPredictiveSuggestions({
    context,
    field,
    query: trimmed,
  });

  if (predictive && trimmed.length === 0) {
    return trimTotal(staticFallback, AUTOCOMPLETE_MAX_SUGGESTIONS);
  }

  if (predictive && trimmed.length === 1) {
    return empty;
  }

  const [
    dbProviders,
    outletProviders,
    dbServices,
    dbLocations,
    outletLocations,
    dbAccessibility,
    dbLanguages,
    dbPopular,
  ] = await Promise.all([
    shouldInclude(field, "provider")
      ? searchProviders(trimmed, limit)
      : Promise.resolve([]),
    shouldInclude(field, "provider")
      ? searchOutletProviders(trimmed, limit)
      : Promise.resolve([]),
    shouldInclude(field, "service")
      ? searchServiceCategories(trimmed, limit)
      : Promise.resolve([]),
    shouldInclude(field, "location")
      ? searchLocations(trimmed, limit)
      : Promise.resolve([]),
    shouldInclude(field, "location")
      ? searchOutletLocations(trimmed, limit)
      : Promise.resolve([]),
    shouldInclude(field, "accessibility")
      ? searchAccessibilityFeatures(trimmed, limit)
      : Promise.resolve([]),
    shouldInclude(field, "language")
      ? searchLanguages(trimmed, limit)
      : Promise.resolve([]),
    field === "all"
      ? searchPopularSearches(trimmed, context, context === "homepage" ? 3 : 2)
      : Promise.resolve([]),
  ]);

  const merged = mergeGroups(
    {
      providers: mergeSuggestions(dbProviders, outletProviders, limit),
      services: dbServices,
      locations: mergeSuggestions(dbLocations, outletLocations, limit),
      accessibilityFeatures: dbAccessibility,
      languages: dbLanguages,
      popularSearches: dbPopular,
    },
    staticFallback,
    {
      providers: limit,
      services: limit,
      locations: limit,
      accessibilityFeatures: limit,
      languages: limit,
      popularSearches: context === "homepage" ? 3 : 2,
    },
  );

  if (context === "provider_finder" && field === "all") {
    return prioritizeProviderFinder(merged);
  }

  return trimTotal(merged, AUTOCOMPLETE_MAX_SUGGESTIONS);
}

function prioritizeProviderFinder(
  groups: AutocompleteGroupedResult,
): AutocompleteGroupedResult {
  return trimTotal(
    {
      providers: groups.providers.slice(0, 3),
      services: groups.services.slice(0, 3),
      locations: groups.locations.slice(0, 2),
      accessibilityFeatures: groups.accessibilityFeatures.slice(0, 2),
      languages: groups.languages.slice(0, 1),
      popularSearches: groups.popularSearches.slice(0, 2),
    },
    AUTOCOMPLETE_MAX_SUGGESTIONS,
  );
}

function trimTotal(
  groups: AutocompleteGroupedResult,
  max: number,
): AutocompleteGroupedResult {
  const flat: AutocompleteSuggestion[] = [
    ...groups.providers,
    ...groups.services,
    ...groups.locations,
    ...groups.accessibilityFeatures,
    ...groups.languages,
    ...groups.popularSearches,
  ].slice(0, max);

  const take = (items: AutocompleteSuggestion[]) =>
    items.filter((i) => flat.some((f) => f.id === i.id));

  return {
    providers: take(groups.providers),
    services: take(groups.services),
    locations: take(groups.locations),
    accessibilityFeatures: take(groups.accessibilityFeatures),
    languages: take(groups.languages),
    popularSearches: take(groups.popularSearches),
  };
}

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
  predictive = false,
): string {
  if (loading) {
    return predictive ? "Loading predictive suggestions." : "Loading suggestions.";
  }
  if (query.trim().length < 2) {
    if (predictive && count > 0) {
      return `${count} predictive suggestion${count === 1 ? "" : "s"} available.`;
    }
    return predictive
      ? "Predictive suggestions appear when you focus this field."
      : "Type at least 2 characters for suggestions.";
  }
  if (count === 0) return `No suggestions found for ${query}.`;
  return `${count} suggestion${count === 1 ? "" : "s"} available.`;
}
