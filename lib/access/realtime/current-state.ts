/**
 * Current-state projection from sensor evidence — history preserved separately.
 */

import type { NormalizedObservation } from "@/lib/integrations/access/contracts";

export type SensorCurrentState = {
  datastreamKey: string;
  currentValue: NormalizedObservation["value"];
  observedAt: string | null;
  sourceProvider: string;
  /** Sensor ≠ verified truth */
  verifiedCapability: false;
  historyCount: number;
};

export function projectCurrentStateFromObservations(
  observations: NormalizedObservation[],
): SensorCurrentState[] {
  const byKey = new Map<string, NormalizedObservation[]>();
  for (const obs of observations) {
    const key = `${obs.featureType}:${obs.attribute}`;
    const list = byKey.get(key) ?? [];
    list.push(obs);
    byKey.set(key, list);
  }

  const states: SensorCurrentState[] = [];
  for (const [datastreamKey, history] of byKey) {
    const sorted = [...history].sort((a, b) => {
      const ta = a.observedAt ?? a.provenance.receivedAt;
      const tb = b.observedAt ?? b.provenance.receivedAt;
      return tb.localeCompare(ta);
    });
    const latest = sorted[0];
    states.push({
      datastreamKey,
      currentValue: latest.value,
      observedAt: latest.observedAt ?? latest.provenance.capturedAt ?? null,
      sourceProvider: latest.provenance.sourceProvider,
      verifiedCapability: false,
      historyCount: history.length,
    });
  }
  return states;
}
