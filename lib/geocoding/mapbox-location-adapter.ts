import { mapboxForwardGeocode } from "@/lib/geocoding/mapbox-geocoding";
import { isMapboxGeocodingEnabled } from "@/lib/geocoding/mapbox-config";
import {
  localLocationAdapter,
  type LocationAutocompleteAdapter,
} from "@/lib/search/location-autocomplete-adapter";
import type { AutocompleteSuggestion } from "@/types/search";

function normalizeKey(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapboxToSuggestion(place: Awaited<ReturnType<typeof mapboxForwardGeocode>>[number]): AutocompleteSuggestion {
  const parts = [place.suburb, place.state, place.postcode].filter(Boolean);
  return {
    id: `mapbox-${place.id}`,
    type: "location",
    typeLabel: "Location",
    label: place.label,
    description: parts.length > 0 ? parts.join(", ") : undefined,
    value: place.label,
    metadata: {
      suburb: place.suburb || undefined,
      state: place.state || undefined,
      postcode: place.postcode || undefined,
      lat: place.lat,
      lng: place.lng,
    },
  };
}

/**
 * Mapbox forward geocode with local DB fallback and deduplication.
 */
export const mapboxCompositeLocationAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    const q = query.trim();
    if (q.length < 2) return [];

    const mapboxLimit = Math.min(limit, 6);
    const localLimit = Math.min(limit, 4);

    const [mapboxPlaces, localRows] = await Promise.all([
      isMapboxGeocodingEnabled()
        ? mapboxForwardGeocode(q, mapboxLimit).catch(() => [])
        : Promise.resolve([]),
      localLocationAdapter.search(q, localLimit),
    ]);

    const seen = new Set<string>();
    const merged: AutocompleteSuggestion[] = [];

    for (const place of mapboxPlaces) {
      const suggestion = mapboxToSuggestion(place);
      const key = normalizeKey(suggestion.label);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(suggestion);
      if (merged.length >= limit) return merged;
    }

    for (const row of localRows) {
      const key = normalizeKey(row.label);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(row);
      if (merged.length >= limit) return merged;
    }

    return merged;
  },
};
