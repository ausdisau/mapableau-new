import {
  searchPredictiveSuggestions,
  type PredictiveSuggestionInput,
} from "@/lib/search/predictive-suggestion-engine";
import type {
  AutocompleteContext,
  AutocompleteField,
  AutocompleteGroupedResult,
  PredictiveSuggestionResult,
  SuggestionMode,
  SuggestionSignals,
} from "@/types/search";

export {
  buildLiveRegionMessage,
  flattenSuggestions,
} from "@/lib/search/autocomplete-utils";

export type AutocompleteSearchInput = {
  query: string;
  context: AutocompleteContext;
  field?: AutocompleteField;
  mode?: SuggestionMode;
  signals?: SuggestionSignals;
};

export async function searchAutocomplete(
  input: AutocompleteSearchInput,
): Promise<AutocompleteGroupedResult> {
  const result = await searchPredictiveSuggestions({
    mode: input.mode ?? "reactive",
    query: input.query,
    context: input.context,
    field: input.field,
    signals: input.signals,
  });
  return result.groups;
}

export async function searchAutocompleteWithMeta(
  input: AutocompleteSearchInput,
): Promise<PredictiveSuggestionResult> {
  return searchPredictiveSuggestions({
    mode: input.mode ?? "reactive",
    query: input.query,
    context: input.context,
    field: input.field,
    signals: input.signals,
  });
}

export type { PredictiveSuggestionInput };
