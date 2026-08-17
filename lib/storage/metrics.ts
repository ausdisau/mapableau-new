/**
 * Process-local storage counters. Not multi-instance safe.
 * Labels must never include filenames or participant identifiers.
 */

export type StorageMetricName =
  | "uploads_requested"
  | "uploads_completed"
  | "uploads_failed"
  | "bytes_uploaded"
  | "provider_errors"
  | "signed_reads"
  | "evidence_attached"
  | "orphaned_uploads"
  | "deletes_failed";

type MetricKey = string;

const counters = new Map<MetricKey, number>();

function key(
  name: StorageMetricName,
  labels: { purpose?: string; provider?: string; errorClass?: string },
): MetricKey {
  return [
    name,
    labels.purpose ?? "",
    labels.provider ?? "",
    labels.errorClass ?? "",
  ].join("|");
}

export function incrementStorageMetric(
  name: StorageMetricName,
  labels: { purpose?: string; provider?: string; errorClass?: string } = {},
  amount = 1,
): void {
  const k = key(name, labels);
  counters.set(k, (counters.get(k) ?? 0) + amount);
}

export function getStorageMetrics(): Array<{
  name: string;
  value: number;
  purpose?: string;
  provider?: string;
  errorClass?: string;
}> {
  const rows: Array<{
    name: string;
    value: number;
    purpose?: string;
    provider?: string;
    errorClass?: string;
  }> = [];
  for (const [k, value] of counters.entries()) {
    const [name, purpose, provider, errorClass] = k.split("|");
    rows.push({
      name,
      value,
      purpose: purpose || undefined,
      provider: provider || undefined,
      errorClass: errorClass || undefined,
    });
  }
  return rows;
}

export function resetStorageMetrics(): void {
  counters.clear();
}
