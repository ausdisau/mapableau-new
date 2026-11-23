import { describe, expect, it } from "vitest";

import { resolveHeapMb } from "../../scripts/resolve-next-build-heap.mjs";

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as unknown as NodeJS.ProcessEnv;
}

describe("next-build heap resolution", () => {
  it("uses 6144 MB on Vercel after in-build eslint+tsc are skipped", () => {
    expect(resolveHeapMb(env({ VERCEL: "1" }))).toBe(6144);
  });

  it("uses 8192 MB on GitHub Actions", () => {
    expect(resolveHeapMb(env({ GITHUB_ACTIONS: "true" }))).toBe(8192);
  });

  it("defaults to 6144 MB locally", () => {
    expect(
      resolveHeapMb(env({ VERCEL: undefined, GITHUB_ACTIONS: undefined })),
    ).toBe(6144);
  });

  it("honours MAPABLE_BUILD_HEAP_MB over Vercel/GHA defaults", () => {
    expect(
      resolveHeapMb(
        env({
          VERCEL: "1",
          GITHUB_ACTIONS: "true",
          MAPABLE_BUILD_HEAP_MB: "4096",
        }),
      ),
    ).toBe(4096);
  });
});
