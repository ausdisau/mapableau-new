import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import {
  driverTransportWhere,
  participantTransportWhere,
  providerTransportWhere,
} from "@/lib/api/phase3-scope";
import { prisma } from "@/lib/prisma";

export async function canAccessTransportBooking(
  user: CurrentUser,
  transportBookingId: string
): Promise<boolean> {
  if (
    isAdminRole(user.primaryRole) ||
    hasPermission(user.primaryRole, "transport:manage:any")
  ) {
    return true;
  }

  const asParticipant = await prisma.transportBooking.findFirst({
    where: { id: transportBookingId, ...participantTransportWhere(user) },
  });
  if (asParticipant) return true;

  const asProvider = await prisma.transportBooking.findFirst({
    where: { id: transportBookingId, ...(await providerTransportWhere(user)) },
  });
  if (asProvider) return true;

  const asDriver = await prisma.transportBooking.findFirst({
    where: { id: transportBookingId, ...(await driverTransportWhere(user)) },
  });
  return Boolean(asDriver);
}
