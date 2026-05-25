import { isMapboxGeocodingEnabled } from "@/lib/geocoding/mapbox-config";
import { mapboxCompositeLocationAdapter } from "@/lib/geocoding/mapbox-location-adapter";
import { localLocationAdapter } from "@/lib/search/local-location-adapter";
import type { AutocompleteSuggestion } from "@/types/search";

/**
 * Location autocomplete: Mapbox Geocoding (AU) when configured, plus local searchable_locations.
 * Forward geocode runs server-side only — never Nominatim for autocomplete.
 */
export interface LocationAutocompleteAdapter {
  search(query: string, limit: number): Promise<AutocompleteSuggestion[]>;
}

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
