import { phase5Config } from "@/lib/config/phase5";

export interface SuppressedMetric {
  value: number | null;
  suppressed: boolean;
  note?: string;
}

export function suppressLowCount(count: number): SuppressedMetric {
  const threshold = phase5Config.smallCellSuppressionThreshold;
  if (count > 0 && count < threshold) {
    return {
      value: null,
      suppressed: true,
      note: `Suppressed: count below ${threshold} for privacy`,
    };
  }
  return { value: count, suppressed: false };
}

export function applyLowCountSuppressionToRecord(
  metrics: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(metrics)) {
    if (typeof val === "number") {
      result[key] = suppressLowCount(val);
    } else if (val && typeof val === "object" && "value" in val && typeof (val as { value: unknown }).value === "number") {
      const v = (val as { value: number }).value;
      result[key] = { ...(val as object), ...suppressLowCount(v) };
    } else {
      result[key] = val;
    }
  }
  return result;
}
