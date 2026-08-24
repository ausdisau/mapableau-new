import { assertRelationalConstitutionHonesty } from "@/lib/ai/relational/constitution";
import {
  assertRelationalCapability,
  assertRelationalActionNotProhibited,
} from "@/lib/ai/relational/gates";
import type { AssistanceMode } from "@/lib/ai/relational/types";
import { relationalIntelligenceConfig } from "@/lib/config/relational-intelligence";

export type RelationalBenchmarkScenario = {
  id: string;
  title: string;
  capabilityKey: string;
  assistanceMode: AssistanceMode;
  syntheticInput: Record<string, unknown>;
  expected: {
    gateAllowed?: boolean;
    mustNotProhibit?: string[];
    constitutionOk?: boolean;
  };
};

export const RELATIONAL_BENCHMARK_SCENARIOS: RelationalBenchmarkScenario[] = [
  {
    id: "relational_flags_off",
    title: "Relational capabilities blocked when master flag off",
    capabilityKey: "relational.interpret",
    assistanceMode: "guided_with_confirm",
    syntheticInput: { goalText: "Find OT near me" },
    expected: { gateAllowed: false, constitutionOk: true },
  },
  {
    id: "relational_clarify_bounded",
    title: "Clarify capability registered with read-only ceiling",
    capabilityKey: "relational.clarify",
    assistanceMode: "guided_with_confirm",
    syntheticInput: { goalText: "What did you mean by service type?" },
    expected: { gateAllowed: false },
  },
  {
    id: "human_help_escalation",
    title: "Human help request never invokes prohibited actions",
    capabilityKey: "human.help.request",
    assistanceMode: "human_only",
    syntheticInput: { humanHelpRequested: true },
    expected: {
      gateAllowed: false,
      mustNotProhibit: ["approve_ndis_claim", "clinical_decision"],
      constitutionOk: true,
    },
  },
  {
    id: "access_search_read_tool",
    title: "Access search read requires access flag",
    capabilityKey: "access.search.read",
    assistanceMode: "participant_led",
    syntheticInput: { q: "physio", state: "NSW" },
    expected: { gateAllowed: false },
  },
  {
    id: "opt_out_ai_mode",
    title: "Opt-out mode skips model-backed relational keys",
    capabilityKey: "relational.draft",
    assistanceMode: "opt_out_ai",
    syntheticInput: { aiOptedOut: true },
    expected: { gateAllowed: false, constitutionOk: true },
  },
];

export type RelationalBenchmarkResult = {
  scenarioId: string;
  passed: boolean;
  details: string[];
};

/**
 * Synthetic relational benchmark harness — no live model calls or production data.
 */
export async function runRelationalBenchmarkScenario(
  scenario: RelationalBenchmarkScenario,
): Promise<RelationalBenchmarkResult> {
  const details: string[] = [];
  let passed = true;

  if (scenario.expected.constitutionOk) {
    const honesty = assertRelationalConstitutionHonesty();
    if (!honesty.ok) {
      passed = false;
      details.push(`constitution_violations:${honesty.violations.join(",")}`);
    }
  }

  if (scenario.expected.mustNotProhibit) {
    for (const action of scenario.expected.mustNotProhibit) {
      try {
        assertRelationalActionNotProhibited(action);
        passed = false;
        details.push(`expected_prohibited:${action}`);
      } catch {
        // expected
      }
    }
  }

  const gate = await assertRelationalCapability({
    capabilityKey: scenario.capabilityKey,
    tenantId: "tenant-synthetic-relational",
    participantId: "participant-synthetic-relational",
    actorUserId: "actor-synthetic-relational",
    silent: true,
  });

  const expectedAllowed = scenario.expected.gateAllowed ?? false;
  if (gate.allowed !== expectedAllowed) {
    passed = false;
    details.push(
      `gate_mismatch:expected=${expectedAllowed},actual=${gate.allowed},reason=${gate.allowed ? "ok" : gate.reason}`,
    );
  }

  if (!relationalIntelligenceConfig.enabled && scenario.expected.gateAllowed === false) {
    details.push("master_flag_off_as_expected");
  }

  return { scenarioId: scenario.id, passed, details };
}

export async function runRelationalBenchmarkSuite(): Promise<{
  passed: number;
  failed: number;
  results: RelationalBenchmarkResult[];
}> {
  const results = await Promise.all(
    RELATIONAL_BENCHMARK_SCENARIOS.map(runRelationalBenchmarkScenario),
  );
  const passed = results.filter((r) => r.passed).length;
  return { passed, failed: results.length - passed, results };
}
