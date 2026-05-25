import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function assertTransportBookingRouteAccess(
  user: CurrentUser,
  transportBookingId: string,
) {
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    select: { participantId: true, operatorOrganisationId: true },
  });
  if (!booking) return { ok: false as const, status: 404 as const };

  if (isAdminRole(user.primaryRole)) return { ok: true as const, booking };

  if (
    booking.participantId === user.id &&
    hasPermission(user.primaryRole, "transport:manage:self")
  ) {
    return { ok: true as const, booking };
  }

  if (hasPermission(user.primaryRole, "transport:manage:org")) {
    return { ok: true as const, booking };
  }

  return { ok: false as const, status: 403 as const };
}
