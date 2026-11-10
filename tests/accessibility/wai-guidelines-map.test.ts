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
  const navPath = join(
    process.cwd(),
    "components/marketing/home/MarketingPrimaryNav.tsx",
  );
  const triggerPath = join(
    process.cwd(),
    "components/accessibility/AccessibilityPanelTrigger.tsx",
  );
  const matrixPath = join(
    process.cwd(),
    "docs/accessibility/ACCESSIBILITY_MANUAL_EVIDENCE_MATRIX.md",
  );

  it("documents WCAG org-wide, ATAG Parts A/B, and UAAG as Note/guidance only", () => {
    expect(existsSync(mapPath)).toBe(true);
    const map = readFileSync(mapPath, "utf8");
    const compact = map.replace(/\s+/g, " ").replace(/\*+/g, "");
    expect(map).toMatch(/Not a conformance claim/i);
    expect(compact.toLowerCase()).toContain("all mapable web interfaces");
    expect(map).toContain("Working Group Note");
    expect(compact.toLowerCase()).toContain(
      "does not make mapable a user agent",
    );
    expect(map).toContain("https://www.w3.org/WAI/standards-guidelines/atag/");
    expect(map).toContain("https://www.w3.org/TR/UAAG20/");
    expect(map).toContain("https://w3c.github.io/UAAG/UAAG20-Reference/");
    expect(map).toContain("WCAG 2.2");
    expect(map).toContain("Next acceptance gate");
  });

  it("publishes claim-safe ATAG and UAAG language on the accessibility statement", () => {
    const source = readFileSync(statementPath, "utf8");
    const compact = source.replace(/\s+/g, " ");
    expect(compact).toContain(
      "does not claim ATAG 2.0 or UAAG 2.0 conformance",
    );
    expect(compact).toContain("does not claim to be a user agent");
    expect(compact).toContain("Working Group Note");
    expect(compact).toContain(
      "design target for MapAble’s web interfaces",
    );
    expect(source).toContain("https://www.w3.org/WAI/standards-guidelines/atag/");
    expect(source).toContain("https://www.w3.org/TR/UAAG20/");
    expect(source).toContain("https://w3c.github.io/UAAG/UAAG20-Reference/");
    expect(compact).not.toMatch(/we (fully )?conform to (ATAG|UAAG)/i);
  });

  it("keeps statement and display-settings labels distinct in marketing chrome", () => {
    const nav = readFileSync(navPath, "utf8");
    const trigger = readFileSync(triggerPath, "utf8");
    expect(nav).toContain("Accessibility statement");
    expect(nav).toContain('className="hidden md:block"');
    expect(trigger).toContain("Display settings");
    expect(trigger).toContain("Open display settings");
  });

  it("records next acceptance gate rows as NOT_RUN in the evidence matrix", () => {
    const matrix = readFileSync(matrixPath, "utf8");
    expect(matrix).toContain("G-ATAG");
    expect(matrix).toContain("G-PREFS");
    expect(matrix).toContain("`NOT_RUN`");
    expect(matrix).toMatch(/Do \*\*not\*\* assert WCAG, ATAG, or UAAG conformance/i);
  });
});
