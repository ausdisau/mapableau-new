/**
 * Deterministic release readiness assessment (Prompt 12).
 * LLMs must never approve releases — verdicts are evidence-derived only.
 */

import { isReleaseGovernanceEnabled } from "@/lib/config/release-governance";

import { isEvidencePresent } from "./evidence";
import { isTerminalReleaseState } from "./states";
import {
  ACCESSIBILITY_EVIDENCE_DIMENSIONS,
  OPERATIONS_CAPACITY_DIMENSIONS,
  SECURITY_EVIDENCE_DIMENSIONS,
  type GateFailure,
  type MapAbleReleaseManifest,
  type ReadinessAssessment,
  type ReadinessVerdict,
  type ReleaseGateEvidence,
} from "./types";

function fail(
  code: string,
  gate: GateFailure["gate"],
  message: string
): GateFailure {
  return { code, gate, message };
}

function requirePresent(
  evidence: { present: boolean; ref: string | null; recordedAt: string | null },
  code: string,
  gate: GateFailure["gate"],
  message: string,
  failures: GateFailure[]
): void {
  if (!isEvidencePresent(evidence)) {
    failures.push(fail(code, gate, message));
  }
}

function evaluateEvidenceGates(
  evidence: ReleaseGateEvidence,
  failures: GateFailure[]
): void {
  if (!evidence.owner.namedOwner || !isEvidencePresent(evidence.owner)) {
    failures.push(
      fail("missing_owner", "identity", "Named owner evidence is required")
    );
  }
  requirePresent(
    evidence.purpose,
    "missing_purpose",
    "identity",
    "Purpose statement evidence is required",
    failures
  );
  if (
    !evidence.authorityCeiling.ceiling ||
    !isEvidencePresent(evidence.authorityCeiling)
  ) {
    failures.push(
      fail(
        "missing_authority_ceiling",
        "identity",
        "Authority ceiling evidence is required"
      )
    );
  }
  if (
    evidence.privacyClassification.dataClasses.length === 0 ||
    !isEvidencePresent(evidence.privacyClassification)
  ) {
    failures.push(
      fail(
        "missing_privacy_classification",
        "privacy",
        "Privacy classification evidence is required"
      )
    );
  }
  if (
    evidence.consentScopes.scopes.length === 0 ||
    !isEvidencePresent(evidence.consentScopes)
  ) {
    failures.push(
      fail(
        "missing_consent_scopes",
        "privacy",
        "Consent scope evidence is required"
      )
    );
  }
  requirePresent(
    evidence.humanReviewPath,
    "missing_human_review_path",
    "human_review",
    "Human review path evidence is required",
    failures
  );
  if (
    !evidence.featureFlag.flagName ||
    !isEvidencePresent(evidence.featureFlag)
  ) {
    failures.push(
      fail("missing_feature_flag", "flags", "Feature flag evidence is required")
    );
  }
  if (
    !evidence.killSwitch.killSwitchKey ||
    !isEvidencePresent(evidence.killSwitch)
  ) {
    failures.push(
      fail("missing_kill_switch", "flags", "Kill switch evidence is required")
    );
  }
  if (
    !evidence.evaluationSuite.suiteId ||
    !isEvidencePresent(evidence.evaluationSuite)
  ) {
    failures.push(
      fail(
        "missing_evaluation_suite",
        "evaluation",
        "Evaluation suite evidence is required"
      )
    );
  }

  for (const dim of ACCESSIBILITY_EVIDENCE_DIMENSIONS) {
    if (!isEvidencePresent(evidence.accessibility[dim])) {
      failures.push(
        fail(
          `missing_accessibility_${dim}`,
          "accessibility",
          `Accessibility evidence missing for ${dim}`
        )
      );
    }
  }

  for (const dim of SECURITY_EVIDENCE_DIMENSIONS) {
    if (!isEvidencePresent(evidence.security[dim])) {
      failures.push(
        fail(
          `missing_security_${dim}`,
          "security",
          `Security evidence missing for ${dim}`
        )
      );
    }
  }

  requirePresent(
    evidence.rollbackPlan,
    "missing_rollback_plan",
    "rollback",
    "Rollback plan evidence is required",
    failures
  );

  if (
    !evidence.operationalOwner.namedOwner ||
    !isEvidencePresent(evidence.operationalOwner)
  ) {
    failures.push(
      fail(
        "missing_operational_owner",
        "operations",
        "Operational owner evidence is required"
      )
    );
  }
  requirePresent(
    evidence.supportProcess,
    "missing_support_process",
    "operations",
    "Support process evidence is required",
    failures
  );
  requirePresent(
    evidence.incidentProcess,
    "missing_incident_process",
    "operations",
    "Incident process evidence is required",
    failures
  );
  if (
    evidence.knownLimitations.limitations.length === 0 ||
    !isEvidencePresent(evidence.knownLimitations)
  ) {
    failures.push(
      fail(
        "missing_known_limitations",
        "operations",
        "Known limitations evidence is required"
      )
    );
  }

  for (const dim of OPERATIONS_CAPACITY_DIMENSIONS) {
    const entry = evidence.operationsCapacity[dim];
    if (!isEvidencePresent(entry) || !entry.namedOwner) {
      failures.push(
        fail(
          `missing_operations_capacity_${dim}`,
          "operations",
          `Named operations capacity missing for ${dim}`
        )
      );
    }
  }
}

