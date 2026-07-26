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
    expect(source).toContain("https://mapable.com.au");
    expect(source).not.toMatch(/window\.MapAble\s*=/);
    expect(source).not.toMatch(/export\s+/);
  });

  it("accepts data-place-id and prefers location-id when both are set", () => {
    expect(source).toContain("data-place-id");
    expect(source).toContain("resolveLocationId");
    // location-id is read before place-id
    const locationIdx = source.indexOf('getAttribute(ATTR_LOCATION)');
    const placeIdx = source.indexOf('getAttribute(ATTR_PLACE)');
    expect(locationIdx).toBeGreaterThan(-1);
    expect(placeIdx).toBeGreaterThan(locationIdx);
  });

  it("preserves SEO fallback links instead of wiping container HTML", () => {
    expect(source).not.toMatch(/\.innerHTML\s*=/);
    expect(source).toContain("hideSeoFallbackLinks");
    expect(source).toContain("aria-hidden");
    expect(source).toContain("tabindex");
    expect(source).toContain("clip:rect");
    expect(source).toContain("appendChild(iframe)");
  });

  it("applies responsive iframe styles and sandbox", () => {
    expect(source).toContain("aspect-ratio");
    expect(source).toContain("min-height");
    expect(source).toContain("allow-scripts");
    expect(source).toContain("encodeURIComponent");
  });
});
