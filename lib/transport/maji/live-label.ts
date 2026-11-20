export function liveTrafficUsedForAdvice(params: {
  liveTrafficUsed: boolean;
  validUntil?: Date | string | null;
  now?: Date;
}): boolean {
  if (!params.liveTrafficUsed) return false;
  if (!params.validUntil) return true;
  const until =
    params.validUntil instanceof Date
      ? params.validUntil
      : new Date(params.validUntil);
  if (Number.isNaN(until.getTime())) return false;
  return until.getTime() > (params.now ?? new Date()).getTime();
}
