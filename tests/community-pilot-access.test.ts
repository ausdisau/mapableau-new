import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { evaluateCommunityPilotAccess } from "@/lib/community-live/policy";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("protected community pilot admission policy", () => {
  it("requires a signed-in user and an exact, server-approved user ID", () => {
    const input = { pilotMode: true, allowedIds: "member-A,member-B" };
    expect(evaluateCommunityPilotAccess({ ...input, userId: null })).toBe("sign_in_required");
    expect(evaluateCommunityPilotAccess({ ...input, userId: "member-A" })).toBe("allowed");
    expect(evaluateCommunityPilotAccess({ ...input, userId: "member-B" })).toBe("allowed");
    expect(evaluateCommunityPilotAccess({ ...input, userId: "member-C" })).toBe("not_invited");
    expect(evaluateCommunityPilotAccess({ ...input, userId: "member" })).toBe("not_invited");
    expect(evaluateCommunityPilotAccess({ ...input, userId: "Member-A" })).toBe("not_invited");
  });

  it("fails closed with missing, empty or whitespace-only invite lists", () => {
    for (const allowedIds of ["", " ,  , "]) {
      expect(evaluateCommunityPilotAccess({ pilotMode: true, allowedIds, userId: "member-A" })).toBe("not_invited");
    }
    expect(evaluateCommunityPilotAccess({
      pilotMode: true, allowedIds: " member-A , member-B ", userId: "member-B",
    })).toBe("allowed");
  });

  it("does not accidentally change existing feature-flagged live behaviour when the pilot is off", () => {
    expect(evaluateCommunityPilotAccess({
      pilotMode: false, allowedIds: "", userId: null,
    })).toBe("not_required");
  });

  it("does not enable protected pilot mode on production Vercel deployments", () => {
    const runtime = source("lib/community-live/runtime.ts");
    expect(runtime).toContain('process.env.VERCEL_ENV === "production"');
    expect(runtime).toContain('MAPABLE_COMMUNITY_LIVE_ENABLED === "true"');
    expect(runtime).toContain('MAPABLE_COMMUNITY_PILOT_MODE === "true"');
  });

  it("requires invite checks on every live community API and the moderation page", () => {
    const paths = [
      "app/api/community/live/challenges/route.ts",
      "app/api/community/live/observations/route.ts",
      "app/api/community/live/moderation/route.ts",
    ];
    for (const path of paths) {
      expect(source(path)).toContain("communityPilotAccessGuard(user)");
    }
    expect(source("app/community/page.tsx")).toContain("evaluateCommunityPilotAccess");
    expect(source("app/community/manage/page.tsx")).toContain("evaluateCommunityPilotAccess");
  });

  it("keeps browser-local fictional seeds out of real API and moderation routes", () => {
    const paths = [
      "app/api/community/live/challenges/route.ts",
      "app/api/community/live/observations/route.ts",
      "app/api/community/live/moderation/route.ts",
    ];
    for (const path of paths) {
      expect(source(path)).not.toContain("createSeedWorkspace");
      expect(source(path)).not.toContain("DEMO_ACCESS_PLACES");
    }
  });
});