function evaluateApprovalGates(
  manifest: MapAbleReleaseManifest,
  now: Date,
  failures: GateFailure[]
): void {
  const needsApproval =
    manifest.releaseState === "controlled_pilot" ||
    manifest.releaseState === "production_supported";

  if (!needsApproval) return;

  if (!manifest.approvedBy || !manifest.approvedAt) {
    failures.push(
      fail(
        "missing_approval",
        "approval",
        "Real human approval (approvedBy/approvedAt) is required for this release state"
      )
    );
    return;
  }

  if (manifest.expiresAt) {
    const expires = Date.parse(manifest.expiresAt);
    if (Number.isFinite(expires) && expires < now.getTime()) {
      failures.push(
        fail("approval_expired", "approval", "Release approval has expired")
      );
    }
  }
}

function decideVerdict(
  manifest: MapAbleReleaseManifest,
  failures: GateFailure[],
  governanceEnabled: boolean
): ReadinessVerdict {
  if (!governanceEnabled) return "BLOCKED";
  if (isTerminalReleaseState(manifest.releaseState)) return "BLOCKED";
  if (failures.some((f) => f.gate === "approval" || f.gate === "suspension")) {
    return "BLOCKED";
  }
  if (failures.length > 0) return "NOT_READY";
  return "READY_FOR_REVIEW";
}

/**
 * Assess whether a capability release manifest is ready for human review.
 * Never returns AUTO_APPROVED. Does not enable pilots or production.
 */
export function assessReleaseReadiness(
  manifest: MapAbleReleaseManifest,
  options?: { now?: Date; governanceEnabled?: boolean }
): ReadinessAssessment {
  const now = options?.now ?? new Date();
  const governanceEnabled =
    options?.governanceEnabled ?? isReleaseGovernanceEnabled();
  const failures: GateFailure[] = [];

  if (!governanceEnabled) {
    failures.push(
      fail(
        "governance_disabled",
        "governance_flag",
        "MAPABLE_RELEASE_GOVERNANCE_ENABLED is false — enforcement fail-closed"
      )
    );
  }

  if (manifest.releaseState === "suspended") {
    failures.push(
      fail(
        "release_suspended",
        "suspension",
        "Release is suspended — not eligible for pilot or production"
      )
    );
  }
  if (manifest.releaseState === "retired") {
    failures.push(
      fail(
        "release_retired",
        "suspension",
        "Release is retired — not eligible for pilot or production"
      )
    );
  }

  if (
    manifest.releaseState === "controlled_pilot_candidate" ||
    manifest.releaseState === "controlled_pilot" ||
    manifest.releaseState === "production_supported"
  ) {
    evaluateEvidenceGates(manifest.evidence, failures);
    evaluateApprovalGates(manifest, now, failures);
  }

  if (
    manifest.releaseState === "experimental" ||
    manifest.releaseState === "internal_test"
  ) {
    if (!manifest.owner) {
      failures.push(
        fail("missing_owner", "identity", "Manifest owner is required")
      );
    }
    if (manifest.requiredFlags.length === 0) {
      failures.push(
        fail(
          "missing_required_flags",
          "flags",
          "At least one required server-side flag must be declared"
        )
      );
    }
  }

  const verdict = decideVerdict(manifest, failures, governanceEnabled);

  return {
    capabilityKey: manifest.capabilityKey,
    releaseState: manifest.releaseState,
    verdict,
    failures,
    checkedAt: now.toISOString(),
    governanceEnforcementActive: governanceEnabled,
  };
}

/** True only when verdict is READY_FOR_REVIEW — never means approved or enabled. */
export function isReadyForHumanReview(assessment: ReadinessAssessment): boolean {
  return assessment.verdict === "READY_FOR_REVIEW";
}
