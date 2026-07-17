/**
 * Append-only synthetic event ledger for Replay Lab.
 * Rewind reconstructs state from a prefix — prior events are never mutated.
 */

import {
  REPLAY_EVENT_NAMESPACE,
  REPLAY_EVENT_TYPES,
  type ReplayEventEnvelope,
  type ReplayEventType,
} from "./types";

export type ReplayLedgerState = {
  actorFlags: Record<string, string>;
  domainFlags: Record<string, string>;
  openContinuityCases: string[];
  rejectedTransportProposals: string[];
  acknowledgedCommunication: boolean;
  authorityBlocks: string[];
};

export type ReplayEventAppendInput = Omit<ReplayEventEnvelope, "synthetic" | "eventId"> & {
  eventId?: string;
  /** Must be true or omitted — false is rejected. */
  synthetic?: true;
};

export type ReplayEventLedger = {
  readonly runId: string;
  append(partial: ReplayEventAppendInput): ReplayEventEnvelope;
  list(): readonly ReplayEventEnvelope[];
  getById(eventId: string): ReplayEventEnvelope | undefined;
  /** Reconstruct domain/actor state from events[0..indexInclusive]. */
  reconstructState(upToEventIndex: number): ReplayLedgerState;
  /** Rewind view: state at event id without mutating the ledger. */
  rewindTo(eventId: string): { state: ReplayLedgerState; events: readonly ReplayEventEnvelope[] };
};

const PRODUCTION_NAMESPACE_PREFIXES = [
  "production.",
  "mapable.care.",
  "mapable.transport.",
  "mapable.billing.",
  "audit.",
  "ledger.",
] as const;

export function isReplayEventType(value: string): value is ReplayEventType {
  return (REPLAY_EVENT_TYPES as readonly string[]).includes(value);
}

export function assertSyntheticEventType(eventType: string): asserts eventType is ReplayEventType {
  if (!eventType.startsWith(`${REPLAY_EVENT_NAMESPACE}.`)) {
    throw new Error(
      `Rejected event type outside synthetic namespace: ${eventType}. Expected ${REPLAY_EVENT_NAMESPACE}.*`,
    );
  }
  for (const prefix of PRODUCTION_NAMESPACE_PREFIXES) {
    if (eventType.startsWith(prefix)) {
      throw new Error(`Production namespace rejected: ${eventType}`);
    }
  }
  if (!isReplayEventType(eventType)) {
    throw new Error(`Unknown or invalid Replay Lab event type: ${eventType}`);
  }
}

function emptyState(): ReplayLedgerState {
  return {
    actorFlags: {},
    domainFlags: {},
    openContinuityCases: [],
    rejectedTransportProposals: [],
    acknowledgedCommunication: false,
    authorityBlocks: [],
  };
}

function applyEvent(state: ReplayLedgerState, event: ReplayEventEnvelope): void {
  switch (event.eventType) {
    case "mapable.replay.communication.instructions_acknowledged":
      state.acknowledgedCommunication = true;
      break;
    case "mapable.replay.continuity.case_opened":
      state.openContinuityCases.push(event.eventId);
      break;
    case "mapable.replay.transport.trip_rejected":
    case "mapable.replay.system.prohibited_action_blocked":
      if (typeof event.payload.proposalId === "string") {
        state.rejectedTransportProposals.push(event.payload.proposalId);
      }
      break;
    case "mapable.replay.participant.consent_revoked":
      state.authorityBlocks.push("consent_revoked");
      break;
    case "mapable.replay.worker.cancelled":
      state.actorFlags[event.sourceActor] = "cancelled";
      break;
    case "mapable.replay.access.lift_unavailable":
      state.domainFlags.lift = "unavailable";
      break;
    default:
      break;
  }
}

let eventSeq = 0;

export function resetReplayEventIdSequenceForTests(): void {
  eventSeq = 0;
}

export function createEventLedger(input: {
  runId: string;
  idFactory?: () => string;
}): ReplayEventLedger {
  const events: ReplayEventEnvelope[] = [];
  const idFactory =
    input.idFactory ??
    (() => {
      eventSeq += 1;
      return `replay_evt_${input.runId}_${String(eventSeq).padStart(4, "0")}`;
    });

  return {
    runId: input.runId,
    append(partial) {
      assertSyntheticEventType(partial.eventType);
      if ("synthetic" in partial && partial.synthetic !== true) {
        throw new Error("Events must be marked synthetic");
      }
      const envelope: ReplayEventEnvelope = {
        simulationId: partial.simulationId,
        scenarioId: partial.scenarioId,
        runId: partial.runId,
        eventId: partial.eventId ?? idFactory(),
        virtualTimestamp: partial.virtualTimestamp,
        sourceActor: partial.sourceActor,
        sourceSystem: partial.sourceSystem,
        eventType: partial.eventType,
        payloadVersion: partial.payloadVersion,
        causalParent: partial.causalParent,
        correlationId: partial.correlationId,
        authorityReference: partial.authorityReference,
        evidenceClass: partial.evidenceClass,
        synthetic: true,
        affectedGoal: partial.affectedGoal,
        visibility: partial.visibility,
        redactionClass: partial.redactionClass,
        payload: partial.payload,
      };
      events.push(envelope);
      return envelope;
    },
    list() {
      return events;
    },
    getById(eventId) {
      return events.find((e) => e.eventId === eventId);
    },
    reconstructState(upToEventIndex) {
      const state = emptyState();
      const end = Math.min(upToEventIndex, events.length - 1);
      for (let i = 0; i <= end; i++) {
        applyEvent(state, events[i]!);
      }
      return state;
    },
    rewindTo(eventId) {
      const idx = events.findIndex((e) => e.eventId === eventId);
      if (idx < 0) throw new Error(`Unknown event for rewind: ${eventId}`);
      const prefix = events.slice(0, idx + 1);
      const state = emptyState();
      for (const e of prefix) applyEvent(state, e);
      return { state, events: prefix };
    },
  };
}
