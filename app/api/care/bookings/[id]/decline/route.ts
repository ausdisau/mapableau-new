import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { updateCareBookingStatus } from "@/lib/care/care-booking-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;
  const booking = await updateCareBookingStatus({
    bookingId: id,
    status: "declined",
    actorUserId: user.id,
  });
  return jsonOk({ booking });
}
import { requireApiPermission } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { assertProviderOrgAccess, isCareAccessError } from "@/lib/care/access-control";
import { updateCareBookingStatus } from "@/lib/care/care-booking-service";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiPermission("care:manage:org");
  if (user instanceof Response) return user;
  const { id } = await params;

  try {
    const booking = await prisma.careBooking.findUnique({ where: { id } });
    if (!booking) return jsonError("Not found", 404);
    await assertProviderOrgAccess(user, booking.organisationId);
    const updated = await updateCareBookingStatus({
      bookingId: id,
      status: "declined",
      actorUserId: user.id,
      eventType: "booking_declined",
      title: "Care booking declined",
    });
    return jsonOk({ booking: updated });
  } catch (error) {
    if (isCareAccessError(error)) return jsonError("Forbidden", 403);
    return jsonError("Decline failed", 500);
  }
}
