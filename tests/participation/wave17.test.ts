import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { findParticipationManifest } from "@/lib/aura/agents/manifests";
import { assessEventAccessFreshness } from "@/lib/participation/access/event-access-service";
import { buildParticipationGoalCreateData } from "@/lib/participation/goals/goal-service";
import { separateSponsoredResults } from "@/lib/participation/opportunities/opportunity-service";
import {
  cancelPlanBlocksFutureAccess,
  assertNoFundingAssumption,
} from "@/lib/participation/plans/plan-service";
import { defaultPrivacyForParticipation } from "@/lib/participation/privacy/sensitive-domains";
import { organiserCanReadReflection } from "@/lib/participation/reflections/reflection-service";
import { isParticipationScoreForbidden } from "@/lib/participation/scoring-prohibitions";

describe("Wave 17 inclusive life planner", () => {
  it("keeps participant-defined wording authoritative for goals", () => {
    const data = buildParticipationGoalCreateData({
      participantId: "participant-1",
      title: "Staff summary",
      participantWording: "I want to join a local choir when I feel ready",
      domain: "music",
    });

    expect(data.title).toBe("I want to join a local choir when I feel ready");
    expect(data.participantWording).toBe(
      "I want to join a local choir when I feel ready",
    );
    expect(data.status).toBe("draft");
  });

  it("defaults sensitive participation domains to private", () => {
    expect(
      defaultPrivacyForParticipation({
        domain: "faith",
        text: "Friday prayers",
      }),
    ).toBe("private");
    expect(
      defaultPrivacyForParticipation({
        domain: "social",
        text: "LGBTQ peer picnic",
      }),
    ).toBe("private");
  });

  it("does not treat unknown or stale event access as accessible", () => {
    expect(assessEventAccessFreshness(null).accessible).toBe(false);
    const stale = assessEventAccessFreshness(
      {
        evidenceLevel: "organiser_statement",
        lastCheckedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      new Date("2026-03-01T00:00:00.000Z"),
    );
    expect(stale.accessible).toBe(false);
    expect(stale.warnings.join(" ")).toMatch(/stale/i);
  });

  it("separates sponsored opportunities without ranking", () => {
    const separated = separateSponsoredResults([
      { id: "organic", sponsored: false },
      { id: "sponsor", sponsored: true },
    ]);

    expect(separated.organic.map((item) => item.id)).toEqual(["organic"]);
    expect(separated.sponsored.map((item) => item.id)).toEqual(["sponsor"]);
  });

  it("prevents organisers from reading reflections", () => {
    expect(organiserCanReadReflection()).toBe(false);
  });

  it("does not assume NDIS funding eligibility", () => {
    expect(() => assertNoFundingAssumption("NDIS funded")).toThrow(
      /NDIS_ELIGIBILITY/,
    );
    expect(() => assertNoFundingAssumption("Gold coin donation")).not.toThrow();
  });

  it("forbids attendance, loneliness, engagement, and isolation scores", () => {
    expect(isParticipationScoreForbidden("attendance_score")).toBe(true);
    expect(isParticipationScoreForbidden("loneliness_index")).toBe(true);
    expect(isParticipationScoreForbidden("social_isolation_risk")).toBe(true);
    expect(isParticipationScoreForbidden("engagement_points")).toBe(true);
  });

  it("does not let plan cancellation block future access", () => {
    expect(cancelPlanBlocksFutureAccess()).toBe(false);
  });

  it("declares the Wave 17 migration and schema additions", () => {
    const migration = path.join(
      process.cwd(),
      "prisma/migrations/20260716320000_wave17_inclusive_life_planner/migration.sql",
    );
    const schema = fs.readFileSync(
      path.join(process.cwd(), "prisma/schema.prisma"),
      "utf8",
    );
    expect(fs.existsSync(migration)).toBe(true);
    expect(schema).toMatch(/model ParticipationOpportunity \{/);
    expect(schema).toMatch(/model ParticipationPlan \{/);
    expect(schema).toMatch(/model ParticipationReflection \{/);
    expect(schema).toMatch(/completed/);
  });

  it("registers AURA participation prohibitions", () => {
    const manifest = findParticipationManifest();
    expect(manifest?.prohibitedActionSlugs).toContain(
      "participation.define_meaningful_life",
    );
    expect(manifest?.prohibitedActionSlugs).toContain(
      "participation.infer_loneliness",
    );
    expect(manifest?.prohibitedActionSlugs).toContain(
      "participation.publish_reflections",
    );
  });
});
