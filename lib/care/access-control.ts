import type { CareBooking, CareShift } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

export class CareAccessError extends Error {
  constructor(
    message: string,
    public code: "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN"
  ) {
    super(message);
    this.name = "CareAccessError";
  }
}

/**
 * Wave 8: platform admin no longer receives a silent bypass for participant-
 * sensitive care operations. To touch a specific organisation's care data,
 * an admin either needs to be a member of the organisation, or the caller
 * must escalate via `lib/tenancy/access/break-glass-service`.
 */
export async function assertProviderOrgAccess(
  user: CurrentUser,
  organisationId: string,
  options: { allowAdminForOrg?: boolean } = {}
): Promise<void> {
  const orgIds = await getUserOrganisationIds(user.id);
  if (orgIds.includes(organisationId)) return;
  if (options.allowAdminForOrg && isAdminRole(user.primaryRole)) {
    return;
  }
  throw new CareAccessError("Organisation access denied");
}

export function assertParticipantOwnsBooking(
  user: CurrentUser,
  booking: Pick<CareBooking, "participantId">
): void {
  if (booking.participantId === user.id) return;
  // Wave 8: no ambient admin bypass for participant-sensitive operations.
  throw new CareAccessError("Participant access denied");
}

export async function assertCanViewCareRequest(
  user: CurrentUser,
  request: {
    participantId: string;
    assignedOrganisationId: string | null;
  }
): Promise<void> {
  if (request.participantId === user.id) return;
  if (request.assignedOrganisationId) {
    await assertProviderOrgAccess(user, request.assignedOrganisationId);
    return;
  }
  throw new CareAccessError("Care request access denied");
}

export async function assertWorkerAssignedToShift(
  user: CurrentUser,
  shift: Pick<CareShift, "workerProfileId">
): Promise<void> {
  if (!shift.workerProfileId) {
    throw new CareAccessError("Shift has no assigned worker");
  }
  const profile = await prisma.workerProfile.findUnique({
    where: { id: shift.workerProfileId },
    select: { userId: true },
  });
  if (!profile?.userId || profile.userId !== user.id) {
    throw new CareAccessError("Worker shift access denied");
  }
}

export async function workerProfileForUser(userId: string) {
  return prisma.workerProfile.findFirst({
    where: { userId, active: true },
  });
}

export async function assertCanViewCareShift(
  user: CurrentUser,
  shift: Pick<CareShift, "participantId" | "organisationId" | "workerProfileId">
): Promise<void> {
  if (shift.participantId === user.id) return;

  if (user.primaryRole === "support_worker") {
    await assertWorkerAssignedToShift(user, shift);
    return;
  }

  if (user.primaryRole === "provider_admin") {
    await assertProviderOrgAccess(user, shift.organisationId);
    return;
  }

  // Wave 8: platform admin has no ambient shift read. Route through an
  // explicitly-scoped admin/platform API with break-glass if needed.
  throw new CareAccessError("Care shift access denied");
}

export async function assertCanMutateCareShift(
  user: CurrentUser,
  shift: Pick<CareShift, "participantId" | "organisationId" | "workerProfileId">
): Promise<void> {
  if (user.primaryRole === "provider_admin") {
    await assertProviderOrgAccess(user, shift.organisationId);
    return;
  }

  if (user.primaryRole === "support_worker") {
    await assertWorkerAssignedToShift(user, shift);
    return;
  }

  // Wave 8: no silent admin bypass; mutations must be tenant-scoped.
  throw new CareAccessError("Care shift update denied");
}
