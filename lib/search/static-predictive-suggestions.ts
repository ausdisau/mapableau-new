import {
  ACCESS_NEEDS,
  HERO_SUGGESTED_SEARCHES,
  SUPPORT_TYPES,
} from "@/lib/provider-finder/filters";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  AutocompleteSuggestion,
} from "@/types/search";

const EXTRA_LOCATIONS = [
  "Sydney NSW",
  "Parramatta NSW 2150",
  "Melbourne VIC",
  "Brisbane QLD",
  "St Ives NSW",
  "Newcastle NSW",
  "Wollongong NSW",
  "Canberra ACT",
  "Gold Coast QLD",
  "Adelaide SA",
  "Perth WA",
];

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

function popularSuggestions(context: AutocompleteContext): AutocompleteSuggestion[] {
  return HERO_SUGGESTED_SEARCHES.map((query, index) => ({
    id: `static-popular-${index}`,
    type: "popular_search" as const,
    typeLabel: "Popular",
    label: query,
    value: query,
  })).slice(0, context === "homepage" ? 5 : 4);
}

const EXTRA_SERVICES = [
  "Physiotherapy",
  "Occupational therapy",
  "Support worker",
  "Personal care",
  "Accessible transport",
  "Support coordination",
];

function serviceSuggestions(query?: string, limit = 5): AutocompleteSuggestion[] {
  const services = [
    ...SUPPORT_TYPES.filter((s) => s.id !== "all").flatMap((s) => [
      s.label,
      ...s.categories,
    ]),
    ...EXTRA_SERVICES,
  ];
  const unique = [...new Set(services)];
  return unique
    .filter((name) => !query || matchesQuery(name, query))
    .slice(0, limit)
    .map((name, index) => ({
      id: `static-service-${index}-${name}`,
      type: "service" as const,
      typeLabel: "Service",
      label: name,
      value: name,
    }));
}

function accessSuggestions(query?: string, limit = 4): AutocompleteSuggestion[] {
  return ACCESS_NEEDS.filter(
    (need) => !query || matchesQuery(need.label, query) || need.keywords.some((kw) => matchesQuery(kw, query)),
  )
    .slice(0, limit)
    .map((need) => ({
      id: `static-access-${need.id}`,
      type: "accessibility_feature" as const,
      typeLabel: "Access",
      label: need.label,
      value: need.label,
    }));
}

function locationSuggestions(query?: string, limit = 5): AutocompleteSuggestion[] {
  return EXTRA_LOCATIONS.filter((loc) => !query || matchesQuery(loc, query))
    .slice(0, limit)
    .map((loc, index) => ({
      id: `static-location-${index}`,
      type: "location" as const,
      typeLabel: "Location",
      label: loc,
      value: loc,
    }));
}

function emptyGroups(): AutocompleteGroupedResult {
  return {
    providers: [],
    services: [],
    locations: [],
    accessibilityFeatures: [],
    languages: [],
    popularSearches: [],
  };
}

function shouldInclude(field: AutocompleteField, target: AutocompleteField): boolean {
  return field === "all" || field === target;
}

/** Curated suggestions that work without a database connection. */
export function getStaticPredictiveSuggestions(input: {
  context: AutocompleteContext;
  field?: AutocompleteField;
  query?: string;
}): AutocompleteGroupedResult {
  const { context, field = "all", query = "" } = input;
  const q = query.trim();

  if (q.length === 1) {
    return emptyGroups();
  }

  const groups = emptyGroups();

  if (shouldInclude(field, "service")) {
    groups.services = serviceSuggestions(q || undefined, field === "all" ? 4 : 8);
  }
  if (shouldInclude(field, "location")) {
    groups.locations = locationSuggestions(q || undefined, field === "all" ? 3 : 8);
  }
  if (shouldInclude(field, "accessibility")) {
    groups.accessibilityFeatures = accessSuggestions(q || undefined, field === "all" ? 3 : 8);
  }
  if (field === "all" && !q) {
    groups.popularSearches = popularSuggestions(context);
  }

  return groups;
}
