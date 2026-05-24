export const nlSearchConfig = {
  enabled: process.env.NL_SEARCH_ENABLED !== "false",
  geminiApiKey: process.env.GOOGLE_GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  geminiBaseUrl:
    process.env.GEMINI_API_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta",
};

export function isNlSearchConfigured(): boolean {
  return nlSearchConfig.enabled && nlSearchConfig.geminiApiKey.length > 0;
}
