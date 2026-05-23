/**
 * Scheduling demo seed — run with:
 * npx tsx prisma/seed-scheduling-demo.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organisation.findFirst({ where: { status: "active" } });
  if (!org) {
    console.warn("No organisation found — skip scheduling seed");
    return;
  }

  const participant = await prisma.user.findFirst({
    where: { primaryRole: "participant" },
  });
  if (!participant) {
    console.warn("No participant user — skip scheduling seed");
    return;
  }

  const site = await prisma.serviceSite.upsert({
    where: { id: "seed-site-sydney-depot" },
    create: {
      id: "seed-site-sydney-depot",
      organisationId: org.id,
      name: "Sydney Depot",
      addressPublic: "Public depot address",
      suburb: "Sydney",
      state: "NSW",
      lat: -33.8688,
      lng: 151.2093,
      capabilities: { wheelchair: true },
    },
    update: {},
  });

  const pickup = await prisma.participantLocation.upsert({
    where: { id: "seed-loc-pickup" },
    create: {
      id: "seed-loc-pickup",
      participantId: participant.id,
      label: "Community hub pickup",
      suburb: "Parramatta",
      state: "NSW",
      lat: -33.815,
      lng: 151.0,
      isDefaultPickup: true,
    },
    update: {},
  });

  const dropoff = await prisma.participantLocation.upsert({
    where: { id: "seed-loc-dropoff" },
    create: {
      id: "seed-loc-dropoff",
      participantId: participant.id,
      label: "Medical appointment",
      suburb: "Sydney",
      state: "NSW",
      lat: -33.87,
      lng: 151.21,
    },
    update: {},
  });

  console.log("Scheduling demo seed:", {
    siteId: site.id,
    pickupId: pickup.id,
    dropoffId: dropoff.id,
    organisationId: org.id,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
