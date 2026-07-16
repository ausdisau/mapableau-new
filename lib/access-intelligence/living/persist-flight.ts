import { getLivingPersistence } from "@/lib/access-intelligence/persistence";
import type { LearningSessionRecord } from "@/lib/access-intelligence/persistence";

import type { FlightSimSession } from "./flight-simulator";

/**
 * Persist flight-sim sessions + Decision Mirror traces via LivingPersistence.
 * Best-effort: in-memory sessions remain authoritative for the request path.
 */
export async function persistFlightSimSession(
  session: FlightSimSession,
): Promise<LearningSessionRecord | null> {
  try {
    const persistence = getLivingPersistence();
    return await persistence.saveLearningSession({
      id: session.id,
      userId: session.userId,
      scenarioId: "interview-level-3",
      stage: session.stage,
      snapshot: {
        prediction: session.prediction,
        inspectedEvidenceIds: session.inspectedEvidenceIds,
        selectedEntranceId: session.selectedEntranceId,
        selectedRouteId: session.selectedRouteId,
        identifiedBlockers: session.identifiedBlockers,
        identifiedUnknowns: session.identifiedUnknowns,
        venueQuestion: session.venueQuestion,
        contingency: session.contingency,
        hintLevel: session.hintLevel,
        mainLiftOutageIntroduced: session.mainLiftOutageIntroduced,
        engineDecisionStatus: session.engineDecision?.status,
        revisedDecisionStatus: session.revisedDecision?.status,
      },
      events: session.events,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    return null;
  }
}
