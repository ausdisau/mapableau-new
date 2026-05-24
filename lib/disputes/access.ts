import type { Dispute, Complaint } from "@prisma/client";

import { isAdminRole } from "@/lib/auth/roles";
import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function getUserOrganisationIds(userId: string): Promise<string[]> {
  const rows = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return rows.map((r) => r.organisationId);
}

export async function canAccessDispute(
  user: CurrentUser,
  dispute: Pick<Dispute, "participantId" | "organisationId" | "createdById">
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;
  if (dispute.participantId === user.id || dispute.createdById === user.id) {
    return true;
  }
  if (dispute.organisationId) {
    const orgIds = await getUserOrganisationIds(user.id);
    if (orgIds.includes(dispute.organisationId)) return true;
  }
  return false;
}

export async function canRespondToDispute(
  user: CurrentUser,
  dispute: Pick<Dispute, "organisationId" | "status">
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;
  if (!dispute.organisationId) return false;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(dispute.organisationId)) return false;
  return (
    dispute.status === "awaiting_provider_response" ||
    dispute.status === "under_review"
  );
}

export async function canAccessComplaint(
  user: CurrentUser,
  complaint: Pick<Complaint, "participantId" | "createdById" | "organisationId">
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;
  if (complaint.participantId === user.id || complaint.createdById === user.id) {
    return true;
  }
  if (complaint.organisationId) {
    const orgIds = await getUserOrganisationIds(user.id);
    if (orgIds.includes(complaint.organisationId)) return true;
  }
  return false;
}

/** Provider-facing views omit direct participant identifiers where possible. */
export function disputeParticipantLabel(participantName: string): string {
  const parts = participantName.trim().split(/\s+/);
  if (parts.length <= 1) return "Participant";
  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0)}.`;
}
