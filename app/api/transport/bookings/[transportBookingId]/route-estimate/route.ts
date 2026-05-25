import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { isDynamicRoutingEnabled } from "@/lib/config/dynamic-routing";
import { prisma } from "@/lib/prisma";
import { computeDynamicRouteEstimate } from "@/lib/routing/dynamic-route-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ transportBookingId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  if (!isDynamicRoutingEnabled()) {
    return jsonError("Dynamic routing is disabled", 503);
  }

  const { transportBookingId } = await params;
  const booking = await prisma.transportBooking.findUnique({
    where: { id: transportBookingId },
    select: { participantId: true },
  });
  if (!booking) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && booking.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const estimate = await computeDynamicRouteEstimate(transportBookingId);
  return jsonOk({ estimate });
}
