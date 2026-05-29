#!/usr/bin/env npx tsx
/**
 * Bulk seed MapAble Access from the allowlisted Google My Maps KML export.
 *
 * Usage:
 *   npx tsx scripts/seed-access-mapable-kml.ts [--file path/to.kml] [--publish] [--force]
 */
import { bulkSeedAccessPlaces } from "@/lib/access-import/bulk-access-seed-service";

function parseArgs(argv: string[]) {
  let filePath: string | undefined;
  let publish = false;
  let force = false;

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
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: npx tsx scripts/seed-access-mapable-kml.ts [options]

Options:
  --file <path>   Local KML file (default: data/imports/*.kml or Google My Maps URL)
  --publish       Publish imported places to the public /access map
  --force         Re-import even when places already exist
  --help          Show this help`);
      process.exit(0);
    }
  }

  return { filePath, publish, force };
}

async function main() {
  const { filePath, publish, force } = parseArgs(process.argv.slice(2));

  console.log("MapAble Access bulk KML seed starting…");
  if (filePath) console.log(`  Source file: ${filePath}`);
  if (publish) console.log("  Mode: publish (public map)");
  if (force) console.log("  Force: yes");

  const result = await bulkSeedAccessPlaces({ filePath, publish, force });

  if (result.skipped) {
    console.log(`Skipped: ${result.reason}`);
    return;
  }

  console.log("MapAble Access bulk KML seed complete:");
  console.log(`  Parsed:   ${result.parsed}`);
  console.log(`  Created:  ${result.created}`);
  console.log(`  Conflicts:${result.conflicts}`);
  console.log(`  Skipped:  ${result.skippedItems} (missing coordinates)`);
  console.log(`  Errors:   ${result.errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
