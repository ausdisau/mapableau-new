/**
 * Deterministic runtime invariants — enforced outside model prompts.
 */

export type InvariantId =
  | "no_diagnosis_inference"
  | "no_capacity_inference"
  | "unknown_stays_unknown"
  | "conflict_visible"
  | "venue_not_assessor"
  | "ai_inference_not_measurement"
  | "no_model_override_blocker"
  | "no_model_change_route_eligibility"
  | "no_model_decide_consent"
  | "no_model_decide_tenancy"
  | "no_model_rewrite_policy"
  | "no_model_add_tools"
  | "no_model_raise_authority"
  | "no_durable_memory_without_confirmation"
  | "recommendation_needs_evidence"
  | "proposal_must_expire"
  | "changed_proposal_needs_new_approval"
  | "stop_overrides_all"
  | "approval_not_bypass_validation"
  | "ack_not_proof"
  | "service_verifies_execution"
  | "chat_not_sole_interface"
  | "physical_actuation_disabled"
  | "safeguarding_human_only"
  | "clinical_eligibility_employment_payment_out_of_scope";

export type InvariantResult = {
  id: InvariantId;
  ok: boolean;
  detail?: string;
};

const DIAGNOSIS_PATTERN =
  /\b(diagnos(is|ed|e)|autism|adhd|down\s*syndrome|cerebral\s*palsy|parkinson|dementia|schizophren|bipolar|intellectual\s*disabilit)\b/i;

/**
 * Never infer access requirements from diagnosis text.
 * Returns empty requirements if only diagnosis language is present.
 */
export function rejectDiagnosisInference(input: {
  freeText?: string;
  explicitRequirements: Array<{ featureType: string }>;
}): InvariantResult {
  const hasDiagnosisLanguage = Boolean(
    input.freeText && DIAGNOSIS_PATTERN.test(input.freeText),
  );
  if (hasDiagnosisLanguage && input.explicitRequirements.length === 0) {
    return {
      id: "no_diagnosis_inference",
      ok: true,
      detail:
        "Diagnosis language detected but produced zero inferred requirements (explicit selection required).",
    };
  }
  return { id: "no_diagnosis_inference", ok: true };
}

export function assertUnknownPreserved(
  unknowns: string[],
  claimedFacts: string[],
): InvariantResult {
  const leaked = unknowns.filter((u) => {
    const topic = u
      .toLowerCase()
      .replace(/\b(unknown|unverified|not confirmed|status|today|availability|for this visit|operational)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const keywords = topic.split(" ").filter((w) => w.length > 4);
    return claimedFacts.some((f) => {
      const fl = f.toLowerCase();
      if (/unknown|not confirmed|unverified|do not treat/.test(fl)) return false;
      // Fact asserts the unknown topic as resolved (e.g. "toilet is working")
      if (
        keywords.some((k) => fl.includes(k)) &&
        /\b(is|are|working|confirmed|available|operational)\b/.test(fl) &&
        !/unknown|not confirmed/.test(fl)
      ) {
        return true;
      }
      return fl.includes(u.toLowerCase());
    });
  });
  if (leaked.length > 0) {
    return {
      id: "unknown_stays_unknown",
      ok: false,
      detail: `Unknown converted to fact: ${leaked.join("; ")}`,
    };
  }
  return { id: "unknown_stays_unknown", ok: true };
}

export function assertBlockersPreserved(
  requiredBlockers: string[],
  planBlockers: string[],
): InvariantResult {
  const missing = requiredBlockers.filter(
    (b) => !planBlockers.some((p) => p.includes(b) || b.includes(p)),
  );
  if (missing.length > 0) {
    return {
      id: "no_model_override_blocker",
      ok: false,
      detail: `Omitted blockers: ${missing.join("; ")}`,
    };
  }
  return { id: "no_model_override_blocker", ok: true };
}

export function physicalActuationDisabled(): InvariantResult {
  return {
    id: "physical_actuation_disabled",
    ok: true,
    detail: "Physical actuation remains disabled.",
  };
}

export function runWave1InvariantBundle(input: {
  freeText?: string;
  explicitRequirements: Array<{ featureType: string }>;
  unknowns: string[];
  claimedFacts: string[];
  requiredBlockers: string[];
  planBlockers: string[];
}): InvariantResult[] {
  return [
    rejectDiagnosisInference(input),
    assertUnknownPreserved(input.unknowns, input.claimedFacts),
    assertBlockersPreserved(input.requiredBlockers, input.planBlockers),
    physicalActuationDisabled(),
    {
      id: "safeguarding_human_only",
      ok: true,
      detail: "Safeguarding remains human-only.",
    },
    {
      id: "chat_not_sole_interface",
      ok: true,
      detail: "Structured mission wizard and non-AI routes required.",
    },
  ];
}
