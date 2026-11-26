import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAdvisoryOutcomeLog,
  createSyntheticCartographyAdapter,
  MAX_ADVISORY_OUTCOME_LOG,
  readAdvisoryOutcomeLog,
  runGoldenSlice,
} from "@/lib/pilot/service-cartography";
import {
  syntheticNeeds,
  syntheticScenario,
} from "@/lib/pilot/service-cartography/fixtures";
import { modelEconomicScenario } from "@mapable/service-cartography";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(),
}));

describe("Service Cartography golden community-visit slice", () => {
  beforeEach(() => {
    process.env.MAPABLE_SERVICE_CARTOGRAPHY_PILOT = "true";
    process.env.MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY = "true";
    clearAdvisoryOutcomeLog();
  });

  afterEach(() => {
    delete process.env.MAPABLE_SERVICE_CARTOGRAPHY_PILOT;
    delete process.env.MAPABLE_SERVICE_CARTOGRAPHY_SYNTHETIC_ONLY;
    clearAdvisoryOutcomeLog();
  });

  it("returns two advisory choices, missing-dependency explanations, and human confirmation", async () => {
    const slice = await runGoldenSlice({});
    expect(slice.blocked).toBe(false);
    expect(slice.matching.status).toBe("advisory_options");
    expect(slice.matching.ranked).toHaveLength(2);
    expect(slice.matching.advisory.requiresParticipantConfirmation).toBe(true);
    expect(slice.matching.advisory.requiresHumanReview).toBe(true);
    expect(slice.missingDependencyExplanations.length).toBeGreaterThan(0);
    expect(slice.graph.missingNodeIds).toContain("personal-care-fallback");
    expect(slice.route.status).toBe("advisory_verified_route");
    expect(slice.schedule.proposals).toHaveLength(1);
    expect(slice.isBooking).toBe(false);
    expect(slice.autoAssignment).toBe(false);
    expect(slice.productionClaim).toBe("none");
    expect(readAdvisoryOutcomeLog()).toHaveLength(1);
  });

  it("fails closed when consent is withdrawn", async () => {
    const slice = await runGoldenSlice({ failureMode: "consent_withdrawn" });
    expect(slice.blocked).toBe(true);
    expect(slice.matching.status).toBe("consent_required");
    expect(slice.matching.ranked).toHaveLength(0);
    expect(slice.schedule.proposals).toHaveLength(0);
    expect(
      slice.notices.some((notice) => /schedule proposals are withheld/i.test(notice)),
    ).toBe(true);
  });

  it("rejects stale evidence", async () => {
    const slice = await runGoldenSlice({ failureMode: "stale_evidence" });
    expect(slice.blocked).toBe(true);
    expect(slice.matching.status).toBe("no_verified_match");
    expect(slice.schedule.proposals).toHaveLength(0);
  });

  it("rejects unverified provider evidence", async () => {
    const slice = await runGoldenSlice({ failureMode: "unverified_provider" });
    expect(slice.blocked).toBe(true);
    expect(slice.matching.exclusions.length).toBeGreaterThan(0);
    expect(slice.schedule.proposals).toHaveLength(0);
  });

  it("rejects communication mismatches before cost ranking", async () => {
    const slice = await runGoldenSlice({ failureMode: "communication_mismatch" });
    expect(slice.blocked).toBe(true);
    expect(
      slice.matching.exclusions.some((exclusion) =>
        exclusion.reasons.includes("communication_access_missing"),
      ),
    ).toBe(true);
    expect(slice.schedule.proposals).toHaveLength(0);
  });

  it("blocks a missing required transport dependency", async () => {
    const slice = await runGoldenSlice({ failureMode: "missing_transport_link" });
    expect(slice.blocked).toBe(true);
    expect(slice.blockReason).toBe("missing_transport_link");
    expect(slice.graph.missingNodeIds).toContain("transport");
  });

  it("returns no-match before a success path is claimed", async () => {
    const slice = await runGoldenSlice({ failureMode: "no_match" });
    expect(slice.blocked).toBe(true);
    expect(slice.matching.status).toBe("no_verified_match");
    expect(slice.matching.ranked).toHaveLength(0);
    expect(slice.schedule.proposals).toHaveLength(0);
  });

  it("caps the in-memory advisory log so simulate cannot grow without bound", async () => {
    const adapter = createSyntheticCartographyAdapter();
    const context = {
      actorUserId: null,
      organisationId: null,
      source: "synthetic_simulate" as const,
    };
    for (let index = 0; index < MAX_ADVISORY_OUTCOME_LOG + 5; index += 1) {
      await adapter.recordAdvisoryOutcome(
        {
          eventId: `cap-${index}`,
          occurredAt: "2026-11-18T09:00:00Z",
          algorithmId: "MATCH-001",
          algorithmVersion: "0.1.0",
          inputReferenceIds: [`cap-${index}`],
          outcome: "advisory",
          reasonCodes: ["cap"],
          humanReviewRequired: true,
        },
        context,
      );
    }
    const log = readAdvisoryOutcomeLog();
    expect(log).toHaveLength(MAX_ADVISORY_OUTCOME_LOG);
    expect(log[0]?.eventId).toBe("cap-5");
    expect(log[log.length - 1]?.eventId).toBe(
      `cap-${MAX_ADVISORY_OUTCOME_LOG + 4}`,
    );
  });

  it("surfaces cancellation without fallback as a human follow-up", async () => {
    const slice = await runGoldenSlice({
      failureMode: "cancellation_without_fallback",
    });
    expect(slice.blocked).toBe(true);
    expect(slice.continuity[0]?.reason).toBe("cancelled_without_fallback");
    expect(slice.continuity[0]?.action).toBe("human_follow_up_required");
  });

  it("treats unknown supply as unknown rather than zero", async () => {
    const slice = await runGoldenSlice({ failureMode: "unknown_supply" });
    expect(slice.economic.hasUnknownCapacity).toBe(true);
    expect(slice.notices.some((notice) => /unknown/i.test(notice))).toBe(true);
  });

  it("keeps required support units invariant when the budget shrinks", () => {
    const high = modelEconomicScenario({
      needs: syntheticNeeds,
      scenario: syntheticScenario,
    });
    const low = modelEconomicScenario({
      needs: syntheticNeeds,
      scenario: { ...syntheticScenario, fundingCeilingCentsAUD: 0 },
    });
    expect(high.requiredUnitsBySupportType).toEqual(
      low.requiredUnitsBySupportType,
    );
    expect(high.requiredUnitsBySupportType["community-access"]).toBe(12);
    expect(low.estimatedFundingGapCentsAUD).toBeGreaterThan(
      high.estimatedFundingGapCentsAUD,
    );
  });
});
