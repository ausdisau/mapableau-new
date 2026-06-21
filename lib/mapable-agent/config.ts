/** MapAble Agent configuration (gpt-oss via Ollama/vLLM). */

export const mapableAgentConfig = {
  enabled: process.env.MAPABLE_AGENT_ENABLED === "true",
  modelProvider: (process.env.MAPABLE_AGENT_MODEL_PROVIDER ?? "ollama") as
    | "ollama"
    | "vllm",
  modelId: process.env.MAPABLE_AGENT_MODEL ?? "gpt-oss:20b",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  vllmBaseUrl: process.env.VLLM_BASE_URL ?? "http://127.0.0.1:8000/v1",
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
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
};

export function isMapableAgentConfigured(): boolean {
  return mapableAgentConfig.enabled;
}
