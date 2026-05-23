export type RoutePoint = { lat: number; lng: number; label?: string };

export type AccessibleRoutePlan = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: unknown;
  warnings: string[];
  confidence: "low" | "medium" | "high";
  provider: string;
};

export async function planAccessibleRoute(input: {
  origin: RoutePoint;
  destination: RoutePoint;
  wheelchairPreferred?: boolean;
}): Promise<AccessibleRoutePlan> {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        "https://api.openrouteservice.org/v2/directions/wheelchair",
        {
          method: "POST",
          headers: {
            Authorization: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coordinates: [
              [input.origin.lng, input.origin.lat],
              [input.destination.lng, input.destination.lat],
            ],
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const summary = data?.routes?.[0]?.summary;
        return {
          distanceMeters: summary?.distance ?? 0,
          durationSeconds: summary?.duration ?? 0,
          geometry: data?.routes?.[0]?.geometry,
          warnings: [
            "Route accessibility is estimated. MapAble does not guarantee step-free access unless verified.",
          ],
          confidence: "medium",
          provider: "openrouteservice",
        };
      }
    } catch {
      /* fall through to mock */
    }
  }

  return {
    distanceMeters: 5000,
    durationSeconds: 1200,
    geometry: null,
    warnings: [
      "Using demo routing. Set OPENROUTESERVICE_API_KEY for live routes.",
      "Always confirm kerb ramps and gradients on the ground.",
    ],
    confidence: "low",
    provider: "mock",
  };
}
