import { NextResponse } from "next/server";

import {
  accessCastFlags,
  runStartingWorkJourneyAccessCast,
  type StartingWorkJourneyInput,
} from "@/lib/accesscast";

export const dynamic = "force-dynamic";

const JOURNEY_SCENARIOS: NonNullable<StartingWorkJourneyInput["scenario"]>[] = [
  "starting_work_tomorrow",
  "lift_outage",
  "return_journey_fragile",
  "conflicting_venue",
  "offline_expired",
];

function parseScenario(
  value: string | undefined | null,
): NonNullable<StartingWorkJourneyInput["scenario"]> {
  if (
    value &&
    (JOURNEY_SCENARIOS as string[]).includes(value)
  ) {
    return value as NonNullable<StartingWorkJourneyInput["scenario"]>;
  }
  return "starting_work_tomorrow";
}

/**
 * Synthetic Starting Work journey AccessCast outlook.
 * Equivalent to POST /api/accesscast/journeys/[missionId]/outlook for demo missions.
 */
export async function POST(request: Request) {
  if (
    !accessCastFlags.enabled ||
    !accessCastFlags.allowSyntheticExecution ||
    !accessCastFlags.journeyOutlook
  ) {
    return NextResponse.json(
      {
        error:
          "AccessCast journey outlook is disabled. Enable MAPABLE_ACCESSCAST_ENABLED and MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED.",
        productionClaim: "none",
      },
      { status: 404 },
    );
  }

  let body: {
    missionId?: string;
    intendedJourneyTime?: string;
    asOf?: string;
    scenario?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const journey = runStartingWorkJourneyAccessCast({
    missionId: body.missionId,
    intendedJourneyTime: body.intendedJourneyTime,
    asOf: body.asOf,
    scenario: parseScenario(body.scenario),
  });

  return NextResponse.json({
    mode: accessCastFlags.mode,
    synthetic: true,
    productionClaim: "none",
    participantLabel: journey.participantLabel,
    venueLabel: journey.venueLabel,
    destinationLabel: journey.destinationLabel,
    missionId: journey.missionId,
    placeRef: journey.placeRef,
    fragility: journey.fragility,
    confirmationTasks: journey.confirmationTasks,
    returnJourney: journey.returnJourney,
    timelinePlainText: journey.timelinePlainText,
    audioSummary: journey.audioSummary,
    printSummary: journey.printSummary,
    result: journey.result,
    segmentListAlternative: journey.result.segments.map((s) => ({
      id: s.id,
      kind: s.kind,
      label: s.label,
      currentState: s.currentState,
      evidenceSummary: s.evidenceSummary,
      confirmationTask: s.confirmationTask?.label ?? null,
      responsibleOrganisation: s.responsibleOrganisation,
    })),
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return POST(
    new Request(request.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        scenario: url.searchParams.get("scenario") ?? undefined,
        intendedJourneyTime:
          url.searchParams.get("intendedJourneyTime") ?? undefined,
        asOf: url.searchParams.get("asOf") ?? undefined,
        missionId: url.searchParams.get("missionId") ?? undefined,
      }),
    }),
  );
}
