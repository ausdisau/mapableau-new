export type TemporalConstraint = {
  nodeId: string; label: string; deadlineIso: string | null; bufferMinutes: number; leadTimeMinutes: number;
  approvalExpiresAt: string | null; status: "feasible"|"tight"|"impossible"|"unknown"; explanation: string;
};
const DEFAULT_BUFFER_MINUTES = 30; const DEFAULT_LEAD_TIME_MINUTES = 60;

export function parseDeadlineFromPayload(payload: Record<string, unknown>): string | null {
  if (typeof payload.deadlineIso === "string") return payload.deadlineIso;
  if (typeof payload.eventTime === "string") return payload.eventTime;
  if (typeof payload.scheduledAt === "string") return payload.scheduledAt;
  return null;
}

export function computeTemporalConstraint(input: {
  nodeId: string; label: string; deadlineIso: string | null; bufferMinutes?: number; leadTimeMinutes?: number;
  approvalExpiresAt?: string | null; referenceTime?: Date;
}): TemporalConstraint {
  const now = input.referenceTime ?? new Date();
  const buffer = input.bufferMinutes ?? DEFAULT_BUFFER_MINUTES;
  const leadTime = input.leadTimeMinutes ?? DEFAULT_LEAD_TIME_MINUTES;
  if (!input.deadlineIso) {
    return { nodeId: input.nodeId, label: input.label, deadlineIso: null, bufferMinutes: buffer, leadTimeMinutes: leadTime,
      approvalExpiresAt: input.approvalExpiresAt ?? null, status: "unknown", explanation: "No deadline specified for this dependency." };
  }
  const deadline = new Date(input.deadlineIso);
  const requiredBy = deadline.getTime() - (buffer + leadTime) * 60_000;
  const msRemaining = requiredBy - now.getTime();
  if (msRemaining < 0) {
    return { nodeId: input.nodeId, label: input.label, deadlineIso: input.deadlineIso, bufferMinutes: buffer, leadTimeMinutes: leadTime,
      approvalExpiresAt: input.approvalExpiresAt ?? null, status: "impossible",
      explanation: `Insufficient time before deadline (${input.label}). Need ${leadTime + buffer} minutes lead time.` };
  }
  const status = msRemaining < 2 * 60 * 60 * 1000 ? "tight" : "feasible";
  let explanation = status === "tight" ? `Timeline is tight — less than 2 hours of buffer before ${input.label}.` : `Timeline appears feasible for ${input.label}.`;
  if (input.approvalExpiresAt && new Date(input.approvalExpiresAt).getTime() < deadline.getTime()) {
    explanation += " Approval expires before the deadline.";
  }
  return { nodeId: input.nodeId, label: input.label, deadlineIso: input.deadlineIso, bufferMinutes: buffer, leadTimeMinutes: leadTime,
    approvalExpiresAt: input.approvalExpiresAt ?? null, status, explanation };
}

export function isDeadlineImpossible(constraints: TemporalConstraint[]): boolean {
  return constraints.some(c => c.status === "impossible");
}
export function earliestDeadline(constraints: TemporalConstraint[]): string | null {
  const withDeadline = constraints.filter(c => c.deadlineIso);
  if (!withDeadline.length) return null;
  return withDeadline.reduce((a, c) => new Date(c.deadlineIso!).getTime() < new Date(a.deadlineIso!).getTime() ? c : a).deadlineIso;
}
export function approvalExpired(expiresAt: string | null, referenceTime?: Date): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < (referenceTime ?? new Date()).getTime();
}
export function minutesUntilDeadline(deadlineIso: string, referenceTime?: Date): number {
  return Math.floor((new Date(deadlineIso).getTime() - (referenceTime ?? new Date()).getTime()) / 60_000);
}
