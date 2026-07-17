import type {
  AppealGroundType,
  DecisionImpact,
  GovernedSystemType,
  Prisma,
  RemedyActionType,
} from "@prisma/client";

import {
  createDraftAia,
  transitionAia,
} from "@/lib/public-interest-governance/aia/aia-lifecycle";
import {
  submitAppeal,
  withdrawAppeal,
} from "@/lib/public-interest-governance/appeals/appeal-service";
import {
  createCommunityRecommendation,
  respondToCommunityRecommendation,
  submitCommunityRecommendation,
} from "@/lib/public-interest-governance/community/recommendation-service";
import { requireNoRecusal } from "@/lib/public-interest-governance/conflicts/conflict-service";
import { createRemedyAction } from "@/lib/public-interest-governance/reviews/remedy-service";
import { publishRegisterEntry } from "@/lib/public-interest-governance/register/register-entry-service";
import {
  activateGovernedSystem,
  createGovernedSystem,
  suspendGovernedSystem,
} from "@/lib/public-interest-governance/register/system-service";
import {
  assignIndependentReviewer,
  completeIndependentReview,
} from "@/lib/public-interest-governance/reviews/independent-review-service";
import { decideAppeal } from "@/lib/public-interest-governance/appeals/appeal-service";
import {
  redactPublicRegisterPayload,
  redactTextForPublication,
} from "@/lib/public-interest-governance/publication/redaction";
import { appendPublicRegisterPublication } from "@/lib/public-interest-governance/publication/publication-service";
import { prisma } from "@/lib/prisma";

const OPEN_APPEAL_STATUSES = [
  "draft",
  "submitted",
  "acknowledged",
  "triage",
  "information_requested",
  "reviewer_assigned",
  "under_review",
  "participant_response",
  "decision_pending",
  "escalated",
] as const;

function iso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function toPublicSystemDto(entry: PublicSystemEntry) {
  return {
    id: entry.id,
    systemId: entry.systemId,
    systemKey: entry.system.systemKey,
    publicTitle: entry.publicTitle,
    publicSummary: redactTextForPublication(entry.publicSummary),
    doesNotDoSummary: entry.doesNotDoSummary,
    aiInvolved: entry.aiInvolved,
    ranksOrRecommends: entry.ranksOrRecommends,
    ownerDisplay: entry.ownerDisplay,
    affectedPeoplePublic: entry.affectedPeoplePublic,
    dataCategoriesPublic: redactPublicRegisterPayload(
      entry.dataCategoriesPublic,
    ),
    exclusionsPublic: entry.exclusionsPublic,
    humanReviewPublic: entry.humanReviewPublic,
    limitationsPublic: redactTextForPublication(entry.limitationsPublic),
    operatingStatus: entry.operatingStatus,
    challengeHowTo: entry.challengeHowTo,
    publishedAt: iso(entry.publishedAt),
    latestAssessmentAt: iso(entry.latestAssessmentAt),
    certificationClaim:
      "Register entry is not certification, endorsement or regulatory approval.",
    system: {
      displayName: entry.system.displayName,
      systemType: entry.system.systemType,
      businessPurpose: entry.system.businessPurpose,
      decisionRole: entry.system.decisionRole,
      actionRiskCeiling: entry.system.actionRiskCeiling,
      knownLimitations: entry.system.knownLimitations,
      incidentContact: entry.system.incidentContact,
      status: entry.system.status,
    },
  };
}

type PublicSystemEntry = Prisma.AlgorithmRegisterEntryGetPayload<{
  include: { system: true };
}>;

