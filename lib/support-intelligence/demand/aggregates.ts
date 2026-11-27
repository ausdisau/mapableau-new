import { auditSupportIntelligence } from "@/lib/support-intelligence/audit";
import {
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import type { SupportIntelligenceDenied } from "@/lib/support-intelligence/types";

export type DemandRegionCell = {
  regionKey: string;
  state: string;
  serviceSlug: string;
  unmetNeedCount: number | null;
  suppressed: boolean;
  suppressionReason?: string;
};

export type DemandIntelResult =
  | {
      ok: true;
      cells: DemandRegionCell[];
      kAnonymityThreshold: number;
      note: string;
    }
  | SupportIntelligenceDenied;

const DEFAULT_K = 5;

/**
 * Privacy-preserving aggregate service-gap analytics.
 * Small cells are suppressed; no participant rows are returned.
 */
export function aggregateSupportDemand(input: {
  rows: Array<{
    state: string;
    regionKey: string;
    serviceSlug: string;
    /** Pre-aggregated count — never raw participant IDs. */
    count: number;
  }>;
  kAnonymityThreshold?: number;
  actorUserId?: string | null;
}): DemandIntelResult {
  if (!isCapabilityEnabled("demand")) {
    return {
      ok: false,
      reasonCode: supportIntelligenceFlags.killSwitch
        ? "kill_switch"
        : "capability_disabled",
      message: "Support Demand Intelligence is disabled (fail-closed).",
    };
  }

  const k = input.kAnonymityThreshold ?? DEFAULT_K;
  const merged = new Map<string, DemandRegionCell>();

  for (const row of input.rows) {
    const key = `${row.state}|${row.regionKey}|${row.serviceSlug}`;
    const existing = merged.get(key);
    const nextCount = (existing?.unmetNeedCount ?? 0) + row.count;
    merged.set(key, {
      regionKey: row.regionKey,
      state: row.state,
      serviceSlug: row.serviceSlug,
      unmetNeedCount: nextCount,
      suppressed: false,
    });
  }

  const cells: DemandRegionCell[] = [...merged.values()].map((cell) => {
    if ((cell.unmetNeedCount ?? 0) < k) {
      return {
        ...cell,
        unmetNeedCount: null,
        suppressed: true,
        suppressionReason: `count_below_k_${k}`,
      };
    }
    return cell;
  });

  void auditSupportIntelligence({
    action: "support_intel.demand.query",
    actorUserId: input.actorUserId,
    entityType: "SupportDemandAggregate",
    metadata: {
      cellCount: cells.length,
      suppressed: cells.filter((c) => c.suppressed).length,
      k,
    },
  });

  return {
    ok: true,
    cells,
    kAnonymityThreshold: k,
    note:
      "Aggregate unmet-need estimates only. Not a funding forecast or eligibility determination.",
  };
}

/** Fixture rows for evaluation / acceptance tests. */
export const SYNTHETIC_DEMAND_ROWS = [
  {
    state: "NSW",
    regionKey: "sydney-inner",
    serviceSlug: "daily-personal-activities",
    count: 12,
  },
  {
    state: "NSW",
    regionKey: "sydney-inner",
    serviceSlug: "support-coordination",
    count: 3,
  },
  {
    state: "VIC",
    regionKey: "melbourne-inner",
    serviceSlug: "community-participation",
    count: 8,
  },
];
