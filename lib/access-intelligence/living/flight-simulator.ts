/**
 * Interview on Level 3 — flight simulator bridged to the same fit/route engines.
 */
import { calculatePersonalFit } from "../fit-engine";
import { buildAccessibleRoute } from "../route-engine";
import type { AccessDecision, DecisionStatus } from "../schemas";

import { buildDecisionMirror } from "./decision-mirror";
import {
  buildHarbourLivingTwin,
  MAIN_LIFT_OUTAGE_INCIDENT,
} from "./harbour-civic";
import { defaultInterviewTwin } from "./personal-twin";
import type { LearningTraceEvent, LivingAccessTwin } from "./schemas";
import { getAccessStateAt } from "./temporal";

export type FlightSimStage =
  | "orientation"
  | "prediction"
  | "investigation"
  | "decision"
  | "consequence"
  | "revision"
  | "teach_back"
  | "reflection"
  | "transfer"
  | "complete";

export type FlightSimSession = {
  id: string;
  userId: string;
  stage: FlightSimStage;
  twin: LivingAccessTwin;
  prediction?: { status: DecisionStatus; confidence: number };
  inspectedEvidenceIds: string[];
  selectedEntranceId?: string;
  selectedRouteId?: string;
  identifiedBlockers: string[];
  identifiedUnknowns: string[];
  venueQuestion?: string;
  contingency?: string;
  teachBackText?: string;
  reflections: string[];
  transferAnswer?: string;
  events: LearningTraceEvent[];
  hintLevel: number;
  engineDecision?: AccessDecision;
  revisedDecision?: AccessDecision;
  mainLiftOutageIntroduced: boolean;
};

const sessions = new Map<string, FlightSimSession>();

const STAGE_ORDER: FlightSimStage[] = [
  "orientation",
  "prediction",
  "investigation",
  "decision",
  "consequence",
  "revision",
  "teach_back",
  "reflection",
  "transfer",
  "complete",
];

function assertAdvance(from: FlightSimStage, to: FlightSimStage) {
  const a = STAGE_ORDER.indexOf(from);
  const b = STAGE_ORDER.indexOf(to);
  if (b !== a + 1 && b !== a) {
    throw new Error(`Invalid flight-sim transition ${from} → ${to}`);
  }
}

export function startInterviewFlightSim(userId: string): FlightSimSession {
  const session: FlightSimSession = {
    id: `flight-${Math.random().toString(36).slice(2, 10)}`,
    userId,
    stage: "orientation",
    twin: buildHarbourLivingTwin(),
    inspectedEvidenceIds: [],
    identifiedBlockers: [],
    identifiedUnknowns: [],
    reflections: [],
    events: [],
    hintLevel: 0,
    mainLiftOutageIntroduced: false,
  };
  sessions.set(session.id, session);
  return session;
}

export function getFlightSim(sessionId: string): FlightSimSession {
  const s = sessions.get(sessionId);
  if (!s) throw new Error("Flight simulator session not found");
  return s;
}

export function getInterviewScenarioBrief() {
  const twin = defaultInterviewTwin("demo");
  return {
    title: "The Interview on Level 3",
    learnerRoles: ["Access planner", "Venue staff", "Support worker", "General learner"],
    humanGoal:
      "Taylor has a job interview in Room 3.12 at Harbour Civic Centre at 10:00 am.",
    requirements: twin.passport.requirements,
    visitAt: twin.journeyContext.visitAt,
    fictionalNotice:
      "Harbour Civic Centre is fictional. Do not treat these measurements as a real venue.",
    evidenceCatalog: buildHarbourLivingTwin().evidence.map((e) => ({
      id: e.id,
      title: e.title,
      sourceType: e.sourceType,
      status: e.status,
      capturedAt: e.capturedAt,
    })),
  };
}

function runEngines(session: FlightSimSession, withOutage: boolean) {
  const personal = defaultInterviewTwin(session.userId);
  const twin = withOutage
    ? buildHarbourLivingTwin({
        incidents: [...session.twin.incidents, MAIN_LIFT_OUTAGE_INCIDENT],
      })
    : session.twin;
  const visitAt = personal.journeyContext.visitAt ?? new Date().toISOString();
  const state = getAccessStateAt(twin, visitAt);
  const decision = calculatePersonalFit({
    place: twin.place,
    passport: personal.passport,
    features: state.effectiveFeatures,
    evidence: twin.evidence,
    incidents: state.activeIncidents,
    now: new Date(visitAt),
  });
  const fromNode =
    session.selectedEntranceId === "n-hcc-a" ? "n-hcc-a" : "n-hcc-b";
  const route = buildAccessibleRoute({
    placeId: twin.place.id,
    nodes: twin.nodes,
    edges: state.effectiveEdges,
    passport: personal.passport,
    fromNodeId: fromNode,
    toNodeId: "n-hcc-room",
    incidents: state.activeIncidents,
  });
  return { decision, route, twin, state };
}

