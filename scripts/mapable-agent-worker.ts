#!/usr/bin/env tsx
/**
 * BullMQ worker for MapAble Agent background jobs (document embeddings, review notifications).
 * Run: pnpm mapable-agent:worker
 */
import { startEmbedDocumentWorker } from "@/lib/queue/workers/embed-document-worker";
import { startNotifyReviewWorker } from "@/lib/queue/workers/notify-review-worker";

const embedWorker = startEmbedDocumentWorker();
const notifyWorker = startNotifyReviewWorker();

embedWorker.on("completed", (job) => {
  console.log(`[embed] completed ${job.id}`);
});

embedWorker.on("failed", (job, err) => {
  console.error(`[embed] failed ${job?.id}`, err);
});

notifyWorker.on("completed", (job) => {
  console.log(`[notify-review] completed ${job.id}`);
});

notifyWorker.on("failed", (job, err) => {
  console.error(`[notify-review] failed ${job?.id}`, err);
});

console.log("MapAble Agent workers running (embed + notify-review)…");
