import type { Prisma } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/organisation-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import { resolveTripAccess } from "@/lib/transport/transport-access-policy";

export async function tripListScope(
  user: CurrentUser,
): Promise<Prisma.TransportTripWhereInput> {
  if (isAdminRole(user.primaryRole)) return {};
  if (user.primaryRole === "driver") {
    const driver = await prisma.transportDriver.findFirst({
      where: { userId: user.id, active: true },
      select: { id: true },
    });
    // Scope by an active assignment in the trip query itself.
    if (!driver) return { id: { in: [] } };
    return {
      dispatchAssignments: { some: { driverId: driver.id, active: true } },
    };
  }
  if (
    user.primaryRole === "transport_operator" ||
    user.primaryRole === "provider_admin"
  ) {
    return {
      providerOrganisationId: { in: await getUserOrganisationIds(user.id) },
    };
  }
  return { participantId: user.id };
}

/** The dashboard only needs the card fields. Vehicle checks, live traffic and
 * booking details are loaded when a user opens an individual trip. */
export async function listTransportTripCards(user: CurrentUser) {
  const where = await tripListScope(user);
  const trips = await prisma.transportTrip.findMany({
    where,
    orderBy: { scheduledStart: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      participantId: true,
      providerOrganisationId: true,
      scheduledStart: true,
      pickupAddress: true,
      pickupSuburb: true,
      dropoffAddress: true,
      dropoffSuburb: true,
    },
  });
  const cards = await Promise.all(
    trips.map(async (trip) => {
      const access = await resolveTripAccess(user, trip);
      if (access === "none") return null;
      return {
        id: trip.id,
        status: trip.status,
        scheduledStart: trip.scheduledStart.toISOString(),
        pickup: {
          suburb: trip.pickupSuburb,
          address: access === "exact" ? trip.pickupAddress : undefined,
        },
        dropoff: {
          suburb: trip.dropoffSuburb,
          address: access === "exact" ? trip.dropoffAddress : undefined,
        },
      };
    }),
  );
  return cards.filter((card) => card !== null);
}
