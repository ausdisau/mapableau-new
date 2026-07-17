/**
 * Pack-expected wrapper — delegates to scripts/federation/audit-consent-recipients.ts
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const script = path.join(__dirname, "federation/audit-consent-recipients.ts");
const result = spawnSync(
  process.execPath,
  [
    path.join(process.cwd(), "node_modules/tsx/dist/cli.mjs"),
    script,
    ...process.argv.slice(2),
  ],
  { stdio: "inherit", env: process.env }
);
process.exit(result.status ?? 1);
