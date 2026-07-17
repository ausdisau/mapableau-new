/**
 * Pack-expected path — delegates to scripts/aura/audit-automation-events.ts
 *
 * Usage: tsx scripts/audit-automation-events.ts [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "aura", "audit-automation-events.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
