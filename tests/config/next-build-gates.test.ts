import fs from "node:fs";

import { describe, expect, it } from "vitest";

import {
  shouldSkipNextBuildEslint,
  shouldSkipNextBuildTypecheck,
} from "@/lib/env/next-build-gates";

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as unknown as NodeJS.ProcessEnv;
}

describe("next-build lint/typecheck skip gates", () => {
  it("skips in-build typecheck on Vercel", () => {
    expect(shouldSkipNextBuildTypecheck(env({ VERCEL: "1" }))).toBe(true);
  });

  it("skips in-build typecheck on GitHub Actions", () => {
    expect(shouldSkipNextBuildTypecheck(env({ GITHUB_ACTIONS: "true" }))).toBe(
      true,
    );
  });

  it("does not skip in-build typecheck for local builds", () => {
    expect(
      shouldSkipNextBuildTypecheck(
        env({ VERCEL: undefined, GITHUB_ACTIONS: undefined }),
      ),
    ).toBe(false);
  });

  it("skips in-build eslint on Vercel and GitHub Actions only", () => {
    expect(shouldSkipNextBuildEslint(env({ VERCEL: "1" }))).toBe(true);
    expect(shouldSkipNextBuildEslint(env({ GITHUB_ACTIONS: "true" }))).toBe(
      true,
    );
    expect(
      shouldSkipNextBuildEslint(
        env({ VERCEL: undefined, GITHUB_ACTIONS: undefined }),
      ),
    ).toBe(false);
  });

  it("wires next.config.ts to the helpers without dropping the env gate", () => {
    const nextConfig = fs.readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toMatch(/assertDeployedProductionEnv/);
    expect(nextConfig).toMatch(/shouldSkipNextBuildTypecheck/);
    expect(nextConfig).toMatch(/shouldSkipNextBuildEslint/);
  });
});
