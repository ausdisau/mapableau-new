import type { ControlledPilot, PilotParticipantEnrolment } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { jsonNdisError } from "@/lib/ndis-gateway/security/http";
import { prisma } from "@/lib/prisma";

/** Organisation IDs the actor may query. Admin may pass an explicit org filter. */
export async function resolvePilotOrganisationFilter(
  user: CurrentUser,
  requestedOrganisationId?: string | null
): Promise<{ organisationIds: string[] } | Response> {
  if (isAdminRole(user.primaryRole)) {
    if (requestedOrganisationId) {
      return { organisationIds: [requestedOrganisationId] };
    }
    return { organisationIds: [] }; // empty = no filter (platform admin)
  }

  const orgIds = await getUserOrganisationIds(user.id);
  if (orgIds.length === 0) {
    return jsonNdisError(
      "Link your account to an organisation to manage pilots.",
      403
    );
  }
  if (requestedOrganisationId) {
    if (!orgIds.includes(requestedOrganisationId)) {
      return jsonNdisError("Organisation access denied", 403);
    }
    return { organisationIds: [requestedOrganisationId] };
  }
  return { organisationIds: orgIds };
}

export async function loadPilotScoped(
  user: CurrentUser,
  pilotId: string
): Promise<ControlledPilot | Response> {
  const pilot = await prisma.controlledPilot.findUnique({
    where: { id: pilotId },
  });
  if (!pilot) return jsonNdisError("Pilot not found", 404);

  if (isAdminRole(user.primaryRole)) return pilot;

  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(pilot.organisationId)) {
    return jsonNdisError("Pilot not found", 404);
  }
  return pilot;
}

/** Safe admin summary — never NDIS numbers, credentials, or restricted findings. */
export function toSafePilotSummary(pilot: ControlledPilot) {
  return {
    id: pilot.id,
    organisationId: pilot.organisationId,
    name: pilot.name,
    code: pilot.code,
    status: pilot.status,
    stage: pilot.stage,
    summary: pilot.summary,
    supportItemAllowlist: pilot.supportItemAllowlist,
    fundingRouteAllowlist: pilot.fundingRouteAllowlist,
    integrationProfileIds: pilot.integrationProfileIds,
    maxTransactionCents: pilot.maxTransactionCents,
    maxDailyExposureCents: pilot.maxDailyExposureCents,
    maxParticipantExposureCents: pilot.maxParticipantExposureCents,
    maxTotalExposureCents: pilot.maxTotalExposureCents,
    maxActiveParticipants: pilot.maxActiveParticipants,
    limitedLiveEnabled: pilot.limitedLiveEnabled,
    assuranceAssessmentId: pilot.assuranceAssessmentId,
    goLiveAssessmentId: pilot.goLiveAssessmentId,
    pauseReason: pilot.pauseReason,
    pausedAt: pilot.pausedAt?.toISOString() ?? null,
    resumeRequiresDecision: pilot.resumeRequiresDecision,
    plannedStartAt: pilot.plannedStartAt?.toISOString() ?? null,
    plannedEndAt: pilot.plannedEndAt?.toISOString() ?? null,
    activatedAt: pilot.activatedAt?.toISOString() ?? null,
    terminatedAt: pilot.terminatedAt?.toISOString() ?? null,
    closedAt: pilot.closedAt?.toISOString() ?? null,
    createdById: pilot.createdById,
    createdAt: pilot.createdAt.toISOString(),
    updatedAt: pilot.updatedAt.toISOString(),
    environmentLabel:
      pilot.stage === "limited_live" || pilot.stage === "controlled_live"
        ? "limited_live"
        : "sandbox",
  };
}

/** Participant-facing fields only. */
export function toParticipantSafePilot(
  pilot: ControlledPilot,
  enrolment: PilotParticipantEnrolment | null
) {
  return {
    id: pilot.id,
    name: pilot.name,
    code: pilot.code,
    status: pilot.status,
    stage: pilot.stage,
    summary: pilot.summary,
    limitedLiveEnabled: pilot.limitedLiveEnabled,
    environmentLabel:
      pilot.stage === "limited_live" || pilot.stage === "controlled_live"
        ? "limited_live"
        : "sandbox",
    plannedStartAt: pilot.plannedStartAt?.toISOString() ?? null,
    plannedEndAt: pilot.plannedEndAt?.toISOString() ?? null,
    enrolment: enrolment
      ? {
          id: enrolment.id,
          status: enrolment.status,
          informationProvidedAt:
            enrolment.informationProvidedAt?.toISOString() ?? null,
          pilotConsentAt: enrolment.pilotConsentAt?.toISOString() ?? null,
          withdrawnAt: enrolment.withdrawnAt?.toISOString() ?? null,
          exitedAt: enrolment.exitedAt?.toISOString() ?? null,
        }
      : null,
  };
}

export function getOptionalIdempotencyKey(req: Request): string | undefined {
  const key = req.headers.get("Idempotency-Key")?.trim();
  return key && key.length > 0 ? key.slice(0, 200) : undefined;
}

export function mapPilotServiceError(error: unknown): Response | null {
  if (!(error instanceof Error)) return null;
  const msg = error.message;

  if (
    msg === "PILOT_NOT_FOUND" ||
    msg.startsWith("PILOT_NOT_FOUND:") ||
    msg.includes("Record to update not found") ||
    msg.includes("No ControlledPilot found") ||
    msg.includes("No PilotParticipantEnrolment found") ||
    msg.includes("No PilotChangeRequest found") ||
    msg.includes("No PilotSafetyTrigger found") ||
    msg.includes("No PilotLimitReservation found")
  ) {
    return jsonNdisError("Not found", 404);
  }

  const forbidden = [
    "INCIDENT_ORG_MISMATCH",
    "COMPLAINT_ORG_MISMATCH",
    "DELEGATE_DENIED",
  ];
  if (forbidden.some((c) => msg === c || msg.startsWith(`${c}:`))) {
    return jsonNdisError("Forbidden", 403);
  }

  return jsonNdisError(msg.replace(/_/g, " ").slice(0, 300), 400);
}
