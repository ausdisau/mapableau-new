import { NextResponse } from "next/server";

import { buildSafeAdContext } from "@/lib/ads/ad-slot-policy";
import { resolveAdSlotContent } from "@/lib/ads/ad-slot-content";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slotId = searchParams.get("slotId");
  const pageContext = searchParams.get("pageContext") ?? "unknown";
  const serviceCategory = searchParams.get("serviceCategory") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const providerCategory = searchParams.get("providerCategory") ?? undefined;

  if (!slotId) {
    return NextResponse.json(
      { error: "slotId is required" },
      { status: 400 },
    );
  }

  const context = buildSafeAdContext({
    pageContext,
    serviceCategory,
    region,
    providerCategory,
  });

  const slot = resolveAdSlotContent(slotId, context);
  return NextResponse.json({ slot, context });
}
