#!/usr/bin/env tsx
/**
 * Lightweight secret pattern scan for tracked source (not a replacement for gitleaks).
 *
 * Catches common credential shapes in application source and documentation so
 * PR bodies / docs / fixtures do not reintroduce plaintext passwords or URL-
 * embedded credentials.
 */
import fs from "node:fs";
import path from "node:path";

import { findSecretPatternHits } from "./secret-pattern-rules";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "public",
  "tmp",
  "data",
]);

const ALLOW_PATH_SNIPPETS = [
  "scripts/ci/check-secret-patterns.ts",
  "scripts/ci/secret-pattern-rules.ts",
  "tests/ci/secret-patterns.test.ts",
];

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|json|yml|yaml|md|env|txt)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function main(): void {
  const errors: string[] = [];
  for (const file of walk(ROOT)) {
    const rel = path.relative(ROOT, file);
    let text = "";
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (text.length > 1_500_000) continue;
    for (const { label } of findSecretPatternHits(text, rel, {
      allowPathSnippets: ALLOW_PATH_SNIPPETS,
    })) {
      errors.push(`${rel} — possible ${label}`);
    }
  }

  if (errors.length > 0) {
    console.error("Secret pattern scan FAILED:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("OK: secret pattern scan");
}

main();
