/** Aggregated demand only. Do not feed individual participant requests into this function. */
export interface DemandBucket {
  region: string;
  service: string;
  requestedUnits: number;
}
export interface CapacityBucket {
  region: string;
  service: string;
  availableUnits: number | null;
  status: 'verified' | 'reported' | 'unknown';
}
export interface GapBucket {
  region: string;
  service: string;
  disclosure: 'visible' | 'suppressed';
  dataQuality: 'verified_supply' | 'unverified_or_missing_supply' | 'suppressed_small_cohort';
  requestedUnits: number | null;
  availableUnits: number | null;
  unmetUnits: number | null;
}

/** Privacy threshold is a conservative release check, not a privacy guarantee. */
export function analyseServiceGaps(input: {
  demands: readonly DemandBucket[];
  capacities: readonly CapacityBucket[];
  minimumAggregateCount?: number;
}): GapBucket[] {
  const threshold = input.minimumAggregateCount ?? 5;
  if (!Number.isInteger(threshold) || threshold < 2) throw new Error('minimumAggregateCount must be >= 2');
  const grouped = new Map<string, { region: string; service: string; demand: number }>();
  for (const d of input.demands) {
    if (!d.region || !d.service || !Number.isInteger(d.requestedUnits) || d.requestedUnits < 0) {
      throw new Error('Demand buckets require nonnegative integer counts and named region/service');
    }
    const key = JSON.stringify([d.region, d.service]);
    const old = grouped.get(key);
    const next = (old?.demand ?? 0) + d.requestedUnits;
    if (!Number.isSafeInteger(next)) throw new Error('Demand count overflow');
    grouped.set(key, { region: d.region, service: d.service, demand: next });
  }
  const capacity = new Map<string, CapacityBucket>();
  for (const c of input.capacities) {
    const key = JSON.stringify([c.region, c.service]);
    if (capacity.has(key)) throw new Error('Duplicate capacity key: aggregate upstream');
    if (c.availableUnits !== null && (!Number.isInteger(c.availableUnits) || c.availableUnits < 0)) {
      throw new Error('Capacity must be a nonnegative integer or null');
    }
    capacity.set(key, c);
  }
  return [...grouped.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([key, group]) => {
    if (group.demand < threshold) return { region: group.region, service: group.service,
      disclosure: 'suppressed' as const, dataQuality: 'suppressed_small_cohort' as const,
      requestedUnits: null, availableUnits: null, unmetUnits: null };
    const supply = capacity.get(key);
    if (!supply || supply.status !== 'verified' || supply.availableUnits === null) {
      return { region: group.region, service: group.service, disclosure: 'visible' as const,
        dataQuality: 'unverified_or_missing_supply' as const,
        requestedUnits: group.demand, availableUnits: null, unmetUnits: null };
    }
    return { region: group.region, service: group.service, disclosure: 'visible' as const,
      dataQuality: 'verified_supply' as const, requestedUnits: group.demand,
      availableUnits: supply.availableUnits, unmetUnits: Math.max(0, group.demand - supply.availableUnits) };
  });
}
