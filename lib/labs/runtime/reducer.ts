import type {
  AgencyEvent,
  AutonomyMode,
  DecisionPoint,
  LabScenario,
  ParticipantChoice,
  ScenarioEvent,
  ScenarioFeedback,
  ScenarioState,
} from "@/lib/labs/contracts";
import { LABS_SIMULATION_DATA } from "@/lib/labs/contracts";

export type ScenarioCommand =
  | { type: "START"; autonomyMode: AutonomyMode; runId: string; at: string }
  | { type: "PAUSE"; at: string }
  | { type: "CONTINUE"; at: string }
  | { type: "PARTICIPANT_CHOICE"; optionId: string; at: string }
  | { type: "SUBMIT_FEEDBACK"; decisionPointId: string; question: string; response: string; at: string }
  | { type: "RESET" }
  | {
      type: "REPLAY";
      autonomyMode: AutonomyMode;
      runId: string;
      at: string;
    }
  | { type: "SET_PRESENTATION"; mode: ScenarioState["presentationMode"] };

function agency(
  partial: Omit<AgencyEvent, "labsSimulationData" | "id"> & { id?: string },
): AgencyEvent {
  return {
    id: partial.id ?? `agency-${partial.timestamp}-${partial.action}`,
    actor: partial.actor,
    action: partial.action,
    authorityState: partial.authorityState,
    participantChoiceId: partial.participantChoiceId,
    scenarioNodeId: partial.scenarioNodeId,
    timestamp: partial.timestamp,
    labsSimulationData: LABS_SIMULATION_DATA,
  };
}

export function createInitialScenarioState(
  scenario: LabScenario,
  autonomyMode: AutonomyMode = "INFORM",
): ScenarioState {
  return {
    scenarioId: scenario.id,
    phase: "IDLE",
    autonomyMode,
    presentationMode: "STANDARD_VISUAL",
    pathIndex: -1,
    currentNodeId: null,
    pendingDecision: null,
    pendingEvent: null,
    choices: [],
    agencyTimeline: [],
    feedback: [],
    runId: "",
    startedAt: null,
    completedAt: null,
    labsSimulationData: LABS_SIMULATION_DATA,
  };
}

function buildDecision(
  scenario: LabScenario,
  event: ScenarioEvent,
  autonomyMode: AutonomyMode,
): DecisionPoint {
  const node = scenario.nodes.find((n) => n.id === event.nodeId);
  const recommendedWait = "wait";
  const recommendedReroute = "reroute";
  const recommendedProceed = "proceed_cautiously";

  const options = [
    {
      id: "wait",
      label: "Wait and reassess",
      description: "Pause the simulated journey until more is known.",
      recommended: autonomyMode === "SUGGEST" || autonomyMode === "ASSIST",
    },
    {
      id: "reroute",
      label: "Ask for another route",
      description: "Request a different simulated path around the condition.",
      recommended: false,
    },
    {
      id: "proceed_cautiously",
      label: "Continue with caution",
      description: "Continue only if you are comfortable with the uncertainty.",
      recommended: autonomyMode === "INFORM" ? false : false,
    },
    {
      id: "hand_back",
      label: "I decide fully",
      description: "Take full control of the next simulated step.",
      recommended: false,
    },
  ];

  let systemRecommendationId: string | undefined;
  if (autonomyMode === "SUGGEST" || autonomyMode === "ASSIST") {
    systemRecommendationId =
      event.type === "LIFT_OUTAGE" ? recommendedReroute : recommendedWait;
    options.forEach((o) => {
      o.recommended = o.id === systemRecommendationId;
    });
  }
  if (autonomyMode === "INFORM") {
    systemRecommendationId = undefined;
    options.forEach((o) => {
      o.recommended = false;
    });
  }

  void recommendedProceed;
  void node;

  return {
    id: `decision-${event.id}`,
    nodeId: event.nodeId,
    eventType: event.type,
    prompt: `${event.title}: what should happen next?`,
    options,
    systemRecommendationId,
  };
}

function advanceToIndex(
  state: ScenarioState,
  scenario: LabScenario,
  nextIndex: number,
  at: string,
  timeline: AgencyEvent[],
): ScenarioState {
  if (nextIndex >= scenario.path.length) {
    return {
      ...state,
      phase: "COMPLETED",
      pathIndex: scenario.path.length - 1,
      pendingDecision: null,
      pendingEvent: null,
      completedAt: at,
      agencyTimeline: [
        ...timeline,
        agency({
          actor: "SYSTEM",
          action: "Journey simulation completed",
          authorityState: "PARTICIPANT_HOLDS",
          timestamp: at,
          scenarioNodeId: state.currentNodeId ?? undefined,
        }),
      ],
    };
  }

  const nodeId = scenario.path[nextIndex]!;
  const node = scenario.nodes.find((n) => n.id === nodeId);
  const events = scenario.eventsByNodeId[nodeId] ?? [];
  const decisionEvent = events.find((e) => e.requiresDecision) ?? null;

  const arriveTimeline = [
    ...timeline,
    agency({
      actor: "ENVIRONMENT",
      action: `Arrived at ${node?.label ?? nodeId}`,
      authorityState:
        state.autonomyMode === "ASSIST" && !decisionEvent
          ? "SYSTEM_CONTINUES_ROUTINE"
          : "PARTICIPANT_HOLDS",
      timestamp: at,
      scenarioNodeId: nodeId,
    }),
  ];

  if (decisionEvent) {
    const decision = buildDecision(scenario, decisionEvent, state.autonomyMode);
    return {
      ...state,
      phase: "DECISION_REQUIRED",
      pathIndex: nextIndex,
      currentNodeId: nodeId,
      pendingEvent: decisionEvent,
      pendingDecision: decision,
      agencyTimeline: [
        ...arriveTimeline,
        agency({
          actor: "ENVIRONMENT",
          action: decisionEvent.title,
          authorityState: "AWAITING_PARTICIPANT",
          timestamp: at,
          scenarioNodeId: nodeId,
        }),
        agency({
          actor: "SYSTEM",
          action:
            state.autonomyMode === "INFORM"
              ? `Informed participant about ${decisionEvent.type}`
              : state.autonomyMode === "SUGGEST"
                ? `Suggested option ${decision.systemRecommendationId}`
                : `Assist mode awaiting approval for ${decisionEvent.type}`,
          authorityState:
            state.autonomyMode === "INFORM"
              ? "PARTICIPANT_HOLDS"
              : "SYSTEM_PROPOSES",
          timestamp: at,
          scenarioNodeId: nodeId,
        }),
      ],
    };
  }

  // ASSIST auto-continues routine nodes without events; INFORM/SUGGEST still need CONTINUE.
  if (state.autonomyMode === "ASSIST") {
    return advanceToIndex(
      {
        ...state,
        pathIndex: nextIndex,
        currentNodeId: nodeId,
        pendingEvent: null,
        pendingDecision: null,
        phase: "RUNNING",
      },
      scenario,
      nextIndex + 1,
      at,
      arriveTimeline,
    );
  }

  return {
    ...state,
    phase: "RUNNING",
    pathIndex: nextIndex,
    currentNodeId: nodeId,
    pendingEvent: null,
    pendingDecision: null,
    agencyTimeline: arriveTimeline,
  };
}

