/**
 * Privacy threshold helpers for community graph aggregation.
 */

export const MIN_AGGREGATION_CELL_SIZE = 5;
export const MIN_UNIQUE_PLACES_FOR_PUBLICATION = 3;

export function meetsPrivacyThreshold(input: {
  cellObservationCount: number;
  uniquePlaceCount: number;
}): boolean {
  return (
    input.cellObservationCount >= MIN_AGGREGATION_CELL_SIZE &&
    input.uniquePlaceCount >= MIN_UNIQUE_PLACES_FOR_PUBLICATION
  );
}

export function redactBelowThreshold<T>(
  value: T,
  input: {
    cellObservationCount: number;
    uniquePlaceCount: number;
  },
): T | null {
  if (meetsPrivacyThreshold(input)) return value;
  return null;
}