export async function listPublicRegisterSystems(limit = 100) {
  const entries = await prisma.algorithmRegisterEntry.findMany({
    where: {
      visibility: "public",
      publishedAt: { not: null },
    },
    include: { system: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return entries.map(toPublicSystemDto);
}

export async function getPublicRegisterSystem(identifier: string) {
  const direct = await prisma.algorithmRegisterEntry.findFirst({
    where: {
      visibility: "public",
      publishedAt: { not: null },
      OR: [{ id: identifier }, { systemId: identifier }],
    },
    include: { system: true },
  });
  if (direct) return toPublicSystemDto(direct);

  const system = await prisma.governedSystem.findUnique({
    where: { systemKey: identifier },
    select: { id: true },
  });
  if (!system) return null;

  const bySystemKey = await prisma.algorithmRegisterEntry.findFirst({
    where: {
      systemId: system.id,
      visibility: "public",
      publishedAt: { not: null },
    },
    include: { system: true },
    orderBy: { publishedAt: "desc" },
  });
  return bySystemKey ? toPublicSystemDto(bySystemKey) : null;
}

export async function getPublicDecisionTransparencySummary() {
  const rows = await prisma.decisionRecord.groupBy({
    by: ["impact", "status"],
    _count: { _all: true },
  });
  return rows.map((row) => ({
    impact: row.impact,
    status: row.status,
    count: row._count._all,
  }));
}

export async function getPublicAppealTransparencySummary() {
  const rows = await prisma.appealCase.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  return rows.map((row) => ({ status: row.status, count: row._count._all }));
}

export async function getPublicGovernanceIncidentSummary() {
  const rows = await prisma.aiGovernanceIncident.groupBy({
    by: ["severity", "status"],
    _count: { _all: true },
  });
  return rows.map((row) => ({
    severity: row.severity,
    status: row.status,
    count: row._count._all,
  }));
}

export async function listPublicCommunityRecommendations() {
  const recommendations = await prisma.communityRecommendation.findMany({
    where: { status: { in: ["submitted", "responded"] } },
    include: { responses: { orderBy: { respondedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return recommendations.map((recommendation) => ({
    id: recommendation.id,
    title: recommendation.title,
    recommendation: recommendation.recommendation,
    status: recommendation.status,
    bindingAuthority: recommendation.bindingAuthority,
    advisoryByDefault: !recommendation.bindingAuthority,
    minorityView: recommendation.minorityView,
    createdAt: iso(recommendation.createdAt),
    latestResponse: recommendation.responses[0]
      ? {
          responseBody: recommendation.responses[0].responseBody,
          respondedAt: iso(recommendation.responses[0].respondedAt),
        }
      : null,
  }));
}

export async function listPublicRegisterChangeLog() {
  const publications = await prisma.publicRegisterPublication.findMany({
    where: { visibility: "public" },
    include: { entry: { include: { system: true } } },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  return publications.map((publication) => ({
    id: publication.id,
    kind: publication.kind,
    payloadHash: publication.payloadHash,
    publishedAt: iso(publication.publishedAt),
    systemKey: publication.entry?.system.systemKey ?? null,
    publicTitle: publication.entry?.publicTitle ?? null,
  }));
}

export async function listParticipantDecisions(params: {
  participantUserId: string;
  tenantId?: string;
}) {
  const decisions = await prisma.decisionRecord.findMany({
    where: {
      subjectUserId: params.participantUserId,
      tenantId: params.tenantId,
    },
    include: { notice: true, system: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return decisions.map((decision) => ({
    id: decision.id,
    title: decision.title,
    summary: decision.summary,
    impact: decision.impact,
    status: decision.status,
    humanInvolved: decision.humanInvolved,
    systemInvolved: decision.systemInvolved,
    effectOnPerson: decision.effectOnPerson,
    effectiveAt: iso(decision.effectiveAt),
    expiresAt: iso(decision.expiresAt),
    createdAt: iso(decision.createdAt),
    system: decision.system
      ? {
          systemKey: decision.system.systemKey,
          displayName: decision.system.displayName,
        }
      : null,
    notice: decision.notice
      ? {
          plainLanguage: decision.notice.plainLanguage,
          easyRead: decision.notice.easyRead,
          detailedNotice: decision.notice.detailedNotice,
          machineReadable: redactPublicRegisterPayload(
            decision.notice.machineReadable,
          ),
          printableRef: decision.notice.printableRef,
          appealDeadlineAt: iso(decision.notice.appealDeadlineAt),
        }
      : null,
  }));
}

export async function getParticipantDecision(params: {
  decisionId: string;
  participantUserId: string;
}) {
  const decision = await prisma.decisionRecord.findFirst({
    where: { id: params.decisionId, subjectUserId: params.participantUserId },
    include: {
      notice: true,
      evidenceRefs: true,
      system: true,
      appeals: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!decision) return null;
  return {
    id: decision.id,
    title: decision.title,
    summary: decision.summary,
    impact: decision.impact,
    status: decision.status,
    humanInvolved: decision.humanInvolved,
    systemInvolved: decision.systemInvolved,
    effectOnPerson: decision.effectOnPerson,
    effectiveAt: iso(decision.effectiveAt),
    expiresAt: iso(decision.expiresAt),
    createdAt: iso(decision.createdAt),
    system: decision.system
      ? {
          systemKey: decision.system.systemKey,
          displayName: decision.system.displayName,
        }
      : null,
    notice: decision.notice
      ? {
          plainLanguage: decision.notice.plainLanguage,
          easyRead: decision.notice.easyRead,
          detailedNotice: decision.notice.detailedNotice,
          machineReadable: redactPublicRegisterPayload(
            decision.notice.machineReadable,
          ),
          printableRef: decision.notice.printableRef,
          appealDeadlineAt: iso(decision.notice.appealDeadlineAt),
        }
      : null,
    evidenceRefs: decision.evidenceRefs.map((ref) => ({
      label: ref.label,
      sensitivity: ref.sensitivity,
      evidenceRef:
        ref.sensitivity === "public" ? ref.evidenceRef : "available-on-request",
    })),
    appeals: decision.appeals.map((appeal) => ({
      id: appeal.id,
      status: appeal.status,
      submittedAt: iso(appeal.submittedAt),
      serviceAccessContinued: appeal.serviceAccessContinued,
    })),
  };
}

export async function submitParticipantDecisionAppeal(params: {
  decisionId: string;
  participantUserId: string;
  advocateUserId?: string;
  nonRetaliationAcknowledged: boolean;
  lateSubmissionReason?: string;
  grounds: Array<{ groundType: AppealGroundType; narrative: string }>;
  submissionBody: string;
  accessibleFormat?: string;
}) {
  const decision = await prisma.decisionRecord.findFirst({
    where: { id: params.decisionId, subjectUserId: params.participantUserId },
  });
  if (!decision) throw new Error("DECISION_NOT_FOUND");

  const existing = await prisma.appealCase.findFirst({
    where: {
      decisionId: params.decisionId,
      appellantUserId: params.participantUserId,
      status: { in: [...OPEN_APPEAL_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) throw new Error("APPEAL_ALREADY_OPEN");

  return submitAppeal({
    decisionId: params.decisionId,
    tenantId: decision.tenantId ?? undefined,
    appellantUserId: params.participantUserId,
    advocateUserId: params.advocateUserId,
    nonRetaliationAcknowledged: params.nonRetaliationAcknowledged,
    lateSubmissionReason: params.lateSubmissionReason,
    grounds: params.grounds,
    submissionBody: params.submissionBody,
    accessibleFormat: params.accessibleFormat,
  });
}

export async function listParticipantAppeals(params: {
  participantUserId: string;
  tenantId?: string;
}) {
  const appeals = await prisma.appealCase.findMany({
    where: {
      appellantUserId: params.participantUserId,
      tenantId: params.tenantId,
    },
    include: {
      decision: {
        select: { id: true, title: true, impact: true, status: true },
      },
      grounds: true,
      submissions: { orderBy: { createdAt: "desc" }, take: 5 },
      remedies: true,
      reviews: { select: { id: true, assignedAt: true, completedAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return appeals.map((appeal) => ({
    id: appeal.id,
    decision: appeal.decision,
    status: appeal.status,
    nonRetaliationAcknowledged: appeal.nonRetaliationAcknowledged,
    serviceAccessContinued: appeal.serviceAccessContinued,
    lateSubmissionReason: appeal.lateSubmissionReason,
    submittedAt: iso(appeal.submittedAt),
    closedAt: iso(appeal.closedAt),
    createdAt: iso(appeal.createdAt),
    grounds: appeal.grounds.map((ground) => ({
      groundType: ground.groundType,
      narrative: ground.narrative,
    })),
    submissions: appeal.submissions.map((submission) => ({
      id: submission.id,
      kind: submission.kind,
      accessibleFormat: submission.accessibleFormat,
      createdAt: iso(submission.createdAt),
    })),
    reviews: appeal.reviews.map((review) => ({
      id: review.id,
      assignedAt: iso(review.assignedAt),
      completedAt: iso(review.completedAt),
    })),
    remedies: appeal.remedies.map((remedy) => ({
      id: remedy.id,
      actionType: remedy.actionType,
      status: remedy.status,
      description: remedy.description,
      completedAt: iso(remedy.completedAt),
    })),
  }));
}

export async function getParticipantAppeal(params: {
  appealId: string;
  participantUserId: string;
}) {
  const appeals = await listParticipantAppeals({
    participantUserId: params.participantUserId,
  });
  return appeals.find((appeal) => appeal.id === params.appealId) ?? null;
}

export async function addParticipantAppealEvidence(params: {
  appealId: string;
  participantUserId: string;
  body: string;
  accessibleFormat?: string;
}) {
  const appeal = await prisma.appealCase.findFirst({
    where: { id: params.appealId, appellantUserId: params.participantUserId },
  });
  if (!appeal) throw new Error("APPEAL_NOT_FOUND");
  if (appeal.status === "closed" || appeal.status === "withdrawn")
    throw new Error("APPEAL_CLOSED");
  return prisma.appealSubmission.create({
    data: {
      appealId: params.appealId,
      kind: "evidence",
      body: params.body,
      accessibleFormat: params.accessibleFormat,
    },
  });
}

export async function withdrawParticipantAppeal(params: {
  appealId: string;
  participantUserId: string;
}) {
  const appeal = await prisma.appealCase.findFirst({
    where: { id: params.appealId, appellantUserId: params.participantUserId },
  });
  if (!appeal) throw new Error("APPEAL_NOT_FOUND");
  return withdrawAppeal(params.appealId);
}

export async function listAdminGovernedSystems(params: {
  tenantId?: string;
  nationalScope?: boolean;
}) {
  const systems = await prisma.governedSystem.findMany({
    where: params.nationalScope ? {} : { tenantId: params.tenantId },
    include: {
      versions: { orderBy: { effectiveFrom: "desc" }, take: 1 },
      registerEntries: { orderBy: { createdAt: "desc" }, take: 1 },
      impactAssessments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return systems.map((system) => ({
    id: system.id,
    systemKey: system.systemKey,
    displayName: system.displayName,
    systemType: system.systemType,
    tenantId: system.tenantId,
    ownerTeam: system.ownerTeam,
    businessPurpose: system.businessPurpose,
    decisionRole: system.decisionRole,
    actionRiskCeiling: system.actionRiskCeiling,
    status: system.status,
    updatedAt: iso(system.updatedAt),
    latestVersion: system.versions[0]
      ? {
          id: system.versions[0].id,
          versionKey: system.versions[0].versionKey,
          publicExplanation: redactTextForPublication(
            system.versions[0].publicExplanation,
          ),
        }
      : null,
    latestRegisterEntry: system.registerEntries[0]
      ? {
          id: system.registerEntries[0].id,
          publicTitle: system.registerEntries[0].publicTitle,
          visibility: system.registerEntries[0].visibility,
          publishedAt: iso(system.registerEntries[0].publishedAt),
        }
      : null,
    latestAia: system.impactAssessments[0]
      ? {
          id: system.impactAssessments[0].id,
          status: system.impactAssessments[0].status,
          approvedAt: iso(system.impactAssessments[0].approvedAt),
        }
      : null,
  }));
}

export async function createAdminGovernedSystem(input: {
  systemKey: string;
  displayName: string;
  systemType: GovernedSystemType;
  tenantId?: string;
  ownerUserId?: string;
  ownerTeam: string;
  businessPurpose: string;
  affectedPeopleSummary: string;
  decisionRole: string;
  actionRiskCeiling: string;
  prohibitedUses: Prisma.InputJsonValue;
  knownLimitations: string;
  incidentContact: string;
  legacyAlgorithmId?: string;
}) {
  const system = await createGovernedSystem(input);
  return {
    id: system.id,
    systemKey: system.systemKey,
    status: system.status,
    createdAt: iso(system.createdAt),
  };
}

export async function assessAdminGovernedSystem(params: {
  systemId: string;
  assessorId: string;
  summary: string;
  rightsImpacts: Prisma.InputJsonValue;
  residualRisks: Prisma.InputJsonValue;
  evidenceRefs?: Prisma.InputJsonValue;
  approve?: boolean;
}) {
  const aia = await createDraftAia({
    systemId: params.systemId,
    assessorId: params.assessorId,
    summary: params.summary,
    rightsImpacts: params.rightsImpacts,
    residualRisks: params.residualRisks,
    evidenceRefs: params.evidenceRefs,
  });
  if (!params.approve) return { id: aia.id, status: aia.status };

  await transitionAia(aia.id, "in_assessment", params.assessorId);
  await transitionAia(aia.id, "under_review", params.assessorId);
  const approved = await transitionAia(aia.id, "approved", params.assessorId);
  return {
    id: approved.id,
    status: approved.status,
    approvedAt: iso(approved.approvedAt),
  };
}

export async function publishAdminRegisterEntry(params: {
  systemId: string;
  entryId?: string;
  impact: DecisionImpact;
}) {
  const entry =
    params.entryId ??
    (
      await prisma.algorithmRegisterEntry.findFirst({
        where: { systemId: params.systemId, visibility: "public" },
        orderBy: { createdAt: "desc" },
      })
    )?.id;
  if (!entry) throw new Error("REGISTER_ENTRY_NOT_FOUND");

  const published = await publishRegisterEntry({
    entryId: entry,
    impact: params.impact,
  });
  await appendPublicRegisterPublication({
    entryId: published.id,
    kind: "algorithm_register_publish",
    payload: {
      entryId: published.id,
      publicTitle: published.publicTitle,
      publicSummary: published.publicSummary,
      operatingStatus: published.operatingStatus,
    },
  });
  await activateGovernedSystem(params.systemId);
  return { id: published.id, publishedAt: iso(published.publishedAt) };
}

export async function suspendAdminGovernedSystem(params: {
  systemId: string;
  reason: string;
}) {
  const system = await suspendGovernedSystem(params.systemId, params.reason);
  return {
    id: system.id,
    status: system.status,
    knownLimitations: system.knownLimitations,
  };
}

export async function listAdminAppeals(params: {
  tenantId?: string;
  nationalScope?: boolean;
}) {
  const appeals = await prisma.appealCase.findMany({
    where: params.nationalScope ? {} : { tenantId: params.tenantId },
    include: {
      decision: {
        select: { id: true, title: true, decisionOwnerId: true, impact: true },
      },
      reviews: { orderBy: { assignedAt: "desc" }, take: 1 },
      remedies: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return appeals.map((appeal) => ({
    id: appeal.id,
    status: appeal.status,
    tenantId: appeal.tenantId,
    submittedAt: iso(appeal.submittedAt),
    serviceAccessContinued: appeal.serviceAccessContinued,
    decision: {
      id: appeal.decision.id,
      title: appeal.decision.title,
      impact: appeal.decision.impact,
    },
    latestReview: appeal.reviews[0]
      ? {
          id: appeal.reviews[0].id,
          reviewerUserId: appeal.reviews[0].reviewerUserId,
          assignedAt: iso(appeal.reviews[0].assignedAt),
          completedAt: iso(appeal.reviews[0].completedAt),
        }
      : null,
    remedies: appeal.remedies.map((remedy) => ({
      id: remedy.id,
      actionType: remedy.actionType,
      status: remedy.status,
    })),
  }));
}

export async function assignAdminAppealReviewer(params: {
  appealId: string;
  reviewerUserId: string;
  conflictChecked: boolean;
  conflictFound?: boolean;
}) {
  await requireNoRecusal({
    subjectUserId: params.reviewerUserId,
    contextType: "appeal",
    contextId: params.appealId,
  });
  const review = await assignIndependentReviewer(params);
  return {
    id: review.id,
    appealId: review.appealId,
    reviewerUserId: review.reviewerUserId,
    assignedAt: iso(review.assignedAt),
  };
}

export async function decideAdminAppeal(params: {
  appealId: string;
  reviewerUserId: string;
  reviewId?: string;
  finding: string;
  outcome: "uphold" | "overturn" | "vary" | "remit";
  rationale: string;
}) {
  await requireNoRecusal({
    subjectUserId: params.reviewerUserId,
    contextType: "appeal",
    contextId: params.appealId,
  });
  const review =
    params.reviewId ??
    (
      await prisma.independentReview.findFirst({
        where: {
          appealId: params.appealId,
          reviewerUserId: params.reviewerUserId,
        },
        orderBy: { assignedAt: "desc" },
      })
    )?.id;
  if (!review) throw new Error("REVIEW_NOT_ASSIGNED");
  const completed = await completeIndependentReview({
    reviewId: review,
    finding: params.finding,
    outcome: params.outcome,
    rationale: params.rationale,
  });
  const appeal = await decideAppeal(params.appealId);
  return {
    appealId: appeal.id,
    status: appeal.status,
    reviewId: completed.id,
    completedAt: iso(completed.completedAt),
  };
}

export async function createAdminAppealRemedy(params: {
  appealId: string;
  actionType: RemedyActionType;
  description: string;
  downstreamRefs?: Prisma.InputJsonValue;
}) {
  const remedy = await createRemedyAction(params);
  return {
    id: remedy.id,
    appealId: remedy.appealId,
    actionType: remedy.actionType,
    status: remedy.status,
    createdAt: iso(remedy.createdAt),
  };
}

export async function createSubmittedCommunityRecommendation(params: {
  panelId?: string;
  bodyId?: string;
  title: string;
  recommendation: string;
  bindingAuthority?: boolean;
  minorityView?: string;
}) {
  const recommendation = await createCommunityRecommendation(params);
  const submitted = await submitCommunityRecommendation(recommendation.id);
  return {
    id: submitted.id,
    title: submitted.title,
    status: submitted.status,
    bindingAuthority: submitted.bindingAuthority,
    advisoryByDefault: !submitted.bindingAuthority,
  };
}

export async function respondAdminCommunityRecommendation(params: {
  recommendationId: string;
  responderId?: string;
  responseBody: string;
}) {
  const response = await respondToCommunityRecommendation(params);
  return {
    id: response.id,
    recommendationId: response.recommendationId,
    respondedAt: iso(response.respondedAt),
  };
}
