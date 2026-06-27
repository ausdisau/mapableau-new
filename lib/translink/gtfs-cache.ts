import JSZip from "jszip";

import { translinkConfig, isTranslinkAvailable } from "@/lib/config/translink";
import { buildGtfsIndex, type GtfsIndex } from "@/lib/translink/gtfs-index";
import { translinkNotConfiguredError } from "@/lib/public-transport/pt-api-error";

let cachedIndex: GtfsIndex | null = null;
let cachedAt = 0;

async function downloadAndParseGtfs(): Promise<GtfsIndex> {
  const res = await fetch(translinkConfig.gtfsUrl, {
    next: { revalidate: translinkConfig.refreshHours * 3600 },
  });
  if (!res.ok) {
    throw new Error(`Translink GTFS download failed: ${res.status}`);
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

  return buildGtfsIndex(files);
}

export async function getTranslinkGtfsIndex(): Promise<GtfsIndex> {
  if (!isTranslinkAvailable()) throw translinkNotConfiguredError();

  const refreshMs = translinkConfig.refreshHours * 3600 * 1000;
  if (cachedIndex && Date.now() - cachedAt < refreshMs) {
    return cachedIndex;
  }

  cachedIndex = await downloadAndParseGtfs();
  cachedAt = Date.now();
  return cachedIndex;
}

export function clearTranslinkGtfsCache(): void {
  cachedIndex = null;
  cachedAt = 0;
}

export async function ensureTranslinkGtfsLoaded(): Promise<boolean> {
  try {
    await getTranslinkGtfsIndex();
    return true;
  } catch {
    return false;
  }
}
