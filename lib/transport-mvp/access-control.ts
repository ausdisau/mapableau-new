import type { CurrentUser } from "@/lib/auth/current-user";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

import {
  resolveAddressViewerRole,
  type TransportAddressViewerRole,
} from "./address-privacy";

export async function getTransportDriverForUser(userId: string) {
  return prisma.transportDriver.findFirst({
    where: { userId, active: true },
  });
}

export async function assertParticipantOwnsTrip(
  tripId: string,
  participantId: string
) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    select: { participantId: true },
  });
  if (!trip || trip.participantId !== participantId) {
    throw new Error("FORBIDDEN");
  }
}

export async function assertProviderOrgTrip(
  tripId: string,
  userId: string
) {
  const orgIds = await getUserOrganisationIds(userId);
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    select: { organisationId: true },
  });
  if (!trip || !orgIds.includes(trip.organisationId)) {
    throw new Error("FORBIDDEN");
  }
}

export async function assertDriverAssignedTrip(
  tripId: string,
  userId: string
) {
  const driver = await getTransportDriverForUser(userId);
  if (!driver) throw new Error("FORBIDDEN");
  const assignment = await prisma.transportDispatchAssignment.findFirst({
    where: { tripId, driverId: driver.id },
  });
  if (!assignment) throw new Error("FORBIDDEN");
}

export async function getTripForViewer(tripId: string, user: CurrentUser) {
  const trip = await prisma.transportTrip.findUnique({
    where: { id: tripId },
    include: {
      stops: true,
      accessNeeds: true,
      dispatch: { include: { driver: true, vehicle: { include: { features: true } } } },
      evidence: true,
      events: { orderBy: { createdAt: "asc" } },
      request: true,
    },
  });
  if (!trip) throw new Error("NOT_FOUND");

  const orgIds = await getUserOrganisationIds(user.id);
  const driver = await getTransportDriverForUser(user.id);
  const isParticipant = trip.participantId === user.id;
  const isProvider = orgIds.includes(trip.organisationId);
  const isAssignedDriver = Boolean(
    driver && trip.dispatch?.driverId === driver.id
  );
  const isAdmin = isAdminRole(user.primaryRole);

  if (!isParticipant && !isProvider && !isAssignedDriver && !isAdmin) {
    throw new Error("FORBIDDEN");
  }

  const viewerRole: TransportAddressViewerRole = resolveAddressViewerRole({
    viewerUserId: user.id,
    participantId: trip.participantId,
    organisationId: trip.organisationId,
    viewerOrgIds: orgIds,
    assignedDriverUserId: trip.dispatch?.driver.userId,
  });

  return { trip, viewerRole, isParticipant, isProvider, isAssignedDriver };
}

export async function listTripsForUser(user: CurrentUser) {
  const orgIds = await getUserOrganisationIds(user.id);
  const driver = await getTransportDriverForUser(user.id);

  if (isAdminRole(user.primaryRole)) {
    return prisma.transportTrip.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { request: true, dispatch: true },
    });
  }

  if (driver) {
    return prisma.transportTrip.findMany({
      where: { dispatch: { driverId: driver.id } },
      orderBy: { createdAt: "desc" },
      include: { request: true, dispatch: true },
    });
  }

  if (orgIds.length > 0) {
    return prisma.transportTrip.findMany({
      where: { organisationId: { in: orgIds } },
      orderBy: { createdAt: "desc" },
      include: { request: true, dispatch: true },
    });
  }

  return prisma.transportTrip.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    include: { request: true, dispatch: true },
  });
}
