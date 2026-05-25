import { isMapboxGeocodingEnabled } from "@/lib/geocoding/mapbox-config";
import { mapboxCompositeLocationAdapter } from "@/lib/geocoding/mapbox-location-adapter";
import { prisma } from "@/lib/prisma";
import type { AutocompleteSuggestion } from "@/types/search";

/**
 * Location autocomplete: Mapbox Geocoding (AU) when configured, plus local searchable_locations.
 * Forward geocode runs server-side only — never Nominatim for autocomplete.
 */
export interface LocationAutocompleteAdapter {
  search(query: string, limit: number): Promise<AutocompleteSuggestion[]>;
}

export const localLocationAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    const q = query.trim();
    if (q.length < 2) return [];

    const rows = await prisma.searchableLocation.findMany({
      where: {
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { suburb: { contains: q, mode: "insensitive" } },
          { postcode: { contains: q, mode: "insensitive" } },
          { state: { contains: q, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { displayName: "asc" },
    });

    return rows.map((row) => ({
      id: `location-${row.id}`,
      type: "location" as const,
      typeLabel: "Location",
      label: row.displayName,
      description: [row.suburb, row.state, row.postcode].filter(Boolean).join(", "),
      value: row.displayName,
      metadata: {
        suburb: row.suburb ?? undefined,
        state: row.state ?? undefined,
        postcode: row.postcode ?? undefined,
      },
    }));
  },
};

let activeAdapter: LocationAutocompleteAdapter | null = null;

function resolveAdapter(): LocationAutocompleteAdapter {
  if (activeAdapter) return activeAdapter;
  return isMapboxGeocodingEnabled()
    ? mapboxCompositeLocationAdapter
    : localLocationAdapter;
}

export function setLocationAutocompleteAdapter(adapter: LocationAutocompleteAdapter) {
  activeAdapter = adapter;
}

export function getLocationAutocompleteAdapter(): LocationAutocompleteAdapter {
  return resolveAdapter();
}

export async function searchLocations(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  return resolveAdapter().search(query, limit);
}
