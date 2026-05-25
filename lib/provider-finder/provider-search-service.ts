import type { Provider } from "@/app/provider-finder/providers";
import {
  buildDistanceLabel,
  haversineDistanceKm,
  isWithinRadiusKm,
} from "@/lib/location/distance-service";
import { suburbCentroid } from "@/lib/provider-finder/suburb-coordinates";
import type { ProviderDistanceKind } from "@/types/location";

export type ProviderSearchFilters = {
  query?: string;
  locationText?: string;
  userLat?: number;
  userLng?: number;
  radiusKm?: number;
  sort?: "relevance" | "distance" | "rating";
};

export type ProviderWithDistance = Provider & {
  distanceKind: ProviderDistanceKind;
  distanceLabel: string;
};

function resolveProviderCoords(provider: Provider): {
  lat: number;
  lng: number;
  kind: ProviderDistanceKind;
} | null {
  if (
    provider.latitude != null &&
    provider.longitude != null &&
    (provider.latitude !== 0 || provider.longitude !== 0)
  ) {
    return {
      lat: provider.latitude,
      lng: provider.longitude,
      kind: "exact",
    };
  }
  if (provider.suburb === "Remote") {
    return null;
  }
  const centroid = suburbCentroid(provider.suburb, provider.state);
  if (!centroid) return null;
  return { lat: centroid[0], lng: centroid[1], kind: "approximate" };
}

export function enrichProvidersWithDistance(
  providers: Provider[],
  userLat: number,
  userLng: number,
): ProviderWithDistance[] {
  return providers.map((provider) => {
    const coords = resolveProviderCoords(provider);
    if (!coords) {
      const label =
        provider.suburb === "Remote"
          ? buildDistanceLabel(null, "service_area")
          : buildDistanceLabel(null, "unknown");
      return {
        ...provider,
        distanceKm: provider.distanceKm,
        distanceKind: provider.suburb === "Remote" ? "service_area" : "unknown",
        distanceLabel: label,
      };
    }
    const km = haversineDistanceKm(
      userLat,
      userLng,
      coords.lat,
      coords.lng,
    );
    return {
      ...provider,
      distanceKm: km,
      distanceKind: coords.kind,
      distanceLabel: buildDistanceLabel(km, coords.kind),
    };
  });
}

export function filterProvidersByRadius(
  providers: ProviderWithDistance[],
  userLat: number,
  userLng: number,
  radiusKm: number,
): ProviderWithDistance[] {
  return providers.filter((p) => {
    const coords = resolveProviderCoords(p);
    if (!coords) return p.distanceKind === "service_area";
    return isWithinRadiusKm(userLat, userLng, coords.lat, coords.lng, radiusKm);
  });
}

export function sortProviders(
  providers: ProviderWithDistance[],
  sort: ProviderSearchFilters["sort"],
): ProviderWithDistance[] {
  const mode = sort ?? "relevance";
  return [...providers].sort((a, b) => {
    if (mode === "distance") {
      const da = Number.isFinite(a.distanceKm) ? a.distanceKm : Infinity;
      const db = Number.isFinite(b.distanceKm) ? b.distanceKm : Infinity;
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name);
    }
    if (mode === "rating") return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });
}

/** Server/client shared search over in-memory provider list. */
export function searchProviderList(
  providers: Provider[],
  filters: ProviderSearchFilters,
): ProviderWithDistance[] {
  let list: Provider[] = [...providers];
  const q = filters.query?.trim().toLowerCase();
  const loc = filters.locationText?.trim().toLowerCase();

  if (loc) {
    list = list.filter((p) =>
      `${p.suburb} ${p.state} ${p.postcode}`.toLowerCase().includes(loc),
    );
  }
  if (q) {
    list = list.filter((p) => {
      const hay = [
        p.name,
        p.suburb,
        p.state,
        p.postcode,
        ...p.categories,
        ...p.supports,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  let withDistance: ProviderWithDistance[] = list.map((p) => ({
    ...p,
    distanceKind: "unknown" as ProviderDistanceKind,
    distanceLabel: buildDistanceLabel(null, "unknown"),
  }));

  if (filters.userLat != null && filters.userLng != null) {
    withDistance = enrichProvidersWithDistance(list, filters.userLat, filters.userLng);
    if (filters.radiusKm != null) {
      withDistance = filterProvidersByRadius(
        withDistance,
        filters.userLat,
        filters.userLng,
        filters.radiusKm,
      );
    }
    if (filters.sort === "distance" || filters.radiusKm != null) {
      withDistance = sortProviders(withDistance, "distance");
    } else if (filters.sort) {
      withDistance = sortProviders(withDistance, filters.sort);
    }
  } else if (filters.sort) {
    withDistance = sortProviders(withDistance, filters.sort);
  }

  return withDistance;
}
