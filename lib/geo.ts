/**
 * Browser geolocation and reverse geocoding (Nominatim) for postcode/area.
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

/**
 * Reverse geocode via MapAble API (Mapbox when configured, else Nominatim on server).
 */
export async function reverseGeocodeViaApi(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
  });
  const res = await fetch(`/api/geocoding/reverse?${params.toString()}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Geocoding failed: ${res.status}`);
  }
  const data = (await res.json()) as { result: ReverseGeocodeResult };
  return data.result;
}

/**
 * Reverse geocode lat/lng via Nominatim (OpenStreetMap). Prefer {@link reverseGeocodeViaApi} in the browser.
 * Use sparingly; Nominatim requires 1 req/sec and a descriptive User-Agent.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "MapableAU-ProviderFinder/1.0 (NDIS provider finder)",
    },
  });
  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    address?: {
      postcode?: string;
      suburb?: string;
      village?: string;
      town?: string;
      state_district?: string;
      state?: string;
    };
    display_name?: string;
  };
  const addr = data.address ?? {};
  const postcode = addr.postcode ?? "";
  const suburb =
    addr.suburb ?? addr.village ?? addr.town ?? addr.state_district ?? "";
  const state = addr.state ?? "";
  return {
    postcode,
    suburb,
    state,
    displayName: data.display_name ?? "",
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
  const { postcode, suburb, state } = await reverseGeocodeViaApi(
    position.lat,
    position.lng,
  );
  return { position, postcode, suburb, state };
}
