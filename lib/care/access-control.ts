import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export class CareAccessError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
    this.name = "CareAccessError";
  }
}

export function isCareAccessError(error: unknown): error is CareAccessError {
  return error instanceof CareAccessError;
}

export function assertParticipantOwnsBooking(
  user: CurrentUser,
  booking: { participantId: string }
) {
  if (isAdminRole(user.primaryRole) || booking.participantId === user.id) return;
  throw new CareAccessError();
}

export async function getUserOrganisationIds(userId: string) {
  const memberships = await prisma.organisationMember.findMany({
    where: { userId },
    select: { organisationId: true },
  });
  return memberships.map((membership) => membership.organisationId);
}

export async function assertProviderOrgAccess(
  user: CurrentUser,
  organisationId: string
) {
  if (isAdminRole(user.primaryRole)) return;
  const organisationIds = await getUserOrganisationIds(user.id);
  if (organisationIds.includes(organisationId)) return;
  throw new CareAccessError();
}

export function assertWorkerAssignedToShift(
  user: CurrentUser,
  shift: { workerProfile?: { userId: string | null } | null }
) {
  if (isAdminRole(user.primaryRole)) return;
  if (shift.workerProfile?.userId === user.id) return;
  throw new CareAccessError();
}

export async function assertProviderCanAccessCareRequest(
  user: CurrentUser,
  request: { assignedOrganisationId: string | null; participantId: string }
) {
  if (isAdminRole(user.primaryRole) || request.participantId === user.id) return;
  if (request.assignedOrganisationId) {
    await assertProviderOrgAccess(user, request.assignedOrganisationId);
    return;
  }
  throw new CareAccessError();
}

export async function assertProviderCanAccessBooking(
  user: CurrentUser,
  booking: { organisationId: string; participantId: string }
) {
  if (isAdminRole(user.primaryRole) || booking.participantId === user.id) return;
  await assertProviderOrgAccess(user, booking.organisationId);
}
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";

export class CareAccessError extends Error {
  constructor(message = "CARE_ACCESS_DENIED") {
    super(message);
    this.name = "CareAccessError";
  }
}

export function isCareAccessError(error: unknown): error is CareAccessError {
  return error instanceof CareAccessError;
}

export function assertParticipantOwnsBooking(
  user: CurrentUser,
  booking: { participantId: string }
): void {
  if (isAdminRole(user.primaryRole)) return;
  if (booking.participantId === user.id) return;
  throw new CareAccessError();
}

export async function assertProviderCanAccessBooking(
  user: CurrentUser,
  booking: { participantId: string; organisationId: string }
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  if (booking.participantId === user.id) return;

  const organisationIds = await getUserOrganisationIds(user.id);
  if (organisationIds.includes(booking.organisationId)) return;

  throw new CareAccessError();
}

export async function assertProviderCanAccessCareRequest(
  user: CurrentUser,
  request: { participantId: string; assignedOrganisationId: string | null }
): Promise<void> {
  if (isAdminRole(user.primaryRole)) return;
  if (request.participantId === user.id) return;

  if (request.assignedOrganisationId) {
    const organisationIds = await getUserOrganisationIds(user.id);
    if (organisationIds.includes(request.assignedOrganisationId)) return;
  }

  throw new CareAccessError();
}
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";

export class CareAccessError extends Error {
  constructor(message = "FORBIDDEN") {
    super(message);
    this.name = "CareAccessError";
  }
}

export function assertParticipantOwnsBooking(
  user: CurrentUser,
  booking: { participantId: string }
) {
  if (isAdminRole(user.primaryRole) || booking.participantId === user.id) return;
  throw new CareAccessError();
}

export async function assertProviderOrgAccess(
  user: CurrentUser,
  organisationId: string | null | undefined
) {
  if (isAdminRole(user.primaryRole)) return;
  if (!organisationId) throw new CareAccessError();
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) throw new CareAccessError();
}

export function assertWorkerAssignedToShift(
  user: CurrentUser,
  shift: { workerProfile?: { userId: string | null } | null }
) {
  if (isAdminRole(user.primaryRole)) return;
  if (shift.workerProfile?.userId === user.id) return;
  throw new CareAccessError();
}

export async function assertProviderCanAccessCareRequest(
  user: CurrentUser,
  request: { assignedOrganisationId: string | null; participantId: string }
) {
  if (isAdminRole(user.primaryRole) || request.participantId === user.id) return;
  await assertProviderOrgAccess(user, request.assignedOrganisationId);
}

export async function assertProviderCanAccessBooking(
  user: CurrentUser,
  booking: { organisationId: string; participantId: string }
) {
  if (isAdminRole(user.primaryRole) || booking.participantId === user.id) return;
  await assertProviderOrgAccess(user, booking.organisationId);
}

export function isCareAccessError(error: unknown): error is CareAccessError {
  return error instanceof CareAccessError;
}
