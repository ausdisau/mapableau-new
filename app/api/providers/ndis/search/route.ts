import { NextResponse } from "next/server";

import { searchNdisProviders } from "@/lib/ingestion/ndisProviders";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const postcode = searchParams.get("postcode") ?? undefined;
  const service = searchParams.get("service") ?? undefined;
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw != null ? Number(limitRaw) : undefined;

  try {
    const result = await searchNdisProviders({
      q,
      state,
      postcode,
      service,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

    return NextResponse.json({
      providers: result.providers.map((p) => ({
        source_id: p.source_id,
        provider_name: p.provider_name,
        suburb: p.suburb,
        state: p.state,
        postcode: p.postcode,
        phone: p.phone,
        email: p.email,
        website: p.website,
        services: p.services,
        registration_groups: p.registration_groups,
        updated_at: p.updated_at,
      })),
      count: result.count,
      filters_applied: result.filters_applied,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not search providers" },
      { status: 500 },
    );
  }
}
