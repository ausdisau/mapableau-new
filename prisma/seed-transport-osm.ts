import type { PrismaClient } from "@prisma/client";

export async function seedTransportOsm(prisma: PrismaClient) {
  const participant = await prisma.user.findFirst({
    where: { email: "alice@example.com" },
  });
  const operator = await prisma.organisation.findFirst({
    where: { organisationType: "transport_provider" },
  });
  if (!participant || !operator) {
    console.warn("seed-transport-osm: skipped (missing participant or transport org)");
    return;
  }

  const pickup = await prisma.storedLocation.upsert({
    where: { id: "seed-loc-pickup-melb" },
    create: {
      id: "seed-loc-pickup-melb",
      ownerUserId: participant.id,
      label: "home",
      addressLine: "100 Demo Street, Fitzroy VIC 3065",
      suburb: "Fitzroy",
      state: "VIC",
      postcode: "3065",
      lat: -37.798,
      lng: 144.978,
      geocodeSource: "manual",
      geocodedAt: new Date(),
    },
    update: {},
  });

  const dropoff = await prisma.storedLocation.upsert({
    where: { id: "seed-loc-dropoff-melb" },
    create: {
      id: "seed-loc-dropoff-melb",
      ownerUserId: participant.id,
      label: "saved",
      addressLine: "200 Example Road, Southbank VIC 3006",
      suburb: "Southbank",
      state: "VIC",
      postcode: "3006",
      lat: -37.822,
      lng: 144.964,
      geocodeSource: "manual",
      geocodedAt: new Date(),
    },
    update: {},
  });

  let vehicle = await prisma.vehicle.findFirst({
    where: { organisationId: operator.id, wheelchairAccessible: true },
  });
  if (!vehicle) {
    vehicle = await prisma.vehicle.create({
      data: {
        organisationId: operator.id,
        displayName: "WAV Demo Van",
        vehicleType: "accessible_van",
        wheelchairAccessible: true,
        rampAvailable: true,
        seatedCapacity: 4,
        wheelchairSpaces: 1,
      },
    });
  }

  let driver = await prisma.driverProfile.findFirst({
    where: { organisationId: operator.id },
  });
  if (!driver) {
    driver = await prisma.driverProfile.create({
      data: {
        organisationId: operator.id,
        displayName: "Demo Driver",
        driverCapabilities: ["wheelchair_assist", "companion_support"],
        accessibilityTrainingStatus: "verified",
      },
    });
  }

  const quotedBooking = await prisma.transportBooking.upsert({
    where: { id: "seed-tb-quoted" },
    create: {
      id: "seed-tb-quoted",
      participantId: participant.id,
      pickupAddress: pickup.addressLine,
      dropoffAddress: dropoff.addressLine,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      pickupLocationId: pickup.id,
      dropoffLocationId: dropoff.id,
      pickupWindowStart: new Date(Date.now() + 86400000),
      passengerCount: 1,
      companionCount: 0,
      accessNeeds: { boardingAssistance: true },
      vehicleRequirements: { requiresWheelchairAccessible: true },
      communicationPreferences: { preferredMethod: "in_app" },
      status: "quoted",
      operatorOrganisationId: operator.id,
      quotedFareCents: 4500,
    },
    update: { status: "quoted" },
  });

  await prisma.transportTripQuote.upsert({
    where: { id: "seed-quote-1" },
    create: {
      id: "seed-quote-1",
      transportBookingId: quotedBooking.id,
      status: "active",
      distanceMeters: 5200,
      durationSeconds: 900,
      fareBreakdown: {
        baseCents: 2500,
        distanceCents: 2000,
        totalCents: 4500,
        currency: "AUD",
      },
      routeSummary: { distanceKm: 5.2, durationMinutes: 15, provider: "placeholder" },
      routingProvider: "placeholder",
      expiresAt: new Date(Date.now() + 3600000),
    },
    update: {},
  });

  await prisma.transportBooking.upsert({
    where: { id: "seed-tb-active-dispatch" },
    create: {
      id: "seed-tb-active-dispatch",
      participantId: participant.id,
      pickupAddress: pickup.addressLine,
      dropoffAddress: dropoff.addressLine,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      pickupWindowStart: new Date(),
      status: "vehicle_dispatched",
      operatorOrganisationId: operator.id,
      driverProfileId: driver.id,
      vehicleId: vehicle.id,
      vehicleRequirements: { requiresWheelchairAccessible: true },
      accessNeeds: {},
      communicationPreferences: {},
    },
    update: {},
  });

  await prisma.travelTimeMatrixCell.upsert({
    where: {
      originHash_destHash_routingProvider: {
        originHash: `${pickup.lat.toFixed(5)},${pickup.lng.toFixed(5)}`,
        destHash: `${dropoff.lat.toFixed(5)},${dropoff.lng.toFixed(5)}`,
        routingProvider: "placeholder",
      },
    },
    create: {
      originHash: `${pickup.lat.toFixed(5)},${pickup.lng.toFixed(5)}`,
      destHash: `${dropoff.lat.toFixed(5)},${dropoff.lng.toFixed(5)}`,
      durationSeconds: 900,
      distanceMeters: 5200,
      routingProvider: "placeholder",
      expiresAt: new Date(Date.now() + 86400000),
    },
    update: {},
  });

  console.log("seed-transport-osm: demo locations, quotes, and active dispatch trip");
}
