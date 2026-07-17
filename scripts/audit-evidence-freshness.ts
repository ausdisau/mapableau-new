/**
 * Pack-expected path — delegates to scripts/assurance/audit-evidence.ts
 *
 * Usage: tsx scripts/audit-evidence-freshness.ts [--dry-run]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "assurance", "audit-evidence.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
