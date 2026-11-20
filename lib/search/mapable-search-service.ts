import "server-only";

import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { searchDomainDirectory } from "@/lib/search/domain-directory-service";
import {
  domainForCategory,
  isValidCategoryFilter,
  type DirectoryDomain,
} from "@/lib/search/domain-directory-taxonomy";

import {
  combineSearchHits,
  importedProviderHits,
  navigationSearch,
  type MapAbleSearchHit,
  type MapAbleSearchInput,
  type MapAbleSearchResponse,
} from "./mapable-search-core";

export const providerIndexEnabled = () =>
  process.env.MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED === "true";

/** Read-only public discovery. No external crawlers or private profiles. */
export async function searchMapAble(input: MapAbleSearchInput): Promise<MapAbleSearchResponse> {
  const warnings = [
    "Directory listings are not proof of professional registration, live vacancies, access fit, NDIS eligibility or current capacity.",
  ];
  if (!isValidCategoryFilter(input.vertical, input.category)) {
    return {
      results: [],
      sourceState: "navigation_only",
      providerIndexEnabled: providerIndexEnabled(),
      resultCount: 0,
      warnings: [...warnings, "The selected category does not belong to this search area."],
    };
  }

  const navigation = navigationSearch(input);
  const imported: MapAbleSearchHit[] = [];
  const directoryHits: MapAbleSearchHit[] = [];
  let partial = false;

  const categoryDomain = domainForCategory(input.category ?? "");
  const queryHasIntent = Boolean(
    input.q.trim() || input.postcode || input.state ||
      (input.category && input.category !== "all"),
  );
  const wantsGenericProviders =
    (input.vertical === "all" || input.vertical === "providers") &&
    !categoryDomain && queryHasIntent;

  if (wantsGenericProviders && providerIndexEnabled()) {
    try {
      const { providers } = await searchNdisProviders({
        q: input.q.trim() || undefined,
        state: input.state,
        postcode: input.postcode,
        limit: 25,
      });
      imported.push(...importedProviderHits(providers));
    } catch {
      partial = true;
      warnings.push("The imported provider index is unavailable; partial results are shown.");
    }
  }

  const domainRequests = (["jobs", "rehabilitation"] as const).filter(
    (domain): domain is DirectoryDomain =>
      (input.vertical === "all" || input.vertical === domain) &&
      (!categoryDomain || categoryDomain === domain) &&
      (input.vertical !== "all" || queryHasIntent),
  );

  const domainResults = await Promise.all(
    domainRequests.map(async (domain) =>
      searchDomainDirectory({ ...input, domain }),
    ),
  );

  for (const domainResult of domainResults) {
    directoryHits.push(...domainResult.results);
    warnings.push(...domainResult.warnings);
    partial ||= domainResult.incomplete;
  }

  const results = combineSearchHits(
    combineSearchHits(navigation, imported),
    directoryHits,
  );

  return {
    results,
    sourceState: partial
      ? "partial"
      : directoryHits.length > 0
        ? "directory_results"
        : imported.length > 0
          ? "imported_provider_index"
          : "navigation_only",
    providerIndexEnabled: providerIndexEnabled(),
    resultCount: results.length,
    warnings: Array.from(new Set(warnings)),
  };
}
