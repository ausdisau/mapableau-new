import { PostHog } from "posthog-node";

let client: PostHog | null | undefined;

type LlmGenerationCapture = {
  traceName: string;
  model: string;
  provider: string;
  latencyMs: number;
  success: boolean;
  distinctId?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  errorName?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

function getPostHogClient(): PostHog | null {
  if (client !== undefined) return client;

  const apiKey = process.env.POSTHOG_API_KEY?.trim();
  if (!apiKey) {
    client = null;
    return client;
  }

  client = new PostHog(apiKey, {
    host: process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  });
  return client;
}

export function captureLlmGeneration(event: LlmGenerationCapture): void {
  const posthog = getPostHogClient();
  if (!posthog) return;

  posthog.capture({
    distinctId: event.distinctId || "anonymous",
    event: "$ai_generation",
    properties: {
      $ai_trace_name: event.traceName,
      $ai_model: event.model,
      $ai_provider: event.provider,
      $ai_latency_ms: event.latencyMs,
      $ai_is_error: !event.success,
      $ai_input_tokens: event.inputTokens,
      $ai_output_tokens: event.outputTokens,
      $ai_total_tokens: event.totalTokens,
      error_name: event.errorName,
      ...event.metadata,
    },
  });
}

export function getLlmAnalyticsProvider(engineId: string): string {
  if (engineId.includes("/gateway/")) return "vercel-ai-gateway";
  if (engineId.includes("/google/")) return "google";
  return "unknown";
}
