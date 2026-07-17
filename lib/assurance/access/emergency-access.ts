export type EmergencyAccessRequest = {
  requesterId: string;
  justification: string;
  expiresAt: Date;
};

export type EmergencyAccessDecision = {
  granted: boolean;
  reason: string;
};

export function evaluateEmergencyAccess(
  request: EmergencyAccessRequest,
  now = new Date()
): EmergencyAccessDecision {
  if (!request.justification.trim()) {
    return { granted: false, reason: "justification_required" };
  }
  if (request.expiresAt.getTime() <= now.getTime()) {
    return { granted: false, reason: "expiry_in_past" };
  }
  const maxMs = 8 * 60 * 60 * 1000;
  if (request.expiresAt.getTime() - now.getTime() > maxMs) {
    return { granted: false, reason: "expiry_exceeds_8_hours" };
  }
  return {
    granted: false,
    reason: "emergency_access_requires_human_approval_out_of_band",
  };
}
