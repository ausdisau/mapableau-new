import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { grantConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";
import type { ConsentScope } from "@/types/mapable";

const SESSION_TTL_MINUTES = 120;

export async function createLocationSession(params: {
  userId: string;
  purpose: "current_location" | "route_history" | "barrier_report";
  precision?: "coarse" | "precise";
  consentGranted?: boolean;
}) {
  const scopeMap: Record<typeof params.purpose, ConsentScope> = {
    current_location: "go.current_location",
    route_history: "go.route_history",
    barrier_report: "go.barrier_report",
  };

  let consentRecordId: string | undefined;
  if (params.consentGranted !== false) {
    const consent = await grantConsent({
      subjectUserId: params.userId,
      scope: scopeMap[params.purpose],
      purpose: `MapAble Go ${params.purpose.replace("_", " ")} for active navigation session`,
      createdById: params.userId,
    });
    consentRecordId = consent.id;
  }

  const expiresAt = new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);

  const session = await prisma.goLocationSession.create({
    data: {
      userId: params.userId,
      purpose: params.purpose,
      precision: params.precision ?? "coarse",
      consentRecordId,
      expiresAt,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "GO_LOCATION_CONSENT_GRANTED",
    entityType: "GoLocationSession",
    entityId: session.id,
    participantId: params.userId,
    metadata: {
      purpose: params.purpose,
      precision: params.precision ?? "coarse",
    },
  });

  return session;
}

export async function revokeLocationSession(sessionId: string, userId: string) {
  const session = await prisma.goLocationSession.findFirst({
    where: { id: sessionId, userId, revokedAt: null },
  });
  if (!session) return null;

  const updated = await prisma.goLocationSession.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "GO_LOCATION_CONSENT_REVOKED",
    entityType: "GoLocationSession",
    entityId: session.id,
    participantId: userId,
    metadata: { purpose: session.purpose },
  });

  return updated;
}

export async function getActiveLocationSession(
  userId: string,
  purpose: "current_location" | "route_history" | "barrier_report",
) {
  const now = new Date();
  return prisma.goLocationSession.findFirst({
    where: {
      userId,
      purpose,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });
}
