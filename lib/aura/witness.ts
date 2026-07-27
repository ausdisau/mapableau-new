/**
 * Minimal witness append for Wave 5 Memory/Calibration.
 * Not the full Agent OS witness chain — audit breadcrumb only.
 */

export type WitnessEvent = {
  missionId: string;
  type: string;
  summary: string;
  correlationId: string;
  actorType?: string;
  actorId?: string;
  payload?: unknown;
  at?: string;
};

const events: WitnessEvent[] = [];

export function appendWitness(event: Omit<WitnessEvent, "at"> & { at?: string }): void {
  events.push({ ...event, at: event.at ?? new Date().toISOString() });
}

export function listWitness(missionId?: string): WitnessEvent[] {
  if (!missionId) return [...events];
  return events.filter((e) => e.missionId === missionId);
}

export function resetWitnessStore(): void {
  events.length = 0;
}
