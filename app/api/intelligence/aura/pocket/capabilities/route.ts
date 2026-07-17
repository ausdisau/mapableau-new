import { NextResponse } from "next/server";

import { auraFlags } from "@/lib/aura/feature-flags";
import { detectPocketCapabilities } from "@/lib/aura/pocket/capabilities";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!auraFlags.enabled && process.env.MAPABLE_AURA_DEMO !== "true") {
    return NextResponse.json({ error: "MAPABLE_AURA_DISABLED" }, { status: 403 });
  }
  const url = new URL(req.url);
  const platform = (url.searchParams.get("platform") ?? "browser") as
    | "android"
    | "ios"
    | "browser"
    | "simulator";
  const capabilities = detectPocketCapabilities({ platform });
  return NextResponse.json({ capabilities, checkedAt: new Date().toISOString() });
}
