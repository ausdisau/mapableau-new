import { runAccessCastForecast } from "./forecast";
import { accessCastFlags } from "./flags";
import { HARBOUR_ACCESSCAST_IDS } from "./harbour-fixture";
import {
  STARTING_WORK_TIMELINE_HINTS,
  buildAccessCastTimeline,
  formatTimelinePlainText,
} from "./timeline";
import type {
  AccessCastConfirmationTask,
  AccessCastResult,
  AccessCastSegmentOutlook,
  AccessCastSyntheticScenarioId,
} from "./types";

export type StartingWorkJourneyInput = {
  intendedJourneyTime?: string;
  asOf?: string;
  /** Override scenario; default starting_work_tomorrow. */
  scenario?: Extract<
    AccessCastSyntheticScenarioId,
    | "starting_work_tomorrow"
    | "lift_outage"
    | "return_journey_fragile"
    | "conflicting_venue"
    | "offline_expired"
  >;
  missionId?: string;
};

export type StartingWorkJourneyAccessCast = {
  participantLabel: "Taylor";
  venueLabel: "Harbour Civic Centre";
  destinationLabel: "Room 3.12";
  missionId: string;
  placeRef: string;
  result: AccessCastResult;
  /** Authoritative text-first timeline. */
  timelinePlainText: string;
  confirmationTasks: AccessCastConfirmationTask[];
  returnJourney: AccessCastSegmentOutlook | null;
  fragility: {
    isFragile: boolean;
    singlePointsOfFailure: string[];
    unverifiedFallbacks: string[];
  };
  audioSummary: string;
  printSummary: string;
};

const JOURNEY_SEGMENT_ORDER = [
  "origin",
  "local_path",
  "pickup_curb",
  "accessible_transport",
  "interchange",
  "destination_stop",
  "drop_off",
  "external_path",
  "entrance",
  "internal_route",
  "destination_room",
  "return_journey",
] as const;

/**
 * Starting Work journey AccessCast for Taylor → Harbour Civic Centre Room 3.12.
 * Full door-to-room + return leg with fragility and confirmation tasks.
 */
export function runStartingWorkJourneyAccessCast(
  input: StartingWorkJourneyInput = {},
): StartingWorkJourneyAccessCast {
  if (!accessCastFlags.allowSyntheticExecution) {
    throw new Error("AccessCast synthetic execution is disabled");
  }
  if (!accessCastFlags.journeyOutlook && accessCastFlags.enabled) {
    // Journey outlook flag gates the dedicated surface; synthetic demo still allowed when master on
  }

  const intended =
    input.intendedJourneyTime ?? "2026-07-17T08:30:00.000+10:00";
  const asOf = input.asOf ?? "2026-07-16T18:00:00.000+10:00";
  const scenario = input.scenario ?? "starting_work_tomorrow";
  const missionId =
    input.missionId ?? `mission:synthetic:starting-work-taylor-${scenario}`;

  const result = runAccessCastForecast({
    journeyRef: missionId,
    placeId: HARBOUR_ACCESSCAST_IDS.placeCanonicalRef,
    requirementSetRef: "fixture:taylor-harbour-accesscast-v1",
    intendedJourneyTime: intended,
    asOf,
    scenario,
  });

  // Ensure Starting Work timeline is attached with segment correlation
  const timeline = buildAccessCastTimeline(intended, STARTING_WORK_TIMELINE_HINTS);
  result.timeline = timeline;

  const ordered = [...result.segments].sort((a, b) => {
    const ai = JOURNEY_SEGMENT_ORDER.indexOf(
      a.kind as (typeof JOURNEY_SEGMENT_ORDER)[number],
    );
    const bi = JOURNEY_SEGMENT_ORDER.indexOf(
      b.kind as (typeof JOURNEY_SEGMENT_ORDER)[number],
    );
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  result.segments = ordered;

  const returnJourney =
    result.segments.find((s) => s.kind === "return_journey") ?? null;

  const spof = result.segments
    .filter(
      (s) =>
        s.hardRequirementEffect === "unresolved" ||
        s.hardRequirementEffect === "blocks",
    )
    .filter((s) => s.fallback != null && !s.fallback.verified)
    .map((s) => s.id);

  const unverifiedFallbacks = result.segments
    .filter((s) => s.fallback && !s.fallback.verified)
    .map((s) => s.id);

  const confirmationTasks = result.envelope.confirmationTasks;
  const timelinePlainText = formatTimelinePlainText(timeline);

  const audioSummary = [
    `Access outlook for Taylor travelling to Harbour Civic Centre Room 3.12.`,
    `Intended time: ${new Date(intended).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}.`,
    `State: ${result.envelope.conclusionState.replaceAll("_", " ")}.`,
    `Why: ${result.why.join(". ")}.`,
    `Suggested checks: ${result.suggestedChecks.join(". ")}.`,
    returnJourney
      ? `Return journey: ${returnJourney.currentState.replaceAll("_", " ")}. ${returnJourney.evidenceSummary}.`
      : "Return journey was not evaluated.",
    "This is a synthetic forecast, not a safety guarantee.",
  ].join(" ");

  const printSummary = [
    "ACCESS OUTLOOK",
    `Journey: Home to Harbour Civic Centre, Room 3.12`,
    `Mission: ${missionId}`,
    `Time: ${new Date(intended).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}`,
    `State: ${result.envelope.conclusionState}`,
    "",
    "Why:",
    ...result.why.map((w) => `- ${w}`),
    "",
    "Suggested checks:",
    ...result.suggestedChecks.map((c, i) => `${i + 1}. ${c}`),
    "",
    `Fallback: ${result.envelope.fallback?.summary ?? "None recorded."}`,
    `Evidence confidence horizon: ${new Date(result.envelope.confidenceHorizon).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}`,
    "",
    "Timeline:",
    timelinePlainText,
    "",
    "Limitations:",
    ...result.envelope.limitations.map((l) => `- ${l}`),
  ].join("\n");

  return {
    participantLabel: "Taylor",
    venueLabel: "Harbour Civic Centre",
    destinationLabel: "Room 3.12",
    missionId,
    placeRef: HARBOUR_ACCESSCAST_IDS.placeCanonicalRef,
    result,
    timelinePlainText,
    confirmationTasks,
    returnJourney,
    fragility: {
      isFragile:
        result.envelope.conclusionState === "fragile" ||
        result.envelope.conclusionState === "cannot_confirm" ||
        (result.envelope.conclusionState === "stale" && spof.length > 0) ||
        result.fragilityWindows.length > 0,
      singlePointsOfFailure: spof,
      unverifiedFallbacks,
    },
    audioSummary,
    printSummary,
  };
}
