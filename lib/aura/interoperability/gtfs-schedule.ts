import { createHash } from "crypto";

import { advanceImport, startImport } from "./source-registry";

const MAX_FEED_BYTES = 50 * 1024 * 1024;
const MAX_ZIP_RATIO = 100;

export type GtfsStopRecord = {
  stopId: string;
  stopName: string;
  wheelchairBoarding?: 0 | 1 | 2;
  parentStation?: string;
};

export type GtfsPathwayRecord = {
  pathwayId: string;
  fromStopId: string;
  toStopId: string;
  pathwayMode: number;
  isBidirectional: number;
  traversalTime?: number;
  stairCount?: number;
  maxSlope?: number;
  minWidth?: number;
};

export type GtfsImportResult = {
  importId: string;
  agencyCount: number;
  routeCount: number;
  stopCount: number;
  pathwayCount: number;
  attribution?: string;
  feedVersion?: string;
  quarantined: string[];
};

export function validateGtfsFeedSize(byteLength: number): void {
  if (byteLength > MAX_FEED_BYTES) {
    throw new Error("AURA_GTFS_FEED_TOO_LARGE");
  }
}

export function rejectZipBomb(compressedBytes: number, uncompressedBytes: number): void {
  if (compressedBytes > 0 && uncompressedBytes / compressedBytes > MAX_ZIP_RATIO) {
    throw new Error("AURA_GTFS_ZIP_BOMB");
  }
}

export function rejectPathTraversal(filename: string): void {
  if (filename.includes("..") || filename.startsWith("/")) {
    throw new Error("AURA_GTFS_PATH_TRAVERSAL");
  }
}

export function sanitizeGtfsText(text: string): string {
  if (text.startsWith("=") || text.startsWith("+") || text.startsWith("-") || text.startsWith("@")) {
    return `'${text}`;
  }
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

export function parseWheelchairBoarding(value?: string): 0 | 1 | 2 | undefined {
  if (value === undefined || value === "") return undefined;
  const n = Number(value);
  if (n === 0 || n === 1 || n === 2) return n;
  return undefined;
}

export function importGtfsScheduleFixture(input: {
  sourceId: string;
  stops: GtfsStopRecord[];
  pathways: GtfsPathwayRecord[];
  attribution?: string;
  feedVersion?: string;
}): GtfsImportResult {
  const hash = createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
  const run = startImport({
    sourceId: input.sourceId,
    rawSourceHash: hash,
    parserVersion: "gtfs-schedule-1.0.0",
  });

  const quarantined: string[] = [];
  for (const p of input.pathways) {
    if (!input.stops.some((s) => s.stopId === p.fromStopId)) {
      quarantined.push(`pathway:${p.pathwayId}:broken_ref`);
    }
  }

  if (quarantined.length) {
    advanceImport(run.id, "quarantined", { validationWarnings: quarantined });
    return {
      importId: run.id,
      agencyCount: 1,
      routeCount: 1,
      stopCount: input.stops.length,
      pathwayCount: input.pathways.length,
      attribution: input.attribution,
      feedVersion: input.feedVersion,
      quarantined,
    };
  }

  advanceImport(run.id, "imported", {
    importCounts: {
      stops: input.stops.length,
      pathways: input.pathways.length,
    },
  });

  return {
    importId: run.id,
    agencyCount: 1,
    routeCount: 1,
    stopCount: input.stops.length,
    pathwayCount: input.pathways.length,
    attribution: input.attribution,
    feedVersion: input.feedVersion,
    quarantined,
  };
}

/** Missing accessibility value remains unknown — never positive claim. */
export function mapWheelchairBoarding(
  value?: 0 | 1 | 2,
): "unknown" | "accessible" | "not_accessible" {
  if (value === undefined) return "unknown";
  if (value === 1) return "accessible";
  if (value === 0) return "not_accessible";
  return "unknown";
}
