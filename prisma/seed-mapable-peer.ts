import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedMapablePeer() {
  const existing = await prisma.peerCircle.findFirst();
  if (existing) return;

  await prisma.peerCircle.create({
    data: {
      title: "Navigating NDIS plans",
      description:
        "Share lived experience about plan reviews, goals, and working with coordinators. Not legal or financial advice.",
      topic: "ndis",
      circleType: "moderated",
      accessibilityNotes: "Plain language welcome. Camera optional in linked events.",
      moderationLevel: "standard",
    },
  });

  await prisma.peerCircle.create({
    data: {
      title: "Daily living and independence",
      description: "Peer tips for routines, equipment, and community access.",
      topic: "daily_living",
      circleType: "open",
      moderationLevel: "standard",
    },
  });

  await prisma.peerResourceLibrary.createMany({
    data: [
      {
        title: "Community guidelines (Easy Read summary)",
        description: "How MapAble Peer keeps connection safe and respectful.",
        category: "guidelines",
      },
      {
        title: "Crisis and support contacts",
        description: "If you or someone else is unsafe, use these services immediately.",
        url: "https://www.lifeline.org.au/",
        category: "safety",
      },
    ],
  });
}
