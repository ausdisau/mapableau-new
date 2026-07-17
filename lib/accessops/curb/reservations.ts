export function canReserveCurbZone(input: {
  lprRequired?: boolean;
  autoInfringement?: boolean;
}): boolean {
  return !input.lprRequired && !input.autoInfringement;
}
