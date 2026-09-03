import type { Prisma } from "@prisma/client";
import type {
  ResearchConsentPurpose,
  ResearchParticipationRole,
} from "@mapable/research";
import {
  assertResearchConsentForCollection,
  canCollectResearchData,
  isResearchConsentActive,
} from "@mapable/research";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { ensureResearchGovernanceEnabled } from "@/lib/config/analytics-research";
import { checkConsent } from "@/lib/consent/consent-service";
import { prisma } from "@/lib/prisma";

export async function createCoDesignProgramme(params: {
  title: string;
  description?: string;
  plainLanguageSummary?: string;
  researchProjectId?: string;
  organisationId?: string;
}) {
  ensureResearchGovernanceEnabled();

  return prisma.coDesignProgramme.create({
    data: {
      title: params.title,
      description: params.description,
      plainLanguageSummary: params.plainLanguageSummary,
      researchProjectId: params.researchProjectId,
      organisationId: params.organisationId,
      status: "draft",
    },
  });
}

export async function enrollCoDesignParticipant(params: {
  programmeId: string;
  userId: string;
  role: ResearchParticipationRole;
  functionalAccessNotes?: string;
  actorUserId: string;
}) {
  ensureResearchGovernanceEnabled();

  const participant = await prisma.coDesignParticipant.upsert({
    where: {
      programmeId_userId: {
        programmeId: params.programmeId,
        userId: params.userId,
      },
    },
    create: {
      programmeId: params.programmeId,
      userId: params.userId,
      role: params.role,
      functionalAccessNotes: params.functionalAccessNotes,
    },
    update: {
      role: params.role,
      functionalAccessNotes: params.functionalAccessNotes,
      withdrawnAt: null,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "research.co_design.enrolled",
    entityType: "CoDesignParticipant",
    entityId: participant.id,
    participantId: params.userId,
    metadata: { programmeId: params.programmeId, role: params.role },
  });

  return participant;
}

export async function grantResearchPurposeConsent(params: {
  participantId: string;
  programmeId: string;
  purpose: ResearchConsentPurpose;
  plainLanguageSummary?: string;
  actorUserId: string;
}) {
  ensureResearchGovernanceEnabled();

  const record = await prisma.researchConsentRecord.upsert({
    where: {
      participantId_programmeId_purpose: {
        participantId: params.participantId,
        programmeId: params.programmeId,
        purpose: params.purpose,
      },
    },
    create: {
      participantId: params.participantId,
      programmeId: params.programmeId,
      purpose: params.purpose,
      status: "granted",
      grantedAt: new Date(),
      plainLanguageSummary: params.plainLanguageSummary,
    },
    update: {
      status: "granted",
      grantedAt: new Date(),
      withdrawnAt: null,
      plainLanguageSummary: params.plainLanguageSummary,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "research.consent.granted",
    entityType: "ResearchConsentRecord",
    entityId: record.id,
    participantId: params.participantId,
    metadata: { programmeId: params.programmeId, purpose: params.purpose },
  });

  return record;
}

export async function withdrawResearchPurposeConsent(params: {
  participantId: string;
  programmeId: string;
  purpose: ResearchConsentPurpose;
  actorUserId: string;
}) {
  ensureResearchGovernanceEnabled();

  const record = await prisma.researchConsentRecord.update({
    where: {
      participantId_programmeId_purpose: {
        participantId: params.participantId,
        programmeId: params.programmeId,
        purpose: params.purpose,
      },
    },
    data: {
      status: "withdrawn",
      withdrawnAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "research.consent.withdrawn",
    entityType: "ResearchConsentRecord",
    entityId: record.id,
    participantId: params.participantId,
    metadata: { programmeId: params.programmeId, purpose: params.purpose },
  });

  return record;
}

export async function getResearchPurposeConsent(params: {
  participantId: string;
  programmeId: string;
  purpose: ResearchConsentPurpose;
}) {
  return prisma.researchConsentRecord.findUnique({
    where: {
      participantId_programmeId_purpose: {
        participantId: params.participantId,
        programmeId: params.programmeId,
        purpose: params.purpose,
      },
    },
  });
}

export async function assertCanCollectResearchData(params: {
  participantId: string;
  programmeId: string;
  purpose: ResearchConsentPurpose;
}) {
  ensureResearchGovernanceEnabled();

  const consent = await getResearchPurposeConsent(params);
  assertResearchConsentForCollection({
    researchConsent: consent,
    purpose: params.purpose,
  });
}

export async function hasActiveResearchPurposeConsent(params: {
  participantId: string;
  programmeId: string;
  purpose: ResearchConsentPurpose;
}) {
  const consent = await getResearchPurposeConsent(params);
  return canCollectResearchData({
    researchConsent: consent,
    purpose: params.purpose,
  });
}

/** Service consent (ConsentRecord) is independent of research consent. */
export async function hasActiveServiceConsent(params: {
  subjectUserId: string;
  scope:
    | "profile.read"
    | "accessibility.read"
    | "go.current_location"
    | "go.route_history"
    | "go.barrier_report";
}) {
  return checkConsent({
    subjectUserId: params.subjectUserId,
    scope: params.scope,
  });
}

export async function researchConsentDoesNotGrantServiceAccess(params: {
  participantId: string;
  programmeId: string;
  purpose: ResearchConsentPurpose;
  serviceScope:
    | "profile.read"
    | "go.route_history";
}) {
  const researchActive = await hasActiveResearchPurposeConsent({
    participantId: params.participantId,
    programmeId: params.programmeId,
    purpose: params.purpose,
  });
  if (!researchActive) return true;

  const serviceActive = await hasActiveServiceConsent({
    subjectUserId: params.participantId,
    scope: params.serviceScope,
  });
  return !serviceActive;
}

export async function recordResearchContribution(params: {
  participantId: string;
  programmeId: string;
  projectId?: string;
  contributionType: string;
  structuredPayload?: Record<string, unknown>;
  plainLanguageNotes?: string;
  purpose: ResearchConsentPurpose;
  actorUserId: string;
}) {
  await assertCanCollectResearchData({
    participantId: params.participantId,
    programmeId: params.programmeId,
    purpose: params.purpose,
  });

  return prisma.researchContribution.create({
    data: {
      participantId: params.participantId,
      programmeId: params.programmeId,
      projectId: params.projectId,
      contributionType: params.contributionType,
      structuredPayload: params.structuredPayload as
        | Prisma.InputJsonValue
        | undefined,
      plainLanguageNotes: params.plainLanguageNotes,
      status: "submitted",
      observedAt: new Date(),
    },
  });
}

export async function recordContributionPayment(params: {
  participantId: string;
  contributionId?: string;
  amountCents: number;
  currency?: string;
  reference?: string;
  actorUserId: string;
}) {
  ensureResearchGovernanceEnabled();

  const payment = await prisma.contributionPayment.create({
    data: {
      participantId: params.participantId,
      contributionId: params.contributionId,
      amountCents: params.amountCents,
      currency: params.currency ?? "AUD",
      status: "approved",
      reference: params.reference,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "research.payment.recorded",
    entityType: "ContributionPayment",
    entityId: payment.id,
    participantId: params.participantId,
    metadata: { amountCents: params.amountCents },
  });

  return payment;
}

export async function publishResearchDecision(params: {
  programmeId: string;
  projectId?: string;
  title: string;
  plainLanguageSummary: string;
  technicalNotes?: string;
  actorUserId: string;
}) {
  ensureResearchGovernanceEnabled();

  const decision = await prisma.researchDecision.create({
    data: {
      programmeId: params.programmeId,
      projectId: params.projectId,
      title: params.title,
      status: "published",
      decidedAt: new Date(),
      rationales: {
        create: {
          plainLanguageSummary: params.plainLanguageSummary,
          technicalNotes: params.technicalNotes,
          participantVisible: true,
        },
      },
    },
    include: { rationales: true },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "research.decision.published",
    entityType: "ResearchDecision",
    entityId: decision.id,
    metadata: { programmeId: params.programmeId },
  });

  return decision;
}

export async function listGovernanceAuditRecords(programmeId: string) {
  const decisions = await prisma.researchDecision.findMany({
    where: { programmeId, status: "published" },
    include: {
      rationales: {
        where: { participantVisible: true },
      },
    },
    orderBy: { decidedAt: "desc" },
  });

  return decisions.map((decision) => ({
    id: decision.id,
    decisionTitle: decision.title,
    plainLanguageSummary:
      decision.rationales[0]?.plainLanguageSummary ?? decision.title,
    participantVisible: true,
    decidedAt: decision.decidedAt,
  }));
}

export async function listCoDesignProgrammes(limit = 20) {
  if (!process.env.MAPABLE_RESEARCH_GOVERNANCE_ENABLED) {
    return { disabled: true as const, programmes: [] };
  }

  const programmes = await prisma.coDesignProgramme.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: {
        select: {
          participants: true,
          consentRecords: true,
          decisions: true,
        },
      },
    },
  });

  return { disabled: false as const, programmes };
}

export async function listParticipantProgrammes(userId: string) {
  ensureResearchGovernanceEnabled();

  return prisma.coDesignParticipant.findMany({
    where: { userId, withdrawnAt: null },
    include: {
      programme: {
        include: {
          consentRecords: {
            where: { participantId: userId },
          },
        },
      },
    },
  });
}

export { isResearchConsentActive };
