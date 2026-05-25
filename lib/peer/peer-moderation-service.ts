import type { PeerModerationDecision, PeerPostStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { moderationDecisionSchema } from "@/lib/validation/peer";
import type { z } from "zod";

import { createSafetyEvent } from "./peer-safety-service";

export async function enqueueModeration(params: {
  reportId?: string;
  contentType: string;
  contentId: string;
  priority?: string;
  autoFlags?: unknown;
}) {
  const existing = await prisma.peerModerationQueue.findFirst({
    where: {
      contentType: params.contentType,
      contentId: params.contentId,
      status: { in: ["open", "in_review"] },
    },
  });
  if (existing) return existing;

  return prisma.peerModerationQueue.create({
    data: {
      reportId: params.reportId,
      contentType: params.contentType,
      contentId: params.contentId,
      priority: params.priority ?? "normal",
      autoFlags: params.autoFlags as object | undefined,
    },
  });
}

export async function listModerationQueue() {
  return prisma.peerModerationQueue.findMany({
    where: { status: { in: ["open", "in_review"] } },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    include: { report: true, actions: { orderBy: { createdAt: "desc" }, take: 3 } },
  });
}

async function setContentStatus(
  contentType: string,
  contentId: string,
  status: PeerPostStatus
) {
  const now = new Date();
  switch (contentType) {
    case "PeerCirclePost":
      await prisma.peerCirclePost.update({
        where: { id: contentId },
        data: {
          status,
          publishedAt: status === "published" ? now : undefined,
          deletedAt: status === "deleted" ? now : status === "hidden" ? now : null,
        },
      });
      break;
    case "PeerCircleReply":
      await prisma.peerCircleReply.update({
        where: { id: contentId },
        data: {
          status,
          deletedAt: status === "hidden" || status === "deleted" ? now : null,
        },
      });
      break;
    case "PeerQuestion":
      await prisma.peerQuestion.update({
        where: { id: contentId },
        data: {
          status,
          publishedAt: status === "published" ? now : undefined,
          deletedAt: status === "deleted" ? now : null,
        },
      });
      break;
    case "PeerAnswer":
      await prisma.peerAnswer.update({
        where: { id: contentId },
        data: {
          status,
          publishedAt: status === "published" ? now : undefined,
          deletedAt: status === "hidden" || status === "deleted" ? now : null,
        },
      });
      break;
    case "PeerStoryItem":
      await prisma.peerStoryItem.update({
        where: { id: contentId },
        data: {
          status,
          publishedAt: status === "published" ? now : undefined,
          deletedAt: status === "deleted" ? now : null,
        },
      });
      break;
    default:
      break;
  }
}

export async function applyModerationDecision(
  queueId: string,
  actorUserId: string,
  data: z.infer<typeof moderationDecisionSchema>
) {
  const queue = await prisma.peerModerationQueue.findUnique({
    where: { id: queueId },
  });
  if (!queue) throw new Error("QUEUE_NOT_FOUND");

  await prisma.peerModerationAction.create({
    data: {
      queueId,
      actorUserId,
      decision: data.decision as PeerModerationDecision,
      notes: data.notes,
    },
  });

  let contentStatus: PeerPostStatus | null = null;
  switch (data.decision) {
    case "approve":
      contentStatus = "published";
      break;
    case "hide":
      contentStatus = "hidden";
      break;
    case "request_edit":
      contentStatus = "draft";
      break;
    case "pause_account": {
      const post = await prisma.peerCirclePost.findUnique({
        where: { id: queue.contentId },
        select: { author: { select: { userId: true } } },
      });
      if (post?.author?.userId) {
        await prisma.peerProfile.updateMany({
          where: { userId: post.author.userId },
          data: { status: "paused" },
        });
      }
      contentStatus = "hidden";
      break;
    }
    case "escalate_safeguarding":
      await createSafetyEvent({
        createdById: actorUserId,
        contentType: queue.contentType,
        contentId: queue.contentId,
        eventType: "moderator_escalation",
        description: data.notes,
      });
      contentStatus = "hidden";
      break;
    default:
      contentStatus = "hidden";
  }

  if (contentStatus) {
    await setContentStatus(queue.contentType, queue.contentId, contentStatus);
  }

  await prisma.peerModerationQueue.update({
    where: { id: queueId },
    data: { status: "resolved" },
  });

  await createAuditEvent({
    actorUserId,
    action: "peer.moderation.decision",
    entityType: "PeerModerationQueue",
    entityId: queueId,
    metadata: { decision: data.decision },
  });

  return queue;
}
