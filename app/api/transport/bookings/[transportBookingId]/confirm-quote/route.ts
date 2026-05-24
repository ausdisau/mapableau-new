import { requireApiPermission } from "@/lib/api/auth-handler";
import { participantTransportWhere } from "@/lib/api/phase3-scope";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { confirmTripQuote } from "@/lib/transport-osm/trip-quote-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> }
) {
  const user = await requireApiPermission("transport:manage:self");
  if (user instanceof Response) return user;
  const { transportBookingId } = await params;

  const booking = await prisma.transportBooking.findFirst({
    where: { id: transportBookingId, ...participantTransportWhere(user) },
  });
  if (!booking) return jsonError("Not found", 404);

  try {
    const updated = await confirmTripQuote(transportBookingId, user.id);
    return jsonOk({ booking: updated });
  } catch (e) {
    if (e instanceof Error && e.message === "QUOTE_EXPIRED") {
      return jsonError("Quote has expired", 410);
    }
    return jsonError("Confirm failed", 500);
  }
}
