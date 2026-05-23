import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { proposeScheduleForBooking } from "@/lib/scheduling/scheduling-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id: bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) return jsonError("Not found", 404);

  const organisationId = booking.assignedOrganisationId;
  if (!organisationId) {
    return jsonError("Booking has no assigned organisation", 400);
  }

  if (!isAdminRole(user.primaryRole)) {
    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId },
    });
    if (!member && booking.participantId !== user.id) {
      return jsonError("Forbidden", 403);
    }
  }

  try {
    const proposal = await proposeScheduleForBooking(
      bookingId,
      organisationId,
      user.id
    );
    return jsonOk(proposal);
  } catch (e) {
    if (e instanceof Error && e.message.includes("CONFLICT")) {
      return jsonError("Scheduling conflict detected", 409);
    }
    return jsonError("Scheduling failed", 500);
  }
}
