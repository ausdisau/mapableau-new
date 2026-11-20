import type { RideRunStatus } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { transportAccessibleConfig } from "@/lib/config/transport-accessible";
import { prisma } from "@/lib/prisma";
import {
  EXTRA_BOARDING_BUFFER_MINUTES,
  mergeMobilityRequirementsStrictest,
  parseMobilityRequirements,
  passengerCountOf,
  wheelchairSecurementDemandOf,
  type MobilityRequirements,
} from "@/lib/transport/mobility-schema";
import { assertProviderOrgTrip } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { checkVehicleEligibility } from "@/lib/transport/transport-eligibility-service";

type TripMobilityRow = {
  id: string;
  mobilityRequirements: unknown;
  scheduledStart: Date;
  scheduledEnd: Date | null;
};

function vehicleCapacityFromFeature(feature: {
  metadata: unknown;
  wheelchairAccessible: boolean;
} | null): { seated: number; wheelchairSpaces: number; maxLengthMm?: number; maxWidthMm?: number; maxHeightMm?: number } {
  const meta =
    feature?.metadata && typeof feature.metadata === "object"
      ? (feature.metadata as Record<string, unknown>)
      : {};
  const seated =
    typeof meta.seatedPassengerCapacity === "number"
      ? meta.seatedPassengerCapacity
      : typeof meta.maxPassengers === "number"
        ? meta.maxPassengers
        : 4;
  const wheelchairSpaces =
    typeof meta.wheelchairSpaces === "number"
      ? meta.wheelchairSpaces
      : typeof meta.wheelchairSecurementCapacity === "number"
        ? meta.wheelchairSecurementCapacity
        : feature?.wheelchairAccessible
          ? 1
          : 0;
  return {
    seated,
    wheelchairSpaces,
    maxLengthMm:
      typeof meta.maxEquipmentLengthMm === "number"
        ? meta.maxEquipmentLengthMm
        : undefined,
    maxWidthMm:
      typeof meta.maxEquipmentWidthMm === "number"
        ? meta.maxEquipmentWidthMm
        : undefined,
    maxHeightMm:
      typeof meta.maxEquipmentHeightMm === "number"
        ? meta.maxEquipmentHeightMm
        : undefined,
  };
}

function assertPoolingConsent(mobility: MobilityRequirements, tripId: string) {
  if (mobility.poolingAccepted !== true) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      `Trip ${tripId} has not independently accepted pooling.`
    );
  }
}

function windowsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function tripWindow(trip: TripMobilityRow, mobility: MobilityRequirements) {
  const bufferMs =
    mobility.needsExtraBoardingTime === true
      ? EXTRA_BOARDING_BUFFER_MINUTES * 60_000
      : 0;
  const start = new Date(trip.scheduledStart.getTime() - bufferMs);
  const endBase =
    trip.scheduledEnd ??
    new Date(trip.scheduledStart.getTime() + 3600000);
  const end = new Date(endBase.getTime() + bufferMs);
  return { start, end };
}

export async function createRideRun(
  user: CurrentUser,
  orgId: string,
  input: {
    vehicleId: string;
    driverId?: string;
    scheduledStart: string;
    scheduledEnd?: string;
    maxPassengers?: number;
    notes?: string;
  }
) {
  if (!transportAccessibleConfig.ridePoolingEnabled) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "Ride pooling is not enabled."
    );
  }

  await assertProviderOrgTrip(user, orgId);

  const vehicle = await prisma.transportVehicle.findFirst({
    where: { id: input.vehicleId, organisationId: orgId, active: true },
  });
  if (!vehicle) {
    throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
  }

  return prisma.rideRun.create({
    data: {
      providerOrganisationId: orgId,
      vehicleId: input.vehicleId,
      driverId: input.driverId,
      scheduledStart: new Date(input.scheduledStart),
      scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : undefined,
      maxPassengers: input.maxPassengers ?? 4,
      status: "planning",
      notes: input.notes,
      requiresHumanReview: true,
    },
    include: { trips: true, vehicle: true, driver: true },
  });
}

