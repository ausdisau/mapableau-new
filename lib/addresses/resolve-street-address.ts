import type { GeoscapeResolvedAddress } from "@/types/geoscape-predictive";
import type { AutocompleteSuggestion } from "@/types/search";

export type ResolvedStreetAddress = {
  formattedAddress: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  gnafId?: string;
  /** Predictive suggestion id used for resolve (when available). */
  suggestionId?: string;
};

/**
 * Resolve a Geoscape suggestion to a structured address.
 * Falls back to suggestion label/metadata when resolve is unavailable.
 * Does not log address text.
 */
export async function resolveStreetAddressSuggestion(
  suggestion: AutocompleteSuggestion,
): Promise<ResolvedStreetAddress> {
  const suggestionId = suggestion.metadata?.gnafId;
  const fallback: ResolvedStreetAddress = {
    formattedAddress: suggestion.value || suggestion.label,
    suburb: suggestion.metadata?.suburb,
    state: suggestion.metadata?.state,
    postcode: suggestion.metadata?.postcode,
    lat: suggestion.metadata?.lat,
    lng: suggestion.metadata?.lng,
    gnafId: suggestion.metadata?.gnafId,
    suggestionId,
  };

  if (!suggestionId) {
    return fallback;
  }

  try {
    const res = await fetch(
      `/api/addresses/resolve?id=${encodeURIComponent(suggestionId)}`,
    );
    if (!res.ok) {
      return fallback;
    }
    const data = (await res.json()) as { address?: GeoscapeResolvedAddress };
    if (!data.address?.formattedAddress) {
      return fallback;
    }
    return {
      formattedAddress: data.address.formattedAddress,
      suburb: data.address.suburb ?? fallback.suburb,
      state: data.address.state ?? fallback.state,
      postcode: data.address.postcode ?? fallback.postcode,
      lat: data.address.lat ?? fallback.lat,
      lng: data.address.lng ?? fallback.lng,
      gnafId: data.address.gnafId ?? fallback.gnafId,
      suggestionId,
    };
  } catch {
    return fallback;
  }
}
