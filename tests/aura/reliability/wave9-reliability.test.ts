import { afterEach, describe, expect, it } from "vitest";

import {
  buildCivicAccessTwin,
  buildRegionalAccessTwin,
  createAndPlanMission,
  evaluateWave9ReleaseGate,
  getPublicReliabilityCard,
  listPredictiveFindings,
  publishServiceCommitment,
  recordReliabilityWindow,
  requireMission,
  resetCivicRegionalStore,
  resetGuardianStore,
  resetLeaseStore,
  resetMissionStore,
  resetPredictiveGuardianStore,
  resetReliabilityStore,
  resetWitnessStore,
  runInfrastructureSimulation,
  runPredictiveGuardianScan,
  setWave8ReleaseGatePassed,
  setWave9ReleaseGatePassed,
} from "@/lib/aura";

afterEach(() => {
  resetMissionStore();
  resetLeaseStore();
  resetWitnessStore();
  resetReliabilityStore();
  resetCivicRegionalStore();
  resetPredictiveGuardianStore();
  resetGuardianStore();
});

describe("Wave 9 — reliability, civic, simulator", () => {
  it("missing telemetry cannot count as full uptime", () => {
    expect(() =>
      recordReliabilityWindow({
        placeId: "place-harbour-civic",
        elementId: "hcc-lift-west",
        indicator: "lift_uptime",
        period: "90d",
        availabilityPercent: 100,
        unplannedInterruptions: 0,
        medianRestorationMinutes: null,
        alternativeAvailableCount: 0,
        alternativeTotal: 0,
        telemetryCoveragePercent: 80,
        methodology: "time-weighted operational availability",
        sourceCoverage: ["sensorthings"],
        missingData: ["20% telemetry gap"],
        scheduledExclusions: [],
        confidence: 0.7,
        lastUpdated: new Date().toISOString(),
      }),
    ).toThrow("AURA_RELIABILITY_MISSING_TELEMETRY_AS_UPTIME");
  });

  it("publishes reliability card with methodology", () => {
    const window = recordReliabilityWindow({
      placeId: "place-harbour-civic",
      elementId: "hcc-lift-west",
      indicator: "lift_uptime",
      period: "90d",
      availabilityPercent: 99.1,
      unplannedInterruptions: 4,
      medianRestorationMinutes: 28,
      alternativeAvailableCount: 3,
      alternativeTotal: 4,
      telemetryCoveragePercent: 96,
      methodology: "operating-hours excluding scheduled maintenance",
      sourceCoverage: ["sensorthings-fixture"],
      missingData: [],
      scheduledExclusions: ["planned maintenance 2026-05-01"],
      confidence: 0.85,
      lastUpdated: new Date().toISOString(),
    });
    expect(window.missingDataCountedAsUptime).toBe(false);
    expect(window.paidPlanInfluenced).toBe(false);
    expect(window.personalFitScore).toBeNull();
    const card = getPublicReliabilityCard(
      "place-harbour-civic",
      "hcc-lift-west",
    );
    expect(card[0]?.methodology).toBeTruthy();
  });

  it("service commitments are voluntary and not compliance badges", () => {
    const c = publishServiceCommitment({
      organisationId: "org-hcc",
      scope: "western lift",
      indicator: "live_feed_freshness",
      target: "refresh every 5 minutes",
      effectiveDate: "2026-01-01",
      expiry: "2027-01-01",
      exclusions: ["power outage"],
      evidenceSource: "sensorthings",
      breachMethod: "public reliability card",
      explanation: "Operational commitment only",
      remediationPath: "incident acknowledgement",
    });
    expect(c.legalComplianceBadge).toBe(false);
  });

  it("civic and regional twins suppress individual journeys", () => {
    const civic = buildCivicAccessTwin({ regionId: "harbour-lga", simulated: true });
    expect(civic.individualJourneysExposed).toBe(false);
    const regional = buildRegionalAccessTwin({
      regionId: "harbour-lga",
      hubLabel: "State hub",
    });
    expect(regional.smallCellSuppressed).toBe(true);
    expect(regional.participantIdentitiesExposed).toBe(false);
  });

  it("infrastructure simulator exposes assumptions without participant scores", () => {
    const scenario = runInfrastructureSimulation({
      regionId: "harbour-lga",
      label: "Extend Entrance B and add lift route",
      proposedChange: "Extend Entrance B to 9pm and install alternative lift",
      assumptions: ["funding available", "construction window 6 months"],
    });
    expect(scenario.bestOptionClaim).toBe(false);
    expect(scenario.participantScore).toBeNull();
    expect(scenario.legalComplianceClaim).toBe(false);
    expect(scenario.assumptions.length).toBeGreaterThan(0);
  });

  it("predictive guardian describes systems not people", () => {
    const res = createAndPlanMission({
      goal: "Interview",
      selectedModules: ["access"],
      placeId: "place-harbour-civic",
      scenarioId: "taylor-harbour-interview",
      userId: "demo-participant-taylor",
    });
    const mission = requireMission(res.missionId);
    const findings = runPredictiveGuardianScan({
      missionId: mission.id,
      userId: mission.participantId,
    });
    expect(findings[0]?.describesSystemReliability).toBe(true);
    expect(findings[0]?.prohibitedParticipantScoring).toBe(false);
    expect(listPredictiveFindings(mission.id).length).toBe(1);
  });

  it("Wave 9 gate passes when Wave 8 gated", () => {
    setWave8ReleaseGatePassed(true);
    setWave9ReleaseGatePassed(true);
    expect(evaluateWave9ReleaseGate().passed).toBe(true);
  });
});
