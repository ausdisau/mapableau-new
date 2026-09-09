import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const researchRoutes = [
  "app/api/research/co-design/consent/route.ts",
  "app/api/research/co-design/programmes/route.ts",
] as const;

describe("research co-design route response contract", () => {
  for (const routePath of researchRoutes) {
    it(`${routePath} converts request-body errors into a Response`, () => {
      const source = readFileSync(resolve(process.cwd(), routePath), "utf8");

      expect(source).not.toMatch(/return\s+jsonBodyErrorResponse\(e\)/);
      expect(source).toMatch(
        /const err = jsonBodyErrorResponse\(e\);\s*return jsonError\(err\.message, err\.status\);/s,
      );
    });
  }
});
