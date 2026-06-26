import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Demo seed for MapAble Agent — sessions, review tasks, document chunks. */
export async function seedMapableAgent(demoUserId: string) {
  const session = await prisma.agentSession.upsert({
    where: { id: "seed-agent-session-001" },
    create: {
      id: "seed-agent-session-001",
      actorUserId: demoUserId,
      participantId: demoUserId,
      title: "Demo NDIS plan questions",
      modelProvider: "ollama",
      status: "active",
    },
    update: {},
  });

  await prisma.agentMessage.deleteMany({ where: { sessionId: session.id } });
  await prisma.agentMessage.createMany({
    data: [
      {
        sessionId: session.id,
        role: "user",
        content: "Can you help me understand my core supports budget?",
      },
      {
        sessionId: session.id,
        role: "assistant",
        content:
          "Core supports cover everyday help like personal care and community access. I can summarise your plan sections once you share plan text — a staff member reviews funding suggestions.",
        reasoningSummary: "Classified as plan intent; no PII loaded.",
        confidence: 0.82,
      },
    ],
  });

  await prisma.humanReviewTask.upsert({
    where: { id: "seed-review-001" },
    create: {
      id: "seed-review-001",
      sessionId: session.id,
      participantId: demoUserId,
      category: "funding",
      priority: "normal",
      status: "pending",
      title: "Review plan category mapping",
      summary: "Agent suggested Capacity Building for therapy query — confirm with participant.",
      context: { toolName: "mapSupportToBudgetCategory" },
    },
    update: {},
  });

  await prisma.documentChunk.upsert({
    where: { id: "seed-chunk-001" },
    create: {
      id: "seed-chunk-001",
      participantId: demoUserId,
      sourceType: "ndis_plan",
      content:
        "Goal 1: Increase independence with daily living tasks. Core supports: assistance with self-care up to 10 hours per week.",
      metadata: { demo: true },
    },
    update: {},
  });

  await prisma.agentUserSettings.upsert({
    where: { userId: demoUserId },
    create: {
      userId: demoUserId,
      showReasoningSummary: false,
    },
    update: {},
  });

  console.log("MapAble Agent seed: session, review task, document chunk");
}

if (require.main === module) {
  seedMapableAgent(process.env.SEED_USER_ID ?? "seed-user")
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