/**
 * Deterministic scenario reducer — no LLM.
 */
export function reduceScenario(
  state: ScenarioState,
  command: ScenarioCommand,
  scenario: LabScenario,
): ScenarioState {
  switch (command.type) {
    case "SET_PRESENTATION":
      return { ...state, presentationMode: command.mode };

    case "RESET":
      return createInitialScenarioState(scenario, state.autonomyMode);

    case "REPLAY":
    case "START": {
      const started = createInitialScenarioState(scenario, command.autonomyMode);
      const withMeta: ScenarioState = {
        ...started,
        phase: "RUNNING",
        runId: command.runId,
        startedAt: command.at,
        presentationMode: state.presentationMode,
        agencyTimeline: [
          agency({
            actor: "PARTICIPANT",
            action: `Started journey in ${command.autonomyMode} mode`,
            authorityState: "PARTICIPANT_HOLDS",
            timestamp: command.at,
          }),
        ],
      };
      return advanceToIndex(withMeta, scenario, 0, command.at, withMeta.agencyTimeline);
    }

    case "PAUSE": {
      if (state.phase !== "RUNNING" && state.phase !== "DECISION_REQUIRED") {
        return state;
      }
      return {
        ...state,
        phase: "PAUSED",
        agencyTimeline: [
          ...state.agencyTimeline,
          agency({
            actor: "PARTICIPANT",
            action: "Paused the simulation",
            authorityState: "PARTICIPANT_HOLDS",
            timestamp: command.at,
            scenarioNodeId: state.currentNodeId ?? undefined,
          }),
        ],
      };
    }

    case "CONTINUE": {
      if (state.phase === "PAUSED") {
        return {
          ...state,
          phase: state.pendingDecision ? "DECISION_REQUIRED" : "RUNNING",
          agencyTimeline: [
            ...state.agencyTimeline,
            agency({
              actor: "PARTICIPANT",
              action: "Resumed the simulation",
              authorityState: "PARTICIPANT_HOLDS",
              timestamp: command.at,
              scenarioNodeId: state.currentNodeId ?? undefined,
            }),
          ],
        };
      }
      if (state.phase !== "RUNNING" || state.pendingDecision) return state;
      return advanceToIndex(
        state,
        scenario,
        state.pathIndex + 1,
        command.at,
        state.agencyTimeline,
      );
    }

    case "PARTICIPANT_CHOICE": {
      if (state.phase !== "DECISION_REQUIRED" || !state.pendingDecision) {
        return state;
      }
      const option = state.pendingDecision.options.find(
        (o) => o.id === command.optionId,
      );
      if (!option) return state;

      const choice: ParticipantChoice = {
        id: `choice-${state.runId}-${state.choices.length + 1}`,
        decisionPointId: state.pendingDecision.id,
        optionId: option.id,
        label: option.label,
        autonomyMode: state.autonomyMode,
        timestamp: command.at,
      };

      const next: ScenarioState = {
        ...state,
        phase: "RUNNING",
        pendingDecision: null,
        pendingEvent: null,
        choices: [...state.choices, choice],
        agencyTimeline: [
          ...state.agencyTimeline,
          agency({
            actor: "PARTICIPANT",
            action: `Chose: ${option.label}`,
            authorityState: "HANDED_BACK",
            participantChoiceId: choice.id,
            scenarioNodeId: state.currentNodeId ?? undefined,
            timestamp: command.at,
          }),
        ],
      };

      return advanceToIndex(
        next,
        scenario,
        state.pathIndex + 1,
        command.at,
        next.agencyTimeline,
      );
    }

    case "SUBMIT_FEEDBACK": {
      const entry: ScenarioFeedback = {
        id: `feedback-${state.feedback.length + 1}`,
        decisionPointId: command.decisionPointId,
        question: command.question,
        response: command.response,
        timestamp: command.at,
      };
      return { ...state, feedback: [...state.feedback, entry] };
    }

    default: {
      const _exhaustive: never = command;
      return _exhaustive;
    }
  }
}
