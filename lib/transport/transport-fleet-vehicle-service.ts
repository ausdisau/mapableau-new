import type { CurrentUser } from "@/lib/auth/current-user";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import {
  FLEET_VEHICLE_VERIFICATION_KINDS,
} from "@/lib/transport/transport-fleet-verification";
import type {
  createFleetVehicleSchema,
  fleetVerificationPatchSchema,
  updateFleetVehicleSchema,
} from "@/lib/validation/transport-fleet-schemas";
import type { z } from "zod";

type CreateInput = z.infer<typeof createFleetVehicleSchema>;
type UpdateInput = z.infer<typeof updateFleetVehicleSchema>;
type VerificationPatch = z.infer<typeof fleetVerificationPatchSchema>;

async function assertVehicleInOrg(vehicleId: string, organisationId: string) {
  const vehicle = await prisma.transportVehicle.findFirst({
    where: { id: vehicleId, organisationId },
  });
  if (!vehicle) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND", "Fleet vehicle not found.");
  }
  return vehicle;
}

async function seedVehicleVerifications(vehicleId: string) {
  await prisma.transportVehicleVerification.createMany({
    data: FLEET_VEHICLE_VERIFICATION_KINDS.map((kind) => ({
      vehicleId,
      kind,
      status: "pending_review",
    })),
    skipDuplicates: true,
  });
}

export async function createFleetVehicle(
  user: CurrentUser,
  organisationId: string,
  input: CreateInput
) {
  if (input.vehicleId) {
    const legacy = await prisma.vehicle.findFirst({
      where: { id: input.vehicleId, organisationId },
    });
    if (!legacy) {
      throw new TransportApiError(
        "TRANSPORT_VALIDATION_FAILED",
        "Legacy vehicle link is invalid for this organisation."
      );
    }
  }

  const features = input.features ?? {};
  const vehicle = await prisma.transportVehicle.create({
    data: {
      organisationId,
      displayName: input.displayName,
      registrationNumber: input.registrationNumber,
      vehicleId: input.vehicleId,
      active: true,
      features: {
        create: {
          wheelchairAccessible: features.wheelchairAccessible ?? false,
          rampAvailable: features.rampAvailable ?? false,
          liftAvailable: features.liftAvailable ?? false,
          hoistAvailable: features.hoistAvailable ?? false,
          assistanceAnimalFriendly: features.assistanceAnimalFriendly ?? true,
        },
      },
    },
    include: { features: true, verifications: true },
  });

  await seedVehicleVerifications(vehicle.id);
  const withVerifications = await prisma.transportVehicle.findUnique({
    where: { id: vehicle.id },
    include: { features: true, verifications: true },
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "transport_fleet_vehicle.created",
    entityType: "TransportVehicle",
    entityId: vehicle.id,
    organisationId,
  });

  return withVerifications!;
}

export async function updateFleetVehicle(
  user: CurrentUser,
  organisationId: string,
  vehicleId: string,
  input: UpdateInput
) {
  await assertVehicleInOrg(vehicleId, organisationId);

  if (input.active === false) {
    const activeAssignment = await prisma.transportDispatchAssignment.findFirst({
      where: { vehicleId, active: true },
    });
    if (activeAssignment) {
      throw new TransportApiError("TRANSPORT_VALIDATION_FAILED", undefined, {
        reasons: ["Vehicle has an active trip assignment. Unassign before deactivating."],
      });
    }
  }

  if (input.features) {
    const existing = await prisma.transportVehicleFeature.findFirst({
      where: { vehicleId },
    });
    const f = input.features;
    if (existing) {
      await prisma.transportVehicleFeature.update({
        where: { id: existing.id },
        data: {
          wheelchairAccessible: f.wheelchairAccessible,
          rampAvailable: f.rampAvailable,
          liftAvailable: f.liftAvailable,
          hoistAvailable: f.hoistAvailable,
          assistanceAnimalFriendly: f.assistanceAnimalFriendly,
        },
      });
    } else {
      await prisma.transportVehicleFeature.create({
        data: {
          vehicleId,
          wheelchairAccessible: f.wheelchairAccessible ?? false,
          rampAvailable: f.rampAvailable ?? false,
          liftAvailable: f.liftAvailable ?? false,
          hoistAvailable: f.hoistAvailable ?? false,
          assistanceAnimalFriendly: f.assistanceAnimalFriendly ?? true,
        },
      });
    }
  }

  const vehicle = await prisma.transportVehicle.update({
    where: { id: vehicleId },
    data: {
      displayName: input.displayName,
      registrationNumber: input.registrationNumber,
      active: input.active,
    },
    include: { features: true, verifications: true },
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "transport_fleet_vehicle.updated",
    entityType: "TransportVehicle",
    entityId: vehicleId,
    organisationId,
  });

  return vehicle;
}

export async function patchFleetVehicleVerifications(
  user: CurrentUser,
  organisationId: string,
  vehicleId: string,
  patches: VerificationPatch[]
) {
  await assertVehicleInOrg(vehicleId, organisationId);

  for (const patch of patches) {
    const existing = await prisma.transportVehicleVerification.findFirst({
      where: { vehicleId, kind: patch.kind },
    });
    const data = {
      status: patch.status,
      expiresAt: patch.expiresAt ? new Date(patch.expiresAt) : null,
      notes: patch.notes ?? null,
    };
    if (existing) {
      await prisma.transportVehicleVerification.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.transportVehicleVerification.create({
        data: { vehicleId, kind: patch.kind, ...data },
      });
    }
  }

  await createAuditEvent({
    actorUserId: user.id,
    action: "transport_fleet_vehicle.verifications_updated",
    entityType: "TransportVehicle",
    entityId: vehicleId,
    organisationId,
    metadata: { kinds: patches.map((p) => p.kind) },
  });

  return prisma.transportVehicle.findUnique({
    where: { id: vehicleId },
    include: { features: true, verifications: true },
  });
}
