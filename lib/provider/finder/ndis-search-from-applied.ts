import type { CopilotProviderResult } from "@/lib/copilot/types";
import {
  searchNdisProviders,
  type NdisProviderSearchParams,
  type NdisProviderSearchRow,
} from "@/lib/ingestion/ndis-providers-search";
import {
  PROVIDER_SERVICE_CATALOG,
  resolveProviderServiceCatalog,
} from "@/lib/provider/finder/search-service-catalog";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

const AU_STATES = new Set([
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
]);

export function parseLocationForNdisSearch(location: string): {
  state?: string;
  postcode?: string;
  suburbQuery?: string;
} {
  const raw = location.trim();
  if (!raw) return {};

  const postcodeMatch = raw.match(/\b(\d{4})\b/);
  const postcode = postcodeMatch?.[1];

  let state: string | undefined;
  for (const token of raw.split(/[\s,]+/)) {
    const upper = token.toUpperCase();
    if (AU_STATES.has(upper)) {
      state = upper;
      break;
    }
  }

  let suburbQuery = raw;
  if (state) {
    suburbQuery = suburbQuery.replace(new RegExp(`\\b${state}\\b`, "i"), "");
  }
  if (postcode) {
    suburbQuery = suburbQuery.replace(postcode, "");
  }
  suburbQuery = suburbQuery.replace(/,/g, " ").replace(/\s+/g, " ").trim();

  return {
    state,
    postcode,
    suburbQuery: suburbQuery || undefined,
  };
}

function serviceFiltersFromApplied(
  applied: AppliedSearchFields,
  interpretation: SearchInterpretation,
): Pick<NdisProviderSearchParams, "service" | "registrationGroups" | "serviceLabels"> {
  const serviceText =
    applied.serviceQuery.trim() ||
    (interpretation.serviceCategorySlug
      ? interpretation.serviceCategorySlug.replace(/-/g, " ")
      : "");
  if (!serviceText) return {};

  const catalogId = resolveProviderServiceCatalog(serviceText);
  if (catalogId) {
    const entry = PROVIDER_SERVICE_CATALOG[catalogId];
    return {
      service: serviceText,
      registrationGroups: entry.registrationGroups,
      serviceLabels: entry.serviceLabels,
    };
  }

  return { service: serviceText };
}

export function buildNdisSearchParamsFromApplied(
  applied: AppliedSearchFields,
  interpretation: SearchInterpretation,
  options?: { limit?: number },
): NdisProviderSearchParams {
  const loc = parseLocationForNdisSearch(applied.location);
  const service = serviceFiltersFromApplied(applied, interpretation);

  return {
    q: applied.providerName.trim() || undefined,
    state: loc.state,
    postcode: loc.postcode,
    suburb: loc.suburbQuery,
    ...service,
    limit: options?.limit,
  };
}

export function ndisRowToCopilotResult(
  row: NdisProviderSearchRow,
): CopilotProviderResult {
  const location = [row.suburb, row.state, row.postcode]
    .filter(Boolean)
    .join(" ");
  const slug = row.provider_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const groupsListed = row.registration_groups.length > 0;

  return {
    id: row.source_id,
    slug: slug || row.source_id,
    name: row.provider_name,
    suburb: row.suburb,
    state: row.state,
    postcode: row.postcode,
    locationLabel: location || null,
    registered: false,
    registrationStatus: groupsListed ? "groups_listed_in_import" : "unknown",
    registrationGroups: row.registration_groups,
    services: row.services.slice(0, 5),
    phone: row.phone,
    website: row.website,
    sourceType: "ndis_import",
    sourceId: row.source_id,
    sourceUpdatedAt: row.updated_at?.toISOString?.() ?? null,
    availability: "unknown",
    workerCredentials: "unknown",
  };
}

export async function searchProvidersForAppliedTurn(
  applied: AppliedSearchFields,
  interpretation: SearchInterpretation,
  options?: { limit?: number; skipSearch?: boolean },
): Promise<CopilotProviderResult[]> {
  if (options?.skipSearch) return [];

  try {
    const params = buildNdisSearchParamsFromApplied(applied, interpretation, {
      limit: options?.limit,
    });
    if (
      !params.q &&
      !params.state &&
      !params.postcode &&
      !params.suburb &&
      !params.service &&
      !(params.registrationGroups && params.registrationGroups.length > 0) &&
      !(params.serviceLabels && params.serviceLabels.length > 0)
    ) {
      return [];
    }
    const { providers } = await searchNdisProviders(params);
    return providers.map(ndisRowToCopilotResult);
  } catch (err) {
    console.error("[searchProvidersForAppliedTurn]", err);
    return [];
  }
}
