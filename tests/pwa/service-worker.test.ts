import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const SW_PATH = path.resolve(__dirname, "../../public/sw.js");

describe("MapAble service worker", () => {
  const source = fs.readFileSync(SW_PATH, "utf8");

  it("exists at public/sw.js", () => {
    expect(fs.existsSync(SW_PATH)).toBe(true);
  });

  it("precaches offline fallback", () => {
    expect(source).toContain("/offline.html");
  });

  it("uses network-first for navigation", () => {
    expect(source).toContain("networkFirstNavigation");
    expect(source).toMatch(/navigate|text\/html/i);
  });

  it("does not cache API routes by default", () => {
    expect(source).toContain('"/api/"');
    expect(source).toMatch(/shouldNeverCache|NO_CACHE/);
  });

  it("blocks sensitive path segments from caching", () => {
    expect(source).toContain("/invoice");
    expect(source).toContain("/incident");
    expect(source).toContain("/clinical");
  });

  it("supports skip waiting for updates", () => {
    expect(source).toContain("SKIP_WAITING");
  });
});
