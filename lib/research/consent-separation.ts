import {
  coreNavigationRequiresResearchEnrolment,
  governanceRecordRetainsMinimumAuditFields,
  isGovernanceRecordAuditable,
  researchConsentImpliesServiceConsent,
  serviceConsentImpliesResearchConsent,
} from "@mapable/research";

import { checkConsent } from "@/lib/consent/consent-service";
import {
  getResearchPurposeConsent,
  hasActiveResearchPurposeConsent,
} from "@/lib/research/co-design-governance-service";

/** Lane separation constants — research and service consent are orthogonal. */
export const CONSENT_LANE = {
  SERVICE: "service",
  RESEARCH: "research",
} as const;

export function assertConsentLanesAreIndependent(): {
  researchImpliesService: false;
  serviceImpliesResearch: false;
} {
  return {
    researchImpliesService: researchConsentImpliesServiceConsent(),
    serviceImpliesResearch: serviceConsentImpliesResearchConsent(),
  };
}

export async function auditConsentSeparation(params: {
  participantId: string;
  programmeId: string;
  researchPurpose: Parameters<
    typeof hasActiveResearchPurposeConsent
  >[0]["purpose"];
  serviceScope: "go.route_history" | "profile.read";
}) {
  const [researchActive, serviceActive] = await Promise.all([
    hasActiveResearchPurposeConsent({
      participantId: params.participantId,
      programmeId: params.programmeId,
      purpose: params.researchPurpose,
    }),
    checkConsent({
      subjectUserId: params.participantId,
      scope: params.serviceScope,
    }),
  ]);

  return {
    researchActive,
    serviceActive,
    researchDoesNotImplyService: !researchActive || !serviceActive,
    serviceDoesNotImplyResearch: !serviceActive || !researchActive,
    lanesIndependent:
      (!researchActive && !serviceActive) ||
      (researchActive && !serviceActive) ||
      (!researchActive && serviceActive) ||
      (researchActive && serviceActive),
  };
}

export async function verifyWithdrawalBlocksCollection(params: {
  participantId: string;
  programmeId: string;
  purpose: Parameters<typeof getResearchPurposeConsent>[0]["purpose"];
}) {
  const consent = await getResearchPurposeConsent({
    participantId: params.participantId,
    programmeId: params.programmeId,
    purpose: params.purpose,
  });

  if (!consent) {
    return { canCollect: false, reason: "no_consent_record" as const };
  }

  if (consent.status === "withdrawn" || consent.withdrawnAt) {
    return { canCollect: false, reason: "withdrawn" as const };
  }

  if (consent.status !== "granted") {
    return { canCollect: false, reason: "not_granted" as const };
  }

  return { canCollect: true, reason: "granted" as const };
}

export function verifyGovernanceAuditRetention(
  records: Array<{
    id: string;
    decisionTitle: string;
    plainLanguageSummary: string;
    participantVisible: boolean;
    decidedAt: Date | null;
  }>
) {
  return records.every(
    (record) =>
      isGovernanceRecordAuditable(record) &&
      governanceRecordRetainsMinimumAuditFields(record) &&
      !record.plainLanguageSummary.toLowerCase().includes("diagnosis")
  );
}

export function verifyCoreNavigationIndependentOfResearch() {
  return coreNavigationRequiresResearchEnrolment() === false;
}
