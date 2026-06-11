import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapAbleCoordinate() {
  console.log("Seeding MapAble Coordinate demo data...");

  const participant = await prisma.user.findUnique({
    where: { email: "participant@mapable.test" },
  });
  const coordinator = await prisma.user.findUnique({
    where: { email: "coordinator@mapable.test" },
  });

  if (!participant || !coordinator) {
    console.log("Skipping Coordinate seed — core users missing.");
    return;
  }

  await prisma.supportCoordinatorRelationship.upsert({
    where: {
      participantId_coordinatorId: {
        participantId: participant.id,
        coordinatorId: coordinator.id,
      },
    },
    create: {
      participantId: participant.id,
      coordinatorId: coordinator.id,
      status: "active",
      scopesJson: ["support_coordination.access", "profile.read"],
    },
    update: { status: "active" },
  });

  const planStart = new Date();
  const planEnd = new Date(planStart);
  planEnd.setFullYear(planEnd.getFullYear() + 1);

  const plan = await prisma.coordinateNdisPlan.upsert({
    where: { id: "seed-coordinate-plan-1" },
    create: {
      id: "seed-coordinate-plan-1",
      participantId: participant.id,
      createdById: coordinator.id,
      planStart,
      planEnd,
      status: "active",
      summaryJson: {
        headline: "Build community participation and daily living skills",
        keyPoints: [
          "Increase social outings twice per month",
          "Support with meal planning and budgeting",
          "Maintain therapy appointments",
        ],
      },
      aiConfidence: 0.78,
      aiReason: "Summary derived from uploaded plan metadata and stated goals.",
      requiresReview: false,
    },
    update: {},
  });

  await prisma.coordinatePlanGoal.upsert({
    where: { id: "seed-coordinate-goal-1" },
    create: {
      id: "seed-coordinate-goal-1",
      planId: plan.id,
      title: "Join community activities",
      description: "Attend local art class and community events with support.",
      category: "Social & community participation",
      priority: 1,
      status: "confirmed",
      confidence: 0.82,
      reason: "Explicit goal in plan summary.",
    },
    update: {},
  });

  await prisma.coordinateBudgetCategory.upsert({
    where: { id: "seed-coordinate-budget-1" },
    create: {
      id: "seed-coordinate-budget-1",
      planId: plan.id,
      supportCategory: "Core supports — Assistance with social & community participation",
      allocatedCents: 1200000,
      spentCents: 320000,
      committedCents: 80000,
      periodStart: planStart,
      periodEnd: planEnd,
    },
    update: {},
  });

  await prisma.coordinateSupportNeed.upsert({
    where: { id: "seed-coordinate-need-1" },
    create: {
      id: "seed-coordinate-need-1",
      planId: plan.id,
      needType: "community_access",
      description: "Support worker for community outings, 3 hours weekly.",
      linkedGoalIds: ["seed-coordinate-goal-1"],
      urgency: "medium",
    },
    update: {},
  });

  await prisma.coordinateHumanReviewTask.upsert({
    where: { id: "seed-coordinate-review-1" },
    create: {
      id: "seed-coordinate-review-1",
      participantId: participant.id,
      assigneeId: coordinator.id,
      taskType: "low_confidence",
      status: "open",
      priority: 2,
      summary: "Review AI-extracted therapy goal wording",
      payloadJson: { planId: plan.id },
      sourceEntityType: "CoordinateNdisPlan",
      sourceEntityId: plan.id,
      confidence: 0.58,
      reason: "Confidence below threshold for auto-confirmation.",
    },
    update: {},
  });

  await prisma.coordinateCommunicationDraft.upsert({
    where: { id: "seed-coordinate-draft-1" },
    create: {
      id: "seed-coordinate-draft-1",
      participantId: participant.id,
      authorId: coordinator.id,
      channel: "email",
      subject: "Checking in about your community activities goal",
      body:
        "Hi Alex,\n\nI drafted a check-in about your community activities goal. Please review before anything is sent.\n\nKind regards,\nSam",
      plainLanguageBody:
        "Hi Alex — I wrote a friendly check-in about joining community activities. Nothing will be sent until you approve it.",
      status: "pending_approval",
      confidence: 0.71,
      reason: "Draft for participant approval; not sent automatically.",
      reviewTaskId: "seed-coordinate-review-1",
    },
    update: {},
  });

  console.log("MapAble Coordinate seed done.");
}
