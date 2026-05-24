export type AutocompleteContext = "homepage" | "provider_finder";

export type AutocompleteSuggestionType =
  | "provider"
  | "service"
  | "location"
  | "accessibility_feature"
  | "language"
  | "popular_search";

export type AutocompleteSuggestion = {
  id: string;
  type: AutocompleteSuggestionType;
  label: string;
  /** Screen reader + visible secondary text */
  description?: string;
  /** Short type label shown beside suggestion (not colour-only) */
  typeLabel: string;
  value: string;
  metadata?: {
    slug?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    providerId?: string;
  };
};

export type AutocompleteField =
  | "all"
  | "provider"
  | "service"
  | "location"
  | "accessibility"
  | "language";

export type AutocompleteGroupedResult = {
  providers: AutocompleteSuggestion[];
  services: AutocompleteSuggestion[];
  locations: AutocompleteSuggestion[];
  accessibilityFeatures: AutocompleteSuggestion[];
  languages: AutocompleteSuggestion[];
  popularSearches: AutocompleteSuggestion[];
};

export const AUTOCOMPLETE_MAX_SUGGESTIONS = 10;
export const AUTOCOMPLETE_MIN_QUERY_LENGTH = 2;

/** Structured filters extracted from a natural-language provider search query. */
export type NaturalLanguageSearchFilters = {
  q: string;
  location: string;
  access: string;
  service: string;
  provider: string;
};

export type NaturalLanguageSearchResponse = {
  filters: NaturalLanguageSearchFilters;
  /** Original query sent to the parser. */
  sourceQuery: string;
  /** Whether Gemini was used (false when falling back to passthrough). */
  parsed: boolean;
};
