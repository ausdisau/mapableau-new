#!/usr/bin/env tsx
/**
 * MapAble Go security checks — wheelchair boundary, flags, prohibited MCP vocabulary.
 * Output: PASS | FAIL | MANUAL_REVIEW_REQUIRED
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const errors: string[] = [];
const manual: string[] = [];

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const PROHIBITED = [
  "driveForward",
  "driveBackward",
  "setDriveAxis",
  "setSpeed",
  "releaseBrake",
  "modifyFirmware",
  "moveSeat",
  "tiltSeat",
];

function main(): void {
  const envExample = read(".env.example");
  for (const flag of [
    "MAPABLE_GO_ENABLED=false",
    "MAPABLE_NAVIGATE_ENABLED=false",
    "MAPABLE_GO_ROUTE_PLANNING_ENABLED=false",
    "MAPABLE_GO_DYNAMIC_BARRIERS_ENABLED=false",
    "MAPABLE_GO_MCP_ENABLED=false",
    "MAPABLE_GO_TELEMETRY_ENABLED=false",
  ]) {
    const [name, val] = flag.split("=");
    if (!envExample.includes(`${name}=${val}`)) {
      errors.push(`.env.example missing ${flag}`);
    }
  }

  const goFiles = [
    ...walk("lib/go"),
    ...walk("lib/access/navigate"),
    ...walk("mcp/go"),
    ...walk("app/go"),
    ...walk("components/go"),
  ];

  for (const file of goFiles) {
    const rel = path.relative(ROOT, file);
    const content = fs.readFileSync(file, "utf8");
    for (const term of PROHIBITED) {
      if (rel === "lib/go/navigate-action.ts") continue;
      if (content.includes(term)) {
        errors.push(`Prohibited wheelchair term "${term}" in ${rel}`);
      }
    }
  }

  const navigateAction = read("lib/go/navigate-action.ts");
  if (!navigateAction.includes("NAVIGATE_ACTIONS")) {
    errors.push("NavigateAction enum missing");
  }

  if (!fs.existsSync("docs/mapable-go/CURRENT_STATE_AUDIT.md")) {
    errors.push("Missing docs/mapable-go/CURRENT_STATE_AUDIT.md");
  }
  if (!fs.existsSync("docs/security/essential-eight/CONTROL_REGISTER.md")) {
    manual.push("Essential Eight control register requires human verification");
  }

  if (errors.length > 0) {
    console.error("FAIL");
    for (const e of errors) console.error(" -", e);
    process.exit(1);
  }

  if (manual.length > 0) {
    console.log("MANUAL_REVIEW_REQUIRED");
    for (const m of manual) console.log(" -", m);
    process.exit(0);
  }

  console.log("PASS");
}

main();
