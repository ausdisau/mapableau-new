import type { Corridor } from "./journey";
export async function fetchPracticeEstimate(
  origin: string,
  corridor: Corridor,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6500);
  try {
    const r = await fetch(
      origin +
        "/api/transport/driver-practice/estimate?corridor=" +
        encodeURIComponent(corridor),
      { signal: controller.signal, credentials: "omit" },
    );
    if (!r.ok) throw new Error("unavailable");
    const v = await r.json();
    if (
      v?.source !== "Mapbox Directions" ||
      !Number.isFinite(v.distanceMetres) ||
      v.distanceMetres <= 0 ||
      !Number.isFinite(v.durationSeconds) ||
      v.durationSeconds <= 0 ||
      !Number.isFinite(Date.parse(v.generatedAt)) ||
      !Number.isFinite(Date.parse(v.validUntil)) ||
      Date.parse(v.validUntil) <= Date.now()
    )
      throw new Error("invalid");
    return {
      distanceMetres: Number(v.distanceMetres),
      durationSeconds: Number(v.durationSeconds),
      generatedAt: String(v.generatedAt),
      validUntil: String(v.validUntil),
    };
  } catch {
    throw new Error(
      "A fresh estimate is unavailable. The dated sample and route in words are available below.",
    );
  } finally {
    clearTimeout(timer);
  }
}
