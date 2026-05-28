import { NextResponse } from "next/server";

import { buildCopilotContext } from "@/lib/copilot/contextBuilder";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // TODO: authenticate user and verify participant access
  const context = await buildCopilotContext(id);

  if (!context) {
    return NextResponse.json(
      {
        error: "Participant context not found. Sign in or check your account.",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
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
