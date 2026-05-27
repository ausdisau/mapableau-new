import { googleLocationAdapter } from "@/lib/search/google-location-adapter";
import { localLocationAdapter } from "@/lib/search/local-location-adapter";
import type { LocationAutocompleteAdapter } from "@/lib/search/location-autocomplete-adapter";
import { isGoogleMapsConfigured } from "@/lib/geocoding/google-config";
import type { AutocompleteSuggestion } from "@/types/search";

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function mergeLocationSuggestions(
  local: AutocompleteSuggestion[],
  google: AutocompleteSuggestion[],
  limit: number,
): AutocompleteSuggestion[] {
  const seen = new Set<string>();
  const merged: AutocompleteSuggestion[] = [];

  for (const item of [...local, ...google]) {
    const key = normalizeLabel(item.label);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
}

/** Local DB first; fill remaining slots from Google Places when enabled. */
export const compositeLocationAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    const local = await localLocationAdapter.search(query, limit);

    if (!isGoogleMapsConfigured() || local.length >= limit) {
      return local.slice(0, limit);
    }

    const remaining = limit - local.length;
    const google = await googleLocationAdapter.search(query, remaining);
    return mergeLocationSuggestions(local, google, limit);
  },
};
