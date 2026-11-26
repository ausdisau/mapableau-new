import { passengerLocalKey } from "./passenger-local-key";
import {
  PRACTICE_TRIPS_KEY,
  restoreTrips,
  type PracticeTrip,
} from "./passenger-practice";

const encoder = new TextEncoder();
function toBase64(bytes: Uint8Array) {
  let value = "";
  for (const byte of bytes) value += String.fromCharCode(byte);
  return btoa(value);
}
function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
export async function sealPracticeValue(
  scope: string,
  value: string,
): Promise<string> {
  const key = await passengerLocalKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: encoder.encode(scope) },
    key,
    encoder.encode(value),
  );
  return ["v1", toBase64(iv), toBase64(new Uint8Array(encrypted))].join(".");
}
export async function unsealPracticeValue(
  scope: string,
  value: string,
): Promise<string> {
  const [version, iv, data, extra] = value.split(".");
  if (version !== "v1" || !iv || !data || extra !== undefined)
    throw new Error("Unrecognised practice record");
  const plain = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: fromBase64(iv),
      additionalData: encoder.encode(scope),
    },
    await passengerLocalKey(),
    fromBase64(data),
  );
  return new TextDecoder().decode(plain);
}

let previewFallback: PracticeTrip[] | null = null;
async function readTrips(): Promise<PracticeTrip[]> {
  const raw = localStorage.getItem(PRACTICE_TRIPS_KEY);
  if (!raw) return previewFallback ?? [];
  if (raw.startsWith("[")) {
    // Upgrade records created by the first preview, using only recognised fields.
    const trips = restoreTrips(raw);
    try {
      const sealed = await sealPracticeValue(
        PRACTICE_TRIPS_KEY,
        JSON.stringify(trips),
      );
      localStorage.setItem(PRACTICE_TRIPS_KEY, sealed);
      previewFallback = null;
    } catch {
      previewFallback = trips;
      localStorage.removeItem(PRACTICE_TRIPS_KEY);
    }
    return trips;
  }
  return restoreTrips(await unsealPracticeValue(PRACTICE_TRIPS_KEY, raw));
}

let lastOperation: Promise<unknown> = Promise.resolve();
async function withTripLock<T>(operation: () => Promise<T>): Promise<T> {
  if (navigator.locks)
    return await navigator.locks.request(PRACTICE_TRIPS_KEY, operation);
  const result = lastOperation.then(operation, operation);
  lastOperation = result.catch(() => {});
  return result;
}

export function readPracticeTrips() {
  return withTripLock(readTrips);
}

export function updatePracticeTrips(
  change: (current: PracticeTrip[]) => PracticeTrip[],
) {
  return withTripLock(async () => {
    const trips = change(await readTrips());
    const sealed = await sealPracticeValue(
      PRACTICE_TRIPS_KEY,
      JSON.stringify(trips),
    );
    localStorage.setItem(PRACTICE_TRIPS_KEY, sealed);
    previewFallback = null;
    return trips;
  });
}

export function clearPracticeTrips() {
  return withTripLock(async () => {
    previewFallback = null;
    localStorage.removeItem(PRACTICE_TRIPS_KEY);
  });
}
