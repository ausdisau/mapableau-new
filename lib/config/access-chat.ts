/** MapAble Access chat search — feature flags and model IDs. */

export const accessChatConfig = {
  enabled: process.env.ACCESS_CHAT_ENABLED !== "false",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  geminiApiKey:
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    "",
  aiGatewayApiKey:
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_AI_GATEWAY_API_KEY ?? "",
  openaiModel: process.env.ACCESS_CHAT_OPENAI_MODEL ?? "gpt-4.1-mini",
  geminiModel:
    process.env.ACCESS_CHAT_GEMINI_MODEL ?? "google/gemini-2.5-flash",
  resultLimit: Number(process.env.ACCESS_CHAT_RESULT_LIMIT ?? "5"),
  maxResultsFloor: 3,
  maxResultsCeil: 5,
};

export function isAccessChatEnabled(): boolean {
  return accessChatConfig.enabled;
}

export function isOpenAiConfigured(): boolean {
  return accessChatConfig.openaiApiKey.length > 0;
}

export function isGeminiConfigured(): boolean {
  return (
    accessChatConfig.geminiApiKey.length > 0 ||
    accessChatConfig.aiGatewayApiKey.length > 0
  );
}

export function isAnyAccessChatModelConfigured(): boolean {
  return isOpenAiConfigured() || isGeminiConfigured();
}
