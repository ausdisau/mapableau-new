#!/usr/bin/env npx tsx
/**
 * Ingest NDIS provider finder list-providers.json into public/data for MapAble.
 *
 * Usage:
 *   pnpm ingest:ndis-providers
 *   pnpm ingest:ndis-providers --input ./list-providers.json
 *   pnpm ingest:ndis-providers --input public/data/provider-outlets.json --refresh-map-only
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  NDIS_LIST_PROVIDERS_URL,
  PROVIDER_OUTLETS_MAP_OUTPUT,
  PROVIDER_OUTLETS_OUTPUT,
} from "../lib/ndis-provider-ingest/constants";
import { downloadNdisListProviders } from "../lib/ndis-provider-ingest/download";
import {
  buildMapPinRecords,
  parseNdisProviderJson,
} from "../lib/ndis-provider-ingest/normalize";

function parseArgs(argv: string[]) {
  let input: string | undefined;
  let refreshMapOnly = false;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--input" && argv[i + 1]) {
      input = argv[++i];
    }
    if (argv[i] === "--refresh-map-only") refreshMapOnly = true;
  }
  return { input, refreshMapOnly };
}

function pinId(o: { ABN: string }, index: number) {
  return `${o.ABN}-${index}`;
}

async function writeOutputs(bundle: ReturnType<typeof parseNdisProviderJson>) {
  const outPath = resolve(PROVIDER_OUTLETS_OUTPUT);
  const mapPath = resolve(PROVIDER_OUTLETS_MAP_OUTPUT);
  await mkdir(dirname(outPath), { recursive: true });

  if (!process.argv.includes("--refresh-map-only")) {
    await writeFile(outPath, JSON.stringify(bundle), "utf8");
    console.log(`Wrote ${bundle.data.length} outlets → ${outPath}`);
  }

  const pins = buildMapPinRecords(bundle.data, pinId);
  const mapBundle = {
    date: bundle.date,
    source: NDIS_LIST_PROVIDERS_URL,
    count: pins.length,
    pins,
  };
  await writeFile(mapPath, JSON.stringify(mapBundle), "utf8");
  console.log(`Wrote ${pins.length} map pins → ${mapPath}`);
}

async function main() {
  const { input, refreshMapOnly } = parseArgs(process.argv.slice(2));

  if (refreshMapOnly && input) {
    const raw = JSON.parse(await readFile(resolve(input), "utf8"));
    const bundle = parseNdisProviderJson(raw);
    await writeOutputs(bundle);
    return;
  }

  if (refreshMapOnly) {
    const raw = JSON.parse(
      await readFile(resolve(PROVIDER_OUTLETS_OUTPUT), "utf8"),
    );
    const bundle = parseNdisProviderJson(raw);
    await writeOutputs(bundle);
    return;
  }

  let jsonText: string;
  if (input) {
    jsonText = await readFile(resolve(input), "utf8");
    console.log(`Reading ${input}`);
  } else {
    console.log(`Downloading ${NDIS_LIST_PROVIDERS_URL}`);
    const dl = await downloadNdisListProviders();
    if (!dl.ok) {
      console.error(dl.error);
      if (dl.hint) console.error(dl.hint);
      process.exit(1);
    }
    jsonText = dl.body;
    console.log(`Downloaded ${(jsonText.length / 1_000_000).toFixed(1)} MB`);
  }

  const bundle = parseNdisProviderJson(JSON.parse(jsonText));
  await writeOutputs(bundle);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
