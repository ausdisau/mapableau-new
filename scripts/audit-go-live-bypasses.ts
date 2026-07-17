/**
 * Pack-expected path — delegates to scripts/assurance/audit-go-live.ts
 *
 * Usage: tsx scripts/audit-go-live-bypasses.ts [--dry-run] [--organisationId=<id>]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "assurance", "audit-go-live.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
