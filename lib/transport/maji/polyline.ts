import type { LatLng } from "@/types/transport-routing";

function encodeSigned(value: number): string {
  let n = value < 0 ? ~(value << 1) : value << 1;
  let out = "";
  while (n >= 0x20) {
    out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
    n >>= 5;
  }
  out += String.fromCharCode(n + 63);
  return out;
}

/** Google encoded polyline used by TfNSW Toll Calculator v2. */
export function encodeGooglePolyline(points: LatLng[]): string {
  let lat = 0;
  let lng = 0;
  let result = "";
  for (const point of points) {
    const latE5 = Math.round(point.lat * 1e5);
    const lngE5 = Math.round(point.lng * 1e5);
    result += encodeSigned(latE5 - lat);
    result += encodeSigned(lngE5 - lng);
    lat = latE5;
    lng = lngE5;
  }
  return result;
}
