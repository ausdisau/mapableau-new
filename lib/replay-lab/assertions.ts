/**
 * Journey integrity assertions — multidimensional, no bare universal score.
 */

import { REPLAY_PERMANENT_DENY_FLAGS } from "./flags";
import type {
  JourneyIntegrityScorecard,
  ReplayAssertion,
  ReplayAssertionResult,
  ReplayAssertionResultState,
  ReplayEventEnvelope,
  ReplayProductMode,
  ReplayScorecardDimension,
} from "./types";

export const CANONICAL_ASSERTION_IDS = [
  "participant_authority_preserved",
  "inaccessible_replacement_rejected",
  "unknown_hoist_not_confirmed",
  "communication_requirements_transferred",
  "recovery_options_presented",
  "no_automatic_assignment",
  "outcome_not_marked_achieved_without_confirmation",
  "no_action_without_authority",
  "no_relationship_based_privilege",
  "no_silence_as_consent",
  "no_ai_authority_expansion",
  "stop_aura_honoured",
  "revocation_blocks_future_use",
] as const;

export type CanonicalAssertionId = (typeof CANONICAL_ASSERTION_IDS)[number];

const ASSERTION_DIMENSION: Record<string, ReplayScorecardDimension> = {
  participant_authority_preserved: "rights",
  inaccessible_replacement_rejected: "access",
  unknown_hoist_not_confirmed: "access",
  communication_requirements_transferred: "communication",
  recovery_options_presented: "continuity",
  no_automatic_assignment: "workforce",
  outcome_not_marked_achieved_without_confirmation: "outcome",
  no_action_without_authority: "rights",
  no_relationship_based_privilege: "rights",
  no_silence_as_consent: "rights",
  no_ai_authority_expansion: "rights",
  stop_aura_honoured: "rights",
  revocation_blocks_future_use: "rights",
};

export function assertionDimension(id: string): ReplayScorecardDimension {
  return ASSERTION_DIMENSION[id] ?? "evidence";
}

export function buildAssertions(expectedIds: string[]): ReplayAssertion[] {
  return expectedIds.map((id) => ({
    id,
    description: id.replace(/_/g, " "),
    dimension: assertionDimension(id),
  }));
}

function hasEvent(
  events: readonly ReplayEventEnvelope[],
  type: string,
  predicate?: (e: ReplayEventEnvelope) => boolean,
): boolean {
  return events.some((e) => e.eventType === type && (predicate ? predicate(e) : true));
}

/**
 * Evaluate expected assertion ids against a synthetic event history.
 * Distinguishes failed, blocked, and cannot_determine.
 */
export function evaluateAssertions(input: {
  expected: string[];
  events: readonly ReplayEventEnvelope[];
  mode: ReplayProductMode;
}): JourneyIntegrityScorecard {
  if (REPLAY_PERMANENT_DENY_FLAGS.universalScore !== false) {
    throw new Error("Universal score must remain permanently denied");
  }

  const results: ReplayAssertionResult[] = input.expected.map((id) =>
    evaluateOne(id, input.events),
  );

  const dimensions = emptyDimensions();
  for (const r of results) {
    const dim = dimensions[r.dimension];
    dim.notes.push(`${r.assertionId}: ${r.state} — ${r.detail}`);
    dim.state = mergeStates(dim.state, r.state);
  }

  return {
    mode: input.mode,
    dimensions,
    assertionResults: results,
    universalScore: null,
    watermark: `replay-lab/${input.mode}/synthetic — not a production safety proof`,
  };
}

