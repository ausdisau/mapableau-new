
import { searchLocations } from "@/lib/search/location-autocomplete-adapter";
import { searchProviders } from "@/lib/search/provider-autocomplete";
import {
  searchAccessibilityFeatures,
  searchLanguages,
  searchPopularSearches,
  searchServiceCategories,
} from "@/lib/search/service-autocomplete";
import { AUTOCOMPLETE_MAX_SUGGESTIONS } from "@/types/search";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
} from "@/types/search";

export {
  buildLiveRegionMessage,
  flattenSuggestions,
} from "@/lib/search/autocomplete-utils";

export type AutocompleteSearchInput = {
  query: string;
  context: AutocompleteContext;
  field?: AutocompleteField;
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

export async function searchAutocomplete(
  input: AutocompleteSearchInput,
): Promise<AutocompleteGroupedResult> {
  const { query, context, field = "all" } = input;
  const limit = perGroupLimit(field, context);

  const empty: AutocompleteGroupedResult = {
    providers: [],
    services: [],
    locations: [],
    accessibilityFeatures: [],
    languages: [],
    popularSearches: [],
  };

  if (query.trim().length < 2) return empty;

  const [
    providers,
    services,
    locations,
    accessibilityFeatures,
    languages,
    popularSearches,
  ] = await Promise.all([
    shouldInclude(field, "provider")
      ? searchProviders(query, limit)
      : Promise.resolve([]),
    shouldInclude(field, "service")
      ? searchServiceCategories(query, limit)
      : Promise.resolve([]),
    shouldInclude(field, "location")
      ? searchLocations(query, limit)
      : Promise.resolve([]),
    shouldInclude(field, "accessibility")
      ? searchAccessibilityFeatures(query, limit)
      : Promise.resolve([]),
    shouldInclude(field, "language")
      ? searchLanguages(query, limit)
      : Promise.resolve([]),
    field === "all"
      ? searchPopularSearches(query, context, context === "homepage" ? 3 : 2)
      : Promise.resolve([]),
  ]);

  const result: AutocompleteGroupedResult = {
    providers,
    services,
    locations,
    accessibilityFeatures,
    languages,
    popularSearches,
  };

  if (context === "provider_finder" && field === "all") {
    return prioritizeProviderFinder(result);
  }

  return trimTotal(result, AUTOCOMPLETE_MAX_SUGGESTIONS);
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
      popularSearches: [],
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

