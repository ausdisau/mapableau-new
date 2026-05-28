import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  assertParticipantAccess,
  ParticipantAccessError,
} from "@/lib/participant-needs/assert-participant-access";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    assertParticipantAccess(user, id);
  } catch (e) {
    if (e instanceof ParticipantAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const context = await buildCopilotContext(id);

  if (!context) {
    return NextResponse.json(
      {
        error: "Participant context not found. Sign in or check your account.",
      },
      { status: 404 },
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
    needsGaps: context.needsGaps ?? [],
  });
}
