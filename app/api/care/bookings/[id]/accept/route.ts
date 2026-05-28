import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { runCareAllocation } from "@/lib/care-allocation/allocation-service";
import { allocationConfig } from "@/lib/config/allocation";
import { providerAcceptCareBooking } from "@/lib/care/care-booking-service";
import { isServicePlanningEnabled } from "@/lib/service-planning/config";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  try {
    const booking = await providerAcceptCareBooking(id, user);

    let allocation = null;
    if (
      isServicePlanningEnabled() &&
      allocationConfig.careAllocationEnabled
    ) {
      try {
        allocation = await runCareAllocation({
          careBookingId: booking.id,
          actorUser: user,
          trigger: "booking_accepted",
        });
      } catch {
        allocation = { skipped: true, reason: "allocation_failed" };
      }
    }

    return jsonOk({ booking, allocation });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Forbidden", 403);
  }
}