export function advanceFlightSim(
  sessionId: string,
  to: FlightSimStage,
): FlightSimSession {
  const session = getFlightSim(sessionId);
  assertAdvance(session.stage, to);
  session.stage = to;
  return session;
}

export function submitFlightPrediction(
  sessionId: string,
  status: DecisionStatus,
  confidence: number,
): FlightSimSession {
  const session = getFlightSim(sessionId);
  if (session.stage === "orientation") session.stage = "prediction";
  if (session.stage !== "prediction") {
    throw new Error("Prediction only allowed during prediction stage");
  }
  session.prediction = { status, confidence };
  session.events.push({
    type: "prediction_submitted",
    status,
    confidence,
    timestamp: new Date().toISOString(),
  });
  session.stage = "investigation";
  return session;
}

export function revealFlightEvidence(
  sessionId: string,
  evidenceId: string,
): FlightSimSession {
  const session = getFlightSim(sessionId);
  if (!session.prediction) {
    throw new Error("Prediction required before evidence reveal");
  }
  if (!session.inspectedEvidenceIds.includes(evidenceId)) {
    session.inspectedEvidenceIds.push(evidenceId);
  }
  session.events.push({
    type: "evidence_opened",
    evidenceId,
    timestamp: new Date().toISOString(),
  });
  return session;
}

export function submitFlightDecision(
  sessionId: string,
  input: {
    entranceId: string;
    routeId: string;
    blockers: string[];
    unknowns: string[];
    venueQuestion?: string;
    contingency?: string;
  },
): FlightSimSession {
  const session = getFlightSim(sessionId);
  session.stage = "decision";
  session.selectedEntranceId = input.entranceId;
  session.selectedRouteId = input.routeId;
  session.identifiedBlockers = input.blockers;
  session.identifiedUnknowns = input.unknowns;
  session.venueQuestion = input.venueQuestion;
  session.contingency = input.contingency;
  session.events.push({
    type: "route_selected",
    routeId: input.routeId,
    timestamp: new Date().toISOString(),
  });

  const { decision, route } = runEngines(session, false);
  session.engineDecision = decision;
  if (route.recommended) {
    decision.recommendedRouteId = route.recommended.id;
  }

  // Consequence: main lift outage
  session.stage = "consequence";
  session.mainLiftOutageIntroduced = true;
  session.twin = buildHarbourLivingTwin({
    incidents: [MAIN_LIFT_OUTAGE_INCIDENT],
  });
  return session;
}

export function reviseFlightPlan(
  sessionId: string,
  routeId: string,
  status: DecisionStatus,
  confidence: number,
): FlightSimSession {
  const session = getFlightSim(sessionId);
  session.stage = "revision";
  session.selectedRouteId = routeId;
  session.events.push({
    type: "decision_revised",
    status,
    confidence,
    timestamp: new Date().toISOString(),
  });
  session.events.push({
    type: "route_selected",
    routeId,
    timestamp: new Date().toISOString(),
  });
  const { decision, route } = runEngines(session, true);
  session.revisedDecision = decision;
  if (route.recommended) {
    decision.recommendedRouteId = route.recommended.id;
    decision.alternatives.push(
      ...route.recommended.steps.map((s) => s.instruction),
    );
  }
  return session;
}

export function flightHint(sessionId: string): { level: number; text: string } {
  const session = getFlightSim(sessionId);
  session.hintLevel = Math.min(3, session.hintLevel + 1);
  session.events.push({
    type: "hint_requested",
    hintLevel: session.hintLevel,
    timestamp: new Date().toISOString(),
  });
  const hints = [
    "Which requirement relates to the selected entrance?",
    "Review the evidence about steps and the Entrance B door.",
    "Entrance A has steps. Taylor’s selected passport requires a step-free route, so Entrance A is not eligible.",
  ] as const;
  return { level: session.hintLevel, text: hints[session.hintLevel - 1]! };
}

export function completeFlightTeachBack(
  sessionId: string,
  text: string,
): FlightSimSession {
  const session = getFlightSim(sessionId);
  session.stage = "teach_back";
  session.teachBackText = text;
  return session;
}

export function completeFlightReflection(
  sessionId: string,
  reflections: string[],
): FlightSimSession {
  const session = getFlightSim(sessionId);
  session.stage = "reflection";
  session.reflections = reflections;
  return session;
}

