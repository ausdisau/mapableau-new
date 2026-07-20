/**
 * Browser geolocation and reverse geocoding for postcode/area.
 * Reverse geocode runs via same-origin API (Nominatim blocks browser CORS).
 * Distance helper (haversine) for filtering providers by radius.
 */

export type UserPosition = { lat: number; lng: number };

export type ReverseGeocodeResult = {
  postcode: string;
  suburb: string;
  state: string;
  displayName: string;
};

/** Get current position from browser. */
export function getCurrentPosition(): Promise<UserPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.message || "Could not get location")),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

/** Reverse geocode lat/lng via MapAble API (server-side Nominatim proxy). */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });

  let res: Response;
  try {
    res = await fetch(`/api/geo/reverse?${params.toString()}`);
  } catch {
    throw new Error("Could not look up your area. Check your connection and try again.");
  }

  const data = (await res.json()) as ReverseGeocodeResult & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? `Geocoding failed: ${res.status}`);
  }

  return {
    postcode: data.postcode ?? "",
    suburb: data.suburb ?? "",
    state: data.state ?? "",
    displayName: data.displayName ?? "",
  };
}

/** Haversine distance in km between two points. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Get user position and postcode in one flow. */
export async function getLocationAndPostcode(): Promise<{
  position: UserPosition;
  postcode: string;
  suburb: string;
  state: string;
}> {
  const position = await getCurrentPosition();
  const { postcode, suburb, state } = await reverseGeocode(
    position.lat,
    position.lng,
  );
  return { position, postcode, suburb, state };
}
