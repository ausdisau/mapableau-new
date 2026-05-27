import {
  googleReverseGeocode,
  type GeocodeResult,
} from "@/lib/geocoding/google-geocoding-client";
import { isGoogleMapsConfigured } from "@/lib/geocoding/google-config";
import { nominatimReverseGeocode } from "@/lib/geocoding/nominatim-reverse";

export type ReverseGeocodeResult = GeocodeResult;

export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (isGoogleMapsConfigured()) {
    try {
      const google = await googleReverseGeocode(lat, lng);
      if (google) return google;
    } catch (err) {
      console.error("[reverse-geocode] Google failed", err);
    }
  }

  try {
    return await nominatimReverseGeocode(lat, lng);
  } catch (err) {
    console.error("[reverse-geocode] Nominatim failed", err);
    return null;
  }
}
