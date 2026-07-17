/**
 * Pack-expected path — delegates to scripts/continuity/migrate-reschedule-requests.ts
 *
 * Usage: tsx scripts/migrate-reschedule-requests.ts [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "continuity", "migrate-reschedule-requests.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
