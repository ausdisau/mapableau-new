import { compositeLocationAdapter } from "@/lib/search/composite-location-adapter";
import { geoscapeStreetAdapter } from "@/lib/search/geoscape-street-adapter";
import {
  isBookingAddressContext,
  type AutocompleteContext,
  type AutocompleteSuggestion,
} from "@/types/search";

/**
 * Location autocomplete: local searchable_locations + optional Australia Post suburbs
 * (homepage / provider finder), or Geoscape street search (booking contexts).
 */
export interface LocationAutocompleteAdapter {
  search(query: string, limit: number): Promise<AutocompleteSuggestion[]>;
}

let activeAdapter: LocationAutocompleteAdapter = compositeLocationAdapter;
let activeStreetAdapter: LocationAutocompleteAdapter = geoscapeStreetAdapter;

export function setLocationAutocompleteAdapter(adapter: LocationAutocompleteAdapter) {
  activeAdapter = adapter;
}

export function getLocationAutocompleteAdapter(): LocationAutocompleteAdapter {
  return activeAdapter;
}

export function setStreetAddressAutocompleteAdapter(
  adapter: LocationAutocompleteAdapter,
) {
  activeStreetAdapter = adapter;
}

export function getStreetAddressAutocompleteAdapter(): LocationAutocompleteAdapter {
  return activeStreetAdapter;
}

export async function searchLocations(
  query: string,
  limit: number,
  context?: AutocompleteContext,
): Promise<AutocompleteSuggestion[]> {
  if (context && isBookingAddressContext(context)) {
    return activeStreetAdapter.search(query, limit);
  }
  return activeAdapter.search(query, limit);
}

export async function searchStreetAddresses(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  return activeStreetAdapter.search(query, limit);
}
