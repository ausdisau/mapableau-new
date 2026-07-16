import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import {
  embedText,
  storeChunkEmbedding,
} from "@/lib/mapable-agent/rag/search";
import { prisma } from "@/lib/prisma";

export type EmbedPendingResult = {
  processed: number;
  skipped: number;
  failed: number;
};

/**
 * Embed document chunks that have no vector yet.
 * Used by Vercel cron when BullMQ worker is unavailable.
 */
export async function embedPendingDocumentChunks(
  limit = mapableAgentConfig.embedBatchSize,
): Promise<EmbedPendingResult> {
  const chunks = await prisma.$queryRaw<Array<{ id: string; content: string }>>`
    SELECT id, content FROM document_chunks
    WHERE embedding IS NULL
    ORDER BY "createdAt" ASC
    LIMIT ${limit}
  `;

  let processed = 0;
  let failed = 0;

  for (const chunk of chunks) {
    const embedding = await embedText(chunk.content);
    if (!embedding) {
      failed += 1;
      continue;
    }
    try {
      await storeChunkEmbedding(chunk.id, embedding);
      processed += 1;
    } catch {
      failed += 1;
    }
  }

  return { processed, skipped: chunks.length === 0 ? 1 : 0, failed };
}
