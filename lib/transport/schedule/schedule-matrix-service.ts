import type { CurrentUser } from "@/lib/auth/current-user";
import { transportScheduleConfig } from "@/lib/config/transport-schedule";
import { prisma } from "@/lib/prisma";
import {
  projectLocationForStage,
  type LocationDisclosureStage,
} from "@/lib/transport/privacy/location-disclosure";
import { assertProviderOrgTrip } from "@/lib/transport/transport-access-policy";

export type ScheduleMatrixSlot = {
  tripId: string;
  status: string;
  requestStatus: string | null;
  driverId: string | null;
  driverName: string | null;
  vehicleId: string | null;
  vehicleName: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  slotStartIso: string;
  slotEndIso: string;
  pickupLabel: string;
  dropoffLabel: string;
  pickupCoordinates: { lat: number; lng: number } | null;
  dropoffCoordinates: { lat: number; lng: number } | null;
  routeAdvisory: {
    estimateId: string;
    provider: string;
    advisoryOnly: true;
    sourceLabel: string;
    distanceMetres: number;
    durationSeconds: number;
  } | null;
  dispatchHref: string;
};

export type ScheduleMatrixRow = {
  resourceType: "driver" | "vehicle" | "unassigned";
  resourceId: string;
  resourceLabel: string;
  slots: ScheduleMatrixSlot[];
};

export type ScheduleMatrixProjection = {
  organisationId: string;
  timeZone: string;
  slotMinutes: number;
  windowStart: string;
  windowEnd: string;
  slotStarts: string[];
  rows: ScheduleMatrixRow[];
  trips: ScheduleMatrixSlot[];
};

function floorToSlot(date: Date, slotMinutes: number): Date {
  const ms = slotMinutes * 60_000;
  return new Date(Math.floor(date.getTime() / ms) * ms);
}

/**
 * Map trip status → location disclosure stage for provider schedule viewers.
 */
export function locationStageForTripStatus(
  status: string
): LocationDisclosureStage {
  switch (status) {
    case "requested":
    case "quote_pending":
    case "quoted":
    case "provider_review":
      return "request";
    case "accepted":
    case "dispatch_pending":
      return "accepted";
    case "driver_vehicle_assigned":
    case "driver_accepted":
    case "pre_start_check_required":
      return "assigned";
    case "en_route_to_pickup":
    case "arrived_at_pickup":
    case "participant_boarded":
    case "en_route_to_dropoff":
    case "arrived_at_dropoff":
      return "in_service";
    case "trip_completed":
    case "closed":
      return "completed";
    default:
      return "accepted";
  }
}

function advisorySourceLabel(provider: string, advisoryOnly: boolean): string {
  if (!advisoryOnly) {
    return `${provider} (treat as advisory — live ETA not claimed)`;
  }
  if (provider === "mock") {
    return "mock (sandbox advisory — not a live ETA)";
  }
  return `${provider} (advisory only)`;
}

