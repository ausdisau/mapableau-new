#!/usr/bin/env npx tsx
/**
 * Bulk seed MapAble Access from the allowlisted Google My Maps KML export.
 *
 * Usage:
 *   npx tsx scripts/seed-access-mapable-kml.ts [--file path/to.kml] [--publish] [--force] [--concurrency N]
 */
import { bulkSeedAccessPlaces } from "@/lib/access-import/bulk-access-seed-service";
import { SEED_CONCURRENCY } from "@/lib/access-import/import-limits";

function parseArgs(argv: string[]) {
  let filePath: string | undefined;
  let publish = false;
  let force = false;
  let concurrency = SEED_CONCURRENCY;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--publish") {
      publish = true;
    } else if (arg === "--force") {
      force = true;
    } else if (arg === "--file") {
      filePath = argv[++i];
      if (!filePath) {
        throw new Error("--file requires a path");
      }
    } else if (arg === "--concurrency") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1 || n > 100) {
        throw new Error("--concurrency must be between 1 and 100");
      }
      concurrency = n;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npx tsx scripts/seed-access-mapable-kml.ts [options]

Options:
  --file <path>        Local KML file (default: data/imports/*.kml or Google My Maps URL)
  --publish            Publish imported places to the public /access map
  --force              Re-import even when places already exist
  --concurrency <n>    Parallel workers (default ${SEED_CONCURRENCY}, ~400 places/min)
  --help               Show this help`);
      process.exit(0);
    }
  }

  return { filePath, publish, force, concurrency };
}

async function main() {
  const { filePath, publish, force, concurrency } = parseArgs(process.argv.slice(2));

  console.log("MapAble Access bulk KML seed starting…");
  if (filePath) console.log(`  Source file: ${filePath}`);
  if (publish) console.log("  Mode: publish (public map)");
  if (force) console.log("  Force: yes");
  console.log(`  Concurrency: ${concurrency}`);

  const result = await bulkSeedAccessPlaces({ filePath, publish, force, concurrency });

  if (result.skipped) {
    console.log(`Skipped: ${result.reason}`);
    return;
  }

  const elapsedSec = result.elapsedMs ? (result.elapsedMs / 1000).toFixed(1) : "?";
  const rate =
    result.elapsedMs && result.created > 0
      ? ((result.created / result.elapsedMs) * 60_000).toFixed(0)
      : "0";

  console.log("MapAble Access bulk KML seed complete:");
  console.log(`  Parsed:   ${result.parsed}`);
  console.log(`  Created:  ${result.created}`);
  console.log(`  Conflicts:${result.conflicts}`);
  console.log(`  Skipped:  ${result.skippedItems} (missing coordinates)`);
  console.log(`  Errors:   ${result.errors}`);
  console.log(`  Elapsed:  ${elapsedSec}s (~${rate} places/min)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
