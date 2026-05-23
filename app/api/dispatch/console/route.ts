import { requireApiSession } from "@/lib/api/auth-handler";
import { jsonError, jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { syncOperationalQueues } from "@/lib/dispatch-console/dispatch-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const organisationId = new URL(req.url).searchParams.get("organisationId");

  if (!isAdminRole(user.primaryRole)) {
    if (!organisationId) return jsonError("organisationId required", 400);
    const member = await prisma.organisationMember.findFirst({
      where: { userId: user.id, organisationId },
    });
    if (!member) return jsonError("Forbidden", 403);
  }

  await syncOperationalQueues(user.id);

  const where = organisationId
    ? { organisationId }
    : isAdminRole(user.primaryRole)
      ? {}
      : { organisationId: "__none__" };

  const [queues, transports, assignments] = await Promise.all([
    prisma.dispatchQueue.findMany({
      where: { status: "open", ...where },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      take: 50,
    }),
    prisma.transportBooking.findMany({
      where: {
        ...(organisationId ? { operatorOrganisationId: organisationId } : {}),
        status: {
          in: ["confirmed", "driver_en_route", "in_transit", "requested"],
        },
      },
      take: 30,
      select: {
        id: true,
        status: true,
        pickupLat: true,
        pickupLng: true,
        dropoffLat: true,
        dropoffLng: true,
        pickupWindowStart: true,
        bookingId: true,
      },
    }),
    organisationId
      ? prisma.scheduledAssignment.findMany({
          where: { organisationId },
          orderBy: { startsAt: "asc" },
          take: 50,
        })
      : Promise.resolve([]),
  ]);

  return jsonOk({ queues, transports, assignments });
}
