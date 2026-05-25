import { NextResponse } from "next/server";

import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import { buildParticipantGraph } from "@/lib/prms/participantGraph";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // TODO: authenticate user and verify participant access
  const graph = buildParticipantGraph(id);
  const context = await buildCopilotContext(id);

  if (!context || !graph) {
    return NextResponse.json(
      {
        error: "Participant context not found. Sign in or check your account.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    graph: {
      participantId: graph.participantId,
      profile: graph.profile,
      accessNeeds: graph.accessNeeds,
      ndisPlan: graph.ndisPlan,
      goals: graph.goals,
      consent: graph.consent,
      services: graph.services,
      documents: graph.documents,
      invoices: graph.invoices,
      incidents: graph.incidents,
      evidence: graph.evidence,
    },
    copilotContext: context,
    profileSummary: {
      participantId: context.participantId,
      profileCompletionPercent: context.profileCompletionPercent,
      accessNeeds: context.accessNeeds,
      mobilityAids: context.mobilityAids,
      communicationPreferences: context.communicationPreferences,
    },
    planSummary: context.planSummary,
    consentSummary: context.consentSummary,
    upcomingEvents: context.upcomingEvents,
    openRisks: context.openRisks,
    missingEvidence: context.missingEvidence,
    activeGoals: context.activeGoals,
  });
}
