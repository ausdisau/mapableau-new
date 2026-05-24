import { readFile } from "node:fs/promises";

import type { NdisProviderListFile } from "./types";

export const NDIS_LIST_PROVIDERS_URL =
  "https://www.ndis.gov.au/sites/default/files/react_extract/provider_finder/build/data/list-providers.json";

export const DEFAULT_LOCAL_PATH = "public/data/provider-outlets.json";

export async function loadNdisProviderList(options: {
  filePath?: string;
  download?: boolean;
}): Promise<NdisProviderListFile> {
  if (options.download) {
    const downloaded = await tryDownloadFromNdis();
    if (downloaded) return downloaded;
    console.warn(
      "NDIS download failed (often 403); falling back to local file."
    );
  }

  const path = options.filePath ?? DEFAULT_LOCAL_PATH;
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as NdisProviderListFile;
}

async function tryDownloadFromNdis(): Promise<NdisProviderListFile | null> {
  try {
    const res = await fetch(NDIS_LIST_PROVIDERS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; MapableAU-ProviderImport/1.0; +https://mapable.com.au)",
      },
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      console.warn(`NDIS fetch HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as NdisProviderListFile;
  } catch (e) {
    console.warn("NDIS fetch error:", e instanceof Error ? e.message : e);
    return null;
  }
}
