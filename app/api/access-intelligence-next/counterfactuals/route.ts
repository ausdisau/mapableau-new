import { NextResponse } from "next/server";

import {
  accessIntelligenceNextFlags,
  listCounterfactualScenarios,
  runAccessCounterfactual,
  taylorRoom312Query,
  type AccessCounterfactualScenario,
  type AccessQueryAst,
  type ParticipantRequirementSet,
  compileParticipantRequirements,
} from "@/lib/access-intelligence-next";

export const dynamic = "force-dynamic";

export async function GET() {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.counterfactuals
  ) {
    return NextResponse.json(
      { error: "Access counterfactuals are disabled" },
      { status: 404 },
    );
  }
  return NextResponse.json({
    scenarios: listCounterfactualScenarios(),
    productionClaim: "none",
  });
}

export async function POST(request: Request) {
  if (
    !accessIntelligenceNextFlags.enabled ||
    !accessIntelligenceNextFlags.counterfactuals
  ) {
    return NextResponse.json(
      { error: "Access counterfactuals are disabled" },
      { status: 404 },
    );
  }

  let body: {
    query?: AccessQueryAst;
    requirementSet?: ParticipantRequirementSet;
    scenario?: AccessCounterfactualScenario;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const scenario = body.scenario ?? "lift_failure";
  const query = body.query ?? taylorRoom312Query();
  const requirementSetRef = body.requirementSet
    ? compileParticipantRequirements(body.requirementSet).requirementSetRef
    : "fixture:taylor-harbour-v1";

  const result = runAccessCounterfactual({ query, requirementSetRef, scenario });

  return NextResponse.json({
    mode: accessIntelligenceNextFlags.mode,
    synthetic: true,
    productionClaim: "none",
    result,
    listAlternative: result.listAlternative,
    limitations: result.limitations,
  });
}
