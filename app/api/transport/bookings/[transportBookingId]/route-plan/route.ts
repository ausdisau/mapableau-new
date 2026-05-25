import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { planFromTransportBooking } from "@/lib/route-optimisation/route-plan-service";
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
    select: { participantId: true, operatorOrganisationId: true },
  });
  if (!booking) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && booking.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  try {
    const plan = await planFromTransportBooking(transportBookingId, user.id);
    if ("skipped" in plan && plan.skipped) {
      return jsonError(plan.message ?? "Route planning disabled", 503);
    }
    return jsonOk({ plan }, 201);
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_FOUND") {
      return jsonError("Not found", 404);
    }
    return jsonError("Route plan failed", 500);
  }
}
