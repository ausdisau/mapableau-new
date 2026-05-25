import { NextResponse } from "next/server";

import { queryMapProviders } from "@/lib/ndis-provider-ingest/map-providers";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radiusKm = searchParams.get("radiusKm");
  const state = searchParams.get("state") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const limit = searchParams.get("limit");
  const activeOnly = searchParams.get("activeOnly") === "1";

  try {
    const result = await queryMapProviders({
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
      radiusKm: radiusKm != null ? Number(radiusKm) : undefined,
      state,
      q,
      limit: limit != null ? Number(limit) : 500,
      activeOnly,
    });

    return NextResponse.json({
      success: true,
      date: result.date,
      totalMatched: result.totalMatched,
      providers: result.providers,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to load provider map data";
    const missing = message.includes("ENOENT");
    return NextResponse.json(
      {
        success: false,
        error: message,
        hint: missing
          ? "Run pnpm ingest:ndis-providers to download NDIS provider data."
          : undefined,
      },
      { status: missing ? 503 : 500 },
    );
  }
}
