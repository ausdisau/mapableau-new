import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;
  const { applicationId } = await params;

  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { participantId: true },
  });
  if (!app) return jsonError("Not found", 404);
  if (!isAdminRole(user.primaryRole) && app.participantId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const events = await prisma.orchestrationEvent.findMany({
    where: { jobApplicationId: applicationId },
    orderBy: { createdAt: "desc" },
  });
  const transportBookingIds = events
    .map((e) => e.transportBookingId)
    .filter((id): id is string => Boolean(id));
  const careRequestIds = events
    .map((e) => e.careRequestId)
    .filter((id): id is string => Boolean(id));

  const [transportBookings, careRequests, calendarEvents] = await Promise.all([
    prisma.transportBooking.findMany({
      where: { id: { in: transportBookingIds } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.careRequest.findMany({
      where: { id: { in: careRequestIds } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.calendarEvent.findMany({
      where: { jobApplicationId: applicationId },
      orderBy: { startAt: "asc" },
    }),
  ]);

  return jsonOk({
    events,
    transportBookings,
    careRequests,
    calendarEvents,
  });
}
