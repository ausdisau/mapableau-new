export function sensorThingsObservationFresh(
  resultTime: Date,
  staleAfterSeconds: number,
  now: Date = new Date(),
): boolean {
  return resultTime.getTime() + staleAfterSeconds * 1000 >= now.getTime();
}
