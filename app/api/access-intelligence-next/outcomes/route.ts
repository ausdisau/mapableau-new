import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  recordJourneyOutcome,
  taylorRoom312Query,
  type AccessOutcomeState,
  type AccessQueryAst,
  type ParticipantRequirementSet,
  compileParticipantRequirements,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.proofCarryingResults
  ) {
    return NextResponse.json(
      { error: "Access outcome recording is disabled" },
      { status: 404 },
    );
  }

  let body: {
    query?: AccessQueryAst;
    requirementSet?: ParticipantRequirementSet;
    outcomeState?: AccessOutcomeState;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const query = body.query ?? taylorRoom312Query();
  const requirementSetRef = body.requirementSet
    ? compileParticipantRequirements(body.requirementSet).requirementSetRef
    : "fixture:taylor-harbour-v1";

  const outcome = recordJourneyOutcome({
    query,
    requirementSetRef,
    outcomeState: body.outcomeState,
  });

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    outcome,
    limitations: outcome.limitations,
  });
}
