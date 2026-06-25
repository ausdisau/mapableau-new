import { Prisma } from "@prisma/client";

import { embedText } from "@/lib/mapable-agent/rag/embedder";
import { prisma } from "@/lib/prisma";

export async function storeChunkEmbedding(
  chunkId: string,
  embedding: number[],
): Promise<void> {
  const vector = `[${embedding.join(",")}]`;
  await prisma.$executeRaw(
    Prisma.sql`UPDATE document_chunks SET embedding = ${vector}::vector WHERE id = ${chunkId}`,
  );
}

export async function searchDocumentChunks(params: {
  queryEmbedding: number[];
  participantId?: string;
  limit?: number;
}): Promise<Array<{ id: string; content: string; score: number }>> {
  const limit = params.limit ?? 8;
  const vector = `[${params.queryEmbedding.join(",")}]`;

  if (params.participantId) {
    return prisma.$queryRaw<
      Array<{ id: string; content: string; score: number }>
    >(Prisma.sql`
      SELECT id, content, 1 - (embedding <=> ${vector}::vector) AS score
      FROM document_chunks
      WHERE embedding IS NOT NULL AND "participantId" = ${params.participantId}
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit}
    `);
  }

  return prisma.$queryRaw<Array<{ id: string; content: string; score: number }>>(
    Prisma.sql`
      SELECT id, content, 1 - (embedding <=> ${vector}::vector) AS score
      FROM document_chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${limit}
    `,
  );
}

export async function ragSearch(params: {
  query: string;
  participantId?: string;
}): Promise<Array<{ content: string; score: number }>> {
  const embedding = await embedText(params.query);
  if (!embedding) return [];
  const hits = await searchDocumentChunks({
    queryEmbedding: embedding,
    participantId: params.participantId,
  });
  return hits.map((h) => ({ content: h.content, score: h.score }));
}

export { chunkDocumentText } from "@/lib/mapable-agent/rag/chunker";
export { embedText, queueChunkEmbedding } from "@/lib/mapable-agent/rag/embedder";
