import { prisma } from "@/lib/prisma";

export interface GaScorecardInput {
  organisationId: string;
  scorecard: {
    assurance: { ready: boolean; score: number; blockers: string[] };
    operationalHealth: { availability: number | null; errorBudgetBurn: number | null };
    entitlementsConfigured: boolean;
    policiesConfigured: boolean;
    incidentsOpen: number;
    outstandingSecurityFindings: number;
    outstandingComplaints: number;
  };
  aiAssistanceSummary?: string;
}

/**
 * Build a GA assessment. Advisory-only until an executive user signs it off.
 * AI must NOT approve GA. This function will refuse to set decision=approved
 * without an executive.
 */
export async function upsertGaAssessment(input: GaScorecardInput) {
  const decision = decideGa(input.scorecard);
  const outstanding: string[] = [];
  if (!input.scorecard.assurance.ready) outstanding.push("assurance_not_ready");
  if (!input.scorecard.entitlementsConfigured) outstanding.push("entitlements_missing");
  if (!input.scorecard.policiesConfigured) outstanding.push("policies_missing");
  if (input.scorecard.incidentsOpen > 0) outstanding.push("open_incidents");
  if (input.scorecard.outstandingSecurityFindings > 0) outstanding.push("open_security_findings");
  if (input.scorecard.outstandingComplaints > 0) outstanding.push("open_complaints");

  return prisma.generalAvailabilityAssessment.create({
    data: {
      organisationId: input.organisationId,
      decision,
      scorecardJson: input.scorecard as never,
      outstandingBlockers: outstanding as never,
      advisoryOnly: true,
      aiAssistanceSummary: input.aiAssistanceSummary ?? null,
    },
  });
}

export function decideGa(
  scorecard: GaScorecardInput["scorecard"]
): "not_ready" | "conditionally_ready" | "ready_pending_executive" {
  if (!scorecard.assurance.ready) return "not_ready";
  if (scorecard.assurance.score < 80) return "not_ready";
  if (scorecard.incidentsOpen > 0) return "not_ready";
  if (scorecard.outstandingSecurityFindings > 0) return "not_ready";
  if (!scorecard.entitlementsConfigured) return "conditionally_ready";
  if (!scorecard.policiesConfigured) return "conditionally_ready";
  if (scorecard.outstandingComplaints > 0) return "conditionally_ready";
  return "ready_pending_executive";
}
