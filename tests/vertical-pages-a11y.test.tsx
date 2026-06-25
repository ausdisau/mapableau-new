import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const verticalPageFiles = [
  "app/innovation/page.tsx",
  "app/planops/page.tsx",
  "app/home/page.tsx",
  "app/accessops/page.tsx",
  "app/life/page.tsx",
  "app/transition/page.tsx",
  "app/ageing/page.tsx",
  "app/academy/page.tsx",
  "app/access-pass/page.tsx",
  "app/ready/page.tsx",
  "app/rights-navigator/page.tsx",
  "app/intelligence/page.tsx",
];

const pagesRequiringBoundaryNotice = [
  "app/planops/page.tsx",
  "app/home/page.tsx",
  "app/accessops/page.tsx",
  "app/transition/page.tsx",
  "app/ready/page.tsx",
  "app/rights-navigator/page.tsx",
];

describe("Vertical pages accessibility smoke tests", () => {
  it("each vertical page file exists", () => {
    for (const file of verticalPageFiles) {
      expect(existsSync(join(process.cwd(), file)), `${file} should exist`).toBe(true);
    }
  });

  it("each vertical page exports metadata with title and description", () => {
    for (const file of verticalPageFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).toContain("export const metadata");
      expect(source).toMatch(/title:/);
      expect(source).toMatch(/description:/);
    }
  });

  it("each vertical landing uses VerticalLandingPage or explicit h1", () => {
    for (const file of verticalPageFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      const hasH1 =
        source.includes("<h1") ||
        source.includes("VerticalLandingPage") ||
        source.includes("mapablePublicTitleClass");
      expect(hasH1, `${file} should have one H1 pattern`).toBe(true);
    }
  });

  it("sensitive pages include SupportBoundaryNotice", () => {
    for (const file of pagesRequiringBoundaryNotice) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).toContain("SupportBoundaryNotice");
    }
  });

  it("pages with interest forms use MapAbleInterestForm with accessible fields", () => {
    const formPages = verticalPageFiles.filter((f) => f !== "app/innovation/page.tsx");
    for (const file of formPages) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).toContain("MapAbleInterestForm");
    }
  });

  it("innovation hub includes interest form with consent pattern", () => {
    const source = readFileSync(join(process.cwd(), "app/innovation/page.tsx"), "utf8");
    expect(source).toContain("MapAbleInterestForm");
    expect(source).toContain("<h1");
  });
});

describe("MapAbleInterestForm accessibility", () => {
  it("form component uses AccessibleFormField with visible labels", () => {
    const source = readFileSync(
      join(process.cwd(), "components/marketing/MapAbleInterestForm.tsx"),
      "utf8",
    );
    expect(source).toContain("AccessibleFormField");
    expect(source).toContain('label="Your name"');
    expect(source).toContain("consentContact");
    expect(source).not.toMatch(/placeholder=\{?["'][^"']+["']\}?/);
  });
});
