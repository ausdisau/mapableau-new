/**
 * Round-robin fairness across tenants for a bounded worker pool. Callers pass
 * a snapshot of "pending work per tenant" and the maximum concurrent slots.
 * Never oversubscribes; always leaves at least one slot for a fresh tenant
 * with pending work if room remains.
 */

export interface QueueSnapshotEntry {
  organisationId: string;
  pending: number;
}

export interface FairShare {
  organisationId: string;
  slots: number;
}

export function computeFairShare(
  snapshot: QueueSnapshotEntry[],
  totalSlots: number
): FairShare[] {
  const active = snapshot.filter((s) => s.pending > 0);
  if (active.length === 0 || totalSlots <= 0) return [];
  const base = Math.floor(totalSlots / active.length);
  let remainder = totalSlots - base * active.length;
  return active.map((s) => {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    return {
      organisationId: s.organisationId,
      slots: Math.min(s.pending, base + extra),
    };
  });
}
