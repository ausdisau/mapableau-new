import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { listBookingTimeline } from "@/lib/bookings/timeline-service";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ careRequestId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { careRequestId } = await params;

  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
    include: {
      booking: { include: { segments: { orderBy: { sortOrder: "asc" } } } },
      shifts: { orderBy: { startAt: "asc" }, take: 20 },
    },
  });
  if (!request) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && request.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const transportWhere = request.bookingId
    ? { OR: [{ careRequestId: request.id }, { bookingId: request.bookingId }] }
    : { careRequestId: request.id };
  const transportBookings = await prisma.transportBooking.findMany({
    where: transportWhere,
    orderBy: { pickupWindowStart: "asc" },
  });
  const timeline = request.bookingId
    ? await listBookingTimeline(
        request.bookingId,
        isAdminRole(user.primaryRole),
      )
    : [];

  return jsonOk({
    request,
    booking: request.booking,
    transportBookings,
    shifts: request.shifts,
    timeline,
  });
}
