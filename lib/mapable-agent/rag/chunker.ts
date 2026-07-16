/** Document chunking for MapAble Agent RAG (pattern from bookings RAG). */

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

export { CHUNK_SIZE };
