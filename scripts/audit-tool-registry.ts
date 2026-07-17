/**
 * Pack-expected path — delegates to scripts/aura/audit-tool-registry.ts
 *
 * Usage: tsx scripts/audit-tool-registry.ts [args...]
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const delegated = path.join(__dirname, "aura", "audit-tool-registry.ts");
const result = spawnSync("pnpm", ["exec", "tsx", delegated, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});
process.exit(result.status ?? 1);
