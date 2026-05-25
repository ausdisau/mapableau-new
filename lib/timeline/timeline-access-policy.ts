import type { CurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

const SENSITIVE_TYPES = new Set(["incident_reported"]);

export function canViewParticipantTimeline(
  user: CurrentUser,
  participantId: string
): boolean {
  if (user.id === participantId) return true;
  if (isAdminRole(user.primaryRole)) return true;
  if (hasPermission(user.primaryRole, "timeline:read")) return true;
  return false;
}

export function redactTimelineEvent<T extends {
  eventType: string;
  title: string;
  summary: string | null;
  redacted: boolean;
}>(
  event: T,
  viewerIsParticipant: boolean
): T {
  if (viewerIsParticipant || !SENSITIVE_TYPES.has(event.eventType)) {
    return event;
  }
  if (event.redacted) {
    return {
      ...event,
      title: "Restricted event",
      summary: "Details available only with appropriate consent.",
    };
  }
  if (SENSITIVE_TYPES.has(event.eventType)) {
    return {
      ...event,
      title: "Safety-related activity",
      summary: "Summary only — full details are restricted.",
      redacted: true,
    };
  }
  return event;
}
