import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  buildJourneyBurdenProfile,
  taylorRoom312Query,
  type AccessQueryAst,
  type ParticipantRequirementSet,
  compileParticipantRequirements,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.burdenEngine
  ) {
    return NextResponse.json(
      { error: "Access burden engine is disabled" },
      { status: 404 },
    );
  }

  let body: {
    query?: AccessQueryAst;
    requirementSet?: ParticipantRequirementSet;
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

  const profile = buildJourneyBurdenProfile({ query, requirementSetRef });

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    profile,
    listAlternative: profile.listAlternative,
    limitations: profile.limitations,
  });
}
