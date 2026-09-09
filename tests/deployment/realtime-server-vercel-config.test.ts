import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("realtime-server Vercel deployment boundary", () => {
  it("pins the workspace deployment to the Node framework instead of inheriting root Next.js config", async () => {
    const configPath = resolve(
      process.cwd(),
      "apps/realtime-server/vercel.json",
    );
    const config = JSON.parse(await readFile(configPath, "utf8")) as {
      framework?: unknown;
    };

    expect(config.framework).toBe("node");
  });
});
