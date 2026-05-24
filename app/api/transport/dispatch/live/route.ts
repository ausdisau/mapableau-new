import { requireApiPermission } from "@/lib/api/auth-handler";
import { providerTransportWhere } from "@/lib/api/phase3-scope";
import { jsonOk } from "@/lib/api/response";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = [
  "driver_assigned",
  "vehicle_dispatched",
  "arrived_at_pickup",
  "passenger_onboard",
  "late_risk",
] as const;

export async function GET() {
  const user = await requireApiPermission("dispatch:manage");
  if (user instanceof Response) return user;

  const scope = isAdminRole(user.primaryRole)
    ? {}
    : await providerTransportWhere(user);

  const trips = await prisma.transportBooking.findMany({
    where: {
      ...scope,
      status: { in: [...ACTIVE_STATUSES] },
    },
    include: {
      vehicle: true,
      driverProfile: true,
      tripTrackingSession: {
        include: {
          locations: { orderBy: { recordedAt: "desc" }, take: 1 },
        },
      },
    },
    take: 50,
  });

  return jsonOk({
    trips: trips.map((t) => ({
      id: t.id,
      status: t.status,
      pickupLat: t.pickupLat,
      pickupLng: t.pickupLng,
      dropoffLat: t.dropoffLat,
      dropoffLng: t.dropoffLng,
      pickupAddress: t.pickupAddress.slice(0, 40),
      vehicle: t.vehicle?.displayName,
      driver: t.driverProfile?.displayName,
      lastLocation: t.tripTrackingSession?.locations[0] ?? null,
    })),
  });
}
