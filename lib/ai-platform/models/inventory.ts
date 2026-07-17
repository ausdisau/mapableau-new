import type { AiModelProvider } from "@prisma/client";

/**
 * AI model profile inventory. Model rows are pinned by (slug, versionKey) so
 * that any live execution can point at the specific weights/version used.
 */

export interface AiModelProfileRecord {
  id: string;
  slug: string;
  provider: AiModelProvider;
  modelName: string;
  versionKey: string;
  contextWindow: number;
  supportsTools: boolean;
  productionActivated: boolean;
}

export function isModelUsable(model: AiModelProfileRecord | null): boolean {
  if (!model) return false;
  if (model.provider === "disabled") return false;
  return true;
}

export function isVendorApi(model: AiModelProfileRecord): boolean {
  return model.provider === "vendor_api";
}
