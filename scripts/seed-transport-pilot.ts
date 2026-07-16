/**
 * Development-only deterministic Transport pilot fixtures.
 * Never seed real personal information. Label all sources as sandbox.
 *
 * Usage: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/seed-transport-pilot.ts
 */
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("sandbox-only-change-me", 10);
  const participantEmail = "transport.pilot.participant@example.com";
  const dispatcherEmail = "transport.pilot.dispatcher@example.com";

  const participant = await prisma.user.upsert({
    where: { email: participantEmail },
    update: {},
    create: {
      email: participantEmail,
      name: "Transport Pilot Participant",
      primaryRole: "participant",
      passwordHash,
    },
  });

  const dispatcher = await prisma.user.upsert({
    where: { email: dispatcherEmail },
    update: {},
    create: {
      email: dispatcherEmail,
      name: "Transport Pilot Dispatcher",
      primaryRole: "provider_admin",
      passwordHash,
    },
  });

  let org = await prisma.organisation.findFirst({
    where: { name: "Sandbox Transport Operator" },
  });
  if (!org) {
    org = await prisma.organisation.create({
      data: {
        name: "Sandbox Transport Operator",
        organisationType: "transport_provider",
        status: "active",
        verificationStatus: "verified",
      },
    });
  }

  await prisma.organisationMember.upsert({
    where: {
      userId_organisationId: {
        userId: dispatcher.id,
        organisationId: org.id,
      },
    },
    update: {},
    create: {
      userId: dispatcher.id,
      organisationId: org.id,
      role: "provider_admin",
    },
  });

  await prisma.transportAccessProfile.upsert({
    where: { userId: participant.id },
    update: {},
    create: {
      userId: participant.id,
      mobilityDevices: [{ type: "manual_wheelchair", level: "required" }],
      serviceAnimal: false,
      safePickupNotes: "Sandbox: wait near the accessible entrance",
    },
  });

  let vehicle = await prisma.transportVehicle.findFirst({
    where: { organisationId: org.id, displayName: "Sandbox WAV 1" },
  });
  if (!vehicle) {
    vehicle = await prisma.transportVehicle.create({
      data: {
        organisationId: org.id,
        displayName: "Sandbox WAV 1",
        registrationNumber: "SANDBOX1",
        active: true,
      },
    });
  }

  await prisma.transportVehicleFeature.deleteMany({ where: { vehicleId: vehicle.id } });
  await prisma.transportVehicleFeature.create({
    data: {
      vehicleId: vehicle.id,
      wheelchairAccessible: true,
      rampAvailable: true,
      liftAvailable: false,
      assistanceAnimalFriendly: true,
    },
  });

  await prisma.transportVehicleVerification.deleteMany({
    where: { vehicleId: vehicle.id },
  });
  for (const kind of ["registration", "insurance", "inspection"] as const) {
    await prisma.transportVehicleVerification.create({
      data: {
        vehicleId: vehicle.id,
        kind,
        status: "verified",
        expiresAt: new Date(Date.now() + 365 * 86400000),
      },
    });
  }

  let driver = await prisma.transportDriver.findFirst({
    where: { organisationId: org.id, displayName: "Sandbox Driver" },
  });
  if (!driver) {
    driver = await prisma.transportDriver.create({
      data: {
        organisationId: org.id,
        displayName: "Sandbox Driver",
        userId: dispatcher.id,
        active: true,
      },
    });
  }

  await prisma.transportDriverVerification.deleteMany({
    where: { driverId: driver.id },
  });
  for (const kind of ["licence", "screening", "training"] as const) {
    await prisma.transportDriverVerification.create({
      data: {
        driverId: driver.id,
        kind,
        status: "verified",
        expiresAt: new Date(Date.now() + 365 * 86400000),
      },
    });
  }

  await prisma.transportPricingRule.upsert({
    where: { versionId: "sandbox-transport-km-v1" },
    update: {},
    create: {
      versionId: "sandbox-transport-km-v1",
      serviceType: "accessible_transport",
      unit: "km",
      rateCents: 250,
      gstTreatment: "inclusive",
      sourceName: "Sandbox fixture",
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      active: true,
      importedByUserId: dispatcher.id,
    },
  });

  console.log(
    JSON.stringify(
      {
        sandbox: true,
        participantEmail,
        dispatcherEmail,
        organisationId: org.id,
        driverId: driver.id,
        vehicleId: vehicle.id,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
