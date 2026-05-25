import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type {
  createPeerCirclePostSchema,
  createPeerReplySchema,
} from "@/lib/validation/peer";
import type { z } from "zod";

import { assertCircleMembership } from "./access-control";
import { initialPostStatus, scanPeerContent } from "./content-scanner";
import { enqueueModeration } from "./peer-moderation-service";

export async function createCirclePost(
  peerProfileId: string,
  circleId: string,
  userId: string,
  data: z.infer<typeof createPeerCirclePostSchema>
) {
  await assertCircleMembership(peerProfileId, circleId);

  const scan = scanPeerContent(data.body);
  const status = initialPostStatus(scan);

  const post = await prisma.peerCirclePost.create({
    data: {
      circleId,
      authorId: peerProfileId,
      body: data.body,
      contentWarning: data.contentWarning,
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
    include: { author: { include: { user: { select: { name: true } } } } },
  });

  if (scan.shouldQueue) {
    await enqueueModeration({
      contentType: "PeerCirclePost",
      contentId: post.id,
      autoFlags: scan,
      priority: scan.priority,
    });
  }

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.post.created",
    entityType: "PeerCirclePost",
    entityId: post.id,
    metadata: { status, flags: scan.flags },
  });

  return post;
}

export async function createCircleReply(
  peerProfileId: string,
  postId: string,
  userId: string,
  data: z.infer<typeof createPeerReplySchema>
) {
  const post = await prisma.peerCirclePost.findUnique({
    where: { id: postId },
  });
  if (!post) throw new Error("POST_NOT_FOUND");

  await assertCircleMembership(peerProfileId, post.circleId);

  const scan = scanPeerContent(data.body);
  const status = initialPostStatus(scan);

  const reply = await prisma.peerCircleReply.create({
    data: {
      postId,
      authorId: peerProfileId,
      body: data.body,
      status,
    },
    include: { author: { include: { user: { select: { name: true } } } } },
  });

  if (scan.shouldQueue) {
    await enqueueModeration({
      contentType: "PeerCircleReply",
      contentId: reply.id,
      autoFlags: scan,
      priority: scan.priority,
    });
  }

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.reply.created",
    entityType: "PeerCircleReply",
    entityId: reply.id,
    metadata: { status },
  });

  return reply;
}

export async function getPostWithReplies(postId: string) {
  return prisma.peerCirclePost.findUnique({
    where: { id: postId },
    include: {
      author: { include: { user: { select: { name: true } } } },
      replies: {
        where: { status: "published", deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: { author: { include: { user: { select: { name: true } } } } },
      },
    },
  });
}
