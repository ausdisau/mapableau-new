/** Approximate suburb centroids for distance when outlet has no lat/lng. */
export const SUBURB_COORDINATES: Record<string, [number, number]> = {
  "Parramatta NSW": [-33.8148, 151.0033],
  "Footscray VIC": [-37.8, 144.9],
  "Morphett Vale SA": [-35.1167, 138.5167],
  "Bayswater WA": [-31.9167, 115.9167],
  "Chermside QLD": [-27.3833, 153.0333],
  "Civic ACT": [-35.2833, 149.1333],
  "Hobart TAS": [-42.8833, 147.3167],
  "Darwin City NT": [-12.4634, 130.8456],
  "Mildura VIC": [-34.1833, 142.15],
  "Newcastle NSW": [-32.9283, 151.7817],
  "Geelong VIC": [-38.15, 144.35],
  "Sydney NSW": [-33.8688, 151.2093],
};

export function suburbCentroid(
  suburb: string,
  state: string,
): [number, number] | null {
  const key = `${suburb} ${state}`.trim();
  return SUBURB_COORDINATES[key] ?? null;
}
