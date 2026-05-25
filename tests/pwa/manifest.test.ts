import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

import manifest from "@/app/manifest";

const ROOT = path.resolve(__dirname, "../..");
const ICONS_DIR = path.join(ROOT, "public", "icons");

describe("PWA manifest", () => {
  it("returns required manifest fields", () => {
    const m = manifest();
    expect(m.name).toBe("MapAble");
    expect(m.short_name).toBe("MapAble");
    expect(m.description).toContain("Accessible care");
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.categories).toEqual(
      expect.arrayContaining(["health", "lifestyle", "productivity", "navigation"])
    );
  });

  it("includes 192 and 512 icons including maskable", () => {
    const m = manifest();
    const icons = m.icons ?? [];
    expect(icons.some((i) => i.sizes === "192x192" && i.purpose === "any")).toBe(
      true
    );
    expect(icons.some((i) => i.sizes === "512x512" && i.purpose === "any")).toBe(
      true
    );
    expect(
      icons.some((i) => i.sizes === "192x192" && i.purpose === "maskable")
    ).toBe(true);
    expect(
      icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable")
    ).toBe(true);
  });

  it("references icon files that exist on disk", () => {
    const m = manifest();
    for (const icon of m.icons ?? []) {
      const file = path.join(ROOT, "public", icon.src.replace(/^\//, ""));
      expect(fs.existsSync(file), `missing ${icon.src}`).toBe(true);
    }
  });

  it("defines app shortcuts", () => {
    const m = manifest();
    expect((m.shortcuts ?? []).length).toBeGreaterThanOrEqual(4);
    const urls = (m.shortcuts ?? []).map((s) => s.url);
    expect(urls).toContain("/provider-finder");
    expect(urls).toContain("/dashboard/messages");
  });

  it("icon PNG files exist in public/icons", () => {
    for (const name of [
      "mapable-icon-192.png",
      "mapable-icon-512.png",
      "mapable-maskable-192.png",
      "mapable-maskable-512.png",
    ]) {
      expect(fs.existsSync(path.join(ICONS_DIR, name))).toBe(true);
    }
  });
});
