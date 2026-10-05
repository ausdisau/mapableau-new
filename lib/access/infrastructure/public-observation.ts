export function toPublicAccessObservation<
  T extends { observerUserId?: string | null },
>(observation: T): Omit<T, "observerUserId"> {
  const { observerUserId: _observerUserId, ...publicObservation } = observation;
  return publicObservation;
}
