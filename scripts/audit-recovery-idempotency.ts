/**
 * Pack-expected path — delegates to scripts/continuity/audit-recovery-idempotency.ts
 *
 * Usage: tsx scripts/audit-recovery-idempotency.ts [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "continuity", "audit-recovery-idempotency.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