function evaluateOne(
  id: string,
  events: readonly ReplayEventEnvelope[],
): ReplayAssertionResult {
  const dimension = assertionDimension(id);

  switch (id) {
    case "participant_authority_preserved": {
      const autoAssign = hasEvent(events, "mapable.replay.transport.trip_confirmed", (e) =>
        Boolean(e.payload.automatic),
      );
      const refusalHonoured = hasEvent(
        events,
        "mapable.replay.participant.option_refused",
      );
      if (autoAssign) {
        return result(id, dimension, "failed", "Automatic assignment bypassed authority");
      }
      if (events.length === 0) {
        return result(id, dimension, "cannot_determine", "No events to evaluate authority");
      }
      return result(
        id,
        dimension,
        refusalHonoured || !autoAssign ? "passed" : "failed",
        "No automatic assignment without participant authority",
      );
    }
    case "inaccessible_replacement_rejected": {
      const proposed = hasEvent(events, "mapable.replay.transport.replacement_proposed", (e) =>
        e.payload.accessible === false || e.payload.hoist_compatibility === "unknown",
      );
      const rejected = hasEvent(events, "mapable.replay.transport.trip_rejected") ||
        hasEvent(events, "mapable.replay.system.prohibited_action_blocked");
      if (!proposed) {
        return result(id, dimension, "cannot_determine", "No inaccessible replacement proposed");
      }
      return result(
        id,
        dimension,
        rejected ? "passed" : "failed",
        rejected
          ? "Inaccessible or unknown-compatibility replacement rejected"
          : "Inaccessible replacement was not rejected",
      );
    }
    case "unknown_hoist_not_confirmed": {
      const unknownConfirmed = hasEvent(
        events,
        "mapable.replay.transport.trip_confirmed",
        (e) => e.payload.hoist_compatibility === "unknown",
      );
      if (unknownConfirmed) {
        return result(id, dimension, "failed", "Trip confirmed with unknown hoist compatibility");
      }
      const proposedUnknown = hasEvent(
        events,
        "mapable.replay.transport.replacement_proposed",
        (e) => e.payload.hoist_compatibility === "unknown",
      );
      if (!proposedUnknown) {
        return result(id, dimension, "cannot_determine", "No unknown-hoist proposal in history");
      }
      return result(id, dimension, "passed", "Unknown hoist was not confirmed");
    }
    case "communication_requirements_transferred": {
      const shared = hasEvent(events, "mapable.replay.communication.instructions_shared");
      if (!shared) {
        return result(id, dimension, "blocked", "Communication instructions never shared");
      }
      const ack = hasEvent(events, "mapable.replay.communication.instructions_acknowledged");
      return result(
        id,
        dimension,
        ack ? "passed" : "failed",
        ack ? "Instructions acknowledged" : "Instructions shared but not acknowledged",
      );
    }
    case "recovery_options_presented": {
      const opened = hasEvent(events, "mapable.replay.continuity.case_opened");
      const options = hasEvent(events, "mapable.replay.recovery.option_created");
      if (!opened) {
        return result(id, dimension, "cannot_determine", "No continuity case opened");
      }
      return result(
        id,
        dimension,
        options ? "passed" : "failed",
        options ? "Recovery options presented" : "Continuity opened without recovery options",
      );
    }
    case "no_automatic_assignment": {
      const auto = hasEvent(events, "mapable.replay.transport.trip_confirmed", (e) =>
        Boolean(e.payload.automatic),
      );
      const workerAuto = hasEvent(events, "mapable.replay.worker.competency_checked", (e) =>
        e.payload.autoAssigned === true,
      );
      if (auto || workerAuto) {
        return result(id, dimension, "failed", "Automatic assignment detected");
      }
      return result(id, dimension, "passed", "No automatic assignment events");
    }
    case "outcome_not_marked_achieved_without_confirmation": {
      const confirmed = hasEvent(events, "mapable.replay.outcome.participant_confirmed");
      const review = hasEvent(events, "mapable.replay.outcome.review_requested");
      if (confirmed && !review) {
        // Confirmation without review path can still be valid; check payload honesty.
        const dishonest = hasEvent(
          events,
          "mapable.replay.outcome.participant_confirmed",
          (e) => e.payload.goalAchieved === true && e.payload.participantConfirmed !== true,
        );
        return result(
          id,
          dimension,
          dishonest ? "failed" : "passed",
          dishonest
            ? "Outcome marked achieved without participant confirmation"
            : "Outcome confirmation present",
        );
      }
      if (!confirmed && !review) {
        return result(
          id,
          dimension,
          "passed_with_limitations",
          "Goal not marked achieved; unresolved outcome remains honest",
        );
      }
      return result(id, dimension, "passed", "Outcome handling did not overclaim achievement");
    }
    case "no_action_without_authority": {
      const blocked = hasEvent(events, "mapable.replay.system.prohibited_action_blocked");
      const unauth = events.some(
        (e) => e.authorityReference === null && e.payload.requiresAuthority === true,
      );
      if (unauth) {
        return result(id, dimension, "failed", "Action required authority but none referenced");
      }
      return result(
        id,
        dimension,
        blocked || !unauth ? "passed" : "failed",
        "Authority checks held",
      );
    }
    case "revocation_blocks_future_use": {
      const revoked = hasEvent(events, "mapable.replay.participant.consent_revoked");
      if (!revoked) {
        return result(id, dimension, "cannot_determine", "No consent revocation in history");
      }
      const revokeIdx = events.findIndex(
        (e) => e.eventType === "mapable.replay.participant.consent_revoked",
      );
      const after = events.slice(revokeIdx + 1);
      const leak = after.some(
        (e) =>
          e.eventType === "mapable.replay.communication.instructions_shared" &&
          e.payload.disclosureAfterRevocation === true,
      );
      return result(
        id,
        dimension,
        leak ? "failed" : "passed",
        leak ? "Disclosure continued after revocation" : "Revocation blocked future use",
      );
    }
    default:
      return result(
        id,
        dimension,
        "human_review_required",
        `No automated evaluator for assertion ${id}`,
      );
  }
}

function result(
  assertionId: string,
  dimension: ReplayScorecardDimension,
  state: ReplayAssertionResultState,
  detail: string,
): ReplayAssertionResult {
  return { assertionId, dimension, state, detail };
}

function emptyDimensions(): JourneyIntegrityScorecard["dimensions"] {
  const states: ReplayScorecardDimension[] = [
    "rights",
    "communication",
    "access",
    "workforce",
    "continuity",
    "evidence",
    "outcome",
    "burden",
  ];
  const dimensions = {} as JourneyIntegrityScorecard["dimensions"];
  for (const d of states) {
    dimensions[d] = { state: "cannot_determine", notes: [] };
  }
  return dimensions;
}

function mergeStates(
  current: ReplayAssertionResultState,
  next: ReplayAssertionResultState,
): ReplayAssertionResultState {
  const rank: ReplayAssertionResultState[] = [
    "cannot_determine",
    "passed",
    "passed_with_limitations",
    "human_review_required",
    "blocked",
    "failed",
  ];
  return rank.indexOf(next) >= rank.indexOf(current) ? next : current;
}
