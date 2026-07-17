/**
 * Wave 11 — Emergency Service Boundary.
 *
 * AURA and every AURA specialist (including `service_recovery`) CANNOT call,
 * dispatch, or otherwise activate an emergency service (000 in Australia,
 * ambulance, police, fire, mental health crisis dispatch). If a plan step
 * would invoke an emergency-service action, the boundary throws and the
 * case must be handed off to a human safety officer.
 */

export const EMERGENCY_ACTION_SLUGS = new Set<string>([
  "emergency.dispatch",
  "emergency.contact_000",
  "emergency.call_ambulance",
  "emergency.call_police",
  "emergency.call_fire",
  "emergency.mental_health_crisis_dispatch",
  "emergency.after_hours_safety_line",
]);

export const EMERGENCY_KEYWORDS = ["000", "triple zero", "emergency services", "ambulance", "police", "fire brigade"];

export class EmergencyBoundaryError extends Error {
  code = "EMERGENCY_BOUNDARY";
  constructor(reason: string) {
    super(`AURA cannot invoke emergency services: ${reason}`);
  }
}

export function assertNotEmergencyAction(actionSlug: string): void {
  if (EMERGENCY_ACTION_SLUGS.has(actionSlug)) {
    throw new EmergencyBoundaryError(`prohibited_action:${actionSlug}`);
  }
}

export function containsEmergencyKeyword(narrative: string | null | undefined): boolean {
  if (!narrative) return false;
  const norm = narrative.toLowerCase();
  return EMERGENCY_KEYWORDS.some((k) => norm.includes(k));
}

export function assertNarrativeDoesNotClaimEmergencyAction(narrative: string | null | undefined): void {
  if (!narrative) return;
  const norm = narrative.toLowerCase();
  const claims =
    /\b(?:will|shall|going to)\s+(?:dial|call|contact|dispatch)\b.*\b(000|triple zero|emergency|ambulance|police|fire brigade)\b/i.test(
      norm
    );
  if (claims) {
    throw new EmergencyBoundaryError("plan_narrative_claims_emergency_action");
  }
}
