import type { JourneyIntegrityScorecard, ReplayActor, ReplayEventEnvelope } from "./types";

export type ReplayAccessibleReport = {
  title: string;
  watermark: string;
  seed: number;
  scenarioId: string;
  runId: string;
  summary: string;
  events: Array<{
    eventId: string;
    localTime: string;
    virtualTimestamp: string;
    eventType: string;
    sourceActor: string;
    detail: string;
    synthetic: true;
  }>;
  actors: Array<{
    id: string;
    displayName: string;
    role: string;
    authorityScopes: string[];
    prohibitedActions: string[];
  }>;
  assertions: Array<{
    id: string;
    state: string;
    dimension: string;
    detail: string;
  }>;
  scorecard: JourneyIntegrityScorecard;
};

export function buildAccessibleReport(input: {
  title: string;
  seed: number;
  scenarioId: string;
  runId: string;
  events: ReplayEventEnvelope[];
  actors: ReplayActor[];
  scorecard: JourneyIntegrityScorecard;
}): ReplayAccessibleReport {
  const failed = input.scorecard.assertionResults.filter((r) =>
    r.state === "failed" || r.state === "blocked",
  ).length;
  const passed = input.scorecard.assertionResults.filter((r) =>
    r.state === "passed" || r.state === "passed_with_limitations",
  ).length;

  return {
    title: input.title,
    watermark: input.scorecard.watermark,
    seed: input.seed,
    scenarioId: input.scenarioId,
    runId: input.runId,
    summary: `Synthetic run ${input.runId} (seed ${input.seed}): ${passed} assertion(s) passed or limited, ${failed} failed or blocked. Not a production safety proof.`,
    events: input.events.map((e) => ({
      eventId: e.eventId,
      localTime: typeof e.payload.localTime === "string" ? e.payload.localTime : "",
      virtualTimestamp: e.virtualTimestamp,
      eventType: e.eventType,
      sourceActor: e.sourceActor,
      detail: summarisePayload(e.payload),
      synthetic: true as const,
    })),
    actors: input.actors.map((a) => ({
      id: a.id,
      displayName: a.displayName,
      role: a.role,
      authorityScopes: a.authorityScopes,
      prohibitedActions: a.prohibitedActions,
    })),
    assertions: input.scorecard.assertionResults.map((r) => ({
      id: r.assertionId,
      state: r.state,
      dimension: r.dimension,
      detail: r.detail,
    })),
    scorecard: input.scorecard,
  };
}

function summarisePayload(payload: Record<string, unknown>): string {
  const entries = Object.entries(payload)
    .filter(([k]) => k !== "localTime")
    .slice(0, 6)
    .map(([k, v]) => `${k}=${String(v)}`);
  return entries.join("; ") || "—";
}
