import {
  SUPPORT_NEEDS_LIFE_AREA_IDS,
  type SupportNeedsIntensity,
  type SupportNeedsLifeAreaId,
} from "@/lib/intake/support-needs-assessor";
import {
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import { buildProvenance } from "@/lib/support-intelligence/provenance";
import type {
  Provenance,
  SupportIntelligenceDenied,
} from "@/lib/support-intelligence/types";

export type SnaAnswer = {
  domainId: SupportNeedsLifeAreaId;
  intensity: SupportNeedsIntensity;
};

export type SnaMatchInput = {
  participantId: string;
  answers: SnaAnswer[];
  priorityAreas?: SupportNeedsLifeAreaId[];
  goals?: string[];
  consentDraftProcessing: boolean;
  /** Always false for MapAble — we never claim official assessment. */
  officialAssessment: false;
  schemaVersion: 1;
  evidenceStatus: "self_report";
};

export type SnaPrepared =
  | {
      ok: true;
      matchInput: SnaMatchInput;
      requiredServiceHints: string[];
      complexSupport: boolean;
      provenance: Provenance;
    }
  | SupportIntelligenceDenied;

const INTENSITY_WEIGHT: Record<SupportNeedsIntensity, number> = {
  a_little: 1,
  some: 2,
  a_lot: 3,
  all_the_time: 4,
};

const DOMAIN_SERVICE_HINTS: Record<SupportNeedsLifeAreaId, string[]> = {
  mobility: ["transport", "assistance-daily-life"],
  self_care: ["daily-personal-activities"],
  domestic_life: ["assistance-daily-life"],
  communication: ["allied-health", "community-participation"],
  looking_after_ones_health: ["allied-health"],
  community_social_civic_life: ["community-participation"],
};

/**
 * Participant-directed SNA preparation for SMA.
 * Does not determine NDIS eligibility or funding.
 */
export function prepareSnaForMatching(input: {
  participantId: string;
  answers: SnaAnswer[];
  priorityAreas?: SupportNeedsLifeAreaId[];
  goals?: string[];
  consentDraftProcessing: boolean;
}): SnaPrepared {
  if (!isCapabilityEnabled("sna")) {
    return {
      ok: false,
      reasonCode: supportIntelligenceFlags.killSwitch
        ? "kill_switch"
        : "capability_disabled",
      message: "Support Needs Assessor integration is disabled (fail-closed).",
    };
  }

  if (!input.consentDraftProcessing) {
    return {
      ok: false,
      reasonCode: "consent_missing",
      message: "SNA processing requires participant consent for draft processing.",
    };
  }

  const validDomain = new Set<string>(SUPPORT_NEEDS_LIFE_AREA_IDS);
  for (const answer of input.answers) {
    if (!validDomain.has(answer.domainId)) {
      return {
        ok: false,
        reasonCode: "validation_failed",
        message: `Unknown life area: ${answer.domainId}`,
      };
    }
  }

  const hints = new Set<string>();
  let maxIntensity = 0;
  for (const answer of input.answers) {
    maxIntensity = Math.max(maxIntensity, INTENSITY_WEIGHT[answer.intensity]);
    for (const h of DOMAIN_SERVICE_HINTS[answer.domainId]) hints.add(h);
  }

  const complexSupport =
    maxIntensity >= 4 ||
    input.answers.filter((a) => INTENSITY_WEIGHT[a.intensity] >= 3).length >= 3;

  const matchInput: SnaMatchInput = {
    participantId: input.participantId,
    answers: input.answers,
    priorityAreas: input.priorityAreas,
    goals: input.goals,
    consentDraftProcessing: true,
    officialAssessment: false,
    schemaVersion: 1,
    evidenceStatus: "self_report",
  };

  return {
    ok: true,
    matchInput,
    requiredServiceHints: [...hints],
    complexSupport,
    provenance: buildProvenance({
      sourceKind: "participant_self_report",
      sourceUrl: "fixture://local",
      raw: {
        participantId: input.participantId,
        answerCount: input.answers.length,
        officialAssessment: false,
      },
      licenseAndReuse:
        "Participant-authored self-report — not an authorised NDIA / I-CAN determination",
    }),
  };
}
