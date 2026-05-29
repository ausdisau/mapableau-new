import { localLocationAdapter } from "@/lib/search/local-location-adapter";
import type { AutocompleteSuggestion } from "@/types/search";

/**
 * Location autocomplete: local searchable_locations table.
 * Swap implementation for Mapbox/commercial geocoder later — never Nominatim.
 */
export interface LocationAutocompleteAdapter {
  search(query: string, limit: number): Promise<AutocompleteSuggestion[]>;
}

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
