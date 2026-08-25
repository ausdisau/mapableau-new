import {
  accessInfrastructureFlags,
  listPlaceCapabilities,
} from "@/lib/access/infrastructure";
import { jsonError, jsonOk } from "@/lib/api/response";
import { getPlaceById } from "@/lib/access/map/access-place-service";

export const dynamic = "force-dynamic";

/**
 * GET place access capabilities + observation provenance.
 * Public place capabilities are environmental — Never include Access Passport data.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ placeId: string }> },
) {
  if (!accessInfrastructureFlags.capabilities) {
    return jsonError("Access capabilities are disabled", 404);
  }

  const { placeId } = await context.params;
  const place = await getPlaceById(placeId, true);
  if (!place) {
    return jsonError("Place not found", 404);
  }

  const bundle = await listPlaceCapabilities(placeId);

  return jsonOk({
    framework: "access_as_infrastructure",
    productionClaim: "none",
    placeId: bundle.placeId,
    placeName: place.name,
    capabilities: bundle.capabilities.map((c) => ({
      schemaVersion: "1.0" as const,
      id: c.id,
      entityType: c.entityType,
      entityId: c.entityId,
      placeId: c.placeId ?? null,
      ontologyConceptId: c.ontologyConceptId,
      attribute: c.attribute,
      value: c.value,
      unit: c.unit ?? null,
      evidenceObservationId: c.evidenceObservationId,
      status: c.status,
    })),
    observations: bundle.observations.map((o) => ({
      schemaVersion: "1.0" as const,
      id: o.id,
      featureKey: o.featureKey,
      ontologyConceptId: o.ontologyConceptId,
      value: o.value,
      unit: o.unit ?? null,
      sourceType: o.sourceType,
      observedAt: o.observedAt,
      evidenceKinds: o.evidenceKinds,
      verificationStatus: o.verificationStatus,
      confidence: o.confidence ?? null,
      reviewDue: o.reviewDue ?? null,
      disputed: o.disputed,
    })),
    adjustments: bundle.adjustments.map((a) => ({
      schemaVersion: "1.0" as const,
      id: a.id,
      entityType: a.entityType,
      entityId: a.entityId,
      ontologyConceptId: a.ontologyConceptId ?? null,
      summary: a.summary,
      description: a.description ?? null,
      status: a.status,
    })),
  });
}
