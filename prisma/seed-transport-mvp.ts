import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTransportMvp() {
  console.log("Seeding Transport MVP...");

  const participant = await prisma.user.findUnique({
    where: { email: "participant@mapable.test" },
  });
  const providerAdmin = await prisma.user.findUnique({
    where: { email: "provider@mapable.test" },
  });
  const transportOrg = await prisma.organisation.findFirst({
    where: { id: "seed-transport-org" },
  });

  if (!participant || !transportOrg) {
    console.log("  Skip Transport MVP — run Phase 1 seed first");
    return;
  }

  const driverUser = await prisma.user.upsert({
    where: { email: "driver@mapable.test" },
    create: {
      email: "driver@mapable.test",
      name: "Demo Transport Driver",
      passwordHash:
        "$2b$10$iLyIbD98gF/4Wnghy5CnY.m4JK0/bL8CLbc/pUtnQ/nXr4Wuep.8O",
      primaryRole: "driver",
    },
    update: { primaryRole: "driver" },
  });

  if (providerAdmin) {
    await prisma.organisationMember.upsert({
      where: {
        userId_organisationId: {
          userId: providerAdmin.id,
          organisationId: transportOrg.id,
        },
      },
      create: {
        userId: providerAdmin.id,
        organisationId: transportOrg.id,
        role: "provider_admin",
      },
      update: {},
    });
  }

  const legacyVehicle = await prisma.vehicle.findFirst({
    where: { organisationId: transportOrg.id, wheelchairAccessible: true },
  });
  const legacyDriver = await prisma.driverProfile.findFirst({
    where: { organisationId: transportOrg.id },
  });

  const vehicle = await prisma.transportVehicle.upsert({
    where: { id: "seed-mvp-transport-vehicle" },
    create: {
      id: "seed-mvp-transport-vehicle",
      organisationId: transportOrg.id,
      legacyVehicleId: legacyVehicle?.id,
      displayName: legacyVehicle?.displayName ?? "Demo Accessible Van",
      registrationNumber: legacyVehicle?.registrationNumber ?? "MVP001",
      verificationStatus: "verified",
      active: true,
      features: {
        create: {
          wheelchairAccessible: true,
          rampAvailable: true,
          liftAvailable: false,
          seatedCapacity: 4,
          wheelchairSpaces: 1,
          assistanceAnimalFriendly: true,
        },
      },
    },
    update: { verificationStatus: "verified", active: true },
  });

  const driver = await prisma.transportDriver.upsert({
    where: { id: "seed-mvp-transport-driver" },
    create: {
      id: "seed-mvp-transport-driver",
      organisationId: transportOrg.id,
      legacyDriverProfileId: legacyDriver?.id,
      userId: driverUser.id,
      displayName: legacyDriver?.displayName ?? "Demo Driver",
      phone: legacyDriver?.phone ?? "0400 000 001",
      verificationStatus: "verified",
      active: true,
      verifications: {
        create: {
          licenceStatus: "verified",
          screeningStatus: "verified",
          accessibilityTrainingStatus: "verified",
          verifiedAt: new Date(),
        },
      },
    },
    update: { verificationStatus: "verified", active: true, userId: driverUser.id },
  });

  const pickupStart = new Date();
  pickupStart.setDate(pickupStart.getDate() + 2);
  pickupStart.setHours(9, 0, 0, 0);

  const request = await prisma.transportTripRequest.upsert({
    where: { id: "seed-mvp-trip-request" },
    create: {
      id: "seed-mvp-trip-request",
      participantId: participant.id,
      organisationId: transportOrg.id,
      status: "accepted",
      pickupAddress: "123 Collins St, Melbourne VIC 3000",
      pickupLat: -37.8136,
      pickupLng: 144.9631,
      dropoffAddress: "456 St Kilda Rd, Melbourne VIC 3004",
      dropoffLat: -37.839,
      dropoffLng: 144.98,
      pickupWindowStart: pickupStart,
      pickupWindowEnd: new Date(pickupStart.getTime() + 30 * 60 * 1000),
      passengerCount: 1,
      accessNeeds: {
        create: {
          wheelchairRequired: true,
          assistedPickup: true,
          assistedDropoff: false,
          driverAssistanceRequired: true,
          shareAccessibility: false,
          assistanceNotes: "Demo access needs — seed data only.",
        },
      },
    },
    update: { organisationId: transportOrg.id, status: "accepted" },
  });

  const trip = await prisma.transportTrip.upsert({
    where: { requestId: request.id },
    create: {
      requestId: request.id,
      participantId: participant.id,
      organisationId: transportOrg.id,
      status: "dispatched",
      stops: {
        create: [
          {
            sequence: 0,
            stopType: "pickup",
            addressFull: request.pickupAddress,
            addressSuburb: "Melbourne",
            lat: request.pickupLat,
            lng: request.pickupLng,
            scheduledAt: pickupStart,
          },
          {
            sequence: 1,
            stopType: "dropoff",
            addressFull: request.dropoffAddress,
            addressSuburb: "Melbourne",
            lat: request.dropoffLat,
            lng: request.dropoffLng,
          },
        ],
      },
      dispatch: providerAdmin
        ? {
            create: {
              driverId: driver.id,
              vehicleId: vehicle.id,
              assignedById: providerAdmin.id,
              eligibilitySnapshot: { verified: true, seed: true },
            },
          }
        : undefined,
      events: {
        create: [
          {
            toStatus: "accepted",
            message: "Request accepted",
            actorUserId: providerAdmin?.id,
          },
          {
            fromStatus: "accepted",
            toStatus: "dispatched",
            message: "Driver and vehicle assigned",
          },
        ],
      },
    },
    update: { status: "dispatched" },
  });

  console.log(`  Transport MVP seed: request ${request.id}, trip ${trip.id}`);
}
