import type { User } from "@prisma/client";

import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function userCanAccessBooking(
  user: Pick<User, "id" | "primaryRole">,
  bookingId: string
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      participantId: true,
      assignedOrganisationId: true,
      assignedWorkerId: true,
      assignedDriverId: true,
    },
  });
  if (!booking) return false;
  if (booking.participantId === user.id) return true;
  if (
    booking.assignedWorkerId === user.id ||
    booking.assignedDriverId === user.id
  ) {
    return true;
  }

  if (booking.assignedOrganisationId) {
    const member = await prisma.organisationMember.findFirst({
      where: {
        userId: user.id,
        organisationId: booking.assignedOrganisationId,
      },
    });
    if (member) return true;
  }

  return false;
}

export async function assertProviderOwnsBooking(
  bookingId: string,
  organisationId: string
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { assignedOrganisationId: true },
  });
  if (!booking || booking.assignedOrganisationId !== organisationId) {
    throw new Error("FORBIDDEN_PROVIDER");
  }
}

export async function assertWorkerBelongsToProvider(
  workerUserId: string,
  organisationId: string
) {
  const member = await prisma.organisationMember.findFirst({
    where: {
      organisationId,
      userId: workerUserId,
      role: { in: ["support_worker", "driver", "provider_admin"] },
    },
  });
  if (member) return;

  const worker = await prisma.worker.findUnique({
    where: { userId: workerUserId },
  });
  if (worker) return;

  throw new Error("WORKER_NOT_IN_ORGANISATION");
}
