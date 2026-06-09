import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { searchNdisProviders } from "@/lib/ingestion/ndis-providers-search";
import { fetchProviderOutlets } from "@/lib/provider-outlets";

export type ProviderDataSource = "prisma" | "json";

export const providerDataConfig = {
  /** Prefer Prisma registry when rows exist; fall back to bundled JSON. */
  preferPrisma: process.env.PROVIDER_DATA_SOURCE !== "json",
  defaultLimit: Number(process.env.PROVIDER_FINDER_DEFAULT_LIMIT ?? "25"),
};

/**
 * Shared provider search — unifies static JSON and Prisma-backed registry.
 * Used by Provider Finder, API routes, and provider pages.
 */
export async function searchProviders(params: {
  q?: string;
  state?: string;
  postcode?: string;
  service?: string;
  limit?: number;
  withCoordinatesOnly?: boolean;
  source?: ProviderDataSource;
}) {
  const limit = params.limit ?? providerDataConfig.defaultLimit;

  if (
    providerDataConfig.preferPrisma &&
    params.source !== "json"
  ) {
    try {
      const result = await searchNdisProviders({
        q: params.q,
        state: params.state,
        postcode: params.postcode,
        service: params.service,
        limit,
        withCoordinatesOnly: params.withCoordinatesOnly,
      });
      if (result.count > 0) {
        return {
          source: "prisma" as const,
          providers: result.providers,
          count: result.count,
        };
      }
    } catch {
      // fall through to JSON
    }
  }

  const outlets = await fetchProviderOutlets();
  const filtered = filterOutlets(outlets, params).slice(0, limit);

  return {
    source: "json" as const,
    providers: filtered.map(mapOutletToSearchRow),
    count: filtered.length,
  };
}

function filterOutlets(
  outlets: ProviderOutlet[],
  params: {
    q?: string;
    state?: string;
    postcode?: string;
    service?: string;
    withCoordinatesOnly?: boolean;
  }
) {
  let rows = outlets;

  if (params.q) {
    const q = params.q.toLowerCase();
    rows = rows.filter(
      (o) =>
        o.Outletname?.toLowerCase().includes(q) ||
        o.Address?.toLowerCase().includes(q)
    );
  }
  if (params.state) {
    rows = rows.filter(
      (o) => o.State_cd?.toUpperCase() === params.state!.toUpperCase()
    );
  }
  if (params.postcode) {
    rows = rows.filter((o) => String(o.Post_cd) === params.postcode);
  }
  if (params.withCoordinatesOnly) {
    rows = rows.filter(
      (o) =>
        o.Latitude != null &&
        o.Longitude != null &&
        o.Latitude !== 0 &&
        o.Longitude !== 0
    );
  }

  return rows;
}

function mapOutletToSearchRow(outlet: ProviderOutlet) {
  return {
    source_id: outlet.Prov_N ?? "",
    provider_name: outlet.Outletname ?? "",
    suburb: outlet.Address ?? null,
    state: outlet.State_cd ?? null,
    postcode: outlet.Post_cd != null ? String(outlet.Post_cd) : null,
    latitude: outlet.Latitude ?? null,
    longitude: outlet.Longitude ?? null,
    phone: outlet.Phone ?? null,
    email: outlet.Email ?? null,
    website: outlet.Website ?? null,
    services: outlet.RegGroup?.map(String) ?? [],
    registration_groups: outlet.RegGroup?.map(String) ?? [],
    updated_at: new Date(),
  };
}
