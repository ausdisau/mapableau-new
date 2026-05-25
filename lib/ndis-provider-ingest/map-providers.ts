import { mapOutletsToProviders } from "@/app/provider-finder/outletToProvider";
import type { Provider } from "@/app/provider-finder/providers";
import type { ProviderOutlet } from "@/data/provider-outlets.types";
import { distanceKm } from "@/lib/geo";
import { loadProviderOutletsBundle } from "@/lib/ndis-provider-ingest/provider-bundle-cache";
import { hasValidCoordinates } from "@/lib/ndis-provider-ingest/normalize";

export type MapProviderQuery = {
  limit?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  state?: string;
  q?: string;
  activeOnly?: boolean;
};

function matchesQuery(outlet: ProviderOutlet, q: string): boolean {
  const hay = [
    outlet.Prov_N,
    outlet.Outletname,
    outlet.Address,
    outlet.Head_Office,
    outlet.prfsn,
  ]
    .join(" ")
    .toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((t) => hay.includes(t));
}

export async function queryMapProviders(
  query: MapProviderQuery,
): Promise<{ providers: Provider[]; totalMatched: number; date: string }> {
  const bundle = await loadProviderOutletsBundle();
  const limit = Math.min(Math.max(query.limit ?? 500, 1), 2000);

  let rows = bundle.data.filter(hasValidCoordinates);

  if (query.activeOnly) {
    rows = rows.filter((o) => o.Active === 1);
  }

  if (query.state) {
    const st = query.state.toUpperCase();
    rows = rows.filter((o) => o.State_cd === st);
  }

  const q = query.q?.trim();
  if (q) {
    rows = rows.filter((o) => matchesQuery(o, q));
  }

  const withDistance = rows.map((o, index) => {
    let d = 0;
    if (
      query.lat != null &&
      query.lng != null &&
      Number.isFinite(query.lat) &&
      Number.isFinite(query.lng)
    ) {
      d = distanceKm(query.lat, query.lng, o.Latitude, o.Longitude);
    }
    return { o, index, d };
  });

  if (
    query.lat != null &&
    query.lng != null &&
    query.radiusKm != null &&
    query.radiusKm > 0
  ) {
    const r = query.radiusKm;
    rows = withDistance.filter((x) => x.d <= r).map((x) => x.o);
  } else if (query.lat != null && query.lng != null) {
    withDistance.sort((a, b) => a.d - b.d);
    rows = withDistance.map((x) => x.o);
  }

  const totalMatched = rows.length;
  const slice = rows.slice(0, limit);
  const providers = mapOutletsToProviders(slice);

  if (
    query.lat != null &&
    query.lng != null &&
    Number.isFinite(query.lat) &&
    Number.isFinite(query.lng)
  ) {
    for (const p of providers) {
      if (p.latitude != null && p.longitude != null) {
        p.distanceKm = distanceKm(
          query.lat,
          query.lng,
          p.latitude,
          p.longitude,
        );
      }
    }
  }

  return { providers, totalMatched, date: bundle.date };
}
