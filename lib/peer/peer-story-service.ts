import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { createPeerStorySchema } from "@/lib/validation/peer";
import type { z } from "zod";

import { initialPostStatus, scanPeerContent } from "./content-scanner";
import { enqueueModeration } from "./peer-moderation-service";

export async function listPeerStories() {
  return prisma.peerStoryItem.findMany({
    where: { status: "published", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      author: { include: { user: { select: { name: true } } } },
    },
  });
}

export async function getPeerStory(storyId: string) {
  return prisma.peerStoryItem.findUnique({
    where: { id: storyId },
    include: {
      author: { include: { user: { select: { name: true } } } },
      comments: {
        where: { status: "published", deletedAt: null },
        include: { author: { include: { user: { select: { name: true } } } } },
      },
    },
  });
}

export async function createPeerStory(
  peerProfileId: string | null,
  userId: string,
  data: z.infer<typeof createPeerStorySchema>
) {
  const scan = scanPeerContent(`${data.title}\n${data.body}`);
  const status = initialPostStatus(scan);

  const story = await prisma.peerStoryItem.create({
    data: {
      authorId: peerProfileId ?? undefined,
      title: data.title,
      body: data.body,
      resourceUrl: data.resourceUrl || null,
      contentWarning: data.contentWarning,
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
    include: { author: { include: { user: { select: { name: true } } } } },
  });

  if (scan.shouldQueue) {
    await enqueueModeration({
      contentType: "PeerStoryItem",
      contentId: story.id,
      autoFlags: scan,
      priority: scan.priority,
    });
  }

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.story.created",
    entityType: "PeerStoryItem",
    entityId: story.id,
  });

  return story;
}

export async function listPeerResources() {
  return prisma.peerResourceLibrary.findMany({
    where: { status: "published" },
    orderBy: { title: "asc" },
  });
}
