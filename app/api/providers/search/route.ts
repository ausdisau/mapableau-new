import { NextResponse } from "next/server";

import { mapOutletsToProviders } from "@/app/provider-finder/outletToProvider";
import { fetchProviderOutlets } from "@/lib/provider-outlets";
import { searchProviderList } from "@/lib/provider-finder/provider-search-service";
import { providerSearchQuerySchema } from "@/lib/validation/provider-search-schemas";

const MAX_SCAN = 8000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = providerSearchQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    radiusKm: searchParams.get("radiusKm") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { q, location, lat, lng, radiusKm, sort, limit } = parsed.data;

  if ((lat != null) !== (lng != null)) {
    return NextResponse.json(
      { error: "lat and lng must be provided together" },
      { status: 400 },
    );
  }

  try {
    const outlets = await fetchProviderOutlets();
    const providers = mapOutletsToProviders(outlets.slice(0, MAX_SCAN));

    const results = searchProviderList(providers, {
      query: q,
      locationText: location,
      userLat: lat,
      userLng: lng,
      radiusKm: lat != null && lng != null ? radiusKm ?? 25 : undefined,
      sort: lat != null && lng != null ? sort ?? "distance" : sort,
    }).slice(0, limit);

    return NextResponse.json({
      providers: results.map((p) => ({
        id: p.id,
        name: p.name,
        suburb: p.suburb,
        state: p.state,
        postcode: p.postcode,
        distanceKm: p.distanceKm,
        distanceLabel: p.distanceLabel,
        distanceKind: p.distanceKind,
        latitude: p.latitude,
        longitude: p.longitude,
      })),
      count: results.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
