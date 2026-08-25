import type { AssistanceMode } from "@/lib/ai/relational/types";
import { PROHIBITED_AUTONOMOUS_ACTIONS } from "@/lib/ai/platform/types/authority";

/** Relational Constitution v0.1 — normative rules for the Relational Response Layer. */
export const RELATIONAL_CONSTITUTION_VERSION = "0.1.0" as const;

export const RELATIONAL_CONSTITUTION = {
  version: RELATIONAL_CONSTITUTION_VERSION,
  participantFacingName: "MapAble Navigator",
  principles: [
    "Models propose; deterministic services enforce consent, authority, audit, and kill switches.",
    "Participant approval is mandatory before consequential actions.",
    "Safeguarding decisions remain human-only.",
    "No emotion surveillance, capacity inference, or second agent operating system.",
    "Hard constraints are never relaxed silently.",
  ],
  assistanceModes: {
    participant_led: "Participant drives each step; AI may explain on request only.",
    guided_with_confirm:
      "AI may interpret and suggest; participant confirms before matching or drafts.",
    draft_only: "AI may produce draft envelopes only; never book, pay, or send.",
    human_only: "Route to human reviewer; no model adjudication of safeguarding.",
    opt_out_ai: "Deterministic passthrough; no model-backed commentary.",
  } satisfies Record<AssistanceMode, string>,
  prohibitedInferences: [
    "infer_loneliness_compliance_motivation_or_risk_from_engagement",
    "infer_capacity_from_communication_style",
    "infer_goals_from_diagnosis",
    "infer_consent_from_behaviour",
  ] as const,
  permanentProhibitions: PROHIBITED_AUTONOMOUS_ACTIONS,
  communicationPassportSourceOfTruth:
    "lib/support/communication-passport" as const,
  authorityWriterSourceOfTruth: "lib/authority" as const,
} as const;

export type RelationalConstitution = typeof RELATIONAL_CONSTITUTION;

export function assertRelationalConstitutionHonesty(): {
  ok: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  for (const inference of RELATIONAL_CONSTITUTION.prohibitedInferences) {
    if (
      !(PROHIBITED_AUTONOMOUS_ACTIONS as readonly string[]).includes(inference)
    ) {
      violations.push(`missing_prohibited_inference:${inference}`);
    }
  }
  return { ok: violations.length === 0, violations };
}
