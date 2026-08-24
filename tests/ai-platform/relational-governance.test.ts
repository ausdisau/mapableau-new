import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assertRelationalActionNotProhibited,
  assertRelationalCapability,
  RELATIONAL_AUDIT,
} from "@/lib/ai/relational/gates";
import { assertRelationalConstitutionHonesty } from "@/lib/ai/relational/constitution";
import {
  runRelationalBenchmarkScenario,
  RELATIONAL_BENCHMARK_SCENARIOS,
} from "@/lib/ai/relational/benchmark";
import { handleRelationalTurn } from "@/lib/ai/relational/handlers";
import {
  clearCapabilityKillSwitch,
  engageCapabilityKillSwitch,
  requireAiCapability,
} from "@/lib/ai/platform";
import { PROHIBITED_AUTONOMOUS_ACTIONS } from "@/lib/ai/platform/types/authority";
import { relationalIntelligenceConfig } from "@/lib/config/relational-intelligence";

const RELATIONAL_FLAG_KEYS = [
  "MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED",
  "MAPABLE_RELATIONAL_INTELLIGENCE_MODEL_ASSISTED",
  "MAPABLE_RELATIONAL_INTELLIGENCE_DRAFT",
  "MAPABLE_RELATIONAL_INTELLIGENCE_ACCESS_SEARCH",
  "MAPABLE_RELATIONAL_INTELLIGENCE_HUMAN_HELP",
] as const;

const RELATIONAL_CAPABILITY_KEYS = [
  "relational.interpret",
  "relational.clarify",
  "relational.explain",
  "relational.draft",
  "access.search.read",
  "human.help.request",
] as const;

describe("Relational Intelligence governance", () => {
  const previous: Partial<
    Record<(typeof RELATIONAL_FLAG_KEYS)[number], string | undefined>
  > = {};

  beforeEach(() => {
    for (const key of RELATIONAL_FLAG_KEYS) {
      previous[key] = process.env[key];
      delete process.env[key];
    }
    for (const key of RELATIONAL_CAPABILITY_KEYS) {
      clearCapabilityKillSwitch(key);
    }
    delete process.env.MAPABLE_AI_GLOBAL_KILL_SWITCH;
  });

  afterEach(() => {
    for (const key of RELATIONAL_FLAG_KEYS) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("registers all relational capability keys as not_claimable / experimental", () => {
    for (const key of RELATIONAL_CAPABILITY_KEYS) {
      const cap = requireAiCapability(key);
      expect(cap.productionClaimStatus).toBe("not_claimable");
      expect(cap.maturity).toBe("experimental");
    }
  });

  it("keeps relational flags default false", () => {
    expect(relationalIntelligenceConfig.enabled).toBe(false);
    expect(relationalIntelligenceConfig.modelAssistedEnabled).toBe(false);
    expect(relationalIntelligenceConfig.draftEnabled).toBe(false);
    expect(relationalIntelligenceConfig.accessSearchEnabled).toBe(false);
    expect(relationalIntelligenceConfig.humanHelpEnabled).toBe(false);
  });

  it("denies relational capabilities when master flag is off", async () => {
    const result = await assertRelationalCapability({
      capabilityKey: "relational.interpret",
      tenantId: "tenant-test",
      participantId: "participant-test",
      actorUserId: "actor-test",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("feature_flag_disabled");
    }
  });

  it("denies unknown relational capability keys", async () => {
    const result = await assertRelationalCapability({
      capabilityKey: "relational.unknown_action",
      tenantId: "tenant-test",
      participantId: "participant-test",
      actorUserId: "actor-test",
      silent: true,
    });
    expect(result.allowed).toBe(false);
  });

  it("blocks relational capability when kill switch engaged", async () => {
    process.env.MAPABLE_RELATIONAL_INTELLIGENCE_ENABLED = "true";
    engageCapabilityKillSwitch("relational.interpret");
    const result = await assertRelationalCapability({
      capabilityKey: "relational.interpret",
      tenantId: "tenant-test",
      participantId: "participant-test",
      actorUserId: "actor-test",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("capability_kill_switch");
    }
  });

  it("rejects non-relational keys at relational gate", async () => {
    const result = await assertRelationalCapability({
      capabilityKey: "billing.copilot",
      tenantId: "tenant-test",
      participantId: "participant-test",
      actorUserId: "actor-test",
      silent: true,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("not_relational_capability");
    }
  });

  it("blocks prohibited autonomous actions", () => {
    expect(() =>
      assertRelationalActionNotProhibited("infer_capacity_from_communication_style"),
    ).toThrow(/RELATIONAL_PROHIBITED_ACTION/);
  });

  it("constitution references prohibited inference classes in authority.ts", () => {
    const honesty = assertRelationalConstitutionHonesty();
    expect(honesty.ok).toBe(true);
    for (const inference of [
      "infer_loneliness_compliance_motivation_or_risk_from_engagement",
      "infer_capacity_from_communication_style",
    ]) {
      expect(PROHIBITED_AUTONOMOUS_ACTIONS).toContain(inference);
    }
  });

  it("exposes relational audit action constants", () => {
    expect(RELATIONAL_AUDIT.gateAllowed).toBe("relational.gate.allowed");
    expect(RELATIONAL_AUDIT.gateDenied).toBe("relational.gate.denied");
    expect(RELATIONAL_AUDIT.humanHelpRequested).toBe(
      "relational.human_help.requested",
    );
  });

  it("passes through Navigator when relational master flag is off", async () => {
    const result = await handleRelationalTurn({
      tenantId: "tenant-test",
      participantId: "participant-test",
      actorUserId: "actor-test",
      capabilityKey: "relational.interpret",
      control: {
        assistanceMode: "guided_with_confirm",
        aiOptedOut: false,
        interpretationConfirmed: false,
        permittedFields: [],
        nonNegotiableKeys: [],
        hardConstraints: {
          requiredServices: [],
          exclusions: [],
          communicationRequirements: [],
          accessibilityRequirements: [],
          credentialRequirements: [],
          nonNegotiableKeys: [],
        },
        humanHelpRequested: false,
      },
    });
    expect(result.status).toBe("allowed");
  });

  it("runs synthetic relational benchmark scenarios", async () => {
    for (const scenario of RELATIONAL_BENCHMARK_SCENARIOS) {
      const result = await runRelationalBenchmarkScenario(scenario);
      expect(result.passed, `${scenario.id}: ${result.details.join("; ")}`).toBe(
        true,
      );
    }
  });
});
