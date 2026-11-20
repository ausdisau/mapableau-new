import "server-only";

import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";

import {
  combineSearchHits,
  importedProviderHits,
  navigationSearch,
  type MapAbleSearchInput,
  type MapAbleSearchResponse,
} from "./mapable-search-core";

export const providerIndexEnabled = () =>
  process.env.MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED === "true";

/**
 * Public, read-only discovery slice. Exa/Parallel and private profiles are
 * intentionally excluded until approved ingestion and consent contracts exist.
 */
export async function searchMapAble(input: MapAbleSearchInput): Promise<MapAbleSearchResponse> {
  const navigation = navigationSearch(input);
  const enabled = providerIndexEnabled();
  const wantsProviders = input.vertical === "all" || input.vertical === "providers";
  const warnings = [
    "Listings do not establish current NDIS Commission registration, worker screening, accessibility or vacancies.",
  ];
  if (!enabled || !wantsProviders || (!input.q.trim() && !input.postcode && !input.state)) {
    return {
      results: navigation,
      sourceState: "navigation_only",
      providerIndexEnabled: enabled,
      resultCount: navigation.length,
      warnings,
    };
  }

  try {
    const { providers } = await searchNdisProviders({
      q: input.q.trim() || undefined,
      state: input.state,
      postcode: input.postcode,
      limit: 30,
    });
    const providerHits = importedProviderHits(providers);
    const results = combineSearchHits(navigation, providerHits);
    return {
      results,
      sourceState: "imported_provider_index",
      providerIndexEnabled: enabled,
      resultCount: results.length,
      warnings,
    };
  } catch {
    // Fail closed for imported data; no unverified synthetic fallback.
    warnings.push("Provider index is temporarily unavailable. Only MapAble navigation is shown.");
    return {
      results: navigation,
      sourceState: "partial",
      providerIndexEnabled: enabled,
      resultCount: navigation.length,
      warnings,
    };
  }
}
