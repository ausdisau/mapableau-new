import type {
  TransportVerificationKind,
  TransportVerificationStatus,
} from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import {
  checkDriverEligibility,
  checkVehicleEligibility,
} from "@/lib/transport/transport-eligibility-service";
import { assertProviderOrgTrip } from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { EligibilityCheckResult } from "@/types/transport-scheduling";

const DRIVER_VERIFICATION_KINDS: TransportVerificationKind[] = [
  "licence",
  "screening",
  "training",
];

const VEHICLE_VERIFICATION_KINDS: TransportVerificationKind[] = [
  "registration",
  "insurance",
  "inspection",
  "access_equipment",
];

function mapVerification(
  record: {
    kind: TransportVerificationKind;
    status: TransportVerificationStatus;
    expiresAt: Date | null;
    notes: string | null;
    updatedAt: Date;
  }
) {
  return {
    kind: record.kind,
    status: record.status,
    expiresAt: record.expiresAt?.toISOString() ?? null,
    notes: record.notes,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapDriver(
  driver: {
    id: string;
    displayName: string;
    active: boolean;
    userId: string | null;
    driverProfileId: string | null;
    createdAt: Date;
    updatedAt: Date;
    verifications: Array<{
      kind: TransportVerificationKind;
      status: TransportVerificationStatus;
      expiresAt: Date | null;
      notes: string | null;
      updatedAt: Date;
    }>;
  },
  eligibility?: EligibilityCheckResult
) {
  return {
    id: driver.id,
    displayName: driver.displayName,
    active: driver.active,
    userId: driver.userId,
    driverProfileId: driver.driverProfileId,
    createdAt: driver.createdAt.toISOString(),
    updatedAt: driver.updatedAt.toISOString(),
    verifications: driver.verifications.map(mapVerification),
    requiredVerificationKinds: DRIVER_VERIFICATION_KINDS,
    eligibility,
  };
}

function mapVehicle(
  vehicle: {
    id: string;
    displayName: string;
    registrationNumber: string | null;
    active: boolean;
    vehicleId: string | null;
    createdAt: Date;
    updatedAt: Date;
    verifications: Array<{
      kind: TransportVerificationKind;
      status: TransportVerificationStatus;
      expiresAt: Date | null;
      notes: string | null;
      updatedAt: Date;
    }>;
    features: Array<{
      wheelchairAccessible: boolean;
      rampAvailable: boolean;
      liftAvailable: boolean;
      hoistAvailable: boolean;
      assistanceAnimalFriendly: boolean;
    }>;
  },
  eligibility?: EligibilityCheckResult
) {
  const feature = vehicle.features[0];
  return {
    id: vehicle.id,
    displayName: vehicle.displayName,
    registrationNumber: vehicle.registrationNumber,
    active: vehicle.active,
    vehicleId: vehicle.vehicleId,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
    verifications: vehicle.verifications.map(mapVerification),
    requiredVerificationKinds: VEHICLE_VERIFICATION_KINDS,
    features: feature
      ? {
          wheelchairAccessible: feature.wheelchairAccessible,
          rampAvailable: feature.rampAvailable,
          liftAvailable: feature.liftAvailable,
          hoistAvailable: feature.hoistAvailable,
          assistanceAnimalFriendly: feature.assistanceAnimalFriendly,
        }
      : null,
    eligibility,
  };
}

async function assertFleetDriver(orgId: string, driverId: string) {
  const driver = await prisma.transportDriver.findFirst({
    where: { id: driverId, organisationId: orgId },
    include: { verifications: true },
  });
  if (!driver) throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
  return driver;
}

async function assertFleetVehicle(orgId: string, vehicleId: string) {
  const vehicle = await prisma.transportVehicle.findFirst({
    where: { id: vehicleId, organisationId: orgId },
    include: { verifications: true, features: true },
  });
  if (!vehicle) throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
  return vehicle;
}

export async function listTransportDrivers(user: CurrentUser, orgId: string) {
  await assertProviderOrgTrip(user, orgId);
  const drivers = await prisma.transportDriver.findMany({
    where: { organisationId: orgId },
    include: { verifications: true },
    orderBy: { displayName: "asc" },
  });

  return Promise.all(
    drivers.map(async (driver) => {
      const eligibility = await checkDriverEligibility(driver.id);
      return mapDriver(driver, eligibility);
    })
  );
}

export async function listTransportVehicles(user: CurrentUser, orgId: string) {
  await assertProviderOrgTrip(user, orgId);
  const vehicles = await prisma.transportVehicle.findMany({
    where: { organisationId: orgId },
    include: { verifications: true, features: true },
    orderBy: { displayName: "asc" },
  });

  return Promise.all(
    vehicles.map(async (vehicle) => {
      const eligibility = await checkVehicleEligibility(vehicle.id);
      return mapVehicle(vehicle, eligibility);
    })
  );
}

export async function getTransportDriver(
  user: CurrentUser,
  orgId: string,
  driverId: string
) {
  await assertProviderOrgTrip(user, orgId);
  const driver = await assertFleetDriver(orgId, driverId);
  const eligibility = await checkDriverEligibility(driver.id);
  return mapDriver(driver, eligibility);
}

export async function getTransportVehicle(
  user: CurrentUser,
  orgId: string,
  vehicleId: string
) {
  await assertProviderOrgTrip(user, orgId);
  const vehicle = await assertFleetVehicle(orgId, vehicleId);
  const eligibility = await checkVehicleEligibility(vehicle.id);
  return mapVehicle(vehicle, eligibility);
}

export async function createTransportDriver(
  user: CurrentUser,
  orgId: string,
  input: {
    displayName: string;
    userId?: string;
    driverProfileId?: string;
  }
) {
  await assertProviderOrgTrip(user, orgId);
  const driver = await prisma.transportDriver.create({
    data: {
      organisationId: orgId,
      displayName: input.displayName,
      userId: input.userId,
      driverProfileId: input.driverProfileId,
      active: true,
    },
    include: { verifications: true },
  });
  const eligibility = await checkDriverEligibility(driver.id);
  return mapDriver(driver, eligibility);
}

export async function createTransportVehicle(
  user: CurrentUser,
  orgId: string,
  input: {
    displayName: string;
    registrationNumber?: string;
    vehicleId?: string;
  }
) {
  await assertProviderOrgTrip(user, orgId);
  const vehicle = await prisma.transportVehicle.create({
    data: {
      organisationId: orgId,
      displayName: input.displayName,
      registrationNumber: input.registrationNumber,
      vehicleId: input.vehicleId,
      active: true,
    },
    include: { verifications: true, features: true },
  });
  const eligibility = await checkVehicleEligibility(vehicle.id);
  return mapVehicle(vehicle, eligibility);
}

export async function updateTransportDriver(
  user: CurrentUser,
  orgId: string,
  driverId: string,
  input: {
    displayName?: string;
    active?: boolean;
    userId?: string | null;
  }
) {
  await assertProviderOrgTrip(user, orgId);
  await assertFleetDriver(orgId, driverId);
  const driver = await prisma.transportDriver.update({
    where: { id: driverId },
    data: {
      displayName: input.displayName,
      active: input.active,
      userId: input.userId,
    },
    include: { verifications: true },
  });
  const eligibility = await checkDriverEligibility(driver.id);
  return mapDriver(driver, eligibility);
}

export async function updateTransportVehicle(
  user: CurrentUser,
  orgId: string,
  vehicleId: string,
  input: {
    displayName?: string;
    registrationNumber?: string | null;
    active?: boolean;
  }
) {
  await assertProviderOrgTrip(user, orgId);
  await assertFleetVehicle(orgId, vehicleId);
  const vehicle = await prisma.transportVehicle.update({
    where: { id: vehicleId },
    data: {
      displayName: input.displayName,
      registrationNumber: input.registrationNumber,
      active: input.active,
    },
    include: { verifications: true, features: true },
  });
  const eligibility = await checkVehicleEligibility(vehicle.id);
  return mapVehicle(vehicle, eligibility);
}

export async function upsertDriverVerifications(
  user: CurrentUser,
  orgId: string,
  driverId: string,
  verifications: Array<{
    kind: TransportVerificationKind;
    status: TransportVerificationStatus;
    expiresAt?: string | null;
    notes?: string | null;
  }>
) {
  await assertProviderOrgTrip(user, orgId);
  await assertFleetDriver(orgId, driverId);

  for (const item of verifications) {
    if (!DRIVER_VERIFICATION_KINDS.includes(item.kind)) {
      throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
    }
    const existing = await prisma.transportDriverVerification.findFirst({
      where: { driverId, kind: item.kind },
    });
    const data = {
      status: item.status,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
      notes: item.notes ?? null,
    };
    if (existing) {
      await prisma.transportDriverVerification.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.transportDriverVerification.create({
        data: { driverId, kind: item.kind, ...data },
      });
    }
  }

  return getTransportDriver(user, orgId, driverId);
}

export async function upsertVehicleVerifications(
  user: CurrentUser,
  orgId: string,
  vehicleId: string,
  verifications: Array<{
    kind: TransportVerificationKind;
    status: TransportVerificationStatus;
    expiresAt?: string | null;
    notes?: string | null;
  }>
) {
  await assertProviderOrgTrip(user, orgId);
  await assertFleetVehicle(orgId, vehicleId);

  for (const item of verifications) {
    if (!VEHICLE_VERIFICATION_KINDS.includes(item.kind)) {
      throw new TransportApiError("TRANSPORT_VALIDATION_FAILED");
    }
    const existing = await prisma.transportVehicleVerification.findFirst({
      where: { vehicleId, kind: item.kind },
    });
    const data = {
      status: item.status,
      expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
      notes: item.notes ?? null,
    };
    if (existing) {
      await prisma.transportVehicleVerification.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.transportVehicleVerification.create({
        data: { vehicleId, kind: item.kind, ...data },
      });
    }
  }

  return getTransportVehicle(user, orgId, vehicleId);
}

export async function upsertVehicleFeatures(
  user: CurrentUser,
  orgId: string,
  vehicleId: string,
  features: {
    wheelchairAccessible?: boolean;
    rampAvailable?: boolean;
    liftAvailable?: boolean;
    hoistAvailable?: boolean;
    assistanceAnimalFriendly?: boolean;
  }
) {
  await assertProviderOrgTrip(user, orgId);
  const vehicle = await assertFleetVehicle(orgId, vehicleId);
  const existing = vehicle.features[0];

  if (existing) {
    await prisma.transportVehicleFeature.update({
      where: { id: existing.id },
      data: features,
    });
  } else {
    await prisma.transportVehicleFeature.create({
      data: {
        vehicleId,
        wheelchairAccessible: features.wheelchairAccessible ?? false,
        rampAvailable: features.rampAvailable ?? false,
        liftAvailable: features.liftAvailable ?? false,
        hoistAvailable: features.hoistAvailable ?? false,
        assistanceAnimalFriendly: features.assistanceAnimalFriendly ?? true,
      },
    });
  }

  return getTransportVehicle(user, orgId, vehicleId);
}
