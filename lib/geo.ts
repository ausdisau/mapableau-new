/**
 * Browser geolocation and reverse geocoding (Nominatim) for postcode/area.
 * Distance helper (haversine) for filtering providers by radius.
 *
 * Server-side reverse geocode via lib/map/nominatim-server.ts is a future option
 * if client Nominatim volume or rate limits become an issue.
 */

export type UserPosition = { lat: number; lng: number };

export type NominatimAddress = {
  postcode?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  locality?: string;
  municipality?: string;
  state_district?: string;
  state?: string;
};

export type ReverseGeocodeResult = {
  postcode: string;
  suburb: string;
  state: string;
  displayName: string;
};

export type UserSuburbResult = {
  position: UserPosition;
  suburb: string;
  state: string;
  postcode: string;
  label: string;
};

const AU_STATE_ABBREVIATIONS: Record<string, string> = {
  "new south wales": "NSW",
  victoria: "VIC",
  queensland: "QLD",
  "south australia": "SA",
  "western australia": "WA",
  tasmania: "TAS",
  "northern territory": "NT",
  "australian capital territory": "ACT",
};

/** Normalize Australian state to abbreviation when possible. */
export function abbreviateAustralianState(state: string): string {
  const trimmed = state.trim();
  if (!trimmed) return "";
  if (/^(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return AU_STATE_ABBREVIATIONS[trimmed.toLowerCase()] ?? trimmed;
}

/** Pick suburb from Nominatim address fields in AU-friendly order. */
export function extractAustralianSuburb(address: NominatimAddress): string {
  return (
    address.suburb ??
    address.city ??
    address.town ??
    address.village ??
    address.locality ??
    address.municipality ??
    address.state_district ??
    ""
  ).trim();
}

/** Format suburb, state, and postcode for display and search. */
export function formatLocationLabel(parts: {
  suburb: string;
  state: string;
  postcode: string;
}): string {
  const suburb = parts.suburb.trim();
  const state = abbreviateAustralianState(parts.state);
  const postcode = parts.postcode.trim();

  if (suburb && state && postcode) {
    return `${suburb} ${state} ${postcode}`;
  }
  if (suburb && state) {
    return `${suburb} ${state}`;
  }
  if (suburb && postcode) {
    return `${suburb} ${postcode}`;
  }
  if (suburb) {
    return suburb;
  }
  if (postcode && state) {
    return `${postcode} ${state}`;
  }
  return postcode || state;
}

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
 * Reverse geocode lat/lng to postcode/suburb/state via Nominatim (OpenStreetMap).
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
      "User-Agent": "MapAbleAU-ProviderFinder/1.0 (NDIS provider finder)",
    },
  });
  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    address?: NominatimAddress;
    display_name?: string;
  };
  const addr = data.address ?? {};
  const postcode = addr.postcode ?? "";
  const suburb = extractAustralianSuburb(addr);
  const state = abbreviateAustralianState(addr.state ?? "");
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

/** Get user position, suburb details, and a formatted location label. */
export async function getUserSuburb(): Promise<UserSuburbResult> {
  const position = await getCurrentPosition();
  const { postcode, suburb, state } = await reverseGeocode(
    position.lat,
    position.lng,
  );
  const label = formatLocationLabel({ suburb, state, postcode });
  return { position, suburb, state, postcode, label };
}

/** Get user position and postcode in one flow. */
export async function getLocationAndPostcode(): Promise<{
  position: UserPosition;
  postcode: string;
  suburb: string;
  state: string;
}> {
  const { position, postcode, suburb, state } = await getUserSuburb();
  return { position, postcode, suburb, state };
}
