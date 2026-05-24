import type { HomeModificationDocumentVisibility } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  checkCoordinatorParticipantAccess,
  checkParticipantSelfAccess,
  checkPlanManagerParticipantAccess,
} from "@/lib/access/consent-aware-access";
import { createNotificationEvent } from "@/lib/access/notification-event-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export const FUNDING_DISCLAIMER =
  "Funding notes are guidance only. MapAble does not guarantee NDIS funding approval.";

export async function createHomeModificationRequest(params: {
  participantId: string;
  title: string;
  description?: string;
  addressSummary?: string;
  fundingNotes?: string;
}) {
  const request = await prisma.homeModificationRequest.create({
    data: {
      participantId: params.participantId,
      title: params.title,
      description: params.description,
      addressSummary: params.addressSummary,
      fundingNotes: params.fundingNotes,
      status: "submitted",
    },
  });

  await createAuditEvent({
    actorUserId: params.participantId,
    action: "home_modification.request_created",
    entityType: "HomeModificationRequest",
    entityId: request.id,
    participantId: params.participantId,
  });

  return request;
}

export async function getHomeModificationRequest(params: {
  requestId: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const request = await prisma.homeModificationRequest.findUnique({
    where: { id: params.requestId },
    include: {
      accessIssues: true,
      assessments: true,
      quotes: true,
      projects: { include: { milestones: { orderBy: { sortOrder: "asc" } } } },
      documents: true,
    },
  });
  if (!request) throw new Error("NOT_FOUND");

  const access = await assertHomeModificationAccess({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: request.participantId,
    providerId: request.projects[0]?.providerId,
  });
  if (!access) throw new Error("FORBIDDEN");

  const visibleDocuments = request.documents.filter((doc) =>
    canViewDocument(doc.visibility, {
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      participantId: request.participantId,
      uploadedById: doc.uploadedById,
    })
  );

  return {
    ...request,
    documents: visibleDocuments,
    fundingDisclaimer: FUNDING_DISCLAIMER,
  };
}

function canViewDocument(
  visibility: HomeModificationDocumentVisibility,
  ctx: {
    actorUserId: string;
    actorRole: UserRole;
    participantId: string;
    uploadedById: string;
  }
): boolean {
  if (ctx.actorUserId === ctx.participantId) return true;
  if (ctx.actorUserId === ctx.uploadedById) return true;
  if (ctx.actorRole === "mapable_admin") return true;

  if (visibility === "private_to_participant") return false;
  if (
    visibility === "shared_with_coordinator" &&
    ctx.actorRole === "support_coordinator"
  ) {
    return true;
  }
  if (
    visibility === "shared_with_provider" &&
    ctx.actorRole === "provider_admin"
  ) {
    return true;
  }
  if (
    visibility === "shared_with_plan_manager" &&
    ctx.actorRole === "plan_manager"
  ) {
    return true;
  }
  return false;
}

export async function assertHomeModificationAccess(params: {
  actorUserId: string;
  actorRole: UserRole;
  participantId: string;
  providerId?: string | null;
}): Promise<boolean> {
  const selfAccess = await checkParticipantSelfAccess({
    actorUserId: params.actorUserId,
    participantId: params.participantId,
    actorRole: params.actorRole,
  });
  if (selfAccess.allowed) return true;

  if (params.actorRole === "support_coordinator") {
    const coord = await checkCoordinatorParticipantAccess({
      coordinatorId: params.actorUserId,
      participantId: params.participantId,
      actorRole: params.actorRole,
    });
    return coord.allowed;
  }

  if (params.actorRole === "plan_manager") {
    const pm = await checkPlanManagerParticipantAccess({
      planManagerId: params.actorUserId,
      participantId: params.participantId,
      actorRole: params.actorRole,
    });
    return pm.allowed;
  }

  if (
    params.actorRole === "provider_admin" &&
    params.providerId &&
    params.actorUserId === params.providerId
  ) {
    return true;
  }

  if (params.actorRole === "family_member") {
    const link = await prisma.participantNomineeLink.findFirst({
      where: {
        nomineeId: params.actorUserId,
        participantId: params.participantId,
        status: "active",
      },
    });
    return Boolean(link);
  }

  return params.actorRole === "mapable_admin";
}

export async function listHomeModificationProviders() {
  return prisma.homeModificationProviderProfile.findMany({
    orderBy: { displayName: "asc" },
    take: 20,
  });
}

export async function createInvoiceFromProject(params: {
  projectId: string;
  actorUserId: string;
  actorRole: UserRole;
}) {
  const project = await prisma.homeModificationProject.findUnique({
    where: { id: params.projectId },
    include: { request: true },
  });
  if (!project) throw new Error("NOT_FOUND");

  const allowed = await assertHomeModificationAccess({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: project.participantId,
    providerId: project.providerId,
  });
  if (!allowed) throw new Error("FORBIDDEN");

  const acceptedQuote = await prisma.homeModificationQuote.findFirst({
    where: { requestId: project.requestId, status: "accepted" },
  });

  const totalCents = acceptedQuote?.totalCents ?? 0;

  const invoice = await prisma.invoice.create({
    data: {
      participantId: project.participantId,
      organisationId: acceptedQuote?.organisationId ?? undefined,
      status: "draft",
      subtotalCents: totalCents,
      totalCents,
      notes: `Home modification project: ${project.title}. ${FUNDING_DISCLAIMER}`,
      createdById: params.actorUserId,
      lines: acceptedQuote
        ? {
            create: {
              description: acceptedQuote.title,
              quantity: 1,
              unitAmountCents: totalCents,
              totalAmountCents: totalCents,
              serviceDate: new Date(),
              supportItemCode: "HOME_MOD_PLACEHOLDER",
            },
          }
        : undefined,
    },
  });

  await prisma.homeModificationProject.update({
    where: { id: params.projectId },
    data: { invoiceId: invoice.id },
  });

  const planManagerRel = await prisma.planManagerRelationship.findFirst({
    where: { participantId: project.participantId, status: "active" },
  });
  if (planManagerRel) {
    await prisma.planManagerInvoiceInbox.create({
      data: {
        invoiceId: invoice.id,
        planManagerId: planManagerRel.planManagerId,
        participantId: project.participantId,
        status: "pending",
        claimWarnings: [
          "Review home modification invoice — funding approval not guaranteed.",
        ],
      },
    });
    await notifyUser(
      planManagerRel.planManagerId,
      "billing",
      "New home modification invoice to review",
      `Invoice created for project: ${project.title}`
    );
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "home_modification.invoice_created",
    entityType: "Invoice",
    entityId: invoice.id,
    participantId: project.participantId,
    metadata: { projectId: params.projectId },
  });

  return invoice;
}

export async function notifyMilestoneUpdate(
  participantId: string,
  title: string,
  body: string,
  projectId: string
) {
  await notifyUser(participantId, "provider", title, body);
  await createNotificationEvent({
    userId: participantId,
    category: "home_modification",
    eventType: "milestone_updated",
    title,
    body,
    participantId,
    entityType: "HomeModificationProject",
    entityId: projectId,
  });
}
