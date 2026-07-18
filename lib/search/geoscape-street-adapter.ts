import { suggestAddresses } from "@/lib/geoscape-predictive/address-search-service";
import {
  geoscapePredictiveConfig,
  isGeoscapeStreetSearchAvailable,
} from "@/lib/config/geoscape-predictive";
import type { LocationAutocompleteAdapter } from "@/lib/search/location-autocomplete-adapter";
import type { AutocompleteSuggestion } from "@/types/search";

function mapSuggestItem(
  item: { id: string; address: string; rank?: number },
  index: number,
): AutocompleteSuggestion {
  // Best-effort suburb/state/postcode from trailing "SUBURB STATE POSTCODE".
  const match = item.address.match(
    /,\s*([^,]+?)\s+(ACT|NSW|NT|OT|QLD|SA|TAS|VIC|WA)\s+(\d{4})\s*$/i,
  );
  const looseMatch = !match
    ? item.address.match(
        /\s+([A-Za-z][A-Za-z\s'-]+?)\s+(ACT|NSW|NT|OT|QLD|SA|TAS|VIC|WA)\s+(\d{4})\s*$/i,
      )
    : null;
  const parts = match ?? looseMatch;

  return {
    id: `geoscape-${item.id}-${index}`,
    type: "location",
    typeLabel: "Address",
    label: item.address,
    description: item.address,
    value: item.address,
    metadata: {
      gnafId: item.id,
      suburb: parts?.[1]?.trim(),
      state: parts?.[2]?.toUpperCase(),
      postcode: parts?.[3],
    },
  };
}

/** Geoscape Predictive street-level address autocomplete (booking forms). */
export const geoscapeStreetAdapter: LocationAutocompleteAdapter = {
  async search(query, limit) {
    if (!isGeoscapeStreetSearchAvailable()) {
      return [];
    }

    const q = query.trim();
    if (q.length < geoscapePredictiveConfig.minQueryLength) {
      return [];
    }

    try {
      const { suggest } = await suggestAddresses({ q, limit });
      return suggest.slice(0, limit).map((item, index) => mapSuggestItem(item, index));
    } catch (err) {
      console.error("[predictive-suggestions] Geoscape street search failed", err);
      return [];
    }
  },
};
