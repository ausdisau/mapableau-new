import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("PWA manifest", () => {
  it("manifest module exports required fields", async () => {
    const { default: manifestFn } = await import("@/app/manifest");
    const manifest = manifestFn();
    expect(manifest.name).toBe("MapAble");
    expect(manifest.short_name).toBe("MapAble");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons?.length).toBeGreaterThanOrEqual(2);
    const sizes = manifest.icons?.map((i) => i.sizes) ?? [];
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("references icon files under public/icons", () => {
    const root = resolve(__dirname, "../..");
    for (const file of [
      "mapable-icon-192.png",
      "mapable-icon-512.png",
      "mapable-maskable-192.png",
      "mapable-maskable-512.png",
    ]) {
      expect(existsSync(resolve(root, "public/icons", file))).toBe(true);
    }
  });

  it("includes app shortcuts", async () => {
    const { default: manifestFn } = await import("@/app/manifest");
    const manifest = manifestFn();
    expect(manifest.shortcuts?.length).toBeGreaterThanOrEqual(4);
  });
});

describe("PWA static assets", () => {
  it("offline.html exists", () => {
    const path = resolve(__dirname, "../../public/offline.html");
    expect(existsSync(path)).toBe(true);
    const html = readFileSync(path, "utf8");
    expect(html).toContain("offline");
  });

  it("service worker exists and avoids sensitive API caching", () => {
    const path = resolve(__dirname, "../../public/sw.js");
    const sw = readFileSync(path, "utf8");
    expect(sw).toContain("/api/");
    expect(sw).toContain("isSensitiveRequest");
    expect(sw).toContain("isSensitiveRequest(url)");
    expect(sw).toContain('if (request.method !== "GET" || isSensitiveRequest(url))');
  });
});
