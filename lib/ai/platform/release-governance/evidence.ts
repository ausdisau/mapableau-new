/**
 * Evidence helpers — absent evidence stays absent (fail-closed).
 */

import type { AuthorityCeiling } from "@/lib/ai/platform/types/authority";
import type { DataClass } from "@/lib/ai/platform/types/classification";

import {
  ACCESSIBILITY_EVIDENCE_DIMENSIONS,
  OPERATIONS_CAPACITY_DIMENSIONS,
  SECURITY_EVIDENCE_DIMENSIONS,
  type AccessibilityEvidenceBundle,
  type EvidencePresence,
  type OperationsCapacityBundle,
  type ReleaseGateEvidence,
  type SecurityEvidenceBundle,
} from "./types";

export function absentEvidence(notes?: string): EvidencePresence {
  return {
    present: false,
    ref: null,
    recordedAt: null,
    ...(notes ? { notes } : {}),
  };
}

export function presentEvidence(
  ref: string,
  recordedAt: string,
  notes?: string
): EvidencePresence {
  return {
    present: true,
    ref,
    recordedAt,
    ...(notes ? { notes } : {}),
  };
}

export function emptyAccessibilityEvidence(): AccessibilityEvidenceBundle {
  return Object.fromEntries(
    ACCESSIBILITY_EVIDENCE_DIMENSIONS.map((d) => [d, absentEvidence()])
  ) as AccessibilityEvidenceBundle;
}

export function emptySecurityEvidence(): SecurityEvidenceBundle {
  return Object.fromEntries(
    SECURITY_EVIDENCE_DIMENSIONS.map((d) => [d, absentEvidence()])
  ) as SecurityEvidenceBundle;
}

export function emptyOperationsCapacity(): OperationsCapacityBundle {
  return Object.fromEntries(
    OPERATIONS_CAPACITY_DIMENSIONS.map((d) => [
      d,
      { ...absentEvidence(), namedOwner: null },
    ])
  ) as OperationsCapacityBundle;
}

/** Empty evidence pack for experimental / unapproved manifests. */
export function emptyReleaseGateEvidence(input?: {
  ownerName?: string;
  purposeRef?: string | null;
  ceiling?: AuthorityCeiling | null;
  dataClasses?: DataClass[];
  flagName?: string | null;
  killSwitchKey?: string | null;
  limitations?: string[];
}): ReleaseGateEvidence {
  const ownerNamed = Boolean(input?.ownerName);
  return {
    owner: {
      ...absentEvidence(),
      namedOwner: input?.ownerName ?? null,
      present: ownerNamed,
      ref: ownerNamed ? "manifest.owner" : null,
      recordedAt: ownerNamed ? "1970-01-01T00:00:00.000Z" : null,
    },
    purpose: input?.purposeRef
      ? presentEvidence(input.purposeRef, "1970-01-01T00:00:00.000Z")
      : absentEvidence(),
    authorityCeiling: {
      ...absentEvidence(),
      ceiling: input?.ceiling ?? null,
      present: Boolean(input?.ceiling),
      ref: input?.ceiling ? "manifest.authorityCeiling" : null,
      recordedAt: input?.ceiling ? "1970-01-01T00:00:00.000Z" : null,
    },
    privacyClassification: {
      ...absentEvidence(),
      dataClasses: input?.dataClasses ?? [],
      present: Boolean(input?.dataClasses?.length),
      ref: input?.dataClasses?.length
        ? "manifest.privacyClassification"
        : null,
      recordedAt: input?.dataClasses?.length
        ? "1970-01-01T00:00:00.000Z"
        : null,
    },
    consentScopes: { ...absentEvidence(), scopes: [] },
    humanReviewPath: absentEvidence(),
    featureFlag: {
      ...absentEvidence(),
      flagName: input?.flagName ?? null,
      present: Boolean(input?.flagName),
      ref: input?.flagName ? "manifest.featureFlag" : null,
      recordedAt: input?.flagName ? "1970-01-01T00:00:00.000Z" : null,
    },
    killSwitch: {
      ...absentEvidence(),
      killSwitchKey: input?.killSwitchKey ?? null,
      present: Boolean(input?.killSwitchKey),
      ref: input?.killSwitchKey ? "manifest.killSwitch" : null,
      recordedAt: input?.killSwitchKey ? "1970-01-01T00:00:00.000Z" : null,
    },
    evaluationSuite: { ...absentEvidence(), suiteId: null },
    accessibility: emptyAccessibilityEvidence(),
    security: emptySecurityEvidence(),
    rollbackPlan: absentEvidence(),
    operationalOwner: { ...absentEvidence(), namedOwner: null },
    supportProcess: absentEvidence(),
    incidentProcess: absentEvidence(),
    knownLimitations: {
      ...absentEvidence(),
      limitations: input?.limitations ?? [],
      present: Boolean(input?.limitations?.length),
      ref: input?.limitations?.length ? "manifest.knownLimitations" : null,
      recordedAt: input?.limitations?.length
        ? "1970-01-01T00:00:00.000Z"
        : null,
    },
    operationsCapacity: emptyOperationsCapacity(),
  };
}

export function isEvidencePresent(evidence: EvidencePresence): boolean {
  return (
    evidence.present === true &&
    typeof evidence.ref === "string" &&
    evidence.ref.length > 0 &&
    typeof evidence.recordedAt === "string" &&
    evidence.recordedAt.length > 0
  );
}
