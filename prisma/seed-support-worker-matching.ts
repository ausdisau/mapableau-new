/**
 * npx tsx prisma/seed-support-worker-matching.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organisation.findFirst({ where: { status: "active" } });
  const participant = await prisma.user.findFirst({
    where: { primaryRole: "participant" },
  });
  if (!org || !participant) {
    console.warn("Need organisation and participant — run mapable core seed first");
    return;
  }

  const workers = await prisma.workerProfile.findMany({
    where: { organisationId: org.id },
    take: 5,
  });

  for (let i = 0; i < workers.length; i++) {
    const w = workers[i];
    await prisma.workerMatchProfile.upsert({
      where: { workerProfileId: w.id },
      create: {
        workerProfileId: w.id,
        capabilities: i === 0 ? ["manual_handling"] : ["community_access"],
        behaviourSupportPlanTrained: i === 1,
        communicationModes: ["plain_english"],
        reliabilityScore: 0.9 - i * 0.1,
        cancellationRate: i === 4 ? 0.25 : 0.05,
        hasUnresolvedIncident: i === 3,
      },
      update: {},
    });

    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17, 0, 0, 0);

    await prisma.workerMatchAvailabilityWindow.create({
      data: {
        workerProfileId: w.id,
        startsAt: start,
        endsAt: end,
      },
    });
  }

  await prisma.participantMatchPreferences.upsert({
    where: { participantId: participant.id },
    create: {
      participantId: participant.id,
      blockedWorkerIds: workers[4] ? [workers[4].id] : [],
      preferredLanguages: ["English"],
      maxDistanceKm: 50,
    },
    update: {},
  });

  console.log("Support worker matching seed complete", {
    workers: workers.length,
    participantId: participant.id,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
