import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const CHUNK_SIZE = 800;

export function chunkDocumentText(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const chunks: string[] = [];
  for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
    chunks.push(normalized.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

export async function embedTextViaOllama(text: string): Promise<number[] | null> {
  try {
    const res = await fetch(`${mapableAgentConfig.ollamaBaseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: mapableAgentConfig.embeddingModel,
        prompt: text,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { embedding?: number[] };
    return json.embedding ?? null;
  } catch {
    return null;
  }
}

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
  const embedding = await embedTextViaOllama(params.query);
  if (!embedding) return [];
  const hits = await searchDocumentChunks({
    queryEmbedding: embedding,
    participantId: params.participantId,
  });
  return hits.map((h) => ({ content: h.content, score: h.score }));
}
