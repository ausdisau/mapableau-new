import { describe, expect, it } from "vitest";

import {
  isProductionInventoryReady,
  summariseInventory,
} from "@/lib/ai-assurance/inventory/register";
import { scoreRisk } from "@/lib/ai-assurance/risk-assessment/scoring";
import {
  IMPACT_ASSESSMENT_QUESTIONS,
  isAssessmentComplete,
} from "@/lib/ai-assurance/impact-assessment/questions";
import { AURA_CONTROL_MAP } from "@/lib/ai-assurance/control-mapping/controls";
import {
  classifyToCandidate,
  isReportabilityDecidedByAura,
} from "@/lib/ai-assurance/incidents/classifier";

describe("AI assurance modules", () => {
  it("inventory ready only when status=active", () => {
    expect(
      isProductionInventoryReady({
        id: "1",
        systemKey: "s1",
        displayName: "s1",
        owner: "team",
        purposeSummary: "x",
        riskTier: "low_readonly",
        status: "active",
      })
    ).toBe(true);
    expect(
      isProductionInventoryReady({
        id: "1",
        systemKey: "s1",
        displayName: "s1",
        owner: "team",
        purposeSummary: "x",
        riskTier: "low_readonly",
        status: "proposed",
      })
    ).toBe(false);
  });

  it("summariseInventory counts by status", () => {
    const summary = summariseInventory([
      {
        id: "1",
        systemKey: "s1",
        displayName: "",
        owner: "",
        purposeSummary: "",
        riskTier: "low_readonly",
        status: "active",
      },
      {
        id: "2",
        systemKey: "s2",
        displayName: "",
        owner: "",
        purposeSummary: "",
        riskTier: "prohibited",
        status: "retired",
      },
    ]);
    expect(summary.total).toBe(2);
    expect(summary.active).toBe(1);
    expect(summary.retired).toBe(1);
    expect(summary.prohibited).toBe(1);
  });

  it("risk scoring: irreversible + write-capable => high", () => {
    expect(
      scoreRisk({
        autonomyLevel: 1,
        reversibility: "irreversible",
        populationImpact: 0,
        regulatorySensitivity: 0,
        writeCapable: true,
        affectsMoney: false,
      })
    ).toBe("high_irreversible");
  });

  it("risk scoring: read-only stays low", () => {
    expect(
      scoreRisk({
        autonomyLevel: 0,
        reversibility: "reversible",
        populationImpact: 0,
        regulatorySensitivity: 0,
        writeCapable: false,
        affectsMoney: false,
      })
    ).toBe("low_readonly");
  });

  it("impact assessment complete only when every question answered", () => {
    const partial = [
      { question: IMPACT_ASSESSMENT_QUESTIONS[0], answer: "x" },
    ];
    expect(isAssessmentComplete(partial)).toBe(false);
    const full = IMPACT_ASSESSMENT_QUESTIONS.map((q) => ({
      question: q,
      answer: "answered",
    }));
    expect(isAssessmentComplete(full)).toBe(true);
  });

  it("control map contains required entries", () => {
    const keys = AURA_CONTROL_MAP.map((c) => c.auraControl);
    expect(keys).toContain("aura.authority.envelope_required");
    expect(keys).toContain("aura.plans.dag_only");
    expect(keys).toContain("aura.simulation.no_external_writes");
    expect(keys).toContain("aura.approvals.input_hash_bound");
    expect(keys).toContain("aura.memory.no_auto_from_model");
  });

  it("incident reportability is not decided by AURA", () => {
    expect(isReportabilityDecidedByAura()).toBe(false);
    const c = classifyToCandidate(
      "prompt_injection_attempt",
      "malicious tool output attempted authority grant",
      "exec_1"
    );
    expect(c.humanReviewRequired).toBe(true);
  });
});
