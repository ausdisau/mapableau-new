#!/usr/bin/env node
/**
 * Push Supabase auth env vars to Vercel production + preview.
 *
 * Prerequisites:
 * - `VERCEL_TOKEN` (or `vercel login` in ~/.local/share/com.vercel.cli)
 * - Values in `.env` / `.env.local`:
 *     NEXT_PUBLIC_SUPABASE_URL
 *     NEXT_PUBLIC_SUPABASE_ANON_KEY
 *     SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   pnpm exec tsx scripts/sync-vercel-supabase-env.ts
 *   pnpm exec tsx scripts/sync-vercel-supabase-env.ts --targets production,preview
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_PROJECT_REF = "louioyirfyzdjshmremy";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_ENABLED",
] as const;

type Target = "production" | "preview" | "development";

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function parseTargets(argv: string[]): Target[] {
  const flag = argv.find((arg) => arg.startsWith("--targets="));
  if (!flag) return ["production", "preview"];
  return flag
    .slice("--targets=".length)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean) as Target[];
}

function addEnv(key: string, value: string, target: Target) {
  execSync(`pnpm dlx vercel@latest env add ${key} ${target} --force`, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });
}

function main() {
  const root = process.cwd();
  const merged = {
    ...parseEnvFile(path.join(root, ".env")),
    ...parseEnvFile(path.join(root, ".env.local")),
  };

  if (!merged.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
    merged.NEXT_PUBLIC_SUPABASE_URL = `https://${DEFAULT_PROJECT_REF}.supabase.co`;
  }
  if (!merged.SUPABASE_URL?.trim()) {
    merged.SUPABASE_URL = merged.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (!merged.SUPABASE_ENABLED?.trim()) {
    merged.SUPABASE_ENABLED = "true";
  }

  const targets = parseTargets(process.argv.slice(2));
  let synced = 0;

  for (const target of targets) {
    for (const key of KEYS) {
      const value = merged[key]?.trim();
      if (!value) {
        console.warn(`skip ${key} for ${target} (not in .env / .env.local)`);
        continue;
      }
      addEnv(key, value, target);
      synced += 1;
      console.log(`synced ${key} → ${target}`);
    }
  }

  console.log(
    `Done. Synced ${synced} variable assignment(s) across ${targets.join(", ")}.`,
  );
  console.log(
    "Redeploy mapableau-new (Production + Preview) so functions pick up new values.",
  );
}

main();
