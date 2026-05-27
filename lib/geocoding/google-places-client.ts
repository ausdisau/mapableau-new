import { getGoogleMapsApiKey, getGoogleMapsRegion } from "@/lib/geocoding/google-config";
import type { AutocompleteSuggestion } from "@/types/search";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

type PlacePrediction = {
  placeId?: string;
  text?: { text?: string };
  structuredFormat?: {
    mainText?: { text?: string };
    secondaryText?: { text?: string };
  };
};

type AutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: PlacePrediction;
    queryPrediction?: { text?: { text?: string } };
  }>;
};

function mapPlacePrediction(prediction: PlacePrediction): AutocompleteSuggestion | null {
  const label =
    prediction.text?.text?.trim() ||
    prediction.structuredFormat?.mainText?.text?.trim();
  if (!label) return null;

  const secondary = prediction.structuredFormat?.secondaryText?.text?.trim();
  const placeId = prediction.placeId;

  return {
    id: placeId ? `google-place-${placeId}` : `google-place-${label}`,
    type: "location",
    typeLabel: "Location",
    label,
    description: secondary || undefined,
    value: label,
    metadata: {
      placeId,
    },
  };
}

/** Places Autocomplete (New) — Australia-restricted, server-side only. */
export async function fetchGooglePlaceAutocomplete(
  query: string,
  limit: number,
): Promise<AutocompleteSuggestion[]> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return [];

  const input = query.trim();
  if (input.length < 2) return [];

  const region = getGoogleMapsRegion();

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: [region],
      regionCode: region,
      languageCode: "en-AU",
      includeQueryPredictions: false,
    }),
  });

  if (!res.ok) {
    console.error("[google-places] autocomplete failed", res.status);
    return [];
  }

  const data = (await res.json()) as AutocompleteResponse;
  const results: AutocompleteSuggestion[] = [];

  for (const suggestion of data.suggestions ?? []) {
    if (results.length >= limit) break;
    const pred = suggestion.placePrediction;
    if (!pred) continue;
    const mapped = mapPlacePrediction(pred);
    if (mapped) results.push(mapped);
  }

  return results;
}
