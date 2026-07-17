/**
 * Pack-expected path — delegates to scripts/continuity/audit-direct-cancellation-propagation.ts
 *
 * Usage: tsx scripts/audit-direct-cancellation-propagation.ts [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "continuity", "audit-direct-cancellation-propagation.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
