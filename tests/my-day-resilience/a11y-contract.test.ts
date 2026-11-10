import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const uiPath = path.resolve(
  __dirname,
  "../../components/my-day-resilience/MyDayResilienceSimulator.tsx",
);

describe("My Day Resilience UI accessibility contract", () => {
  const source = readFileSync(uiPath, "utf8");

  it("exposes live regions for status updates", () => {
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('id="my-day-status"');
  });

  it("uses semantic section headings and labelled regions", () => {
    expect(source).toContain("aria-labelledby");
    expect(source).toContain("consent-heading");
    expect(source).toContain("plan-heading");
    expect(source).toContain("recovery-heading");
    expect(source).toContain("receipt-heading");
  });

  it("keeps large tap targets via min-h-11 controls", () => {
    expect(source).toContain("min-h-11");
  });

  it("provides a non-map list plan and offline-readable summary path", () => {
    expect(source).toContain("list view — no map required");
    expect(source).toContain("offline-readable summary");
  });

  it("supports AAC/text goal editing without requiring speech", () => {
    expect(source).toContain("<textarea");
    expect(source).toContain("Goal statement");
  });

  it("documents 400% reflow intent via max-width single-column layout", () => {
    expect(source).toContain("max-w-3xl");
    expect(source).toContain("flex-wrap");
  });

  it("labels demo-only banner with role=status", () => {
    expect(source).toContain('role="status"');
    expect(source).toContain("DEMO ONLY");
  });
});
