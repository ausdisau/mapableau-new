import { execSync } from "child_process";

import { validateProductionEnv } from "../lib/env";

const checks: { name: string; ok: boolean; detail?: string }[] = [];

const env = validateProductionEnv();
checks.push({
  name: "Production env",
  ok: process.env.NODE_ENV !== "production" || env.ok,
  detail: env.missing.join(", ") || undefined,
});

try {
  execSync("pnpm type-check", { stdio: "pipe" });
  checks.push({ name: "Type check", ok: true });
} catch {
  checks.push({ name: "Type check", ok: false });
}

try {
  execSync("pnpm test", { stdio: "pipe" });
  checks.push({ name: "Unit tests", ok: true });
} catch {
  checks.push({ name: "Unit tests", ok: false });
}

const blockers = checks.filter((c) => !c.ok);

console.log("\nRelease preflight\n");
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}

if (blockers.length > 0) {
  console.error(`\n${blockers.length} blocker(s). Fix before release.`);
  process.exit(1);
}

console.log("\nPreflight passed.");
