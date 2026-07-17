/**
 * Pack-expected path — delegates to scripts/assurance/backfill-frameworks.ts
 *
 * Usage: tsx scripts/backfill-assurance-controls.ts [--dry-run]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "assurance", "backfill-frameworks.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
