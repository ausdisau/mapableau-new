import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { linkTransportBookingToBooking } from "@/lib/modules/transport-facade";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;
  const body = (await req.json().catch(() => ({}))) as { bookingId?: string };

  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    select: { participantId: true },
  });
  if (!booking) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && booking.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const linked = await linkTransportBookingToBooking({
    transportBookingId,
    bookingId: body.bookingId,
    actorUserId: user.id,
  });
  return jsonOk({ booking: linked });
}
