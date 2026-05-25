import { prisma } from "@/lib/prisma";
import type { AutocompleteSuggestion } from "@/types/search";


/**
 * Local MVP: searchable_locations table only.
 * Swap implementation for Photon/Pelias/commercial geocoder later — never Nominatim.
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

let activeAdapter: LocationAutocompleteAdapter = localLocationAdapter;

export function setLocationAutocompleteAdapter(adapter: LocationAutocompleteAdapter) {
  activeAdapter = adapter;
}

export function getLocationAutocompleteAdapter(): LocationAutocompleteAdapter {
  return activeAdapter;
}

export async function searchLocations(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  return activeAdapter.search(query, limit);
}
