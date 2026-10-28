export function toPublicAccessObservation<
  T extends {
    observerUserId?: string | null;
    entityId?: string | null;
    entityType?: string | null;
  },
>(observation: T): Omit<T, "observerUserId" | "entityId" | "entityType"> {
  const {
    observerUserId: _observerUserId,
    entityId: _entityId,
    entityType: _entityType,
    ...publicObservation
  } = observation;
  return publicObservation;
}
