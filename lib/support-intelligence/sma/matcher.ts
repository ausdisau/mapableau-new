import { auditSupportIntelligence } from "@/lib/support-intelligence/audit";
import {
  hardDenyOperationalActions,
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import { lookupRegulatoryEvidence } from "@/lib/support-intelligence/regulatory/gateway";
import type { SnaPrepared } from "@/lib/support-intelligence/sna/snapshot";
import { mapServicesToTaxonomy } from "@/lib/support-intelligence/spider/taxonomy";
import type { SpiderProviderRecord } from "@/lib/support-intelligence/spider/types";
import type {
  ExplainableMatchCandidate,
  HumanReviewReason,
  SupportIntelligenceDenied,
} from "@/lib/support-intelligence/types";

export type SmaCandidateSource = {
  record: SpiderProviderRecord;
  directoryActive?: unknown;
  sourceDate?: string | null;
  /** Org hard-eligibility from MapAble onboarding (optional). */
  orgEligible?: boolean;
};

export type SmaMatchResult =
  | {
      ok: true;
      candidates: ExplainableMatchCandidate[];
      operationalActions: ReturnType<typeof hardDenyOperationalActions>;
      eligibilityBlockedCount: number;
    }
  | SupportIntelligenceDenied;

function preferenceScore(
  record: SpiderProviderRecord,
  serviceHints: string[],
): number {
  if (serviceHints.length === 0) return 0.5;
  const tax = mapServicesToTaxonomy(record.services);
  const mapped = new Set(
    tax.mapped.filter((m) => m.slug).map((m) => m.slug as string),
  );
  let hits = 0;
  for (const hint of serviceHints) {
    if (mapped.has(hint)) hits += 1;
  }
  return hits / serviceHints.length;
}

/**
 * Service Matching Algorithm — mandatory eligibility gates before preference ranking.
 * Commercial influence is excluded: no paid boost fields exist on the ranking path.
 */
export async function runServiceMatching(input: {
  sna: Extract<SnaPrepared, { ok: true }>;
  sources: SmaCandidateSource[];
  actorUserId?: string | null;
  consentWithdrawn?: boolean;
}): Promise<SmaMatchResult> {
  if (!isCapabilityEnabled("sma")) {
    return {
      ok: false,
      reasonCode: supportIntelligenceFlags.killSwitch
        ? "kill_switch"
        : "capability_disabled",
      message: "Service Matching Algorithm is disabled (fail-closed).",
    };
  }

  if (input.consentWithdrawn) {
    await auditSupportIntelligence({
      action: "support_intel.consent.blocked",
      actorUserId: input.actorUserId,
      participantId: input.sna.matchInput.participantId,
      entityType: "SmaMatch",
      metadata: { reason: "consent_withdrawn" },
    });
    return {
      ok: false,
      reasonCode: "consent_withdrawn",
      message: "Consent withdrawn — matching denied.",
    };
  }

  const eligible: ExplainableMatchCandidate[] = [];
  let eligibilityBlockedCount = 0;

  for (const source of input.sources) {
    const record = source.record;
    const reviewReasons: HumanReviewReason[] = [];

    // --- Mandatory eligibility gates (before preference) ---
    if (record.isDemo) {
      eligibilityBlockedCount += 1;
      continue;
    }
    if (source.orgEligible === false) {
      eligibilityBlockedCount += 1;
      await auditSupportIntelligence({
        action: "support_intel.sma.eligibility_blocked",
        actorUserId: input.actorUserId,
        participantId: input.sna.matchInput.participantId,
        entityType: "SpiderProviderRecord",
        entityId: record.sourceId,
        metadata: { reason: "org_not_eligible" },
      });
      continue;
    }

    const reg = await lookupRegulatoryEvidence({
      abn: record.abn,
      providerName: record.providerName,
      directoryActive: source.directoryActive ?? record.raw.Active,
      sourceDate: source.sourceDate,
      actorUserId: input.actorUserId,
    });

    if (!reg.ok) {
      // Regulatory gateway off → treat registration as unknown, still allow
      // discovery-only ranking with human review for complex cases.
      reviewReasons.push("uncertain_entity_match");
    } else {
      if (reg.humanReviewRequired) {
        reviewReasons.push(...reg.humanReviewReasons);
      }
      if (reg.registration === "conflict") {
        // Conflict: never enter preference ranking as a recommended match.
        eligibilityBlockedCount += 1;
        continue;
      }
    }

    if (input.sna.complexSupport) {
      reviewReasons.push("complex_support_requirement");
    }

    const pref = preferenceScore(record, input.sna.requiredServiceHints);
    const confirmed: string[] = [];
    const unknown: string[] = [
      "live_commission_registration",
      "worker_screening",
      "current_vacancies",
      "access_fit",
    ];
    const needsChecking: string[] = [
      "Confirm current registration on the NDIS Commission Provider Register",
    ];

    if (record.services.length > 0) {
      confirmed.push(`Declared services in directory: ${record.services.join(", ")}`);
    } else {
      unknown.push("declared_services");
    }

    if (record.state) confirmed.push(`State in directory: ${record.state}`);

    const tax = mapServicesToTaxonomy(record.services);
    if (tax.unknown.length > 0) {
      unknown.push(`unmapped_service_labels:${tax.unknown.join("|")}`);
    }

    eligible.push({
      candidateId: `sma:${record.sourceId}`,
      entityKind: "provider_outlet",
      entityId: record.sourceId,
      title: record.providerName,
      eligibilityPassed: true,
      preferenceScore: pref,
      displayRank: null,
      explanation: {
        whyMayWork:
          pref > 0
            ? "Directory-declared services overlap with your self-reported support areas."
            : "Listed in the local directory for your region; service overlap is unknown.",
        confirmed,
        unknown,
        needsChecking,
        whoMustConfirm:
          "You (and any authorised supporter) must confirm fit; MapAble does not approve funding or NDIS eligibility.",
      },
      claims:
        reg.ok
          ? reg.claims
          : [
              {
                field: "commission_registration",
                value: null,
                state: "unknown",
                note: "Regulatory gateway unavailable — registration unknown.",
              },
            ],
      humanReviewRequired: reviewReasons.length > 0,
      humanReviewReasons: reviewReasons,
      provenance: [
        input.sna.provenance,
        ...(reg.ok ? reg.provenance : []),
      ],
    });
  }

  // Preference ranking only among eligibility-passed candidates.
  eligible.sort(
    (a, b) => (b.preferenceScore ?? 0) - (a.preferenceScore ?? 0),
  );
  eligible.forEach((c, i) => {
    c.displayRank = i + 1;
  });

  await auditSupportIntelligence({
    action: "support_intel.sma.match_run",
    actorUserId: input.actorUserId,
    participantId: input.sna.matchInput.participantId,
    entityType: "SmaMatch",
    metadata: {
      candidateCount: eligible.length,
      eligibilityBlockedCount,
      complexSupport: input.sna.complexSupport,
    },
  });

  return {
    ok: true,
    candidates: eligible,
    operationalActions: hardDenyOperationalActions(),
    eligibilityBlockedCount,
  };
}
