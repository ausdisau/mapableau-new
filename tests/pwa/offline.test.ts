import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const OFFLINE_PATH = path.resolve(__dirname, "../../public/offline.html");

describe("offline fallback page", () => {
  const html = fs.readFileSync(OFFLINE_PATH, "utf8");

  it("exists at public/offline.html", () => {
    expect(fs.existsSync(OFFLINE_PATH)).toBe(true);
  });

  it("is accessible and mobile-friendly", () => {
    expect(html).toContain('lang="en"');
    expect(html).toContain("viewport");
    expect(html).toContain("You are offline");
  });

  it("provides retry and online listener", () => {
    expect(html).toContain('id="retry"');
    expect(html).toContain("navigator.onLine");
    expect(html).toContain('aria-live="polite"');
  });

  it("uses touch-friendly control sizing", () => {
    expect(html).toMatch(/44px|min-height:\s*44/);
  });
});
