import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  buildCommunicationHandoffCard,
  COMMUNICATION_AUDIT_ACTIONS,
  projectCommunicationPassport,
} from "@/lib/communications-os";
import {
  isCommunicationPassportEnabled,
  isCommunicationsEnabled,
} from "@/lib/config/connected-capability-flags";
import {
  TAYLOR_FIXTURE_ID,
  taylorAccessibilityProfile,
} from "@/lib/connected-capability/taylor-fixture";
import { prisma } from "@/lib/prisma";

/**
 * GET Communication Passport projection.
 * Flags default off. Supports ?fixture=taylor for synthetic demo only.
 * No external messaging.
 */
export async function GET(req: Request) {
  if (!isCommunicationsEnabled() || !isCommunicationPassportEnabled()) {
    return jsonError("MapAble Communication is not enabled", 503);
  }

  const url = new URL(req.url);
  const fixture = url.searchParams.get("fixture");

  if (fixture === "taylor") {
    const passport = projectCommunicationPassport(taylorAccessibilityProfile, {
      participantId: TAYLOR_FIXTURE_ID,
      isSynthetic: true,
    });
    const handoffCard = buildCommunicationHandoffCard(passport, {
      participantLabel: "Taylor (synthetic)",
    });
    return jsonOk({
      passport,
      handoffCard,
      productionClaimState: "synthetic",
    });
  }

  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  const passport = projectCommunicationPassport(profile, {
    participantId: user.id,
  });
  const handoffCard = buildCommunicationHandoffCard(passport, {
    participantLabel: user.name ?? "Participant",
  });

  await createAuditEvent({
    actorUserId: user.id,
    actorRole: user.primaryRole as never,
    action: COMMUNICATION_AUDIT_ACTIONS.passportViewed,
    entityType: "CommunicationPassportProjection",
    entityId: passport.id,
    participantId: user.id,
    metadata: {
      evidenceClass: passport.evidenceClass,
      sourceVersion: passport.sourceVersion,
    },
  });

  return jsonOk({
    passport,
    handoffCard,
    productionClaimState: "internal_alpha",
  });
}
