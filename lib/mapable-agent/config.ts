/** MapAble Agent configuration (gpt-oss via Ollama/vLLM). */

export type MapableAgentModelProvider = "ollama" | "vllm";

function isVercelDeployment(): boolean {
  return process.env.VERCEL === "1";
}

function resolveRedisUrl(): string | undefined {
  return (
    process.env.REDIS_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim() ||
    process.env.KV_REDIS_URL?.trim() ||
    undefined
  );
}

function resolveModelProvider(): MapableAgentModelProvider {
  const explicit = process.env.MAPABLE_AGENT_MODEL_PROVIDER?.trim();
  if (explicit === "ollama" || explicit === "vllm") return explicit;
  // Ollama cannot run inside Vercel serverless — default to vLLM on Vercel.
  return isVercelDeployment() ? "vllm" : "ollama";
}

const redisUrl = resolveRedisUrl();

export const mapableAgentConfig = {
  enabled: process.env.MAPABLE_AGENT_ENABLED === "true",
  isVercel: isVercelDeployment(),
  modelProvider: resolveModelProvider(),
  modelId: process.env.MAPABLE_AGENT_MODEL ?? "gpt-oss:20b",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  vllmBaseUrl: process.env.VLLM_BASE_URL ?? "http://127.0.0.1:8000/v1",
  vllmApiKey: process.env.VLLM_API_KEY ?? process.env.MAPABLE_AGENT_VLLM_API_KEY ?? "",
  confidenceThreshold: Math.min(
    Math.max(Number(process.env.MAPABLE_AGENT_CONFIDENCE_THRESHOLD ?? "0.7"), 0),
    1,
  ),
  maxSteps: Math.min(
    Math.max(Number(process.env.MAPABLE_AGENT_MAX_STEPS ?? "8"), 1),
    16,
  ),
  embeddingModel: process.env.MAPABLE_AGENT_EMBEDDING_MODEL ?? "nomic-embed-text",
  embeddingDimensions: 1536,
  /** BullMQ / Redis — optional on Vercel; use cron embed route instead. */
  redisUrl: redisUrl ?? "redis://127.0.0.1:6379",
  queueEnabled: Boolean(redisUrl),
  /** Max document chunks to embed per cron invocation on Vercel. */
  embedBatchSize: Math.min(
    Math.max(Number(process.env.MAPABLE_AGENT_EMBED_BATCH_SIZE ?? "10"), 1),
    50,
  ),
};

export function isMapableAgentConfigured(): boolean {
  return mapableAgentConfig.enabled;
}

export function isMapableAgentQueueEnabled(): boolean {
  return mapableAgentConfig.queueEnabled;
}

export type MapableAgentRuntimeIssue = {
  code: string;
  message: string;
};

/** Validates env for the current deployment target (local vs Vercel). */
export function getMapableAgentRuntimeIssues(): MapableAgentRuntimeIssue[] {
  if (!mapableAgentConfig.enabled) return [];

  const issues: MapableAgentRuntimeIssue[] = [];

  if (mapableAgentConfig.isVercel && mapableAgentConfig.modelProvider === "ollama") {
    issues.push({
      code: "ollama_on_vercel",
      message:
        "Ollama cannot run on Vercel. Set MAPABLE_AGENT_MODEL_PROVIDER=vllm and VLLM_BASE_URL to a reachable HTTPS endpoint.",
    });
  }

  if (mapableAgentConfig.modelProvider === "vllm") {
    const url = mapableAgentConfig.vllmBaseUrl;
    if (!url || url.includes("127.0.0.1") || url.includes("localhost")) {
      issues.push({
        code: "vllm_unreachable",
        message:
          "VLLM_BASE_URL must point to an external OpenAI-compatible endpoint reachable from Vercel (HTTPS).",
      });
    }
  }

  if (mapableAgentConfig.isVercel && !mapableAgentConfig.queueEnabled) {
    issues.push({
      code: "queue_disabled",
      message:
        "REDIS_URL is not set — BullMQ worker is disabled. Use the Vercel cron route /api/cron/mapable-agent/embed for document embeddings.",
    });
  }

  return issues;
}

export function assertMapableAgentRuntimeReady(): void {
  const blocking = getMapableAgentRuntimeIssues().filter(
    (i) => i.code === "ollama_on_vercel" || i.code === "vllm_unreachable",
  );
  if (blocking.length > 0) {
    throw new Error(blocking.map((i) => i.message).join(" "));
  }
}
