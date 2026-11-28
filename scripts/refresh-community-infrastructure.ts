/** Manual snapshot refresh. No credentials, upstream edits, database writes or scheduled jobs. */
import { createHash } from "node:crypto";
import { open, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildCommunityOverpassQuery,
  COMMUNITY_AREAS,
  getCommunityArea,
} from "../lib/access/community-infrastructure/config";
import {
  councilJurisdictionForPoint,
  parseCouncilBoundarySnapshot,
} from "../lib/access/community-infrastructure/council-geometry";
import { normaliseOverpassResponse } from "../lib/access/community-infrastructure/normalise";
import type { CommunitySnapshot } from "../lib/access/community-infrastructure/types";

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const MAX_BYTES = 4_000_000;
const USAGE =
  "Usage: node --import tsx scripts/refresh-community-infrastructure.ts [all|parramatta|penrith|blacktown] OR --from-file AREA FILE --retrieved-at ISO_TIMESTAMP";

async function readBoundedFileBytes(filename: string): Promise<Buffer> {
  const file = await open(path.resolve(filename), "r");
  try {
    const buffer = Buffer.alloc(MAX_BYTES + 1);
    let size = 0;
    for (;;) {
      const { bytesRead } = await file.read(
        buffer,
        size,
        buffer.length - size,
        size,
      );
      size += bytesRead;
      if (size > MAX_BYTES) throw new Error("Source file exceeds limit");
      if (bytesRead === 0) break;
    }
    return buffer.subarray(0, size);
  } finally {
    await file.close();
  }
}

async function readBoundedFile(filename: string): Promise<unknown> {
  return JSON.parse((await readBoundedFileBytes(filename)).toString("utf8"));
}

async function readBoundedResponse(response: Response): Promise<unknown> {
  if (!response.ok || !response.body)
    throw new Error(`Source HTTP ${response.status}`);
  if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES)
    throw new Error("Source response exceeds limit");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error("Source response exceeds limit");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function main() {
  const args = process.argv.slice(2);
  const fromFile = args[0] === "--from-file";
  if (
    (fromFile && (args.length !== 5 || args[3] !== "--retrieved-at")) ||
    (!fromFile && args.length > 1)
  )
    throw new Error(USAGE);
  const areaArg = fromFile ? args[1] : (args[0] ?? "all");
  const receiptTime = fromFile ? args[4] : undefined;
  if (
    fromFile &&
    (areaArg === "all" ||
      !receiptTime ||
      !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
        receiptTime,
      ) ||
      !Number.isFinite(Date.parse(receiptTime)) ||
      new Date(`${receiptTime.slice(0, 10)}T00:00:00.000Z`)
        .toISOString()
        .slice(0, 10) !== receiptTime.slice(0, 10))
  )
    throw new Error(USAGE);
  const selected =
    areaArg === "all" ? COMMUNITY_AREAS : [getCommunityArea(areaArg)];
  if (selected.some((area) => !area)) throw new Error("Unknown study area");
  // Read-only, pinned local boundary input. Fail before source requests or writes
  // if it is missing, changed, malformed or incomplete. Never import this large
  // geometry asset into the runtime API/client bundle.
  const boundaryBytes = await readBoundedFileBytes(
    "data/community-infrastructure/nsw-lga-boundaries.geojson",
  );
  const boundaryReceipt = await readBoundedFile(
    "data/community-infrastructure/nsw-lga-boundaries-receipt.json",
  );
  const councilBoundaries = parseCouncilBoundarySnapshot(
    JSON.parse(boundaryBytes.toString("utf8")),
    boundaryReceipt,
    {
      byteLength: boundaryBytes.byteLength,
      sha256: createHash("sha256").update(boundaryBytes).digest("hex"),
    },
  );
  const output = path.resolve(
    "data/community-infrastructure/osm-snapshot.json",
  );
  const prior = JSON.parse(await readFile(output, "utf8")) as CommunitySnapshot;
  if (
    prior.schemaVersion !== "1.0.0" ||
    !prior.areas ||
    typeof prior.areas !== "object"
  )
    throw new Error("Invalid existing snapshot");
  const next: CommunitySnapshot = { ...prior, areas: { ...prior.areas } };
  // Sequential requests to one fixed host. Runtime API requests never reach this source.
  for (const area of selected) {
    if (!area) throw new Error("Unknown study area");
    let source: unknown;
    let retrievedAt: string;
    if (fromFile && receiptTime) {
      source = await readBoundedFile(args[2]);
      retrievedAt = new Date(receiptTime).toISOString();
    } else {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(40_000),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "MapAble-Community-Infrastructure/0.1 (https://mapable.com.au)",
        },
        body: new URLSearchParams({
          data: buildCommunityOverpassQuery(area.id),
        }),
      });
      source = await readBoundedResponse(response);
      retrievedAt = new Date().toISOString();
    }
    const result = normaliseOverpassResponse(source, area, retrievedAt);
    if (result.features.length === 0)
      throw new Error(
        `Empty ${area.id} refresh requires manual investigation; previous snapshot preserved`,
      );
    for (const feature of result.features) {
      feature.properties.councilJurisdiction = councilJurisdictionForPoint(
        feature.geometry.coordinates,
        councilBoundaries,
      );
    }
    next.areas[area.id] = result;
    console.log(
      `${area.id}: ${result.features.length} source-reported features from ${result.inputElementCount} OSM objects`,
    );
  }
  next.generatedAt = new Date().toISOString();
  const temporary = `${output}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, {
    flag: "wx",
  });
  await rename(temporary, output);
  console.log(
    "Snapshot written atomically; review data diff and tests before publishing.",
  );
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Snapshot refresh failed",
  );
  process.exitCode = 1;
});
