export function buildStaleWarning(assetId: string, stale: boolean): string[] {
  return stale ? [`status_stale:${assetId}`] : [];
}

export function guaranteesSafeRoute(): false {
  return false;
}
