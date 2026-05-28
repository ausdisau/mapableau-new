import type { CurrentUser } from "@/lib/auth/current-user";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { FLEET_DRIVER_VERIFICATION_KINDS } from "@/lib/transport/transport-fleet-verification";
import type {
  createFleetDriverSchema,
  fleetVerificationPatchSchema,
  updateFleetDriverSchema,
} from "@/lib/validation/transport-fleet-schemas";
import type { z } from "zod";

type CreateInput = z.infer<typeof createFleetDriverSchema>;
type UpdateInput = z.infer<typeof updateFleetDriverSchema>;
type VerificationPatch = z.infer<typeof fleetVerificationPatchSchema>;

async function assertDriverInOrg(driverId: string, organisationId: string) {
  const driver = await prisma.transportDriver.findFirst({
    where: { id: driverId, organisationId },
  });
  if (!driver) {
    throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND", "Fleet driver not found.");
  }
  return driver;
}

async function seedDriverVerifications(driverId: string) {
  await prisma.transportDriverVerification.createMany({
    data: FLEET_DRIVER_VERIFICATION_KINDS.map((kind) => ({
      driverId,
      kind,
      status: "pending_review",
    })),
    skipDuplicates: true,
  });
}

export async function createFleetDriver(
  user: CurrentUser,
  organisationId: string,
  input: CreateInput
) {
  const driver = await prisma.transportDriver.create({
    data: {
      organisationId,
      displayName: input.displayName,
      userId: input.userId,
      driverProfileId: input.driverProfileId,
      active: true,
    },
    include: { verifications: true },
  });

  await seedDriverVerifications(driver.id);
  const withVerifications = await prisma.transportDriver.findUnique({
    where: { id: driver.id },
    include: { verifications: true },
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "transport_fleet_driver.created",
    entityType: "TransportDriver",
    entityId: driver.id,
    organisationId,
  });

  return withVerifications!;
}

export async function updateFleetDriver(
  user: CurrentUser,
  organisationId: string,
  driverId: string,
  input: UpdateInput
) {
  await assertDriverInOrg(driverId, organisationId);

  if (input.active === false) {
    const activeAssignment = await prisma.transportDispatchAssignment.findFirst({
      where: { driverId, active: true },
    });
    if (activeAssignment) {
      throw new TransportApiError("TRANSPORT_VALIDATION_FAILED", undefined, {
        reasons: ["Driver has an active trip assignment. Unassign before deactivating."],
      });
    }
  }

  const driver = await prisma.transportDriver.update({
    where: { id: driverId },
    data: {
      displayName: input.displayName,
      userId: input.userId,
      driverProfileId: input.driverProfileId,
      active: input.active,
    },
    include: { verifications: true },
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "transport_fleet_driver.updated",
    entityType: "TransportDriver",
    entityId: driverId,
    organisationId,
  });

  return driver;
}

export async function patchFleetDriverVerifications(
  user: CurrentUser,
  organisationId: string,
  driverId: string,
  patches: VerificationPatch[]
) {
  await assertDriverInOrg(driverId, organisationId);

  for (const patch of patches) {
    const existing = await prisma.transportDriverVerification.findFirst({
      where: { driverId, kind: patch.kind },
    });
    const data = {
      status: patch.status,
      expiresAt: patch.expiresAt ? new Date(patch.expiresAt) : null,
      notes: patch.notes ?? null,
    };
    if (existing) {
      await prisma.transportDriverVerification.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await prisma.transportDriverVerification.create({
        data: { driverId, kind: patch.kind, ...data },
      });
    }
  }

  await createAuditEvent({
    actorUserId: user.id,
    action: "transport_fleet_driver.verifications_updated",
    entityType: "TransportDriver",
    entityId: driverId,
    organisationId,
    metadata: { kinds: patches.map((p) => p.kind) },
  });

  return prisma.transportDriver.findUnique({
    where: { id: driverId },
    include: { verifications: true },
  });
}
