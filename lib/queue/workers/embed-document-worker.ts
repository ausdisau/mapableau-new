import { Worker } from "bullmq";

import { storeChunkEmbedding, embedText } from "@/lib/mapable-agent/rag/search";
import { getQueueConnection } from "@/lib/queue/connection";
import { EMBED_DOCUMENT_QUEUE, type EmbedDocumentJob } from "@/lib/queue/queues";

export function startEmbedDocumentWorker(): Worker<EmbedDocumentJob> {
  return new Worker<EmbedDocumentJob>(
    EMBED_DOCUMENT_QUEUE,
    async (job) => {
      const embedding = await embedText(job.data.content);
      if (embedding) {
        await storeChunkEmbedding(job.data.chunkId, embedding);
      }
    },
    { connection: getQueueConnection() },
  );
}
