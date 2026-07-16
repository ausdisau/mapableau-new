import {
  assertBlockersPreserved,
  assertUnknownPreserved,
} from "../authority/invariants";
import {
  AURA_WAVE1_AUTHORITY_CEILING,
  isAuthorityAtMost,
} from "../authority/ladder";
import { listActiveLeases } from "../leases";
import type { AuraMissionRecord } from "../mission/store";
import type { AuraProofPlan, AuraVerifierResult } from "../schemas";

export const AURA_VERIFIER_VERSION = "aura-plan-verifier@1";

export function verifyProofPlan(input: {
  plan: AuraProofPlan;
  mission: AuraMissionRecord;
  requiredBlockers: string[];
  expectedUnknowns: string[];
  allowedDisclosureFields: string[];
}): AuraVerifierResult {
  const findings: AuraVerifierResult["findings"] = [];
  const checkedAt = new Date().toISOString();

  if (input.mission.stopState || input.mission.status === "stopped") {
    findings.push({
      code: "mandate_revoked",
      severity: "error",
      message: "Participant mandate revoked; plan rejected.",
    });
  }

  if (
    !isAuthorityAtMost(
      input.mission.authorityLevel,
      AURA_WAVE1_AUTHORITY_CEILING,
    )
  ) {
    findings.push({
      code: "authority_ceiling",
      severity: "error",
      message: `Authority ${input.mission.authorityLevel} exceeds Wave 1 ceiling.`,
    });
  }

  if (input.plan.authority.maximumLevel !== AURA_WAVE1_AUTHORITY_CEILING) {
    findings.push({
      code: "plan_authority_mismatch",
      severity: "warning",
      message:
        "Plan maximum authority should equal Wave 1 ceiling L2_RECOMMEND.",
    });
  }

  const leases = listActiveLeases(input.mission.id);
  if (leases.length === 0 && !input.mission.stopState) {
    findings.push({
      code: "no_active_leases",
      severity: "error",
      message: "No active capability leases for this mission.",
    });
  }

  if (input.plan.evidence.length === 0) {
    findings.push({
      code: "missing_evidence",
      severity: "error",
      message: "Plan without evidence is rejected.",
    });
  }

  for (const ev of input.plan.evidence) {
    if (!ev.evidenceId || !ev.sourceType || !ev.observedAt) {
      findings.push({
        code: "evidence_provenance",
        severity: "error",
        message: `Evidence ${ev.evidenceId || "(missing)"} lacks provenance.`,
      });
    }
  }

  const blockerCheck = assertBlockersPreserved(
    input.requiredBlockers,
    input.plan.blockers,
  );
  if (!blockerCheck.ok) {
    findings.push({
      code: "blocker_omitted",
      severity: "error",
      message: blockerCheck.detail ?? "Required blocker omitted.",
    });
  }

  const unknownCheck = assertUnknownPreserved(
    input.expectedUnknowns,
    input.plan.assumptions.concat(
      // facts must not claim unknowns as confirmed
      [],
    ),
  );
  // Also ensure unknowns remain listed on the plan
  for (const u of input.expectedUnknowns) {
    if (!input.plan.unknowns.some((p) => p.includes(u) || u.includes(p))) {
      findings.push({
        code: "unknown_omitted",
        severity: "error",
        message: `Unknown not preserved on plan: ${u}`,
      });
    }
  }
  if (!unknownCheck.ok) {
    findings.push({
      code: "unknown_as_fact",
      severity: "error",
      message: unknownCheck.detail ?? "Unknown converted to fact.",
    });
  }

  if (input.plan.recommendedRoute) {
    if (!input.plan.recommendedRoute.deterministic) {
      findings.push({
        code: "route_not_deterministic",
        severity: "error",
        message: "Route was not produced by the deterministic route engine.",
      });
    }
    if (
      !input.plan.deterministicDecisions.some((d) =>
        d.engine.includes("route-engine"),
      )
    ) {
      findings.push({
        code: "route_engine_reference_missing",
        severity: "error",
        message: "Missing deterministic route-engine decision reference.",
      });
    }
  }

  // Disclosure minimisation — plan must not list diagnosis fields
  const disclosed = input.plan.participantRequirements.map(
    (r) => r.featureType,
  );
  for (const field of disclosed) {
    if (
      /diagnos|medical|ndis_eligibility/i.test(field) ||
      (!input.allowedDisclosureFields.includes(field) &&
        ![
          "quiet_waiting_area",
          "plain_language_instructions",
          "staff_assistance",
        ].includes(field))
    ) {
      // preferred fields allowed; only flag diagnosis-like
      if (/diagnos|medical|ndis/i.test(field)) {
        findings.push({
          code: "excessive_disclosure",
          severity: "error",
          message: `Disclosure exceeds consent: ${field}`,
        });
      }
    }
  }

  if (!input.plan.expiresAt || Date.parse(input.plan.expiresAt) <= Date.now()) {
    findings.push({
      code: "plan_expired",
      severity: "error",
      message: "Plan has no valid expiry.",
    });
  }

  // Wave 1: proposals empty — if any appear they must expire and stay non-executable
  for (const raw of input.plan.proposedActions) {
    const action = raw as { expiresAt?: string; authorityLevel?: string };
    if (!action.expiresAt) {
      findings.push({
        code: "proposal_no_expiry",
        severity: "error",
        message: "Proposal has no expiry.",
      });
    }
    if (
      action.authorityLevel &&
      !isAuthorityAtMost(
        action.authorityLevel as "L2_RECOMMEND",
        AURA_WAVE1_AUTHORITY_CEILING,
      )
    ) {
      findings.push({
        code: "action_exceeds_authority",
        severity: "error",
        message: "Action exceeds mission authority.",
      });
    }
  }

  const errors = findings.filter((f) => f.severity === "error");
  const warnings = findings.filter((f) => f.severity === "warning");

  let status: AuraVerifierResult["status"];
  if (errors.length > 0) status = "rejected";
  else if (warnings.length > 0) status = "verified_with_warnings";
  else status = "verified";

  return {
    status,
    findings,
    checkedAt,
    verifierVersion: AURA_VERIFIER_VERSION,
  };
}

/** Model cannot override verifier output. */
export function applyModelOverrideAttempt(
  verifier: AuraVerifierResult,
  _modelClaimedStatus: string,
): AuraVerifierResult {
  return {
    ...verifier,
    findings: [
      ...verifier.findings,
      {
        code: "model_override_ignored",
        severity: "info",
        message:
          "Model cannot override verifier output; deterministic result retained.",
      },
    ],
  };
}
