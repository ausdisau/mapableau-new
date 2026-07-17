import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("continuity permissions", () => {
  const src = fs.readFileSync(path.join(process.cwd(), "lib/auth/permissions.ts"), "utf8");

  const REQUIRED = [
    "continuity:signals:read",
    "continuity:signals:manage",
    "continuity:cases:read",
    "continuity:cases:manage",
    "continuity:cases:approve",
    "continuity:recovery:draft",
    "continuity:recovery:approve",
    "continuity:recovery:execute",
    "continuity:reservations:manage",
    "continuity:life-events:read:self",
    "continuity:life-events:manage:self",
    "continuity:life-events:read:org",
    "continuity:life-events:manage:org",
    "continuity:standing-instructions:manage:self",
    "continuity:civic-feed:manage",
  ];

  for (const p of REQUIRED) {
    it(`declares ${p} in the union`, () => {
      expect(src).toContain(`"${p}"`);
    });
  }

  it("support coordinator role grants continuity:cases:approve", () => {
    // Extract the support_coordinator array as a rough regex snapshot.
    const match = src.match(/support_coordinator:\s*\[[^\]]*\]/);
    expect(match).toBeTruthy();
    expect(match?.[0]).toContain("continuity:cases:approve");
  });

  it("participant role grants continuity:manage:self", () => {
    const match = src.match(/participant:\s*\[[^\]]*\]/);
    expect(match?.[0]).toContain("continuity:manage:self");
  });
});
