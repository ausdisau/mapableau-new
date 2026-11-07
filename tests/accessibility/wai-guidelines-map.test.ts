import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("WAI guidelines map (WCAG / ATAG / UAAG)", () => {
  const mapPath = join(
    process.cwd(),
    "docs/accessibility/WAI-GUIDELINES-MAP.md",
  );
  const statementPath = join(
    process.cwd(),
    "app/(marketing)/accessibility-statement/page.tsx",
  );

  it("documents WCAG, ATAG, and UAAG without claiming conformance", () => {
    expect(existsSync(mapPath)).toBe(true);
    const map = readFileSync(mapPath, "utf8");
    expect(map).toMatch(/Not a conformance claim/i);
    expect(map).toContain("https://www.w3.org/WAI/standards-guidelines/atag/");
    expect(map).toContain("https://www.w3.org/TR/UAAG20/");
    expect(map).toContain("https://w3c.github.io/UAAG/UAAG20-Reference/");
    expect(map).toContain("WCAG 2.2");
  });

  it("publishes claim-safe ATAG and UAAG links on the accessibility statement", () => {
    const source = readFileSync(statementPath, "utf8");
    const compact = source.replace(/\s+/g, " ");
    expect(compact).toContain(
      "does not claim ATAG 2.0 or UAAG 2.0 conformance",
    );
    expect(source).toContain("https://www.w3.org/WAI/standards-guidelines/atag/");
    expect(source).toContain("https://www.w3.org/TR/UAAG20/");
    expect(source).toContain("https://w3c.github.io/UAAG/UAAG20-Reference/");
    expect(compact).not.toMatch(/we (fully )?conform to (ATAG|UAAG)/i);
  });
});
