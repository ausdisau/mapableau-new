import type { Provider as DbProvider, ServiceLocation } from "@prisma/client";

import type { Provider } from "@/app/provider-finder/providers";

type DbProviderWithLocations = DbProvider & {
  locations: ServiceLocation[];
};

const AU_STATES = new Set([
  "NSW",
  "VIC",
  "QLD",
  "SA",
  "WA",
  "TAS",
  "ACT",
  "NT",
]);

function normalizeState(raw: string | null | undefined): Provider["state"] {
  const s = (raw ?? "").trim().toUpperCase();
  if (AU_STATES.has(s)) return s as Provider["state"];
  return "NSW";
}

export function mapDbProviderToFinder(p: DbProviderWithLocations): Provider {
  const loc = p.locations[0];
  const suburb = loc?.city?.trim() || "—";
  const state = normalizeState(loc?.state);
  const postcode = loc?.postcode?.trim() || "";

  return {
    id: p.id,
    slug: p.slug ?? p.id,
    outletKey: p.outletKey ?? undefined,
    name: p.name,
    suburb,
    state,
    postcode,
    distanceKm: 0,
    rating: p.rating ?? 0,
    reviewCount: p.reviewCount ?? 0,
    registered: p.ndisRegistered,
    categories:
      p.specialisations.length > 0 ? p.specialisations : p.serviceAreas,
    supports: ["In-person"],
    latitude: loc?.latitude ?? undefined,
    longitude: loc?.longitude ?? undefined,
    phone: p.phone ?? undefined,
    email: p.email ?? undefined,
    website: p.website ?? undefined,
    abn: p.abn ?? undefined,
  };
}
