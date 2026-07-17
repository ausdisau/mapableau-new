import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function recordGovernanceMeeting(params: {
  title: string;
  meetingAt: Date;
  notes?: string;
  tenantId?: string;
  constituencySummary?: string;
  actorUserId: string;
}) {
  if (!phase6Config.communityGovernanceEnabled) {
    throw new Error("GOVERNANCE_DISABLED");
  }

  const meeting = await prisma.communityGovernanceMeeting.create({
    data: {
      title: params.title,
      meetingAt: params.meetingAt,
      notes: params.notes,
      tenantId: params.tenantId,
      constituencySummary: params.constituencySummary,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "community_governance.meeting_recorded",
    entityType: "CommunityGovernanceMeeting",
    entityId: meeting.id,
  });

  return meeting;
}

export async function recordGovernanceDecision(params: {
  meetingId?: string;
  title: string;
  summary: string;
  constituencySummary?: string;
  actorUserId: string;
}) {
  // Wave 13 publish-style governance decisions require conflict declarations
  // before publication; new records default conflictCheckCompleted to false.
  const decision = await prisma.communityGovernanceDecision.create({
    data: {
      meetingId: params.meetingId,
      title: params.title,
      summary: params.summary,
      constituencySummary: params.constituencySummary,
      conflictCheckCompleted: false,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "community_governance.decision_recorded",
    entityType: "CommunityGovernanceDecision",
    entityId: decision.id,
  });

  return decision;
}
