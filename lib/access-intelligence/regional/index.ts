/**
 * System 7 — Regional thin-market / hub-and-spoke control tower.
 * Aggregates only — small-cell suppression, no participant ranking.
 */

import { accessIntelligenceFlags } from "@/lib/access-intelligence/feature-flags";

export type ThinMarketGapCode =
  | "no_provider"
  | "no_capacity"
  | "transport_unavailable"
  | "accessible_vehicle_unavailable"
  | "venue_access_blocked"
  | "venue_access_unknown"
  | "support_worker_timing_conflict"
  | "outside_feasible_journey_time"
  | "evidence_too_stale"
  | "no_combined_care_transport"
  | "no_support_in_time_window";

export type AggregateCell = {
  key: string;
  count: number;
  gapCodes: ThinMarketGapCode[];
};

export const DEFAULT_SMALL_CELL_THRESHOLD = 5;

export function suppressSmallCells<T extends { count: number }>(
  cells: T[],
  threshold = DEFAULT_SMALL_CELL_THRESHOLD,
): { visible: T[]; suppressedKeys: number } {
  const visible = cells.filter((c) => c.count >= threshold);
  return {
    visible,
    suppressedKeys: cells.length - visible.length,
  };
}

export function buildThinMarketSignals(input: {
  hubId: string;
  cells: AggregateCell[];
}): Array<{
  hubId: string;
  signalType: ThinMarketGapCode;
  severity: "low" | "medium" | "high";
  summary: string;
  metrics: Record<string, unknown>;
}> {
  const { visible, suppressedKeys } = suppressSmallCells(input.cells);
  const byCode = new Map<ThinMarketGapCode, number>();
  for (const cell of visible) {
    for (const code of cell.gapCodes) {
      byCode.set(code, (byCode.get(code) ?? 0) + cell.count);
    }
  }

  return [...byCode.entries()].map(([signalType, count]) => ({
    hubId: input.hubId,
    signalType,
    severity: count >= 20 ? "high" : count >= 10 ? "medium" : "low",
    summary: `Aggregated ${signalType.replace(/_/g, " ")} signal (n=${count}). Demand signal ≠ verified unmet need.`,
    metrics: { count, suppressedKeys },
  }));
}

export function assertNoParticipantRanking(payload: Record<string, unknown>): void {
  const banned = ["worthiness", "participantRank", "disabilityScore", "riskScore"];
  for (const key of banned) {
    if (key in payload) {
      throw new Error(`Regional payloads must not include ${key}.`);
    }
  }
}

export function assertRegionalControlTowerEnabled(): void {
  if (!accessIntelligenceFlags.regionalControlTower) {
    throw new Error("Regional control tower disabled.");
  }
}

export type PilotReadinessInput = {
  hubId: string;
  evidenceCoveragePct: number;
  journeyAssemblySuccessPct: number;
  smallCellSuppressionOk: boolean;
  liveAdaptersOffByDefault: boolean;
  regressionPackPresent: boolean;
};

export function evaluateRegionalPilotReadiness(input: PilotReadinessInput): {
  hubId: string;
  ready: boolean;
  score: number;
  blockers: string[];
} {
  const blockers: string[] = [];
  if (input.evidenceCoveragePct < 60) {
    blockers.push("Evidence coverage below 60%.");
  }
  if (input.journeyAssemblySuccessPct < 50) {
    blockers.push("Journey assembly success below 50%.");
  }
  if (!input.smallCellSuppressionOk) {
    blockers.push("Small-cell suppression not verified.");
  }
  if (!input.liveAdaptersOffByDefault) {
    blockers.push("Live adapters must default off for pilot.");
  }
  if (!input.regressionPackPresent) {
    blockers.push("Release regression evidence pack missing.");
  }
  const score = Math.round(
    (Math.min(100, input.evidenceCoveragePct) * 0.35 +
      Math.min(100, input.journeyAssemblySuccessPct) * 0.35 +
      (input.smallCellSuppressionOk ? 10 : 0) +
      (input.liveAdaptersOffByDefault ? 10 : 0) +
      (input.regressionPackPresent ? 10 : 0)),
  );
  return {
    hubId: input.hubId,
    ready: blockers.length === 0,
    score,
    blockers,
  };
}
