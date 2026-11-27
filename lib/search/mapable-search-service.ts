import "server-only";

import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { enhanceSearchResponse } from "@/lib/support-intelligence/search-integration";
import { isCapabilityEnabled } from "@/lib/support-intelligence/config/feature-flags";

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
 * Support Intelligence may add evidence warnings when its search flag is on.
 */
export async function searchMapAble(input: MapAbleSearchInput): Promise<MapAbleSearchResponse> {
  const navigation = navigationSearch(input);
  const enabled = providerIndexEnabled();
  const wantsProviders = input.vertical === "all" || input.vertical === "providers";
  const warnings = [
    "Listings do not establish current NDIS Commission registration, worker screening, accessibility or vacancies.",
  ];

  const finalize = (base: MapAbleSearchResponse): MapAbleSearchResponse => {
    if (!isCapabilityEnabled("search")) return base;
    const enhanced = enhanceSearchResponse({ base });
    const { supportIntelligence: _si, ...rest } = enhanced;
    return {
      ...rest,
      warnings: enhanced.warnings,
    };
  };

  if (!enabled || !wantsProviders || (!input.q.trim() && !input.postcode && !input.state)) {
    return finalize({
      results: navigation,
      sourceState: "navigation_only",
      providerIndexEnabled: enabled,
      resultCount: navigation.length,
      warnings,
    });
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
    return finalize({
      results,
      sourceState: "imported_provider_index",
      providerIndexEnabled: enabled,
      resultCount: results.length,
      warnings,
    });
  } catch {
    // Fail closed for imported data; no unverified synthetic fallback.
    warnings.push("Provider index is temporarily unavailable. Only MapAble navigation is shown.");
    return finalize({
      results: navigation,
      sourceState: "partial",
      providerIndexEnabled: enabled,
      resultCount: navigation.length,
      warnings,
    });
  }
}
