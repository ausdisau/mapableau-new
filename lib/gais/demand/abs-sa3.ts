import type { GaisDemandBounds } from "@/lib/gais/demand/contracts";

export function buildAbsSa3QueryUrl(
  bounds: GaisDemandBounds,
  baseUrl: string,
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("where", "1=1");
  url.searchParams.set("outFields", "*");
  url.searchParams.set(
    "geometry",
    `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`,
  );
  url.searchParams.set("geometryType", "esriGeometryEnvelope");
  url.searchParams.set("inSR", "4326");
  url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  url.searchParams.set("returnGeometry", "true");
  url.searchParams.set("outSR", "4326");
  url.searchParams.set("f", "geojson");
  return url.toString();
}

export function extractSa3Code(
  properties: Record<string, unknown> | null | undefined,
): string | null {
  if (!properties) return null;
  const value =
    properties.SA3_CODE_2016 ??
    properties.sa3_code_2016 ??
    properties.SA3_CODE16 ??
    properties.sa3_code16;
  return value == null ? null : String(value);
}
