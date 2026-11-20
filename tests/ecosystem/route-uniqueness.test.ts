import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Next.js App Router: `app/ecosystem/page.tsx` and `app/(core)/ecosystem/page.tsx`
 * both resolve to `/ecosystem`. The certified API directory must live elsewhere.
 */
describe("ecosystem route uniqueness", () => {
  const root = path.resolve(__dirname, "../..");

  it("keeps MapAble One hub at app/ecosystem", () => {
    expect(existsSync(path.join(root, "app/ecosystem/page.tsx"))).toBe(true);
  });

  it("does not keep a duplicate (core)/ecosystem page", () => {
    expect(existsSync(path.join(root, "app/(core)/ecosystem/page.tsx"))).toBe(
      false,
    );
  });

  it("serves certified API ecosystem at /certified-api-ecosystem", () => {
    expect(
      existsSync(path.join(root, "app/(core)/certified-api-ecosystem/page.tsx")),
    ).toBe(true);
  });
});
