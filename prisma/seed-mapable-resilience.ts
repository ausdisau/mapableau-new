import type { PrismaClient } from "@prisma/client";

const INITIAL_FLAGS = [
  { key: "service_recovery_enabled", name: "Service Recovery", moduleArea: "service_recovery" },
  { key: "waitlist_exchange_enabled", name: "Waitlist & Capacity Exchange", moduleArea: "capacity" },
  { key: "outcomes_tracker_enabled", name: "Outcomes Tracker", moduleArea: "outcomes" },
  { key: "quote_marketplace_enabled", name: "Quote Marketplace", moduleArea: "quotes" },
  { key: "support_desk_enabled", name: "Support Desk", moduleArea: "support" },
  { key: "journey_timeline_enabled", name: "Journey Timeline", moduleArea: "timeline" },
  { key: "evidence_pack_builder_enabled", name: "Evidence Pack Builder", moduleArea: "evidence" },
  { key: "unmet_need_register_enabled", name: "Unmet Need Register", moduleArea: "unmet_needs" },
  { key: "provider_quality_signals_enabled", name: "Provider Quality Signals", moduleArea: "quality" },
];

export async function seedMapableResilience(prisma: PrismaClient) {
  for (const f of INITIAL_FLAGS) {
    await prisma.featureFlag.upsert({
      where: { key: f.key },
      create: {
        key: f.key,
        name: f.name,
        description: `Controls rollout of ${f.name}`,
        enabled: true,
        rolloutPercentage: 100,
        environment: "all",
        moduleArea: f.moduleArea,
        killSwitch: false,
      },
      update: {},
    });
  }

  await prisma.betaGroup.upsert({
    where: { key: "resilience_beta" },
    create: {
      key: "resilience_beta",
      name: "Resilience wave beta",
      description: "Early testers for Phase 13 modules",
    },
    update: {},
  });

  // Demo scenarios (fictional names) — attach to existing seeded users when present
  const alex = await prisma.user.findFirst({
    where: { name: { contains: "Alex", mode: "insensitive" } },
  });
  const priya = await prisma.user.findFirst({
    where: { name: { contains: "Priya", mode: "insensitive" } },
  });
  const demoParticipant = alex ?? priya;
  if (demoParticipant) {
    await prisma.betaGroupMember.upsert({
      where: {
        betaGroupId_userId: {
          betaGroupId: (
            await prisma.betaGroup.findUniqueOrThrow({
              where: { key: "resilience_beta" },
            })
          ).id,
          userId: demoParticipant.id,
        },
      },
      create: {
        betaGroupId: (
          await prisma.betaGroup.findUniqueOrThrow({
            where: { key: "resilience_beta" },
          })
        ).id,
        userId: demoParticipant.id,
      },
      update: {},
    });
  }
}
