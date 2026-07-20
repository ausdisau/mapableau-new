import { NextResponse } from "next/server";
import { z } from "zod";

import { accessAddressIntelligenceFlags } from "@/lib/spatial/flags";
import {
  evaluateServiceAreaContainment,
  explainServiceAreaForFinder,
  listSyntheticProviderServiceAreas,
} from "@/lib/spatial/service-areas";

const querySchema = z.object({
  postcode: z.string().trim().regex(/^\d{4}$/).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  organisationId: z.string().trim().min(1).max(120).optional(),
});

/**
 * List / evaluate governed provider service areas (synthetic pilot).
 * Coverage is never ranked by payment or advertising status.
 */
export async function GET(request: Request) {
  if (!accessAddressIntelligenceFlags.providerServiceAreasEnabled) {
    return NextResponse.json(
      {
        error: "Provider service areas are disabled.",
        code: "SERVICE_AREAS_DISABLED",
      },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    postcode: searchParams.get("postcode") ?? undefined,
    lat: searchParams.get("lat") ?? undefined,
    lng: searchParams.get("lng") ?? undefined,
    organisationId: searchParams.get("organisationId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let areas = listSyntheticProviderServiceAreas();
  if (parsed.data.organisationId) {
    areas = areas.filter((a) => a.organisationId === parsed.data.organisationId);
  }

  const evaluations = areas.map((area) => {
    const containment = evaluateServiceAreaContainment(area, {
      postcode: parsed.data.postcode,
      latitude: parsed.data.lat,
      longitude: parsed.data.lng,
    });
    return {
      area: {
        serviceAreaId: area.serviceAreaId,
        organisationId: area.organisationId,
        organisationLabel: area.organisationLabel,
        serviceCategory: area.serviceCategory,
        geometrySource: area.geometrySource,
        boundaryReferences: area.boundaryReferences,
        status: area.status,
        availability: area.availability,
        travelFeesMayApply: area.travelFeesMayApply,
        radiusKm: area.radiusKm,
        outletLatitude: area.outletLatitude,
        outletLongitude: area.outletLongitude,
      },
      containment,
      finderExplanation: explainServiceAreaForFinder(containment),
    };
  });

  return NextResponse.json({
    areas: evaluations,
    mapEnabled: accessAddressIntelligenceFlags.serviceAreaMapEnabled,
    listAlternative: evaluations.map((e) => ({
      id: e.area.serviceAreaId,
      label: `${e.area.organisationLabel} — ${e.area.serviceCategory}`,
      status: e.area.status,
      availability: e.area.availability,
      covered: e.containment.covered,
      explanation: e.finderExplanation,
    })),
    productionClaim: "none",
    rankingPolicy:
      "Payment and advertising status must not improve compatibility ranking.",
  });
}

export async function POST(_request: Request) {
  if (!accessAddressIntelligenceFlags.providerServiceAreasEnabled) {
    return NextResponse.json(
      {
        error: "Provider service areas are disabled.",
        code: "SERVICE_AREAS_DISABLED",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      error:
        "Persisted provider service-area writes are not enabled in this wave. Use GET for synthetic evaluation.",
      code: "SERVICE_AREA_WRITE_DISABLED",
    },
    { status: 501 },
  );
}