export function completeFlightTransfer(
  sessionId: string,
  answer: string,
): {
  session: FlightSimSession;
  eveningDecision: AccessDecision;
  mirror: ReturnType<typeof buildDecisionMirror>;
  rubric: {
    criteria: {
      criterionId: string;
      status: "met" | "partially_met" | "not_met";
      explanation: string;
      nextPracticeSuggestion: string;
    }[];
    overallLevel:
      | "introduced"
      | "developing"
      | "independent"
      | "can_explain_to_others";
    strengths: string[];
    nextFocus: string[];
  };
} {
  const session = getFlightSim(sessionId);
  session.stage = "transfer";
  session.transferAnswer = answer;

  // Evening case: Entrance B closed
  const eveningTwin = buildHarbourLivingTwin();
  const eveningAt = "2026-07-16T09:00:00.000Z"; // 19:00 Sydney (UTC+10)
  const personal = defaultInterviewTwin(session.userId);
  const state = getAccessStateAt(eveningTwin, eveningAt);
  const eveningDecision = calculatePersonalFit({
    place: eveningTwin.place,
    passport: personal.passport,
    features: state.effectiveFeatures,
    evidence: eveningTwin.evidence,
    incidents: state.activeIncidents,
    now: new Date(eveningAt),
  });
  if (state.closedElementIds.includes("hcc-ent-b")) {
    eveningDecision.conditions.push(
      "Entrance B is closed at 19:00 — special access must be arranged or information remains incomplete for step-free evening entry.",
    );
    if (eveningDecision.status === "suitable") {
      eveningDecision.status = "unknown";
    }
  }

  const finalStatus =
    session.revisedDecision?.status ??
    session.engineDecision?.status ??
    "unknown";
  const mirror = buildDecisionMirror({
    events: session.events,
    engineFinalStatus: finalStatus,
    staleEvidenceIds: ["ev-hcc-toilet-stale"],
    eligibleRouteIds: ["route-main-lift", "route-western-lift", session.selectedRouteId ?? ""],
  });

  const teachOk =
    (session.teachBackText?.toLowerCase().includes("entrance b") ?? false) &&
    (session.teachBackText?.toLowerCase().includes("west") ?? false);

  const rubric = {
    criteria: [
      {
        criterionId: "requirement_recognition",
        status: (session.selectedEntranceId === "n-hcc-b"
          ? "met"
          : "not_met") as "met" | "partially_met" | "not_met",
        explanation: "Entrance A is ineligible for step-free requirements.",
        nextPracticeSuggestion: "Re-check entrance step evidence before predicting.",
      },
      {
        criterionId: "evidence_reasoning",
        status: (session.inspectedEvidenceIds.length >= 3
          ? "met"
          : "partially_met") as "met" | "partially_met" | "not_met",
        explanation: `Inspected ${session.inspectedEvidenceIds.length} evidence items.`,
        nextPracticeSuggestion: "Open door width and toilet freshness evidence.",
      },
      {
        criterionId: "uncertainty_handling",
        status: (session.identifiedUnknowns.length > 0
          ? "met"
          : "partially_met") as "met" | "partially_met" | "not_met",
        explanation: "Unknown toilet ops and reception assistance must stay explicit.",
        nextPracticeSuggestion: "List unknowns before contacting the venue.",
      },
      {
        criterionId: "route_contingency",
        status: (session.mainLiftOutageIntroduced &&
        (session.selectedRouteId?.includes("west") ?? false)
          ? "met"
          : "partially_met") as "met" | "partially_met" | "not_met",
        explanation: "Western lift is the contingency after main-lift outage.",
        nextPracticeSuggestion: "Always identify an alternate vertical route.",
      },
      {
        criterionId: "rights_privacy",
        status: "met" as const,
        explanation: "Teach-back should avoid unnecessary diagnosis disclosure.",
        nextPracticeSuggestion: "Share requirements, not medical labels.",
      },
      {
        criterionId: "teach_back",
        status: (teachOk ? "met" : "partially_met") as
          | "met"
          | "partially_met"
          | "not_met",
        explanation: teachOk
          ? "Teach-back mentioned Entrance B and western route."
          : "Teach-back incomplete — include Entrance B, western lift, toilet location, and unknowns.",
        nextPracticeSuggestion: "Practice explaining the plan to Taylor in plain language.",
      },
    ],
    overallLevel: (teachOk && session.selectedEntranceId === "n-hcc-b"
      ? "independent"
      : "developing") as
      | "introduced"
      | "developing"
      | "independent"
      | "can_explain_to_others",
    strengths: mirror.narratableFindings.slice(0, 2),
    nextFocus: ["Temporal evening access", "Consent-minimised venue questions"],
  };

  session.stage = "complete";
  return { session, eveningDecision, mirror, rubric };
}

export function resetFlightSimForTests(): void {
  sessions.clear();
}
