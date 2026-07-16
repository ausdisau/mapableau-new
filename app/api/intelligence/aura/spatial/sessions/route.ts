import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { selectSpatialAdapter } from "@/lib/aura/spatial";

export const runtime = "nodejs";

export async function POST() {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const adapter = selectSpatialAdapter();
  const session = await adapter.startCapture({
    purpose: "route_connectivity",
  });
  return NextResponse.json({ session, adapterId: adapter.adapterId });
}
