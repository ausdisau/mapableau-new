/**
 * Participant Graph — PRMS source-of-truth view for Co-Pilot.
 * Summary/ref shapes only; no NDIS numbers, addresses, or case-note narratives.
 */

import {
  isMockParticipant,
  MOCK_CONSENT,
  MOCK_DOCUMENTS,
  MOCK_EVIDENCE,
  MOCK_GOALS,
  MOCK_INCIDENTS,
  MOCK_INVOICES,
  MOCK_MISSING_EVIDENCE,
  MOCK_OPEN_RISKS,
  MOCK_PLAN,
  MOCK_PROFILE,
  MOCK_UPCOMING_EVENTS,
} from "@/lib/prms/mockPrmsData";
import type {
  AccessNeed,
  BudgetBand,
  ConsentScope,
  ConsentStatus,
  MobilityAid,
  NdisPlanSummary,
  ParticipantGoal,
  ServiceEventSummary,
} from "@/lib/prms/types";

export type ParticipantGraphDocumentSummary = {
  id: string;
  documentType: "consent_form" | "service_agreement" | "plan_review" | "other";
  status: "available" | "pending" | "expired";
};

export type ParticipantGraphInvoiceSummary = {
  id: string;
  status: "pending_review" | "approved" | "disputed";
  lineItemCount: number;
  /** Band only in Co-Pilot context — not exact dollars. */
  amountBand: BudgetBand;
};

export type ParticipantGraphIncidentSummary = {
  id: string;
  status: "open" | "under_review" | "closed";
  severityBand: "info" | "watch" | "urgent";
};

export type ParticipantGraphEvidenceSummary = {
  id: string;
  packType: string;
  status: "none" | "partial" | "complete";
  missingItemLabels: string[];
};

export type ParticipantGraphProfileNode = {
  participantId: string;
  profileCompletionPercent: number;
  fundingManagement: NdisPlanSummary["fundingManagement"];
  hasNominee: boolean;
  emergencyContactCount: number;
};

export type ParticipantGraphAccessNeedsNode = {
  accessNeeds: AccessNeed[];
  mobilityAids: MobilityAid[];
};

export type ParticipantGraph = {
  participantId: string;
  profile: ParticipantGraphProfileNode;
  accessNeeds: ParticipantGraphAccessNeedsNode;
  ndisPlan: {
    planId: string;
    status: NdisPlanSummary["status"];
    fundingManagement: NdisPlanSummary["fundingManagement"];
    overallBudgetBand: BudgetBand;
    categoryCount: number;
  };
  goals: ParticipantGoal[];
  consent: {
    records: { scope: ConsentScope; status: ConsentStatus }[];
    openConflicts: ConsentScope[];
  };
  services: ServiceEventSummary[];
  documents: ParticipantGraphDocumentSummary[];
  invoices: ParticipantGraphInvoiceSummary[];
  incidents: ParticipantGraphIncidentSummary[];
  evidence: ParticipantGraphEvidenceSummary;
};

export function buildParticipantGraph(
  participantId: string
): ParticipantGraph | null {
  if (!isMockParticipant(participantId)) {
    return null;
  }

  return {
    participantId,
    profile: {
      participantId: MOCK_PROFILE.participantId,
      profileCompletionPercent: MOCK_PROFILE.profileCompletionPercent,
      fundingManagement: MOCK_PROFILE.fundingManagement,
      hasNominee: MOCK_PROFILE.hasNominee,
      emergencyContactCount: MOCK_PROFILE.emergencyContactCount,
    },
    accessNeeds: {
      accessNeeds: MOCK_PROFILE.accessNeeds,
      mobilityAids: MOCK_PROFILE.mobilityAids,
    },
    ndisPlan: {
      planId: MOCK_PLAN.planId,
      status: MOCK_PLAN.status,
      fundingManagement: MOCK_PLAN.fundingManagement,
      overallBudgetBand: MOCK_PLAN.overallBudgetBand,
      categoryCount: MOCK_PLAN.categoryCount,
    },
    goals: [...MOCK_GOALS],
    consent: {
      records: MOCK_CONSENT.records.map((r) => ({
        scope: r.scope,
        status: r.status,
      })),
      openConflicts: [...MOCK_CONSENT.openConflicts],
    },
    services: [...MOCK_UPCOMING_EVENTS],
    documents: [...MOCK_DOCUMENTS],
    invoices: [...MOCK_INVOICES],
    incidents: [...MOCK_INCIDENTS],
    evidence: { ...MOCK_EVIDENCE },
  };
}
