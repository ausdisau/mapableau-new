import type { OptionsSession } from "./types";
const sessions = new Map<string, OptionsSession>();
export function saveOptionsSession(session: OptionsSession): OptionsSession { sessions.set(session.sessionId, session); return session; }
export function getOptionsSession(sessionId: string): OptionsSession | null { return sessions.get(sessionId) ?? null; }
export function updateOptionsSession(sessionId: string, patch: Partial<OptionsSession>): OptionsSession | null {
  const existing = sessions.get(sessionId); if (!existing) return null;
  const next = { ...existing, ...patch, sessionId: existing.sessionId }; sessions.set(sessionId, next); return next;
}
export function clearOptionsStore(): void { sessions.clear(); }
export function listOptionsSessionsForParticipant(participantId: string, tenantId: string): OptionsSession[] {
  return [...sessions.values()].filter((s) => s.participantId === participantId && s.tenantId === tenantId);
}
