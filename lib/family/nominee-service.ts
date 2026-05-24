import type { NomineePermissionScope } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import { getActiveNomineeLink } from "./family-permission-policy";

export async function getNomineeProfile(userId: string) {
  return prisma.nomineeProfile.findUnique({ where: { userId } });
}

export async function listLinkedParticipantsForNominee(nomineeId: string) {
  const links = await prisma.participantNomineeLink.findMany({
    where: { nomineeId, status: "active" },
    include: { permissions: { where: { revokedAt: null } } },
  });

  return Promise.all(
    links.map(async (link) => {
      const profile = await prisma.participantProfile.findUnique({
        where: { userId: link.participantId },
        select: { displayName: true, preferredName: true },
      });
      return {
        linkId: link.id,
        participantId: link.participantId,
        displayName:
          profile?.preferredName ?? profile?.displayName ?? "Participant",
        permissions: link.permissions.map((p) => p.scope),
        acceptedAt: link.acceptedAt,
      };
    })
  );
}

export async function getParticipantForNominee(params: {
  nomineeId: string;
  participantId: string;
}) {
  const link = await getActiveNomineeLink(
    params.nomineeId,
    params.participantId
  );
  if (!link || link.status !== "active") throw new Error("NO_LINK");

  const scopes = link.permissions.map((p) => p.scope);
  const hasDashboard = scopes.includes("view_dashboard");

  const data: Record<string, unknown> = {
    linkId: link.id,
    permissions: scopes,
  };

  if (hasDashboard) {
    const profile = await prisma.participantProfile.findUnique({
      where: { userId: params.participantId },
    });
    data.profile = profile;
  }

  if (scopes.includes("view_bookings")) {
    data.upcomingBookings = await prisma.booking.findMany({
      where: {
        participantId: params.participantId,
        requestedStart: { gte: new Date() },
      },
      take: 5,
      orderBy: { requestedStart: "asc" },
    });
  }

  if (scopes.includes("view_documents")) {
    data.documents = await prisma.document.findMany({
      where: { participantId: params.participantId },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        visibility: true,
      },
    });
  } else {
    data.documentsHidden = true;
    data.documentsMessage =
      "Documents are hidden. The participant has not granted document access.";
  }

  if (scopes.includes("view_emergency_profile")) {
    const accessibility = await prisma.accessibilityProfile.findUnique({
      where: { userId: params.participantId },
      select: {
        mobilityNeeds: true,
        communicationPreferences: true,
        transportRequirements: true,
      },
    });
    data.emergencyProfile = accessibility;
  }

  return data;
}

export async function updateNomineePermissions(params: {
  linkId: string;
  participantId: string;
  scopes: NomineePermissionScope[];
}) {
  const link = await prisma.participantNomineeLink.findUnique({
    where: { id: params.linkId },
  });
  if (!link || link.participantId !== params.participantId) {
    throw new Error("FORBIDDEN");
  }

  await prisma.nomineePermission.updateMany({
    where: { linkId: params.linkId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  for (const scope of params.scopes) {
    await prisma.nomineePermission.upsert({
      where: { linkId_scope: { linkId: params.linkId, scope } },
      create: { linkId: params.linkId, scope },
      update: { revokedAt: null, grantedAt: new Date() },
    });
  }

  await createAuditEvent({
    actorUserId: params.participantId,
    action: "family.permissions_updated",
    entityType: "ParticipantNomineeLink",
    entityId: params.linkId,
    participantId: params.participantId,
    metadata: { scopes: params.scopes },
  });

  return prisma.participantNomineeLink.findUnique({
    where: { id: params.linkId },
    include: { permissions: { where: { revokedAt: null } } },
  });
}

export async function approveInvoiceAsNominee(params: {
  nomineeId: string;
  participantId: string;
  invoiceId: string;
  linkId: string;
}) {
  const link = await getActiveNomineeLink(
    params.nomineeId,
    params.participantId
  );
  if (!link) throw new Error("NO_LINK");

  const canApprove = link.permissions.some(
    (p) => p.scope === "approve_invoice" && !p.revokedAt
  );
  if (!canApprove) throw new Error("SCOPE_MISSING");

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
  });
  if (!invoice || invoice.participantId !== params.participantId) {
    throw new Error("NOT_FOUND");
  }

  await prisma.nomineeActionLog.create({
    data: {
      linkId: params.linkId,
      nomineeId: params.nomineeId,
      participantId: params.participantId,
      actionType: "approve_invoice",
      entityType: "Invoice",
      entityId: params.invoiceId,
      details: { note: "Nominee approved invoice for participant review" },
    },
  });

  await createAuditEvent({
    actorUserId: params.nomineeId,
    action: "family.invoice_approved",
    entityType: "Invoice",
    entityId: params.invoiceId,
    participantId: params.participantId,
  });

  return { approved: true, requiresParticipantConfirmation: true };
}

export async function listNomineeLinksForParticipant(participantId: string) {
  return prisma.participantNomineeLink.findMany({
    where: { participantId },
    include: {
      permissions: { where: { revokedAt: null } },
    },
  });
}
