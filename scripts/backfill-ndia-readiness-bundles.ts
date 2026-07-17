/**
 * Pack-expected path — delegates to scripts/assurance/backfill-ndia-readiness-bundles.ts
 *
 * Usage: tsx scripts/backfill-ndia-readiness-bundles.ts [--dry-run] [--organisationId=<id>]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "assurance", "backfill-ndia-readiness-bundles.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
