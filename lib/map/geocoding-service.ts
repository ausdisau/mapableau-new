import {
  accessGeoGeocodeAddress,
  isAccessGeocodingAvailable,
} from "@/lib/access-map/access-geocoding-service";

export async function geocodeSuburbPostcode(
  suburb?: string,
  postcode?: string
): Promise<{ lat: number; lng: number } | null> {
  if (!suburb && !postcode) return null;

  if (!isAccessGeocodingAvailable()) return null;

  const query = [suburb, postcode, "Australia"].filter(Boolean).join(", ");
  const resolved = await accessGeoGeocodeAddress(query);
  if (!resolved) return null;

  return { lat: resolved.latitude, lng: resolved.longitude };
}
