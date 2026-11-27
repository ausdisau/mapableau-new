import type { SpiderProviderRecord } from "@/lib/support-intelligence/spider/types";

export type DedupeKey = string;

/** Stable identity for duplicate detection across directory pages. */
export function providerDedupeKey(record: SpiderProviderRecord): DedupeKey {
  if (record.abn) {
    const suburb = (record.suburb ?? "").trim().toLowerCase();
    const postcode = (record.postcode ?? "").trim();
    return `abn:${record.abn}:${suburb}:${postcode}`;
  }
  return `id:${record.sourceId}`;
}

/**
 * Keeps first occurrence; later duplicates are dropped with reasons.
 * Demo / incomplete rows are excluded from the keep set.
 */
export function dedupeSpiderRecords(records: SpiderProviderRecord[]): {
  kept: SpiderProviderRecord[];
  duplicates: Array<{ record: SpiderProviderRecord; of: DedupeKey }>;
  excluded: Array<{ record: SpiderProviderRecord; reason: string }>;
} {
  const seen = new Map<DedupeKey, SpiderProviderRecord>();
  const duplicates: Array<{ record: SpiderProviderRecord; of: DedupeKey }> = [];
  const excluded: Array<{ record: SpiderProviderRecord; reason: string }> = [];

  for (const record of records) {
    if (record.isDemo) {
      excluded.push({ record, reason: "demo_or_synthetic" });
      continue;
    }
    if (!record.sourceId || !record.providerName.trim()) {
      excluded.push({ record, reason: "incomplete" });
      continue;
    }
    const key = providerDedupeKey(record);
    if (seen.has(key)) {
      duplicates.push({ record, of: key });
      continue;
    }
    seen.set(key, record);
  }

  return {
    kept: [...seen.values()],
    duplicates,
    excluded,
  };
}
