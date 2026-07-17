/**
 * Pack-expected path — delegates to scripts/continuity/audit-placeholder-operational-data.ts
 *
 * Usage: tsx scripts/audit-placeholder-operational-data.ts [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "continuity", "audit-placeholder-operational-data.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
