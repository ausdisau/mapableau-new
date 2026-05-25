import type { CopilotContext } from "@/lib/copilot/types";
import {
  buildParticipantGraph,
  type ParticipantGraph,
} from "@/lib/prms/participantGraph";
import { MOCK_OPEN_RISKS, MOCK_PROFILE } from "@/lib/prms/mockPrmsData";

/**
 * Maps Participant Graph (PRMS source of truth) to a privacy-scoped Co-Pilot context.
 * Does not expose raw NDIS numbers, free-text case notes, or incident narratives.
 */
export function graphToCopilotContext(graph: ParticipantGraph): CopilotContext {
  const grantedScopes = graph.consent.records
    .filter((r) => r.status === "granted")
    .map((r) => r.scope);

  const openIncidentRisks = graph.incidents
    .filter((i) => i.status !== "closed")
    .map((i) => ({
      id: i.id,
      level: i.severityBand,
      label: `Incident ${i.status.replace(/_/g, " ")}`,
    }));

  const context: CopilotContext = {
    participantId: graph.participantId,
    profileCompletionPercent: graph.profile.profileCompletionPercent,
    accessNeeds: graph.accessNeeds.accessNeeds.map((a) => ({
      id: a.id,
      label: a.label,
    })),
    mobilityAids: graph.accessNeeds.mobilityAids.map((m) => ({
      id: m.id,
      label: m.label,
    })),
    communicationPreferences: [],
    planSummary: {
      status: graph.ndisPlan.status,
      fundingManagement: graph.ndisPlan.fundingManagement,
      overallBudgetBand: graph.ndisPlan.overallBudgetBand,
    },
    activeGoals: graph.goals.map((g) => ({
      id: g.id,
      summary: g.summary,
    })),
    consentSummary: {
      grantedScopes,
      openConsentConflicts: graph.consent.openConflicts,
    },
    upcomingEvents: graph.services.map((e) => ({
      id: e.id,
      title: e.title,
      scheduledAt: e.scheduledAt,
    })),
    openRisks: openIncidentRisks,
    missingEvidence: [...graph.evidence.missingItemLabels],
  };

  if (graph.participantId === MOCK_PROFILE.participantId) {
    context.communicationPreferences =
      MOCK_PROFILE.communicationPreferences.map((c) => ({
        id: c.id,
        mode: c.mode,
      }));
    context.openRisks = MOCK_OPEN_RISKS.map((r) => ({
      id: r.id,
      level: r.level,
      label: r.label,
    }));
  }

  return context;
}

/**
 * Builds a privacy-scoped context object for Co-Pilot from the Participant Graph.
 */
export async function buildCopilotContext(
  participantId: string
): Promise<CopilotContext | null> {
  const graph = buildParticipantGraph(participantId);
  if (!graph) {
    return null;
  }
  return graphToCopilotContext(graph);
}

export function buildParticipantGraphForParticipant(
  participantId: string
): ParticipantGraph | null {
  return buildParticipantGraph(participantId);
}
