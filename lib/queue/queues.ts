import { Queue } from "bullmq";

import { getQueueConnection } from "@/lib/queue/connection";

export const EMBED_DOCUMENT_QUEUE = "mapable-agent-embed-document";
export const NOTIFY_REVIEW_QUEUE = "mapable-agent-notify-review";

let embedQueue: Queue | null = null;
let notifyQueue: Queue | null = null;

export function getEmbedDocumentQueue(): Queue {
  if (!embedQueue) {
    embedQueue = new Queue(EMBED_DOCUMENT_QUEUE, {
      connection: getQueueConnection(),
    });
  }
  return embedQueue;
}

export function getNotifyReviewQueue(): Queue {
  if (!notifyQueue) {
    notifyQueue = new Queue(NOTIFY_REVIEW_QUEUE, {
      connection: getQueueConnection(),
    });
  }
  return notifyQueue;
}

export type EmbedDocumentJob = {
  chunkId: string;
  content: string;
};

export async function enqueueEmbedDocument(job: EmbedDocumentJob): Promise<void> {
  await getEmbedDocumentQueue().add("embed", job, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}
