import type {
  NaturalLanguageSearchFilters,
  NaturalLanguageSearchResponse,
} from "@/types/search";

export type ProviderFinderSearchValues = {
  query: string;
  location: string;
  accessQuery: string;
  serviceQuery: string;
  providerName: string;
};

export function buildProviderFinderUrl(
  values: ProviderFinderSearchValues,
): string {
  const params = new URLSearchParams();
  if (values.query.trim()) params.set("q", values.query.trim());
  if (values.location.trim()) params.set("location", values.location.trim());
  if (values.accessQuery.trim()) params.set("access", values.accessQuery.trim());
  if (values.serviceQuery.trim()) params.set("service", values.serviceQuery.trim());
  if (values.providerName.trim()) params.set("provider", values.providerName.trim());
  const qs = params.toString();
  return qs ? `/provider-finder?${qs}` : "/provider-finder";
}

export function filtersToSearchValues(
  filters: NaturalLanguageSearchFilters,
  existing?: Partial<ProviderFinderSearchValues>,
): ProviderFinderSearchValues {
  return {
    query: filters.q || existing?.query || "",
    location: filters.location || existing?.location || "",
    accessQuery: filters.access || existing?.accessQuery || "",
    serviceQuery: filters.service || existing?.serviceQuery || "",
    providerName: filters.provider || existing?.providerName || "",
  };
}

export function mergeWithExistingValues(
  parsed: NaturalLanguageSearchFilters,
  existing: ProviderFinderSearchValues,
): ProviderFinderSearchValues {
  return {
    query: parsed.q || existing.query,
    location: parsed.location || existing.location,
    accessQuery: parsed.access || existing.accessQuery,
    serviceQuery: parsed.service || existing.serviceQuery,
    providerName: parsed.provider || existing.providerName,
  };
}

export async function fetchNaturalLanguageSearch(
  query: string,
): Promise<NaturalLanguageSearchResponse> {
  const response = await fetch("/api/search/natural-language", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Natural language search failed (${response.status})`);
  }

  return (await response.json()) as NaturalLanguageSearchResponse;
}

export async function resolveSearchValues(
  values: ProviderFinderSearchValues,
): Promise<ProviderFinderSearchValues> {
  const primary = values.query.trim();
  const hasOtherFields =
    values.location.trim() ||
    values.accessQuery.trim() ||
    values.serviceQuery.trim() ||
    values.providerName.trim();

  if (!primary || hasOtherFields) {
    return values;
  }

  try {
    const result = await fetchNaturalLanguageSearch(primary);
    if (!result.parsed) {
      return values;
    }
    return mergeWithExistingValues(result.filters, values);
  } catch {
    return values;
  }
}
