import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const loader = path.join(root, "tests/config/fixtures/load-next-config.mjs");

function loadNextConfigFlags(env: Record<string, string | undefined>): {
  status: number | null;
  ignoreBuildErrors: boolean | null;
  ignoreDuringBuilds: boolean | null;
  stderr: string;
} {
  const merged: NodeJS.ProcessEnv = { ...process.env, ...env, FORCE_COLOR: "0" };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete merged[key];
    }
  }

  const result = spawnSync(process.execPath, ["--import", "tsx", loader], {
    cwd: root,
    env: merged,
    encoding: "utf8",
    timeout: 60_000,
  });
  const stdout = result.stdout ?? "";
  const jsonLine = stdout
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("{") && line.includes("ignoreBuildErrors"));
  let flags: { ignoreBuildErrors?: boolean; ignoreDuringBuilds?: boolean } | null =
    null;
  if (jsonLine) {
    flags = JSON.parse(jsonLine) as {
      ignoreBuildErrors?: boolean;
      ignoreDuringBuilds?: boolean;
    };
  }

  return {
    status: result.status,
    ignoreBuildErrors:
      typeof flags?.ignoreBuildErrors === "boolean" ? flags.ignoreBuildErrors : null,
    ignoreDuringBuilds:
      typeof flags?.ignoreDuringBuilds === "boolean"
        ? flags.ignoreDuringBuilds
        : null,
    stderr: `${result.stderr ?? ""}${stdout}`,
  };
}

describe("Vercel preview build policy", () => {
  it("declares Next.js in vercel.json without a CRA/static output directory", () => {
    const vercel = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      framework?: string;
      outputDirectory?: string;
      rootDirectory?: string;
    };
    expect(vercel.framework).toBe("nextjs");
    expect(vercel.outputDirectory).toBeUndefined();
    expect(vercel.rootDirectory).toBeUndefined();
    expect(JSON.stringify(vercel)).not.toMatch(/"outputDirectory"\s*:\s*"build"/);
  });

  it("keeps Vercel heap at the documented 5120 MB cap", () => {
    const script = readFileSync("scripts/run-next-build.mjs", "utf8");
    expect(script).toMatch(/if \(process\.env\.VERCEL === "1"\)/);
    expect(script).toMatch(/return 5120;/);
    expect(script).not.toMatch(/VERCEL === "1"[\s\S]{0,400}return 6144;/);
    expect(script).not.toMatch(/VERCEL === "1"[\s\S]{0,400}return 7168;/);
  });

  it("keeps conservative static-generation settings", () => {
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toMatch(/cpus:\s*1/);
    expect(nextConfig).toMatch(/staticGenerationMaxConcurrency:\s*1/);
    expect(nextConfig).toMatch(/staticGenerationMinPagesPerWorker:\s*400/);
  });

  it("keeps GitHub Actions type-check as a required CI gate", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8");
    const quality = readFileSync(".github/workflows/quality.yml", "utf8");
    expect(ci).toMatch(/run:\s*pnpm type-check/);
    expect(quality).toMatch(/- run:\s*pnpm type-check/);
  });

  it("skips duplicate TypeScript checking on Vercel and GitHub Actions only", () => {
    const vercel = loadNextConfigFlags({
      VERCEL: "1",
      VERCEL_ENV: "preview",
      GITHUB_ACTIONS: undefined,
    });
    expect(vercel.status).toBe(0);
    expect(vercel.ignoreBuildErrors).toBe(true);

    const github = loadNextConfigFlags({
      VERCEL: undefined,
      VERCEL_ENV: undefined,
      GITHUB_ACTIONS: "true",
    });
    expect(github.status).toBe(0);
    expect(github.ignoreBuildErrors).toBe(true);

    const local = loadNextConfigFlags({
      VERCEL: undefined,
      VERCEL_ENV: undefined,
      GITHUB_ACTIONS: undefined,
    });
    expect(local.status).toBe(0);
    expect(local.ignoreBuildErrors).toBe(false);
  });
});
