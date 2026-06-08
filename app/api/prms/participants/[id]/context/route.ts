import { NextResponse } from "next/server";

import { requireApiSession } from "@/lib/api/auth-handler";
import { apiForbidden } from "@/lib/auth/guards";
import { buildCopilotContext } from "@/lib/copilot/contextBuilder";
import {
  assertCanAccessParticipantData,
  ParticipantAccessError,
} from "@/lib/prms/participant-access";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const user = await requireApiSession();
  if (user instanceof Response) return user;

  const { id } = await params;

  try {
    await assertCanAccessParticipantData(user, id);
  } catch (e) {
    if (e instanceof ParticipantAccessError) {
      return apiForbidden(e.message);
    }
    throw e;
  }

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
