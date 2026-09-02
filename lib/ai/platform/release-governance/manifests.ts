/**
 * Code-defined release manifests (Prompt 12).
 * All entries start experimental/internal_test with null approvals.
 * Do not invent approval references.
 */

import { emptyReleaseGateEvidence } from "./evidence";
import type { MapAbleReleaseManifest } from "./types";

/**
 * Seed manifests for Agentic Nerve Centre surfaces.
 * No pilot is enabled. Approvals remain null until real human sign-off.
 */
export const RELEASE_MANIFESTS: readonly MapAbleReleaseManifest[] = [
  {
    capabilityKey: "mission.copilot",
    releaseState: "experimental",
    version: "0.1.0",
    allowedCohorts: [],
    domains: ["mission"],
    requiredFlags: ["MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED"],
    requiredEvals: ["mission-runtime"],
    requiredHumanOperations: ["mission_plan_review"],
    knownLimitations: [
      "In-memory mission store only",
      "Not production-live",
      "No autonomous execution",
    ],
    privacyReviewRef: null,
    accessibilityReviewRef: null,
    securityReviewRef: null,
    rollbackPlanRef: null,
    owner: "ai-platform",
    approvedBy: null,
    approvedAt: null,
    expiresAt: null,
    evidence: emptyReleaseGateEvidence({
      ownerName: "ai-platform",
      purposeRef: "docs/ai-platform/MISSION_RUNTIME.md",
      ceiling: "SUGGEST_WITH_HUMAN_REVIEW",
      dataClasses: ["operational", "participant_pii"],
      flagName: "MAPABLE_AGENTIC_NERVE_CENTRE_ENABLED",
      killSwitchKey: "mission.copilot",
      limitations: [
        "In-memory mission store only",
        "Not production-live",
        "No autonomous execution",
      ],
    }),
    relatedCapabilityMaturity: "experimental",
  },
  {
    capabilityKey: "action.kernel",
    releaseState: "experimental",
    version: "0.1.0",
    allowedCohorts: [],
    domains: ["actions"],
    requiredFlags: ["MAPABLE_ACTION_KERNEL_ENABLED"],
    requiredEvals: ["action-kernel"],
    requiredHumanOperations: ["action_approval_review"],
    knownLimitations: [
      "In-memory proposal store",
      "Not production-live",
      "Approval-bound execution only",
    ],
    privacyReviewRef: null,
    accessibilityReviewRef: null,
    securityReviewRef: null,
    rollbackPlanRef: null,
    owner: "ai-platform",
    approvedBy: null,
    approvedAt: null,
    expiresAt: null,
    evidence: emptyReleaseGateEvidence({
      ownerName: "ai-platform",
      purposeRef: "docs/ai-platform/GOVERNED_ACTION_KERNEL.md",
      ceiling: "SUGGEST_WITH_PARTICIPANT_APPROVAL",
      dataClasses: ["operational", "participant_pii"],
      flagName: "MAPABLE_ACTION_KERNEL_ENABLED",
      killSwitchKey: "action.kernel",
      limitations: [
        "In-memory proposal store",
        "Not production-live",
        "Approval-bound execution only",
      ],
    }),
    relatedCapabilityMaturity: "experimental",
  },
  {
    capabilityKey: "recovery.engine",
    releaseState: "experimental",
    version: "0.1.0",
    allowedCohorts: [],
    domains: ["recovery"],
    requiredFlags: ["MAPABLE_ADAPTIVE_RECOVERY_ENABLED"],
    requiredEvals: ["adaptive-recovery"],
    requiredHumanOperations: ["recovery_plan_review"],
    knownLimitations: [
      "Reassessment without automatic redecision",
      "Not production-live",
    ],
    privacyReviewRef: null,
    accessibilityReviewRef: null,
    securityReviewRef: null,
    rollbackPlanRef: null,
    owner: "ai-platform",
    approvedBy: null,
    approvedAt: null,
    expiresAt: null,
    evidence: emptyReleaseGateEvidence({
      ownerName: "ai-platform",
      purposeRef: "docs/ai-platform/ADAPTIVE_RECOVERY_ENGINE.md",
      ceiling: "SUGGEST_WITH_HUMAN_REVIEW",
      dataClasses: ["operational"],
      flagName: "MAPABLE_ADAPTIVE_RECOVERY_ENABLED",
      killSwitchKey: "recovery.engine",
      limitations: [
        "Reassessment without automatic redecision",
        "Not production-live",
      ],
    }),
    relatedCapabilityMaturity: "experimental",
  },
  {
    capabilityKey: "control_plane.observability",
    releaseState: "internal_test",
    version: "0.1.0",
    allowedCohorts: [],
    domains: ["control-plane"],
    requiredFlags: ["MAPABLE_AI_CONTROL_PLANE_ENABLED"],
    requiredEvals: ["control-plane"],
    requiredHumanOperations: ["ops_dashboard_review"],
    knownLimitations: [
      "Observability only — never scores participants",
      "Not production-live",
    ],
    privacyReviewRef: null,
    accessibilityReviewRef: null,
    securityReviewRef: null,
    rollbackPlanRef: null,
    owner: "ai-platform",
    approvedBy: null,
    approvedAt: null,
    expiresAt: null,
    evidence: emptyReleaseGateEvidence({
      ownerName: "ai-platform",
      purposeRef: "docs/ai-platform/CONTROL_PLANE.md",
      ceiling: "READ_ONLY_EXPLAIN",
      dataClasses: ["operational"],
      flagName: "MAPABLE_AI_CONTROL_PLANE_ENABLED",
      killSwitchKey: "control_plane.observability",
      limitations: [
        "Observability only — never scores participants",
        "Not production-live",
      ],
    }),
    relatedCapabilityMaturity: "shadow",
  },
];

const byKey = new Map(
  RELEASE_MANIFESTS.map((m) => [m.capabilityKey, m] as const)
);

export function listReleaseManifests(): MapAbleReleaseManifest[] {
  return RELEASE_MANIFESTS.map((m) => ({ ...m }));
}

export function getReleaseManifest(
  capabilityKey: string
): MapAbleReleaseManifest | undefined {
  const found = byKey.get(capabilityKey);
  return found ? { ...found } : undefined;
}

export function requireReleaseManifest(
  capabilityKey: string
): MapAbleReleaseManifest {
  const found = getReleaseManifest(capabilityKey);
  if (!found) {
    throw new Error(`RELEASE_MANIFEST_NOT_FOUND:${capabilityKey}`);
  }
  return found;
}
