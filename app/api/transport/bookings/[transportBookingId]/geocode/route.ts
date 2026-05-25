import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { geocodeTransportBooking } from "@/lib/modules/transport-facade";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;

  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    select: { participantId: true },
  });
  if (!booking) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && booking.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const updated = await geocodeTransportBooking(transportBookingId);
  return jsonOk({ booking: updated });
}
