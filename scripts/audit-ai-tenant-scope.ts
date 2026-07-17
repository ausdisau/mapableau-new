/**
 * Pack-expected path — delegates to scripts/aura/audit-ai-tenant-scope.ts
 *
 * Usage: tsx scripts/audit-ai-tenant-scope.ts [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "aura", "audit-ai-tenant-scope.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
