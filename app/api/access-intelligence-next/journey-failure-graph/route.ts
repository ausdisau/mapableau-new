import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  buildJourneyFailureGraph,
  taylorRoom312Query,
  type AccessQueryAst,
  type ParticipantRequirementSet,
  compileParticipantRequirements,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

/**
 * Journey failure / fragility graph (synthetic).
 * Defaults to Taylor Room 3.12 Harbour scenario.
 */
export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.journeyFailureGraph
  ) {
    return NextResponse.json(
      { error: "Journey failure graph is disabled" },
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

  const graph = buildJourneyFailureGraph({ query, requirementSetRef });

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    graph,
    listAlternative: graph.listAlternative,
    limitations: graph.limitations,
  });
}
