import { makeSydneyDemoTrip } from "@/lib/tourism/planner";
import { isTourismTrip, migrateTourismTrip } from "@/lib/tourism/trip-ops";
import {
  TOURISM_PREFS_STORAGE_KEY,
  TOURISM_TRIP_STORAGE_KEY,
  type TourismPlannerInput,
  type TourismTrip,
} from "@/lib/tourism/types";

export function readTourismTrip(): TourismTrip {
  if (typeof window === "undefined") return makeSydneyDemoTrip();
  try {
    const saved = window.localStorage.getItem(TOURISM_TRIP_STORAGE_KEY);
    if (!saved) return makeSydneyDemoTrip();
    const migrated = migrateTourismTrip(JSON.parse(saved));
    return migrated ?? makeSydneyDemoTrip();
  } catch {
    return makeSydneyDemoTrip();
  }
}

export function writeTourismTrip(trip: TourismTrip): void {
  if (typeof window === "undefined") return;
  if (!isTourismTrip(trip)) return;
  try {
    window.localStorage.setItem(TOURISM_TRIP_STORAGE_KEY, JSON.stringify(trip));
  } catch {
    /* The itinerary remains editable for this session. */
  }
}

export function readPlannerPrefs(): TourismPlannerInput | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(TOURISM_PREFS_STORAGE_KEY);
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as TourismPlannerInput;
  } catch {
    return null;
  }
}

export function writePlannerPrefs(prefs: TourismPlannerInput): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOURISM_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* Preferences remain in memory for this session. */
  }
}

export function resetTourismPrototypeStorage(): TourismTrip {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(TOURISM_TRIP_STORAGE_KEY);
      window.localStorage.removeItem(TOURISM_PREFS_STORAGE_KEY);
    } catch {
      /* Ignore storage failures. */
    }
  }
  const trip = makeSydneyDemoTrip();
  writeTourismTrip(trip);
  return trip;
}
