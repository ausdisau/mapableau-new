export type SignalPoint = {
  signalType: string;
  severity: string;
  at: Date;
};

export function aggregateSignalsByType(
  signals: readonly SignalPoint[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of signals) {
    out[s.signalType] = (out[s.signalType] ?? 0) + 1;
  }
  return out;
}

export function countCritical(signals: readonly SignalPoint[]): number {
  return signals.filter((s) => s.severity === "critical").length;
}
