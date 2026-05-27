import type { CurrentUser } from "@/lib/auth/current-user";
import { allocationConfig } from "@/lib/config/allocation";
import { runCareAllocation } from "@/lib/care-allocation/allocation-service";
import { prisma } from "@/lib/prisma";

/**
 * After a match or AI candidate is accepted/selected, refresh allocation proposals
 * for the linked care booking when allocation is enabled.
 */
export async function syncAllocationAfterMatchSelection(params: {
  careRequestId: string;
  actorUser: CurrentUser;
}) {
  if (!allocationConfig.careAllocationEnabled) {
    return { skipped: true, reason: "CARE_ALLOCATION_DISABLED" };
  }

  const booking = await prisma.careBooking.findUnique({
    where: { careRequestId: params.careRequestId },
  });
  if (!booking) return { skipped: true, reason: "NO_BOOKING" };

  return runCareAllocation({
    careBookingId: booking.id,
    actorUser: params.actorUser,
    trigger: "manual",
  });
}
