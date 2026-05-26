import { prisma } from "@/lib/prisma";
import {
  assertCoordinatorCanAccessParticipant,
  CareSupportAccessError,
} from "@/lib/care-support/access-control";

export async function ensureCoordinationCaseForRelationship(
  relationshipId: string,
  latestAssessmentId?: string
) {
  const rel = await prisma.supportCoordinatorRelationship.findUnique({
    where: { id: relationshipId },
  });
  if (!rel) return null;

  const participantOpenReferrals = await prisma.supportReferral.count({
    where: {
      participantId: rel.participantId,
      status: { in: ["submitted", "triaged", "accepted"] },
    },
  });

  return prisma.coordinationCase.upsert({
    where: { relationshipId },
    create: {
      relationshipId,
      status: "open",
      openReferralCount: participantOpenReferrals,
      latestAssessmentId: latestAssessmentId ?? null,
    },
    update: {
      openReferralCount: participantOpenReferrals,
      ...(latestAssessmentId ? { latestAssessmentId } : {}),
    },
  });
}

export async function refreshCoordinationCaseCounts(participantId: string) {
  const rels = await prisma.supportCoordinatorRelationship.findMany({
    where: { participantId, status: "active" },
  });
  const openCount = await prisma.supportReferral.count({
    where: {
      participantId,
      status: { in: ["submitted", "triaged", "accepted"] },
    },
  });
  const latest = await prisma.supportNeedsAssessment.findFirst({
    where: { participantId, status: { in: ["submitted", "reviewed"] } },
    orderBy: { submittedAt: "desc" },
  });

  for (const rel of rels) {
    await prisma.coordinationCase.upsert({
      where: { relationshipId: rel.id },
      create: {
        relationshipId: rel.id,
        openReferralCount: openCount,
        latestAssessmentId: latest?.id ?? null,
      },
      update: {
        openReferralCount: openCount,
        latestAssessmentId: latest?.id ?? null,
      },
    });
  }
}

export async function getCoordinationTimeline(
  coordinatorId: string,
  participantId: string
) {
  await assertCoordinatorCanAccessParticipant(
    coordinatorId,
    participantId,
    "care_support.referral_manage"
  );

  const [assessments, referrals, careRequests, careBookings, planSummary] =
    await Promise.all([
      prisma.supportNeedsAssessment.findMany({
        where: { participantId },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          createdAt: true,
        },
      }),
      prisma.supportReferral.findMany({
        where: { participantId },
        orderBy: { updatedAt: "desc" },
        take: 20,
      }),
      prisma.careRequest.findMany({
        where: { participantId },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
      }),
      prisma.careBooking.findMany({
        where: { participantId },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: {
          id: true,
          status: true,
          createdAt: true,
          organisation: { select: { name: true } },
        },
      }),
      prisma.participantSupportPlanSummary.findUnique({
        where: { participantId },
      }),
    ]);

  const events: Array<{
    type: string;
    id: string;
    at: Date;
    label: string;
    status?: string;
  }> = [];

  for (const a of assessments) {
    events.push({
      type: "assessment",
      id: a.id,
      at: a.submittedAt ?? a.createdAt,
      label: "Support needs assessment",
      status: a.status,
    });
  }
  for (const r of referrals) {
    events.push({
      type: "referral",
      id: r.id,
      at: r.updatedAt,
      label: r.summary,
      status: r.status,
    });
  }
  for (const c of careRequests) {
    events.push({
      type: "care_request",
      id: c.id,
      at: c.updatedAt,
      label: c.title,
      status: c.status,
    });
  }
  for (const b of careBookings) {
    events.push({
      type: "care_booking",
      id: b.id,
      at: b.createdAt,
      label: `Booking — ${b.organisation.name}`,
      status: b.status,
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());

  return {
    participantId,
    planSummary: planSummary?.summaryJson ?? {},
    events,
    assessments,
    referrals,
    careRequests,
    careBookings,
  };
}

export async function listCoordinatorCaseload(coordinatorId: string) {
  const rels = await prisma.supportCoordinatorRelationship.findMany({
    where: { coordinatorId, status: "active" },
    include: {
      coordinationCases: true,
      tasks: { where: { status: "open" }, take: 5 },
    },
  });

  const participants = await Promise.all(
    rels.map(async (rel) => {
      const user = await prisma.user.findUnique({
        where: { id: rel.participantId },
        select: { id: true, name: true, email: true },
      });
      const latestAssessment = await prisma.supportNeedsAssessment.findFirst({
        where: { participantId: rel.participantId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, status: true, submittedAt: true },
      });
      const openTasks = rel.tasks.length;
      const coordinationCase = rel.coordinationCases[0];
      return {
        participantId: rel.participantId,
        relationshipId: rel.id,
        participant: user,
        openTasks,
        latestAssessment,
        openReferralCount: coordinationCase?.openReferralCount ?? 0,
        coordinationStatus: coordinationCase?.status ?? "open",
      };
    })
  );

  return participants;
}

export async function assertCoordinatorParticipantAccess(
  coordinatorId: string,
  participantId: string
) {
  await assertCoordinatorCanAccessParticipant(coordinatorId, participantId);
}
