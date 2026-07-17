/**
 * Pack-expected path — delegates to scripts/assurance/backfill-security-evidence.ts
 *
 * Usage: tsx scripts/backfill-security-evidence.ts [--dry-run]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "assurance", "backfill-security-evidence.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
