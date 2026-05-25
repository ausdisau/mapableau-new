import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type {
  createPeerAnswerSchema,
  createPeerQuestionSchema,
} from "@/lib/validation/peer";
import type { z } from "zod";

import { initialPostStatus, scanPeerContent } from "./content-scanner";
import { enqueueModeration } from "./peer-moderation-service";

export async function listPeerQuestions() {
  return prisma.peerQuestion.findMany({
    where: { status: "published", deletedAt: null },
    orderBy: { publishedAt: "desc" },
    take: 50,
    include: {
      author: { include: { user: { select: { name: true } } } },
      _count: { select: { answers: true } },
    },
  });
}

export async function getPeerQuestion(questionId: string) {
  return prisma.peerQuestion.findUnique({
    where: { id: questionId },
    include: {
      author: { include: { user: { select: { name: true } } } },
      answers: {
        where: { status: "published", deletedAt: null },
        orderBy: [{ moderatorHighlight: "desc" }, { publishedAt: "asc" }],
        include: { author: { include: { user: { select: { name: true } } } } },
      },
    },
  });
}

export async function createPeerQuestion(
  peerProfileId: string,
  userId: string,
  data: z.infer<typeof createPeerQuestionSchema>
) {
  const scan = scanPeerContent(`${data.title}\n${data.body}`);
  const status = initialPostStatus(scan);

  const question = await prisma.peerQuestion.create({
    data: {
      authorId: peerProfileId,
      title: data.title,
      body: data.body,
      topic: data.topic,
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
    include: { author: { include: { user: { select: { name: true } } } } },
  });

  if (scan.shouldQueue) {
    await enqueueModeration({
      contentType: "PeerQuestion",
      contentId: question.id,
      autoFlags: scan,
      priority: scan.priority,
    });
  }

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.question.created",
    entityType: "PeerQuestion",
    entityId: question.id,
  });

  return question;
}

export async function createPeerAnswer(
  peerProfileId: string,
  questionId: string,
  userId: string,
  data: z.infer<typeof createPeerAnswerSchema>
) {
  const scan = scanPeerContent(data.body);
  const status = initialPostStatus(scan);

  const answer = await prisma.peerAnswer.create({
    data: {
      questionId,
      authorId: peerProfileId,
      body: data.body,
      status,
      publishedAt: status === "published" ? new Date() : null,
    },
    include: { author: { include: { user: { select: { name: true } } } } },
  });

  if (scan.shouldQueue) {
    await enqueueModeration({
      contentType: "PeerAnswer",
      contentId: answer.id,
      autoFlags: scan,
      priority: scan.priority,
    });
  }

  await createAuditEvent({
    actorUserId: userId,
    action: "peer.answer.created",
    entityType: "PeerAnswer",
    entityId: answer.id,
  });

  return answer;
}
