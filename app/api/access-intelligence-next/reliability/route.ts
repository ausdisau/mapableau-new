import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  scanPlaceReliability,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

/**
 * GET ?placeRef=harbour_civic — synthetic reliability scan.
 * Returns bands and cannot_forecast — never fabricated probabilities.
 */
export async function GET(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.reliability
  ) {
    return NextResponse.json(
      { error: "Access reliability engine is disabled" },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const placeRef = url.searchParams.get("placeRef") ?? "harbour_civic";
  const result = scanPlaceReliability(placeRef);

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    ...result,
  });
}
