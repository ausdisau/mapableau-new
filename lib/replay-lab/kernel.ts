/**
 * Deterministic Replay Lab simulation kernel (in-process).
 * Uses virtual clock + seeded random + append-only ledger.
 */

import { runDomainAdapters } from "./adapters";
import { evaluateAssertions } from "./assertions";
import { createEventLedger, type ReplayEventLedger } from "./event-ledger";
import type { ReplayRunContext } from "./run-context";
import type { ValidatedReplayScenario } from "./scenario-schema";
import { createSeededRandom, type SeededRandom } from "./seeded-random";
import type {
  JourneyIntegrityScorecard,
  ReplayActor,
  ReplayEventEnvelope,
  ReplayProductMode,
} from "./types";
import {
  createVirtualClock,
  resolveLocalTimeOnStartDay,
  type VirtualClock,
} from "./virtual-clock";

export type ReplayRunResult = {
  runId: string;
  simulationId: string;
  scenarioId: string;
  seed: number;
  mode: ReplayProductMode;
  events: ReplayEventEnvelope[];
  scorecard: JourneyIntegrityScorecard;
  actors: ReplayActor[];
  clock: VirtualClock;
  ledger: ReplayEventLedger;
  random: SeededRandom;
};

export type ReplayRunOptions = {
  scenario: ValidatedReplayScenario;
  seed?: number;
  runId?: string;
  simulationId?: string;
  /** Virtual day anchor — default 2026-09-17T00:00:00+10:00 (AIN Taylor tip day). */
  startIso?: string;
  /** When true, synthetic domain adapters may append additional ledger events. */
  enableAdapters?: boolean;
  /** Optional adapter hook after each timeline event is appended. */
  onEvent?: (event: ReplayEventEnvelope, ctx: ReplayRunContext) => void;
};

export function runScenario(options: ReplayRunOptions): ReplayRunResult {
  const seed = options.seed ?? 42;
  const runId = options.runId ?? `run_${seed}`;
  const simulationId = options.simulationId ?? `sim_${options.scenario.scenario.id}`;
  const timeZone = options.scenario.localisation?.timeZone ?? "Australia/Sydney";
  const startIso = options.startIso ?? "2026-09-17T00:00:00+10:00";

  const clock = createVirtualClock({ start: startIso, timeZone });
  const random = createSeededRandom(seed);
  const ledger = createEventLedger({
    runId,
    idFactory: (() => {
      let n = 0;
      return () => {
        n += 1;
        return `replay_evt_${runId}_${String(n).padStart(4, "0")}`;
      };
    })(),
  });

  const actors = new Map<string, ReplayActor>();
  for (const a of options.scenario.actors ?? []) {
    actors.set(a.id, a as ReplayActor);
  }

  const ctx: ReplayRunContext = { clock, ledger, random, scenario: options.scenario, actors };

  const sorted = [...options.scenario.timeline].sort((a, b) => a.at.localeCompare(b.at));

  for (const entry of sorted) {
    const atMs = resolveLocalTimeOnStartDay(clock, entry.at);
    clock.jumpToMs(atMs);

    const event = ledger.append({
      simulationId,
      scenarioId: options.scenario.scenario.id,
      runId,
      virtualTimestamp: clock.nowIso(),
      sourceActor: entry.actor ?? "actor:application_service",
      sourceSystem: "replay-lab.kernel",
      eventType: entry.event as ReplayEventEnvelope["eventType"],
      payloadVersion: 1,
      causalParent: ledger.list().at(-1)?.eventId ?? null,
      correlationId: `${runId}:${options.scenario.scenario.id}`,
      authorityReference: authorityFor(entry.actor, actors),
      evidenceClass: "synthetic_fixture",
      affectedGoal: options.scenario.goal.outcome,
      visibility: "report",
      redactionClass: "public_synthetic",
      payload: { ...(entry.data ?? {}), localTime: entry.at },
    });

    if (options.enableAdapters) {
      runDomainAdapters(event, ctx);
    }
    options.onEvent?.(event, ctx);
  }

  const events = [...ledger.list()];
  const scorecard = evaluateAssertions({
    expected: options.scenario.expected,
    events,
    mode: options.scenario.scenario.mode,
  });

  return {
    runId,
    simulationId,
    scenarioId: options.scenario.scenario.id,
    seed,
    mode: options.scenario.scenario.mode,
    events,
    scorecard,
    actors: [...actors.values()],
    clock,
    ledger,
    random,
  };
}

function authorityFor(
  actorId: string | undefined,
  actors: Map<string, ReplayActor>,
): string | null {
  if (!actorId) return null;
  const actor = actors.get(actorId);
  if (!actor) return null;
  if (actor.authorityScopes.length === 0) return null;
  return `${actor.id}:${actor.authorityScopes.join(",")}`;
}
