import { fetchGooglePlaceAutocomplete } from "@/lib/geocoding/google-places-client";
import { isGoogleMapsConfigured } from "@/lib/geocoding/google-config";
import type { LocationAutocompleteAdapter } from "@/lib/search/location-autocomplete-adapter";

export const googleLocationAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    if (!isGoogleMapsConfigured()) return [];
    try {
      return await fetchGooglePlaceAutocomplete(query, limit);
    } catch (err) {
      console.error("[google-location-adapter] search failed", err);
      return [];
    }
  },
};
