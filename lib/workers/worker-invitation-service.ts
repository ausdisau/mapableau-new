import { createHash, randomBytes } from "crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureProviderOrganisation } from "@/lib/providers/ensure-provider-organisation";
import { prisma } from "@/lib/prisma";
import { affiliateWorkerToOrganisation } from "@/lib/workers/worker-profile-service";

const INVITE_TTL_DAYS = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInviteToken() {
  return randomBytes(32).toString("base64url");
}

export async function createWorkerProviderInvitation(params: {
  providerId: string;
  email: string;
  invitedByUserId: string;
  displayName?: string;
}) {
  const organisationId = await ensureProviderOrganisation(params.providerId);
  if (!organisationId) {
    throw new Error("Provider organisation not found");
  }

  const email = params.email.trim().toLowerCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const token = generateInviteToken();
  const tokenHash = hashToken(token);

  const invitation = await prisma.workerProviderInvitation.create({
    data: {
      providerId: params.providerId,
      organisationId,
      email,
      invitedByUserId: params.invitedByUserId,
      tokenHash,
      expiresAt,
      status: "pending",
    },
    include: {
      provider: { select: { id: true, name: true } },
    },
  });

  await createAuditEvent({
    actorUserId: params.invitedByUserId,
    action: "worker.invitation_created",
    entityType: "WorkerProviderInvitation",
    entityId: invitation.id,
    organisationId,
    metadata: { email },
  });

  return { invitation, token, invitePath: `/worker/invites/${token}` };
}

export async function getInvitationByToken(token: string) {
  const tokenHash = hashToken(token);
  const invitation = await prisma.workerProviderInvitation.findUnique({
    where: { tokenHash },
    include: {
      provider: { select: { id: true, name: true } },
      organisation: { select: { id: true, name: true } },
    },
  });
  if (!invitation) return null;

  if (
    invitation.status === "pending" &&
    invitation.expiresAt < new Date()
  ) {
    await prisma.workerProviderInvitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    return { ...invitation, status: "expired" as const };
  }

  return invitation;
}

export async function acceptWorkerInvitation(params: {
  token: string;
  userId: string;
  displayName: string;
}) {
  const invitation = await getInvitationByToken(params.token);
  if (!invitation || invitation.status !== "pending") {
    return { error: "Invitation is not valid" as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, name: true },
  });
  if (!user?.email || user.email.toLowerCase() !== invitation.email) {
    return {
      error: "Sign in with the email address that received this invitation",
    } as const;
  }

  const profile = await affiliateWorkerToOrganisation({
    userId: params.userId,
    organisationId: invitation.organisationId,
    displayName: params.displayName.trim() || user.name,
    createdById: invitation.invitedByUserId,
    affiliationStatus: "active",
    invitedByUserId: invitation.invitedByUserId,
  });

  const now = new Date();
  await prisma.workerProviderInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "accepted",
      acceptedAt: now,
      workerProfileId: profile.id,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "worker.invitation_accepted",
    entityType: "WorkerProviderInvitation",
    entityId: invitation.id,
    organisationId: invitation.organisationId,
  });

  return { profile, providerId: invitation.providerId };
}

export async function declineWorkerInvitation(token: string) {
  const invitation = await getInvitationByToken(token);
  if (!invitation || invitation.status !== "pending") {
    return { error: "Invitation is not valid" as const };
  }

  await prisma.workerProviderInvitation.update({
    where: { id: invitation.id },
    data: { status: "declined", declinedAt: new Date() },
  });

  return { ok: true as const };
}
