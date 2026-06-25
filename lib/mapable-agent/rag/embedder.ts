import { mapableAgentConfig } from "@/lib/mapable-agent/config";
import { enqueueEmbedDocument } from "@/lib/queue/queues";

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

async function embedTextViaOpenAICompatible(text: string): Promise<number[] | null> {
  const baseURL = mapableAgentConfig.vllmBaseUrl.replace(/\/$/, "");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (mapableAgentConfig.vllmApiKey) {
    headers.Authorization = `Bearer ${mapableAgentConfig.vllmApiKey}`;
  }

  try {
    const res = await fetch(`${baseURL}/embeddings`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: mapableAgentConfig.embeddingModel,
        input: text,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
    return json.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

/** Ollama locally; OpenAI-compatible /embeddings on Vercel or when provider is vllm. */
export async function embedText(text: string): Promise<number[] | null> {
  if (mapableAgentConfig.modelProvider === "vllm" || mapableAgentConfig.isVercel) {
    return embedTextViaOpenAICompatible(text);
  }
  return embedTextViaOllama(text);
}

export async function queueChunkEmbedding(chunkId: string, content: string): Promise<void> {
  await enqueueEmbedDocument({ chunkId, content });
}
