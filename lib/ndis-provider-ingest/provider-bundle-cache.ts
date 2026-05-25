import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  parseNdisProviderJson,
  type NdisProviderBundle,
} from "@/lib/ndis-provider-ingest/normalize";
import { PROVIDER_OUTLETS_OUTPUT } from "@/lib/ndis-provider-ingest/constants";

let cached: NdisProviderBundle | null = null;

export async function loadProviderOutletsBundle(): Promise<NdisProviderBundle> {
  if (cached) return cached;
  const path = join(process.cwd(), PROVIDER_OUTLETS_OUTPUT);
  const raw = await readFile(path, "utf8");
  cached = parseNdisProviderJson(JSON.parse(raw));
  return cached;
}

export function clearProviderBundleCache() {
  cached = null;
}
