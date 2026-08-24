import type { SyntheticMission } from "./types";

export const SYNTHETIC_MISSIONS: readonly SyntheticMission[] = [
  { id: "mission-syn-care-transport", personaId: "persona-syn-physical-metro", kind: "care_and_transport", objective: "Arrange support worker attendance and accessible transport to my workplace support session", domains: ["core", "care", "transport"], requestedUseOfAccessibilityProfile: true, profileConsentGranted: true },
  { id: "mission-syn-employment", personaId: "persona-syn-aac", kind: "employment", objective: "Help me prepare for a job interview and keep disability disclosure under my control", domains: ["core", "jobs"], requestedUseOfAccessibilityProfile: false, profileConsentGranted: false },
  { id: "mission-syn-access-barrier", personaId: "persona-syn-multiple", kind: "access_barrier", objective: "Find an accessible community venue with bathroom access and captioned materials", domains: ["core", "access"], requestedUseOfAccessibilityProfile: true, profileConsentGranted: true },
  { id: "mission-syn-service-outage", personaId: "persona-syn-sensory-regional", kind: "service_outage", objective: "My booked support may be cancelled — show alternatives I can choose without auto-booking", domains: ["core", "care"] },
  { id: "mission-syn-conflicting-evidence", personaId: "persona-syn-physical-metro", kind: "conflicting_evidence", objective: "Building lift reports disagree — keep conflict visible and do not invent certainty", domains: ["core", "access"] },
  { id: "mission-syn-delegate-boundary", personaId: "persona-syn-multiple", kind: "delegate_boundary", objective: "Ask my support coordinator to request human coordination within their allowed boundary", domains: ["core", "care"] },
  { id: "mission-syn-remote", personaId: "persona-syn-cognitive-remote", kind: "regional_remote", objective: "Book remote community support with short stepwise next actions and extra time", domains: ["core", "care", "transport"] },
  { id: "mission-syn-continuity", personaId: "persona-syn-psychosocial", kind: "continuity_recovery", objective: "Support worker cancelled — offer recovery options I can accept or reject on my own terms", domains: ["core", "care"] },
] as const;

export function getSyntheticMission(id: string): SyntheticMission {
  const mission = SYNTHETIC_MISSIONS.find((m) => m.id === id);
  if (!mission) throw new Error(`UNKNOWN_SYNTHETIC_MISSION:${id}`);
  return mission;
}
