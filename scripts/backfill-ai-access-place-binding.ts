#!/usr/bin/env tsx
/**
 * Wave 0 backfill: bind AiAccessPlace rows to canonical AccessPlace.
 *
 * Usage:
 *   pnpm exec tsx scripts/backfill-ai-access-place-binding.ts --dry-run
 *   pnpm exec tsx scripts/backfill-ai-access-place-binding.ts --apply
 */

import { backfillAiAccessPlaceBindings } from "../lib/access-intelligence/place-binding";

async function main() {
  const apply = process.argv.includes("--apply");
  const dryRun = !apply;
  const result = await backfillAiAccessPlaceBindings({ dryRun });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  if (dryRun) {
    // eslint-disable-next-line no-console
    console.log(
      "Dry run only. Re-run with --apply to write canonicalAccessPlaceId bindings.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
