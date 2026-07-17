import { prisma } from "@/lib/prisma";

const MAX_BREAK_GLASS_HOURS = 8;
const MIN_REASON_LENGTH = 20;

export interface CreateBreakGlassInput {
  actorUserId: string;
  targetOrganisationId: string;
  reason: string;
  ticketRef?: string | null;
  expiresInMinutes: number;
}

export class BreakGlassPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BreakGlassPolicyError";
  }
}

export async function requestBreakGlass(input: CreateBreakGlassInput) {
  const reason = input.reason?.trim() ?? "";
  if (reason.length < MIN_REASON_LENGTH) {
    throw new BreakGlassPolicyError(
      `BREAK_GLASS_REASON_TOO_SHORT (min ${MIN_REASON_LENGTH} chars)`
    );
  }
  if (
    !Number.isFinite(input.expiresInMinutes) ||
    input.expiresInMinutes <= 0 ||
    input.expiresInMinutes > MAX_BREAK_GLASS_HOURS * 60
  ) {
    throw new BreakGlassPolicyError(
      `BREAK_GLASS_EXPIRY_OUT_OF_RANGE (must be 1..${MAX_BREAK_GLASS_HOURS * 60} minutes)`
    );
  }
  const expiresAt = new Date(Date.now() + input.expiresInMinutes * 60 * 1000);

  const org = await prisma.organisation.findUnique({
    where: { id: input.targetOrganisationId },
    select: { id: true },
  });
  if (!org) {
    throw new BreakGlassPolicyError("BREAK_GLASS_TARGET_ORG_NOT_FOUND");
  }

  const session = await prisma.breakGlassSession.create({
    data: {
      actorUserId: input.actorUserId,
      targetOrganisationId: input.targetOrganisationId,
      reason,
      ticketRef: input.ticketRef ?? null,
      status: "requested",
      expiresAt,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: "break_glass.requested",
      entityType: "BreakGlassSession",
      entityId: session.id,
      organisationId: input.targetOrganisationId,
      metadata: {
        expiresAt: expiresAt.toISOString(),
        ticketRef: input.ticketRef ?? null,
      },
    },
  });

  return session;
}

export async function approveBreakGlass(input: {
  sessionId: string;
  approverUserId: string;
}) {
  const session = await prisma.breakGlassSession.findUnique({
    where: { id: input.sessionId },
  });
  if (!session) throw new BreakGlassPolicyError("BREAK_GLASS_NOT_FOUND");
  if (session.actorUserId === input.approverUserId) {
    throw new BreakGlassPolicyError("BREAK_GLASS_SELF_APPROVAL_DENIED");
  }
  if (session.status !== "requested") {
    throw new BreakGlassPolicyError(
      `BREAK_GLASS_INVALID_STATE:${session.status}`
    );
  }

  const updated = await prisma.breakGlassSession.update({
    where: { id: session.id },
    data: {
      status: "active",
      approverUserId: input.approverUserId,
      approvedAt: new Date(),
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: input.approverUserId,
      action: "break_glass.approved",
      entityType: "BreakGlassSession",
      entityId: session.id,
      organisationId: session.targetOrganisationId,
    },
  });

  return updated;
}

export async function revokeBreakGlass(input: {
  sessionId: string;
  actorUserId: string;
  reason: string;
}) {
  const updated = await prisma.breakGlassSession.update({
    where: { id: input.sessionId },
    data: {
      status: "revoked",
      revokedAt: new Date(),
      revokedReason: input.reason,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: "break_glass.revoked",
      entityType: "BreakGlassSession",
      entityId: input.sessionId,
      organisationId: updated.targetOrganisationId,
      metadata: { reason: input.reason },
    },
  });

  return updated;
}

export async function isBreakGlassActive(sessionId: string): Promise<boolean> {
  const s = await prisma.breakGlassSession.findUnique({
    where: { id: sessionId },
    select: { status: true, expiresAt: true },
  });
  if (!s) return false;
  if (s.status !== "active") return false;
  return s.expiresAt.getTime() > Date.now();
}
