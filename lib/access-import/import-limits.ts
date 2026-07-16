/** Shared limits for admin KML/GeoJSON imports. */
export const MAX_IMPORT_BYTES = 5_000_000;
export const MAX_IMPORT_ITEMS = 2_000;

/** Elevated limits for CLI-only bulk seed (MapAble My Maps KML). */
export const SEED_MAX_IMPORT_BYTES = 20_000_000;
export const SEED_MAX_IMPORT_ITEMS = 10_000;
export const SEED_BATCH_SIZE = 500;

/** Parallel workers for bulk seed (~400 places/min on typical Neon latency). */
export const SEED_CONCURRENCY = 40;

/** Log progress to stdout every N created/skipped items. */
export const SEED_PROGRESS_INTERVAL = 100;

/** Skip bulk seed when this many places already exist (unless --force). */
export const SEED_EXISTING_PLACE_THRESHOLD = 100;

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/** Run async work over items with a fixed concurrency pool. */
export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  const limit = Math.max(1, Math.min(concurrency, items.length));
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
}
