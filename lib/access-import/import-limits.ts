/** Shared limits for admin KML/GeoJSON imports. */
export const MAX_IMPORT_BYTES = 5_000_000;
export const MAX_IMPORT_ITEMS = 2_000;

/** Elevated limits for CLI-only bulk seed (MapAble My Maps KML). */
export const SEED_MAX_IMPORT_BYTES = 20_000_000;
export const SEED_MAX_IMPORT_ITEMS = 10_000;
export const SEED_BATCH_SIZE = 500;

/** Skip bulk seed when this many places already exist (unless --force). */
export const SEED_EXISTING_PLACE_THRESHOLD = 100;

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
