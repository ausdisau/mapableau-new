import { NextResponse } from "next/server";

import { accessAddressIntelligenceFlags } from "@/lib/spatial/flags";
import { listSyntheticProviderServiceAreas } from "@/lib/spatial/service-areas";

type RouteContext = { params: Promise<{ providerId: string }> };

/** Provider-scoped service areas (synthetic pilot). */
export async function GET(_request: Request, context: RouteContext) {
  if (!accessAddressIntelligenceFlags.providerServiceAreasEnabled) {
    return NextResponse.json(
      {
        error: "Provider service areas are disabled.",
        code: "SERVICE_AREAS_DISABLED",
      },
      { status: 404 },
    );
  }

  const { providerId } = await context.params;
  const areas = listSyntheticProviderServiceAreas().filter(
    (a) => a.organisationId === providerId,
  );

  return NextResponse.json({
    providerId,
    areas,
    productionClaim: "none",
    limitations: [
      "Geographic coverage is not live availability or capacity.",
      "Hard requirements still need checking.",
      "No paid ranking.",
    ],
  });
}
