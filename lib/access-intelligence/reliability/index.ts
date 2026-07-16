/**
 * System 1 — Evidence reliability, freshness, reverification, provenance.
 * Health scores apply to records/places — never to people.
 * Paid plans must not alter confidence recalculation.
 */

import { createHash } from "crypto";

import { featureFreshnessDays } from "@/lib/access-intelligence/configuration";
import { calculateEvidenceConfidence } from "@/lib/access-intelligence/confidence-engine";
import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";
import { recordAuditEvent } from "@/lib/access-intelligence/audit";
import type { AccessFeature, Evidence } from "@/lib/access-intelligence/schemas";

export type FreshnessPolicyExample = {
  featureType: string;
  maxAgeDays: number;
  notes: string;
};

/** Documented defaults — also seedable into EvidenceFreshnessPolicy. */
export const DEFAULT_FRESHNESS_POLICIES: FreshnessPolicyExample[] = [
  {
    featureType: "lift",
    maxAgeDays: 1,
    notes: "Lift operating state expires within 24 hours.",
  },
  {
    featureType: "clear_door_width_mm",
    maxAgeDays: 730,
    notes: "Structural door width measurements: 24 months.",
  },
  {
    featureType: "accessible_toilet",
    maxAgeDays: 7,
    notes: "Toilet operating state: 7 days.",
  },
  {
    featureType: "step_free",
    maxAgeDays: featureFreshnessDays.step_free ?? 365,
    notes: "Step-free path evidence.",
  },
];

export type ReliabilityScanInput = {
  accessPlaceId: string;
  features: AccessFeature[];
  evidence: Evidence[];
  now?: Date;
};

export type ReliabilityFindingDraft = {
  findingType:
    | "expired_evidence"
    | "missing_provenance"
    | "unresolved_unknown"
    | "claim_conflict"
    | "orphaned_evidence";
  severity: "low" | "medium" | "high";
  summary: string;
  details: Record<string, unknown>;
  healthScoreImpact: number;
};

export type ReliabilityScanResult = {
  accessPlaceId: string;
  healthScore: number;
  findings: ReliabilityFindingDraft[];
  confidence: ReturnType<typeof calculateEvidenceConfidence>;
  expiredFeatureTypes: string[];
};

function policyDays(featureType: string): number {
  const example = DEFAULT_FRESHNESS_POLICIES.find(
    (p) => p.featureType === featureType,
  );
  if (example) return example.maxAgeDays;
  return featureFreshnessDays[featureType] ?? featureFreshnessDays.default ?? 180;
}

function ageDays(iso: string, now: Date): number {
  return Math.max(0, (now.getTime() - new Date(iso).getTime()) / 86_400_000);
}

/**
 * Deterministic reliability scan. Expired evidence becomes unknown — never absent.
 */
export function scanEvidenceReliability(
  input: ReliabilityScanInput,
): ReliabilityScanResult {
  const now = input.now ?? new Date();
  const findings: ReliabilityFindingDraft[] = [];
  const expiredFeatureTypes: string[] = [];

  for (const feature of input.features) {
    const maxAge = policyDays(feature.featureType);
    if (ageDays(feature.observedAt, now) > maxAge) {
      expiredFeatureTypes.push(feature.featureType);
      findings.push({
        findingType: "expired_evidence",
        severity: feature.featureType === "lift" ? "high" : "medium",
        summary: `Evidence for ${feature.featureType} exceeds freshness policy (${maxAge} days). Treat as unknown, not absent.`,
        details: {
          featureId: feature.id,
          observedAt: feature.observedAt,
          maxAgeDays: maxAge,
        },
        healthScoreImpact: 0.08,
      });
    }
    if (!feature.evidenceIds.length) {
      findings.push({
        findingType: "missing_provenance",
        severity: "medium",
        summary: `Feature ${feature.featureType} has no linked evidence provenance.`,
        details: { featureId: feature.id },
        healthScoreImpact: 0.05,
      });
    }
  }

  const byType = new Map<string, AccessFeature[]>();
  for (const f of input.features) {
    const list = byType.get(f.featureType) ?? [];
    list.push(f);
    byType.set(f.featureType, list);
  }
  for (const [featureType, list] of byType) {
    if (list.length < 2) continue;
    const values = new Set(list.map((f) => JSON.stringify(f.value)));
    if (values.size > 1) {
      findings.push({
        findingType: "claim_conflict",
        severity: "high",
        summary: `Conflicting claims for ${featureType}.`,
        details: { featureIds: list.map((f) => f.id), values: [...values] },
        healthScoreImpact: 0.12,
      });
    }
  }

  const linked = new Set(input.features.flatMap((f) => f.evidenceIds));
  for (const ev of input.evidence) {
    if (!linked.has(ev.id)) {
      findings.push({
        findingType: "orphaned_evidence",
        severity: "low",
        summary: `Evidence ${ev.id} is not linked to any feature claim.`,
        details: { evidenceId: ev.id },
        healthScoreImpact: 0.02,
      });
    }
  }

  // Expired features are excluded from confidence inputs (unknown, not false).
  const activeFeatures = input.features.filter(
    (f) => !expiredFeatureTypes.includes(f.featureType),
  );
  const confidence = calculateEvidenceConfidence({
    features: activeFeatures,
    evidence: input.evidence,
    now,
  });

  const impact = findings.reduce((s, f) => s + f.healthScoreImpact, 0);
  const healthScore = Math.max(0, Math.min(1, 1 - impact));

  return {
    accessPlaceId: input.accessPlaceId,
    healthScore,
    findings,
    confidence,
    expiredFeatureTypes: [...new Set(expiredFeatureTypes)],
  };
}

