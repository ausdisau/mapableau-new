import { z } from "zod";

export const researchParticipationRoleSchema = z.enum([
  "co_investigator",
  "paid_researcher",
  "field_validator",
  "design_reviewer",
  "governance_member",
  "research_participant",
]);
export type ResearchParticipationRole = z.infer<
  typeof researchParticipationRoleSchema
>;

export const researchConsentPurposeSchema = z.enum([
  "data_collection",
  "interviews",
  "usability_testing",
  "field_validation",
  "governance_participation",
  "payment_processing",
]);
export type ResearchConsentPurpose = z.infer<
  typeof researchConsentPurposeSchema
>;

export const researchConsentRecordStatusSchema = z.enum([
  "pending",
  "granted",
  "declined",
  "withdrawn",
]);
export type ResearchConsentRecordStatus = z.infer<
  typeof researchConsentRecordStatusSchema
>;

export const serviceConsentScopeSchema = z.enum([
  "profile.read",
  "accessibility.read",
  "go.current_location",
  "go.route_history",
  "go.barrier_report",
]);
export type ServiceConsentScope = z.infer<typeof serviceConsentScopeSchema>;

export type ConsentLane = "service" | "research";

export type ActiveResearchConsent = {
  participantId: string;
  programmeId: string;
  purpose: ResearchConsentPurpose;
  status: ResearchConsentRecordStatus;
  grantedAt: Date | null;
  withdrawnAt: Date | null;
};

export type ActiveServiceConsent = {
  subjectUserId: string;
  scope: ServiceConsentScope;
  status: "active" | "revoked" | "expired" | "pending";
};

/** Research consent never implies service consent. */
export function researchConsentImpliesServiceConsent(): false {
  return false;
}

/** Service consent never implies research consent. */
export function serviceConsentImpliesResearchConsent(): false {
  return false;
}

export function isResearchConsentActive(
  consent: Pick<
    ActiveResearchConsent,
    "status" | "withdrawnAt"
  > | null | undefined,
  now: Date = new Date()
): boolean {
  if (!consent) return false;
  if (consent.status !== "granted") return false;
  if (consent.withdrawnAt && consent.withdrawnAt <= now) return false;
  return true;
}

export function canCollectResearchData(params: {
  researchConsent: Pick<
    ActiveResearchConsent,
    "status" | "withdrawnAt" | "purpose"
  > | null;
  purpose: ResearchConsentPurpose;
  now?: Date;
}): boolean {
  if (!params.researchConsent) return false;
  if (params.researchConsent.purpose !== params.purpose) return false;
  return isResearchConsentActive(params.researchConsent, params.now);
}

export function assertResearchConsentForCollection(params: {
  researchConsent: Pick<
    ActiveResearchConsent,
    "status" | "withdrawnAt" | "purpose"
  > | null;
  purpose: ResearchConsentPurpose;
  now?: Date;
}): void {
  if (!canCollectResearchData(params)) {
    throw new Error("RESEARCH_CONSENT_REQUIRED");
  }
}

/** Core navigation must not require research enrolment. */
export function coreNavigationRequiresResearchEnrolment(): false {
  return false;
}

export type GovernanceAuditRecord = {
  id: string;
  decisionTitle: string;
  plainLanguageSummary: string;
  participantVisible: boolean;
  decidedAt: Date | null;
  /** No diagnosis or unnecessary PII in audit exports */
  redactedParticipantLabel?: string;
};

export function isGovernanceRecordAuditable(
  record: GovernanceAuditRecord
): boolean {
  return (
    record.plainLanguageSummary.trim().length > 0 &&
    record.decisionTitle.trim().length > 0
  );
}

export function governanceRecordRetainsMinimumAuditFields(
  record: GovernanceAuditRecord
): boolean {
  return Boolean(record.id && record.decisionTitle && record.plainLanguageSummary);
}

export const createCoDesignProgrammeInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  plainLanguageSummary: z.string().max(5000).optional(),
  researchProjectId: z.string().cuid().optional(),
  organisationId: z.string().cuid().optional(),
});

export const grantResearchConsentInputSchema = z.object({
  participantId: z.string().cuid(),
  programmeId: z.string().cuid(),
  purpose: researchConsentPurposeSchema,
  plainLanguageSummary: z.string().max(2000).optional(),
});

export const enrollCoDesignParticipantInputSchema = z.object({
  programmeId: z.string().cuid(),
  userId: z.string().cuid(),
  role: researchParticipationRoleSchema,
  functionalAccessNotes: z.string().max(2000).optional(),
});
