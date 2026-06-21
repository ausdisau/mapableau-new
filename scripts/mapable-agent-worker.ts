#!/usr/bin/env tsx
/**
 * BullMQ worker for MapAble Agent background jobs (document embeddings).
 * Run: pnpm mapable-agent:worker
 */
import { startEmbedDocumentWorker } from "@/lib/queue/workers/embed-document-worker";

const worker = startEmbedDocumentWorker();

worker.on("completed", (job) => {
  console.log(`[embed] completed ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[embed] failed ${job?.id}`, err);
});

console.log("MapAble Agent embed worker running…");
