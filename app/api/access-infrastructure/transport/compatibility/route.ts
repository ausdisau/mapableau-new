import type { NextRequest } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { accessInfrastructureFlags } from "@/lib/access/infrastructure";
import { getPassportForUser } from "@/lib/access/infrastructure/passport-service";
import {
  assessTransportCompatibilityIfEnabled,
} from "@/lib/access/infrastructure/adapters/transport";
import { createAuditEvent } from "@/lib/audit/audit-event-service";

export const dynamic = "force-dynamic";

/**
 * POST transport segment-aware compatibility (flag-gated).
 * Does not book, dispatch, or guarantee vehicle verification.
 */
export async function POST(req: NextRequest) {
  if (
    !accessInfrastructureFlags.enabled ||
    !accessInfrastructureFlags.transportCompatibility
  ) {
    return jsonError("Transport access compatibility is disabled", 404);
  }
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const passport = await getPassportForUser(user.id);
  if (!passport) {
    return jsonError("Access Passport not found — create requirements first", 404);
  }

  const body = await req.json();
  if (!body?.vehicle?.vehicleId) {
    return jsonError("vehicle.vehicleId is required", 400);
  }

  const report = assessTransportCompatibilityIfEnabled({
    passportId: passport.id,
    requirements: passport.requirements,
    vehicle: body.vehicle,
    pickup: body.pickup ?? null,
    destination: body.destination ?? null,
    adjustments: body.adjustments ?? [],
  });

  if (!report) {
    return jsonError("Transport access compatibility is disabled", 404);
  }

  await createAuditEvent({
    actorUserId: user.id,
    action: "TRANSPORT_COMPATIBILITY_PRESENTED",
    entityType: "TransportCompatibility",
    entityId: body.vehicle.vehicleId,
    participantId: user.id,
    metadata: {
      overall: report.overall,
      segments: report.segments.map((s) => ({ segment: s.segment, state: s.state })),
    },
  });

  return jsonOk({
    productionClaim: "none",
    decisionOwner: report.decisionOwner,
    overall: report.overall,
    participantSummary: report.participantSummary,
    segments: report.segments.map((s) => ({
      segment: s.segment,
      state: s.state,
      summary: s.summary,
      findings: s.findings.map((f) => ({
        ontologyConceptId: f.ontologyConceptId,
        result: f.result,
        reasonCode: f.reasonCode,
        explanation: f.explanation,
        requiresConfirmation: f.requiresConfirmation,
      })),
    })),
    limitations: report.limitations,
  });
}
