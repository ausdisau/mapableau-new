import JSZip from "jszip";

import { buildGtfsIndex, mergeGtfsIndexes, type GtfsIndex } from "@/lib/gtfs/index";

export type GtfsCacheConfig = {
  gtfsUrls: string[];
  refreshHours: number;
  fetchHeaders?: Record<string, string>;
};

async function downloadGtfsFiles(
  url: string,
  fetchHeaders?: Record<string, string>,
  refreshHours = 24
): Promise<Record<string, string>> {
  const res = await fetch(url, {
    headers: fetchHeaders,
    next: { revalidate: refreshHours * 3600 },
  });
  if (!res.ok) {
    throw new Error(`GTFS download failed (${url}): ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const files: Record<string, string> = {};

  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue;
    const baseName = name.split("/").pop()?.replace(".txt", "") ?? name;
    if (["stops", "routes", "trips", "stop_times"].includes(baseName)) {
      files[baseName] = await file.async("string");
    }
  }

  return files;
}

export function createGtfsCache(config: GtfsCacheConfig) {
  let cachedIndex: GtfsIndex | null = null;
  let cachedAt = 0;

  async function downloadAndParseGtfs(): Promise<GtfsIndex> {
    const indexes = await Promise.all(
      config.gtfsUrls.map(async (url) => {
        const files = await downloadGtfsFiles(url, config.fetchHeaders, config.refreshHours);
        return buildGtfsIndex(files);
      })
    );
    return indexes.length === 1 ? indexes[0]! : mergeGtfsIndexes(indexes);
  }

  async function getIndex(): Promise<GtfsIndex> {
    const refreshMs = config.refreshHours * 3600 * 1000;
    if (cachedIndex && Date.now() - cachedAt < refreshMs) {
      return cachedIndex;
    }

    cachedIndex = await downloadAndParseGtfs();
    cachedAt = Date.now();
    return cachedIndex;
  }

  function clear(): void {
    cachedIndex = null;
    cachedAt = 0;
  }

  async function ensureLoaded(): Promise<boolean> {
    try {
      await getIndex();
      return true;
    } catch {
      return false;
    }
  }

  return { getIndex, clear, ensureLoaded };
}

export type GtfsCache = ReturnType<typeof createGtfsCache>;
