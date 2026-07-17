import { NextResponse } from "next/server";

import {
  accessCastFlags,
  runAccessCastForecast,
  type AccessCastRequest,
  type AccessCastSyntheticScenarioId,
} from "@/lib/accesscast";

export const dynamic = "force-dynamic";

const SCENARIOS: AccessCastSyntheticScenarioId[] = [
  "harbour_place_baseline",
  "starting_work_tomorrow",
  "community_event",
  "lift_outage",
  "conflicting_venue",
  "offline_expired",
  "vision_false_positive",
  "return_journey_fragile",
];

/**
 * Synthetic AccessCast demo — no live sources, no participant persistence.
 */
export async function GET(request: Request) {
  if (!accessCastFlags.enabled || !accessCastFlags.allowSyntheticExecution) {
    return NextResponse.json(
      { error: "AccessCast demo is disabled", productionClaim: "none" },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const scenarioParam = url.searchParams.get("scenario") ?? "harbour_place_baseline";
  const scenario = SCENARIOS.includes(scenarioParam as AccessCastSyntheticScenarioId)
    ? (scenarioParam as AccessCastSyntheticScenarioId)
    : "harbour_place_baseline";

  const result = runAccessCastForecast({
    intendedJourneyTime:
      url.searchParams.get("intendedJourneyTime") ?? "2026-07-17T08:30:00.000+10:00",
    asOf: url.searchParams.get("asOf") ?? "2026-07-16T18:00:00.000+10:00",
    scenario,
  });

  return NextResponse.json({
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    result,
  });
}

export async function POST(request: Request) {
  if (!accessCastFlags.enabled || !accessCastFlags.allowSyntheticExecution) {
    return NextResponse.json(
      { error: "AccessCast demo is disabled", productionClaim: "none" },
      { status: 404 },
    );
  }

  let body: AccessCastRequest = {
    intendedJourneyTime: "2026-07-17T08:30:00.000+10:00",
  };
  try {
    body = (await request.json()) as AccessCastRequest;
  } catch {
    // use defaults
  }

  if (!body.intendedJourneyTime) {
    return NextResponse.json(
      { error: "intendedJourneyTime is required" },
      { status: 400 },
    );
  }

  const result = runAccessCastForecast({
    ...body,
    asOf: body.asOf ?? "2026-07-16T18:00:00.000+10:00",
    scenario: body.scenario ?? "harbour_place_baseline",
  });

  return NextResponse.json({
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    result,
  });
}
