import { prisma } from "@/lib/prisma";
import { transportOsmConfig } from "@/lib/transport-osm/config";

import type { LatLng } from "./routing/types";

export async function geocodeAddress(addressLine: string): Promise<LatLng & {
  suburb?: string;
  state?: string;
  postcode?: string;
}> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", addressLine);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "au");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": transportOsmConfig.nominatimUserAgent },
  });
  if (!res.ok) throw new Error("GEOCODE_FAILED");
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    address?: {
      suburb?: string;
      village?: string;
      town?: string;
      state?: string;
      postcode?: string;
    };
  }>;
  const hit = data[0];
  if (!hit) throw new Error("GEOCODE_NOT_FOUND");
  const addr = hit.address;
  return {
    lat: Number(hit.lat),
    lng: Number(hit.lon),
    suburb: addr?.suburb ?? addr?.village ?? addr?.town,
    state: addr?.state,
    postcode: addr?.postcode,
  };
}

export async function createStoredLocation(params: {
  ownerUserId: string;
  addressLine: string;
  label?: "home" | "work" | "saved" | "other";
  suburb?: string;
  state?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
}) {
  let lat = params.lat;
  let lng = params.lng;
  let suburb = params.suburb;
  let state = params.state;
  let postcode = params.postcode;
  let geocodeSource: "nominatim" | "manual" = "manual";

  if (lat == null || lng == null) {
    const geo = await geocodeAddress(params.addressLine);
    lat = geo.lat;
    lng = geo.lng;
    suburb = suburb ?? geo.suburb;
    state = state ?? geo.state;
    postcode = postcode ?? geo.postcode;
    geocodeSource = "nominatim";
  }

  return prisma.storedLocation.create({
    data: {
      ownerUserId: params.ownerUserId,
      label: params.label ?? "saved",
      addressLine: params.addressLine,
      suburb,
      state,
      postcode,
      lat: lat!,
      lng: lng!,
      geocodedAt: new Date(),
      geocodeSource,
    },
  });
}

export async function findLocationsNear(
  lat: number,
  lng: number,
  radiusMeters: number,
  ownerUserId?: string
) {
  const deg = radiusMeters / 111_320;
  return prisma.storedLocation.findMany({
    where: {
      ...(ownerUserId ? { ownerUserId } : {}),
      lat: { gte: lat - deg, lte: lat + deg },
      lng: { gte: lng - deg, lte: lng + deg },
    },
    take: 50,
  });
}

export function coordHash(point: LatLng): string {
  return `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
}
