import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "vitest";

describe("public/embed.js bootstrapper", () => {
  const source = readFileSync(
    join(process.cwd(), "public/embed.js"),
    "utf8",
  );

  it("is an isolated IIFE targeting data-mapable-widget", () => {
    expect(source).toMatch(/\(function\s*\(\)\s*\{/);
    expect(source).toContain("data-mapable-widget");
    expect(source).toContain("data-location-id");
    expect(source).toContain("IntersectionObserver");
    expect(source).toContain("/embed/");
    expect(source).not.toMatch(/window\.MapAble\s*=/);
    expect(source).not.toMatch(/export\s+/);
  });

  it("applies responsive iframe styles and sandbox", () => {
    expect(source).toContain("aspect-ratio");
    expect(source).toContain("min-height");
    expect(source).toContain("allow-scripts");
    expect(source).toContain("encodeURIComponent");
  });
});