export async function attachTripToRideRun(
  user: CurrentUser,
  orgId: string,
  rideRunId: string,
  tripId: string
) {
  if (!transportAccessibleConfig.ridePoolingEnabled) {
    throw new TransportApiError(
      "TRANSPORT_ROUTE_PROVIDER_UNAVAILABLE",
      "Ride pooling is not enabled."
    );
  }

  await assertProviderOrgTrip(user, orgId);

  const run = await prisma.rideRun.findFirst({
    where: { id: rideRunId, providerOrganisationId: orgId },
    include: {
      trips: true,
      vehicle: { include: { features: true } },
    },
  });
  if (!run) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  if (run.status === "locked" || run.status === "in_progress") {
    throw new TransportApiError(
      "TRANSPORT_INVALID_STATUS_TRANSITION",
      "Cannot attach trips to a locked or active run."
    );
  }

  if (!run.requiresHumanReview && run.status !== "planning" && run.status !== "open") {
    throw new TransportApiError(
      "TRANSPORT_INVALID_STATUS_TRANSITION",
      "Run is past human-review planning and cannot accept new trips."
    );
  }

  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip || trip.providerOrganisationId !== orgId) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");
  }

  if (trip.rideRunId && trip.rideRunId !== rideRunId) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Trip is already attached to another run."
    );
  }

  const mobility = parseMobilityRequirements(trip.mobilityRequirements);
  assertPoolingConsent(mobility, tripId);

  for (const other of run.trips) {
    if (other.id === tripId) continue;
    const otherMobility = parseMobilityRequirements(other.mobilityRequirements);
    assertPoolingConsent(otherMobility, other.id);
  }

  const allMobilities: MobilityRequirements[] = [
    ...run.trips
      .filter((t) => t.id !== tripId)
      .map((t) => parseMobilityRequirements(t.mobilityRequirements)),
    mobility,
  ];

  const totalPassengers = allMobilities.reduce(
    (sum, m) => sum + passengerCountOf(m),
    0
  );
  if (totalPassengers > run.maxPassengers) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      `Ride run seat capacity exceeded (${totalPassengers}/${run.maxPassengers}).`
    );
  }

  const feature = run.vehicle.features[0] ?? null;
  const capacity = vehicleCapacityFromFeature(feature);
  const wheelchairDemand = allMobilities.reduce(
    (sum, m) => sum + wheelchairSecurementDemandOf(m),
    0
  );
  if (wheelchairDemand > capacity.wheelchairSpaces) {
    throw new TransportApiError(
      "TRANSPORT_VEHICLE_NOT_ELIGIBLE",
      `Wheelchair securement capacity exceeded (${wheelchairDemand}/${capacity.wheelchairSpaces}).`,
      { reasons: ["insufficient_wheelchair_securement"] }
    );
  }

  const merged = mergeMobilityRequirementsStrictest(...allMobilities);
  const vehicleCheck = await checkVehicleEligibility(run.vehicleId, merged);
  if (!vehicleCheck.eligible) {
    throw new TransportApiError(
      "TRANSPORT_VEHICLE_NOT_ELIGIBLE",
      "Vehicle cannot satisfy combined mobility needs for all passengers.",
      { reasons: vehicleCheck.reasons }
    );
  }

  for (const dim of [
    ["equipmentLengthMm", capacity.maxLengthMm],
    ["equipmentWidthMm", capacity.maxWidthMm],
    ["equipmentHeightMm", capacity.maxHeightMm],
  ] as const) {
    const [field, max] = dim;
    const need = merged[field];
    if (typeof need === "number" && typeof max === "number" && need > max) {
      throw new TransportApiError(
        "TRANSPORT_VEHICLE_NOT_ELIGIBLE",
        `Equipment ${field} ${need}mm exceeds vehicle limit ${max}mm.`
      );
    }
  }

  // Boarding-buffer-aware temporal overlap between trips on the same run.
  const candidateWindow = tripWindow(trip, mobility);
  for (const other of run.trips) {
    if (other.id === tripId) continue;
    const otherMobility = parseMobilityRequirements(other.mobilityRequirements);
    const otherWindow = tripWindow(other, otherMobility);
    if (
      windowsOverlap(
        candidateWindow.start,
        candidateWindow.end,
        otherWindow.start,
        otherWindow.end
      )
    ) {
      // Same-run overlap is allowed for pooling, but boarding buffers must still fit
      // the run's scheduled window when the run has an end.
      if (run.scheduledEnd) {
        const runEnd = run.scheduledEnd.getTime();
        if (
          candidateWindow.end.getTime() > runEnd ||
          otherWindow.end.getTime() > runEnd
        ) {
          throw new TransportApiError(
            "TRANSPORT_SCHEDULE_CONFLICT",
            "Boarding buffers push a trip outside the ride-run window."
          );
        }
      }
    }
  }

  await prisma.transportTrip.update({
    where: { id: tripId },
    data: { rideRunId },
  });

  return prisma.rideRun.findUnique({
    where: { id: rideRunId },
    include: { trips: true, vehicle: true, driver: true },
  });
}

export async function lockRideRun(
  user: CurrentUser,
  orgId: string,
  rideRunId: string
) {
  await assertProviderOrgTrip(user, orgId);
  const run = await prisma.rideRun.findFirst({
    where: { id: rideRunId, providerOrganisationId: orgId },
    include: { trips: true, vehicle: { include: { features: true } } },
  });
  if (!run) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  if (!run.requiresHumanReview) {
    throw new TransportApiError(
      "TRANSPORT_INVALID_STATUS_TRANSITION",
      "Ride run has already cleared human review."
    );
  }

  if (run.trips.length === 0) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Cannot lock an empty ride run."
    );
  }

  for (const trip of run.trips) {
    const mobility = parseMobilityRequirements(trip.mobilityRequirements);
    assertPoolingConsent(mobility, trip.id);
  }

  const allMobilities = run.trips.map((t) =>
    parseMobilityRequirements(t.mobilityRequirements)
  );
  const merged = mergeMobilityRequirementsStrictest(...allMobilities);
  const vehicleCheck = await checkVehicleEligibility(run.vehicleId, merged);
  if (!vehicleCheck.eligible) {
    throw new TransportApiError(
      "TRANSPORT_VEHICLE_NOT_ELIGIBLE",
      "Vehicle cannot satisfy combined mobility needs at lock time.",
      { reasons: vehicleCheck.reasons }
    );
  }

  const totalPassengers = allMobilities.reduce(
    (sum, m) => sum + passengerCountOf(m),
    0
  );
  if (totalPassengers > run.maxPassengers) {
    throw new TransportApiError(
      "TRANSPORT_VALIDATION_FAILED",
      "Seat capacity exceeded at lock time."
    );
  }

  return prisma.rideRun.update({
    where: { id: rideRunId },
    data: { status: "locked" as RideRunStatus, requiresHumanReview: false },
    include: { trips: true },
  });
}

export async function listRideRuns(user: CurrentUser, orgId: string) {
  await assertProviderOrgTrip(user, orgId);
  return prisma.rideRun.findMany({
    where: { providerOrganisationId: orgId },
    orderBy: { scheduledStart: "desc" },
    include: { trips: true, vehicle: true, driver: true },
    take: 50,
  });
}