/** Civil calendar day in Australia/Sydney → UTC [start, end). */
export function sydneyDayBounds(day: string): { start: Date; end: Date } {
  const probe = new Date(`${day}T12:00:00.000Z`);
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(probe);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  const wallAsUtc = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second"))
  );
  const offsetMs = wallAsUtc - probe.getTime();
  const start = new Date(
    Date.UTC(
      Number(day.slice(0, 4)),
      Number(day.slice(5, 7)) - 1,
      Number(day.slice(8, 10)),
      0,
      0,
      0
    ) - offsetMs
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function getProviderScheduleMatrix(
  user: CurrentUser,
  orgId: string,
  options?: { day?: string }
): Promise<ScheduleMatrixProjection> {
  await assertProviderOrgTrip(user, orgId);

  const slotMinutes = transportScheduleConfig.slotMinutes;
  const timeZone = transportScheduleConfig.displayTimeZone;
  const day = options?.day ?? new Date().toISOString().slice(0, 10);
  const { start, end } = sydneyDayBounds(day);

  const trips = await prisma.transportTrip.findMany({
    where: {
      providerOrganisationId: orgId,
      scheduledStart: { lt: end },
      OR: [
        { scheduledEnd: { gt: start } },
        { scheduledEnd: null, scheduledStart: { gte: start } },
      ],
      status: { notIn: ["cancelled", "declined", "closed"] },
    },
    include: {
      tripRequest: { select: { status: true } },
      dispatchAssignments: {
        where: { active: true },
        include: {
          driver: { select: { id: true, displayName: true } },
          vehicle: { select: { id: true, displayName: true } },
        },
        take: 1,
      },
      routeEstimates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          provider: true,
          advisoryOnly: true,
          distanceMetres: true,
          durationSeconds: true,
        },
      },
    },
    orderBy: { scheduledStart: "asc" },
    take: 500,
  });

  const drivers = await prisma.transportDriver.findMany({
    where: { organisationId: orgId, active: true },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });
  const vehicles = await prisma.transportVehicle.findMany({
    where: { organisationId: orgId, active: true },
    select: { id: true, displayName: true },
    orderBy: { displayName: "asc" },
  });

  const slotStarts: string[] = [];
  for (
    let t = floorToSlot(start, slotMinutes).getTime();
    t < end.getTime();
    t += slotMinutes * 60_000
  ) {
    slotStarts.push(new Date(t).toISOString());
  }

  const flat: ScheduleMatrixSlot[] = trips.map((trip) => {
    const assignment = trip.dispatchAssignments[0];
    const tripEnd =
      trip.scheduledEnd ??
      new Date(trip.scheduledStart.getTime() + 60 * 60 * 1000);
    const stage = locationStageForTripStatus(trip.status);
    const pickup = projectLocationForStage({
      stage,
      suburb: trip.pickupSuburb ?? undefined,
      exactAddress: trip.pickupAddress,
      coordinates:
        trip.pickupLat != null && trip.pickupLng != null
          ? { lat: trip.pickupLat, lng: trip.pickupLng }
          : undefined,
      role: "provider",
    });
    const dropoff = projectLocationForStage({
      stage,
      suburb: trip.dropoffSuburb ?? undefined,
      exactAddress: trip.dropoffAddress,
      coordinates:
        trip.dropoffLat != null && trip.dropoffLng != null
          ? { lat: trip.dropoffLat, lng: trip.dropoffLng }
          : undefined,
      role: "provider",
    });

    const estimate = trip.routeEstimates[0];
    const routeAdvisory = estimate
      ? {
          estimateId: estimate.id,
          provider: estimate.provider,
          advisoryOnly: true as const,
          sourceLabel: advisorySourceLabel(
            estimate.provider,
            estimate.advisoryOnly
          ),
          distanceMetres: estimate.distanceMetres,
          durationSeconds: estimate.durationSeconds,
        }
      : null;

    return {
      tripId: trip.id,
      status: trip.status,
      requestStatus: trip.tripRequest?.status ?? null,
      driverId: assignment?.driverId ?? null,
      driverName: assignment?.driver?.displayName ?? null,
      vehicleId: assignment?.vehicleId ?? null,
      vehicleName: assignment?.vehicle?.displayName ?? null,
      scheduledStart: trip.scheduledStart.toISOString(),
      scheduledEnd: tripEnd.toISOString(),
      slotStartIso: floorToSlot(trip.scheduledStart, slotMinutes).toISOString(),
      slotEndIso: floorToSlot(tripEnd, slotMinutes).toISOString(),
      pickupLabel: pickup.redacted
        ? pickup.label
        : pickup.exactAddress ?? pickup.label,
      dropoffLabel: dropoff.redacted
        ? dropoff.label
        : dropoff.exactAddress ?? dropoff.label,
      pickupCoordinates: pickup.coordinates ?? null,
      dropoffCoordinates: dropoff.coordinates ?? null,
      routeAdvisory,
      dispatchHref: `/provider/transport/dispatch?tripId=${encodeURIComponent(trip.id)}`,
    };
  });

  const driverRows: ScheduleMatrixRow[] = drivers.map((d) => ({
    resourceType: "driver" as const,
    resourceId: d.id,
    resourceLabel: d.displayName,
    slots: flat.filter((s) => s.driverId === d.id),
  }));

  const vehicleRows: ScheduleMatrixRow[] = vehicles.map((v) => ({
    resourceType: "vehicle" as const,
    resourceId: v.id,
    resourceLabel: v.displayName,
    slots: flat.filter((s) => s.vehicleId === v.id),
  }));

  return {
    organisationId: orgId,
    timeZone,
    slotMinutes,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    slotStarts,
    rows: [
      ...driverRows,
      ...vehicleRows,
      {
        resourceType: "unassigned",
        resourceId: "unassigned",
        resourceLabel: "Unassigned trips",
        slots: flat.filter((s) => !s.driverId),
      },
    ],
    trips: flat,
  };
}
