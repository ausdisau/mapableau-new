export type WitnessEvent = {
  id: string;
  missionId: string;
  type: string;
  summary: string;
  correlationId: string;
  createdAt: string;
  /** Redacted payload — never full Passport. */
  payload: Record<string, unknown>;
};

const events: WitnessEvent[] = [];

export function resetWitnessStore(): void {
  events.length = 0;
}

export function appendWitness(input: {
  missionId: string;
  type: string;
  summary: string;
  correlationId: string;
  payload?: Record<string, unknown>;
}): WitnessEvent {
  const event: WitnessEvent = {
    id: `wit-${events.length + 1}-${Date.now()}`,
    missionId: input.missionId,
    type: input.type,
    summary: input.summary,
    correlationId: input.correlationId,
    createdAt: new Date().toISOString(),
    payload: redactPayload(input.payload ?? {}),
  };
  events.push(event);
  return event;
}

export function listWitness(missionId: string): WitnessEvent[] {
  return events.filter((e) => e.missionId === missionId);
}

function redactPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (/passport|diagnosis|health|password|token/i.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    out[k] = v;
  }
  return out;
}