export function buildReverificationTasks(input: {
  accessPlaceId: string;
  findings: ReliabilityFindingDraft[];
}): Array<{ accessPlaceId: string; featureType?: string; reason: string }> {
  return input.findings
    .filter(
      (f) =>
        f.findingType === "expired_evidence" ||
        f.findingType === "claim_conflict" ||
        f.findingType === "missing_provenance",
    )
    .map((f) => ({
      accessPlaceId: input.accessPlaceId,
      featureType:
        typeof f.details.featureId === "string"
          ? String(f.details.featureType ?? f.summary)
          : undefined,
      reason: f.summary,
    }));
}

export function provenanceDebuggerHash(
  steps: Array<{ actorType: string; summary: string }>,
): string {
  return createHash("sha256")
    .update(JSON.stringify(steps))
    .digest("hex")
    .slice(0, 16);
}

export function assertReliabilityConsoleEnabled(): void {
  if (!accessIntelligenceFlags.reliabilityConsole) {
    throw new Error(
      "Reliability console is disabled. Set ACCESS_INTELLIGENCE_RELIABILITY_CONSOLE=true.",
    );
  }
}

export function assertReverificationSchedulerEnabled(): void {
  if (!accessIntelligenceFlags.reverificationScheduler) {
    throw new Error(
      "Reverification scheduler disabled. Set ACCESS_INTELLIGENCE_REVERIFICATION_SCHEDULER=true.",
    );
  }
}

/**
 * System job stub: schedule open reverification tasks from findings.
 * Does not auto-resolve disputes — creates assessor queue entries only.
 */
export function scheduleReverificationFromScan(input: {
  accessPlaceId: string;
  findings: ReliabilityFindingDraft[];
  now?: Date;
}): {
  scheduled: Array<{
    accessPlaceId: string;
    featureType?: string;
    reason: string;
    dueAt: string;
  }>;
  skipped: number;
} {
  assertReverificationSchedulerEnabled();
  const now = input.now ?? new Date();
  const drafts = buildReverificationTasks({
    accessPlaceId: input.accessPlaceId,
    findings: input.findings,
  });
  const scheduled = drafts.map((d, i) => ({
    ...d,
    dueAt: new Date(now.getTime() + (i + 1) * 86_400_000).toISOString(),
  }));
  return { scheduled, skipped: 0 };
}

export type ProvenanceStep = {
  actorType: string;
  summary: string;
  at?: string;
  sourceId?: string;
};

/**
 * Provenance debugger — reconstructs an inspectable source chain for a claim.
 */
export function buildProvenanceTrace(input: {
  accessPlaceId: string;
  claimOrFeatureId: string;
  steps: ProvenanceStep[];
}): {
  accessPlaceId: string;
  claimOrFeatureId: string;
  chain: ProvenanceStep[];
  chainHash: string;
} {
  return {
    accessPlaceId: input.accessPlaceId,
    claimOrFeatureId: input.claimOrFeatureId,
    chain: input.steps,
    chainHash: provenanceDebuggerHash(
      input.steps.map((s) => ({
        actorType: s.actorType,
        summary: s.summary,
      })),
    ),
  };
}

export function auditReliabilityScan(input: {
  actorUserId: string;
  accessPlaceId: string;
  healthScore: number;
  findingCount: number;
}): void {
  recordAuditEvent({
    actorUserId: input.actorUserId,
    action: "reliability.scan",
    purpose: "data_quality",
    outcome: "approved",
    entityType: "AccessPlace",
    entityId: input.accessPlaceId,
    metadata: {
      healthScore: input.healthScore,
      findingCount: input.findingCount,
    },
    persistCanonical: false,
  });
}

export {
  clearReliabilityStoreForTests,
  listReliabilityScans,
  listReverificationTasks,
  persistReliabilityScan,
  persistReverificationTasks,
  updateReverificationTaskStatus,
} from "@/lib/access-intelligence/reliability/store";
