import type { PanelActor } from "@/lib/access-control/panel-access";
import {
  assertOrganisationAccess,
  PanelAccessError,
} from "@/lib/access-control/panel-access";
import { prisma } from "@/lib/prisma";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { isAdminRole } from "@/lib/auth/roles";

export async function resolveProviderOrganisationId(
  actor: PanelActor
): Promise<string> {
  const orgIds = await getUserOrganisationIds(actor.id);
  if (orgIds.length === 0) {
    throw new PanelAccessError("FORBIDDEN", "No provider organisation membership.");
  }
  return orgIds[0];
}

export async function getProviderDashboard(
  actor: PanelActor,
  organisationId?: string
) {
  const orgId =
    organisationId ??
    (isAdminRole(actor.primaryRole)
      ? (await prisma.organisation.findFirst({ select: { id: true } }))?.id
      : await resolveProviderOrganisationId(actor));

  if (!orgId) {
    throw new PanelAccessError("NOT_FOUND", "No organisation found.");
  }

  await assertOrganisationAccess(actor, orgId, "ProviderDashboard");

  const [
    org,
    pendingBookings,
    openQuotes,
    rosterToday,
    workforcePending,
    qualityOpen,
    serviceLogsReview,
    invoicesDraft,
  ] = await Promise.all([
    prisma.organisation.findUnique({
      where: { id: orgId },
      include: {
        providerServices: { where: { active: true }, take: 5 },
        accessCapabilities: { take: 10 },
      },
    }),
    prisma.booking.count({
      where: {
        assignedOrganisationId: orgId,
        status: "awaiting_provider_acceptance",
      },
    }),
    prisma.quoteRequest.count({
      where: { organisationId: orgId, status: { in: ["sent", "responded"] } },
    }),
    prisma.rosterAssignment.count({
      where: {
        organisationId: orgId,
        startAt: { lte: new Date(new Date().setHours(23, 59, 59)) },
        endAt: { gte: new Date(new Date().setHours(0, 0, 0)) },
      },
    }),
    prisma.workerProfile.count({
      where: {
        organisationId: orgId,
        OR: [
          { workerScreeningStatus: { not: "verified" } },
          { verificationStatus: { not: "verified" } },
        ],
      },
    }),
    prisma.providerQualitySignal.count({
      where: { organisationId: orgId, status: "open" },
    }),
    prisma.serviceLog.count({
      where: { organisationId: orgId, status: "submitted" },
    }),
    prisma.invoice.count({
      where: { organisationId: orgId, status: "draft" },
    }),
  ]);

  return {
    org,
    actionQueue: {
      pendingBookings,
      openQuotes,
      rosterToday,
      workforcePending,
      qualityOpen,
      serviceLogsReview,
      invoicesDraft,
    },
  };
}

export async function getParticipantCaseload(
  actor: PanelActor,
  organisationId: string
) {
  await assertOrganisationAccess(actor, organisationId, "ParticipantCaseload");

  const bookings = await prisma.booking.findMany({
    where: { assignedOrganisationId: organisationId },
    select: { participantId: true },
    distinct: ["participantId"],
  });
  const participantIds = bookings.map((b) => b.participantId);

  return prisma.participantProfile.findMany({
    where: { userId: { in: participantIds } },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
