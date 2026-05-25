#!/usr/bin/env npx tsx
/**
 * Ingest NDIS provider finder JSON into PostgreSQL (ndis_providers).
 *
 * Usage:
 *   pnpm ingest:ndis-providers
 *   pnpm ingest:ndis-providers:dry
 *   pnpm ingest:ndis-providers -- --input ./list-providers.json
 */

import { config } from "dotenv";

import { runNdisProviderIngestion } from "../lib/ingestion/ndisProviders";

config();

function parseArgs(argv: string[]) {
  let input: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--input" && argv[i + 1]) input = argv[++i];
  }
  return { input };
}

async function main() {
  const { input } = parseArgs(process.argv.slice(2));
  const dryRun = process.env.DRY_RUN === "true";

  if (!dryRun && !process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for live ingestion.");
    process.exit(1);
  }

  const result = await runNdisProviderIngestion({
    inputPath: input,
    dryRun,
  });

  console.log("NDIS provider ingestion");
  console.log("  sourceUrl:", result.sourceUrl);
  console.log("  dryRun:", result.dryRun);
  console.log("  rawRecordCount:", result.rawRecordCount);
  console.log("  normalisedProviderCount:", result.providerCount);
  console.log("  sourceHash:", result.sourceHash || "(n/a)");
  console.log("  durationMs:", result.durationMs);

  if (result.runId) console.log("  runId:", result.runId);
  if (result.rawFieldKeys?.length) {
    console.log("  rawFieldKeys:", result.rawFieldKeys.join(", "));
  }
  if (result.sample) {
    console.log("  sampleProvider:", {
      sourceId: result.sample.sourceId,
      providerName: result.sample.providerName,
      state: result.sample.state,
      postcode: result.sample.postcode,
      services: result.sample.services.slice(0, 3),
    });
  }

  if (!result.ok) {
    console.error("  error:", result.error);
    process.exit(1);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
