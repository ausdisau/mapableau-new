#!/usr/bin/env tsx
/**
 * Lint only files changed since BASE_SHA to avoid full-repo ESLint OOM in CI.
 * Scope matches package.json `lint` (app, components, lib, schemas, scripts/ci).
 */
import { execSync } from "node:child_process";

const BASE_SHA = process.env.BASE_SHA ?? process.env.GITHUB_BASE_SHA;
const LINT_ROOTS = ["app", "components", "lib", "schemas", "scripts/ci"];
const EXT = /\.(cjs|mjs|js|jsx|ts|tsx)$/;

function sh(cmd: string): string {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function resolveBaseRef(): string {
  if (BASE_SHA && BASE_SHA.length >= 7) {
    return BASE_SHA;
  }
  try {
    return sh("git merge-base HEAD origin/main");
  } catch {
    return "HEAD~1";
  }
}

function listChangedLintFiles(baseRef: string): string[] {
  const out = sh(`git diff --name-only --diff-filter=ACMRTUXB ${baseRef}...HEAD`);
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => LINT_ROOTS.some((root) => file === root || file.startsWith(`${root}/`)))
    .filter((file) => EXT.test(file));
}

const baseRef = resolveBaseRef();
const files = listChangedLintFiles(baseRef);

if (files.length === 0) {
  console.log(`lint-changed: no lint-scoped files changed since ${baseRef}; skipping ESLint.`);
  process.exit(0);
}

console.log(`lint-changed: linting ${files.length} file(s) since ${baseRef}`);
for (const file of files) {
  console.log(`lint-changed: ${file}`);
  execSync(
    `NODE_OPTIONS='--max-old-space-size=4096' pnpm exec eslint "${file.replace(/"/g, '\\"')}" --max-warnings 0 --config .eslintrc.ci.json`,
    { stdio: "inherit", env: process.env },
  );
}
