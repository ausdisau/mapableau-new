import { afterEach, describe, expect, it, vi } from "vitest";

describe("Wave 0 capability flags fail closed", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("disables matching engine, NDIA readiness, billing copilot, and case AI when unset", async () => {
    vi.stubEnv("MATCHING_ENGINE_ENABLED", undefined);
    vi.stubEnv("NDIA_READINESS_ENABLED", undefined);
    vi.stubEnv("BILLING_COPILOT_ENABLED", undefined);
    vi.stubEnv("CASE_MANAGEMENT_ENABLED", undefined);
    vi.stubEnv("CASE_MANAGEMENT_AI_ENABLED", undefined);

    const { phase4Config } = await import("@/lib/config/phase4");
    const { phase5Config } = await import("@/lib/config/phase5");
    const { isBillingCopilotEnabled } = await import("@/lib/billing/config");
    const { caseManagementConfig } =
      await import("@/lib/config/case-management");

    expect(phase4Config.matchingEngineEnabled).toBe(false);
    expect(phase5Config.ndiaReadinessEnabled).toBe(false);
    expect(isBillingCopilotEnabled()).toBe(false);
    expect(caseManagementConfig.enabled).toBe(false);
    expect(caseManagementConfig.aiEnabled).toBe(false);
  });

  it("keeps participant confirmation and human-review safety gates fail-open", async () => {
    vi.stubEnv("MATCH_PARTICIPANT_CONFIRM_REQUIRED", undefined);
    vi.stubEnv("AI_MATCHING_REQUIRE_HUMAN_REVIEW", undefined);

    const { platformPatternsConfig } =
      await import("@/lib/config/platform-patterns");
    const { phase5Config } = await import("@/lib/config/phase5");

    expect(platformPatternsConfig.matchParticipantConfirmRequired).toBe(true);
    expect(phase5Config.aiMatchingRequireHumanReview).toBe(true);
  });

  it("keeps starting-work synthetic-only fail-open as a safety default", async () => {
    vi.stubEnv("MAPABLE_STARTING_WORK_SYNTHETIC_ONLY", undefined);
    const { startingWorkPilotConfig } =
      await import("@/lib/config/starting-work-pilot");
    expect(startingWorkPilotConfig.syntheticOnly).toBe(true);
  });

  it("keeps traffic-aware ETA and live location flags fail-closed when unset", async () => {
    vi.stubEnv("TRANSPORT_ETA_PILOT_ENABLED", undefined);
    vi.stubEnv("TRANSPORT_TRAFFIC_AWARE_ENABLED", undefined);
    vi.stubEnv("TRANSPORT_TOMTOM_TRAFFIC_LIVE", undefined);
    vi.stubEnv("TRANSPORT_LIVE_LOCATION_ENABLED", undefined);
    vi.stubEnv("TFNSW_ENRICH_ROUTE_ESTIMATES", undefined);
    vi.stubEnv("TRANSPORT_ROUTING_PROVIDER", undefined);
    vi.stubEnv("TOMTOM_API_KEY", undefined);

    const { transportRoutingConfig } = await import(
      "@/lib/config/transport-routing"
    );
    const { phase4Config } = await import("@/lib/config/phase4");
    const { tfnswConfig } = await import("@/lib/config/tfnsw");

    expect(transportRoutingConfig.etaPilotEnabled).toBe(false);
    expect(transportRoutingConfig.trafficAwareEnabled).toBe(false);
    expect(transportRoutingConfig.tomtomTrafficLive).toBe(false);
    expect(transportRoutingConfig.provider).toBe("mock");
    expect(transportRoutingConfig.tomtomApiKey).toBeUndefined();
    expect(phase4Config.transportLiveLocationEnabled).toBe(false);
    expect(tfnswConfig.enrichRouteEstimates).toBe(false);
  });

  it("keeps MAJI advisory flags fail-closed when unset", async () => {
    vi.stubEnv("MAJI_ADVISORY_ENABLED", undefined);
    vi.stubEnv("MAJI_TRAFFIC_ROUTING_ENABLED", undefined);
    vi.stubEnv("MAJI_TOLL_ESTIMATES_ENABLED", undefined);
    vi.stubEnv("MAJI_SYNTHETIC_PREVIEW_ENABLED", undefined);
    vi.stubEnv("MAJI_SYNTHETIC_CENTS_PER_KM", undefined);
    vi.stubEnv("MAJI_SYNTHETIC_CENTS_PER_PAID_MINUTE", undefined);
    vi.stubEnv("TRANSPORT_TRAFFIC_AWARE_ENABLED", undefined);
    vi.stubEnv("TRANSPORT_TOMTOM_TRAFFIC_LIVE", undefined);
    vi.stubEnv("TOMTOM_API_KEY", undefined);

    const { majiConfig, isMajiLiveTrafficAllowed, resolveMajiSyntheticRates } =
      await import("@/lib/config/maji");

    expect(majiConfig.advisoryEnabled).toBe(false);
    expect(majiConfig.trafficRoutingEnabled).toBe(false);
    expect(majiConfig.tollEstimatesEnabled).toBe(false);
    expect(majiConfig.syntheticPreviewEnabled).toBe(false);
    expect(majiConfig.minTimeSavingSeconds).toBe(180);
    expect(majiConfig.minCostSavingCents).toBe(200);
    expect(majiConfig.cooldownSeconds).toBe(300);
    expect(isMajiLiveTrafficAllowed()).toBe(false);
    expect(resolveMajiSyntheticRates()).toEqual({
      centsPerKm: null,
      centsPerPaidMinute: null,
    });
  });
});
