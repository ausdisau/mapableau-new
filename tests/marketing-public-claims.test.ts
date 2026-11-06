import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { exploreServiceCatalogue } from "@/lib/marketing/mapable-care-combined-data";

const claimFiles = [
  "app/(marketing)/technology/page.tsx",
  "app/(marketing)/white-label/page.tsx",
  "app/(marketing)/for-providers/page.tsx",
  "components/marketing/home/SupportCloudSection.tsx",
];

describe("public marketing claims stay proposed", () => {
  it("does not certify WCAG or claim integrations are live", () => {
    for (const file of claimFiles) {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/\bWCAG\s*2\.\d\s*AA\s+compliant\b/i);
      expect(source).not.toMatch(/\bXero is live\b/i);
      expect(source).not.toMatch(/\bStripe is live\b/i);
      expect(source).not.toMatch(/\bproduction ready\b/i);
    }
  });

  it("labels Support Cloud and domains as not configured or planned", () => {
    const whiteLabel = readFileSync(
      join(process.cwd(), "app/(marketing)/white-label/page.tsx"),
      "utf8",
    );
    const technology = readFileSync(
      join(process.cwd(), "app/(marketing)/technology/page.tsx"),
      "utf8",
    );
    expect(whiteLabel).toMatch(/not configured/i);
    expect(technology).toMatch(/planned/i);
    expect(technology).toMatch(/is a live connection/i);
  });

  it("marks marketplace as in development and the map as available", () => {
    const marketplace = exploreServiceCatalogue.find(
      (item) => item.title === "Marketplace",
    );
    const mapping = exploreServiceCatalogue.find(
      (item) => item.title === "Accessibility mapping",
    );
    expect(marketplace?.status).toBe("in_development");
    expect(mapping?.status).toBe("available");
    expect(mapping?.statusLabel).toBe("Available now");
  });
});