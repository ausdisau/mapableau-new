/** Natural-language search interpreter (AI SDK + catalog resolution). */

export type InterpreterProvider = "gateway" | "google" | "openai";

export const searchInterpreterConfig = {
  enabled: process.env.SEARCH_INTERPRETER_ENABLED !== "false",
  aiGatewayApiKey:
    process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_AI_GATEWAY_API_KEY ?? "",
  googleApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  /**
   * Model id. Gateway-style (`google/gemini-3.5-flash`, `openai/gpt-4o-mini`)
   * or bare provider ids (`gemini-3.5-flash`, `gpt-4o-mini`).
   */
  modelId: process.env.SEARCH_INTERPRETER_MODEL ?? "google/gemini-3.5-flash",
  /**
   * Dedicated LLM service-category slug classifier (hint before full NL parse).
   * Works with Google Gemini or OpenAI via `getInterpreterModel()`.
   * Default on when interpreter keys exist; set to `false` to skip.
   */
  geminiCategoryClassifier:
    process.env.SEARCH_INTERPRETER_GEMINI_CLASSIFIER !== "false",
  /** Optional HF text-classifier repo for slug hints (phase 3). */
  classifierHubId: process.env.SEARCH_INTERPRETER_CLASSIFIER_HUB_ID ?? "",
  huggingFaceToken:
    process.env.HF_TOKEN ?? process.env.HUGGINGFACE_API_KEY ?? "",
  elasticsearchUrl: process.env.ES_URL ?? "",
  elasticsearchApiKey: process.env.ES_API_KEY ?? "",
  elasticsearchCategoryAlias:
    process.env.ES_SERVICE_CATEGORY_ALIAS ?? "mapable_service_categories_current",
  /** Dedicated LLM step when keyword needs resolution returns empty but access text is set. */
  needsInterpreterLlm:
    process.env.SEARCH_NEEDS_INTERPRETER_LLM !== "false",
};

export function isSearchInterpreterConfigured(): boolean {
  return (
    searchInterpreterConfig.enabled &&
    (searchInterpreterConfig.aiGatewayApiKey.length > 0 ||
      searchInterpreterConfig.googleApiKey.length > 0 ||
      searchInterpreterConfig.openaiApiKey.length > 0)
  );
}

/** @deprecated Prefer {@link isCategoryClassifierEnabled}. */
export function isGeminiCategoryClassifierEnabled(): boolean {
  return isCategoryClassifierEnabled();
}

export function isCategoryClassifierEnabled(): boolean {
  return (
    isSearchInterpreterConfigured() &&
    searchInterpreterConfig.geminiCategoryClassifier
  );
}

export function isElasticsearchCategorySearchConfigured(): boolean {
  return (
    searchInterpreterConfig.elasticsearchUrl.length > 0 &&
    searchInterpreterConfig.elasticsearchApiKey.length > 0
  );
}

export function isNeedsInterpreterLlmEnabled(): boolean {
  return (
    isSearchInterpreterConfigured() && searchInterpreterConfig.needsInterpreterLlm
  );
}
