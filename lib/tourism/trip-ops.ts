import { isOpenTripMapPlace, type OpenTripMapPlace } from "@/lib/tourism/open-trip-map";
import { getSydneyPlace, SYDNEY_TOURISM_PLACES } from "@/lib/tourism/sydney-dataset";
import {
  attractionIdsOnDay,
  evidenceToLegacy,
  tripStopId,
  type AccessEvidence,
  type TourismPlace,
  type TourismTrip,
  type TripDay,
  type TripStop,
} from "@/lib/tourism/types";

function unknownEvidence(summary: string, checkedOn: string): AccessEvidence {
  return {
    status: "unknown",
    summary,
    sourceName: "OpenTripMap (OpenStreetMap / Wikimedia sources)",
    sourceUrl: "https://dev.opentripmap.org/product",
    checkedOn,
    limitations: ["OpenTripMap list records are not access evidence."],
  };
}

export function getTourismPlace(id: string): TourismPlace | undefined {
  return getSydneyPlace(id);
}

export function getTourismPlaceInTrip(trip: TourismTrip, id: string): TourismPlace | undefined {
  return getTourismPlace(id) ?? trip.externalPlaces?.find((place) => place.id === id);
}

function isFiniteCoord(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isTripStop(value: unknown, validIds: Set<string>): value is TripStop {
  if (!value || typeof value !== "object") return false;
  const stop = value as Partial<TripStop> & { kind?: string };
  if (stop.kind === "attraction") {
    return (
      typeof stop.id === "string" &&
      typeof stop.placeId === "string" &&
      validIds.has(stop.placeId) &&
      stop.id === stop.placeId
    );
  }
  if (stop.kind === "rest") {
    return (
      typeof stop.id === "string" &&
      stop.id.startsWith("rest-") &&
      typeof stop.title === "string" &&
      stop.title.length > 0 &&
      stop.title.length <= 160 &&
      typeof stop.note === "string"
    );
  }
  if (stop.kind === "transport") {
    return (
      typeof stop.id === "string" &&
      stop.id.startsWith("transport-") &&
      typeof stop.mode === "string" &&
      typeof stop.note === "string" &&
      (stop.evidenceStatus === "unknown" ||
        stop.evidenceStatus === "requires_confirmation" ||
        stop.evidenceStatus === "documented" ||
        stop.evidenceStatus === "conflicting")
    );
  }
  return false;
}

function migrateLegacyDay(day: { day: number; title: string; stopIds?: string[] }, validIds: Set<string>): TripDay | null {
  if (!Number.isInteger(day.day) || typeof day.title !== "string") return null;
  if (Array.isArray(day.stopIds)) {
    if (day.stopIds.some((id) => typeof id !== "string" || !validIds.has(id))) return null;
    const stops = day.stopIds.map((id) => ({ kind: "attraction" as const, id, placeId: id }));
    return {
      day: day.day,
      title: day.title,
      stops,
      stopIds: [...day.stopIds],
    };
  }
  return null;
}

export function migrateTourismTrip(value: unknown): TourismTrip | null {
  if (typeof value !== "object" || value === null) return null;
  const trip = value as Partial<TourismTrip> & { days?: unknown[] };
  if (trip.id !== "sydney-demo" || trip.destination !== "Sydney" || !Array.isArray(trip.days)) return null;
  if (trip.days.length < 1 || trip.days.length > 5) return null;
  const external = trip.externalPlaces ?? [];
  if (!Array.isArray(external) || external.length > 30) return null;
  const validIds = new Set(SYDNEY_TOURISM_PLACES.map((place) => place.id));
  for (const place of external) {
    if (
      !place ||
      typeof place !== "object" ||
      typeof place.id !== "string" ||
      !/^otm:[A-Za-z0-9_-]{1,64}$/.test(place.id) ||
      validIds.has(place.id) ||
      place.sourceType !== "opentripmap" ||
      typeof place.name !== "string" ||
      place.name.trim().length < 1 ||
      place.name.length > 160 ||
      !isFiniteCoord(place.latitude) ||
      !isFiniteCoord(place.longitude) ||
      place.latitude < -34.05 ||
      place.latitude > -33.65 ||
      place.longitude < 150.98 ||
      place.longitude > 151.4 ||
      place.stepFree?.status !== "unknown" ||
      place.accessibleToilet?.status !== "unknown" ||
      place.sourceUrl !== "https://dev.opentripmap.org/product"
    ) {
      return null;
    }
    validIds.add(place.id);
  }

  const days: TripDay[] = [];
  const allAttractionIds: string[] = [];
  for (const rawDay of trip.days) {
    if (!rawDay || typeof rawDay !== "object") return null;
    const candidate = rawDay as TripDay & { stopIds?: string[] };
    if (Array.isArray(candidate.stops)) {
      if (!Number.isInteger(candidate.day) || typeof candidate.title !== "string") return null;
      if (!candidate.stops.every((stop) => isTripStop(stop, validIds))) return null;
      days.push({
        day: candidate.day,
        title: candidate.title,
        stops: candidate.stops,
        stopIds: attractionIdsOnDay({
          day: candidate.day,
          title: candidate.title,
          stops: candidate.stops,
          stopIds: [],
        }),
      });
      allAttractionIds.push(...attractionIdsOnDay(days[days.length - 1]));
      continue;
    }
    const migrated = migrateLegacyDay(candidate, validIds);
    if (!migrated) return null;
    days.push(migrated);
    allAttractionIds.push(...attractionIdsOnDay(migrated));
  }
  if (new Set(allAttractionIds).size !== allAttractionIds.length) return null;
  return {
    id: "sydney-demo",
    destination: "Sydney",
    createdFrom: trip.createdFrom === "planner" ? "planner" : "local-demo",
    plannerPrefs: trip.plannerPrefs,
    externalPlaces: external,
    days,
  };
}

export function isTourismTrip(value: unknown): value is TourismTrip {
  return migrateTourismTrip(value) !== null;
}

function withSyncedStopIds(days: TripDay[]): TripDay[] {
  return days.map((day) => ({ ...day, stopIds: attractionIdsOnDay(day) }));
}

export function moveTourismStop(
  trip: TourismTrip,
  fromDay: number,
  stopId: string,
  toDay: number,
  targetIndex?: number,
): TourismTrip {
  const days = trip.days.map((day) => ({ ...day, stops: [...day.stops] }));
  const origin = days.find((day) => day.day === fromDay);
  const destination = days.find((day) => day.day === toDay);
  if (!origin || !destination) return trip;
  const index = origin.stops.findIndex((stop) => tripStopId(stop) === stopId);
  if (index < 0) return trip;
  const [stop] = origin.stops.splice(index, 1);
  const insertAt =
    targetIndex === undefined
      ? destination.stops.length
      : Math.max(0, Math.min(targetIndex, destination.stops.length));
  destination.stops.splice(insertAt, 0, stop);
  return { ...trip, days: withSyncedStopIds(days) };
}

export function removeTourismStop(trip: TourismTrip, stopId: string): TourismTrip {
  return {
    ...trip,
    days: withSyncedStopIds(
      trip.days.map((day) => ({
        ...day,
        stops: day.stops.filter((stop) => tripStopId(stop) !== stopId),
      })),
    ),
  };
}

export function addTourismStop(trip: TourismTrip, stopId: string, dayNumber: number): TourismTrip {
  if (!getTourismPlaceInTrip(trip, stopId)) return trip;
  if (trip.days.some((day) => attractionIdsOnDay(day).includes(stopId))) return trip;
  return {
    ...trip,
    days: withSyncedStopIds(
      trip.days.map((day) =>
        day.day === dayNumber
          ? {
              ...day,
              stops: [...day.stops, { kind: "attraction", id: stopId, placeId: stopId }],
            }
          : day,
      ),
    ),
  };
}

export function addOpenTripMapStop(
  trip: TourismTrip,
  place: OpenTripMapPlace,
  dayNumber: number,
): TourismTrip {
  if (!isOpenTripMapPlace(place) || !trip.days.some((day) => day.day === dayNumber)) return trip;
  if (
    place.latitude < -34.05 ||
    place.latitude > -33.65 ||
    place.longitude < 150.98 ||
    place.longitude > 151.4
  ) {
    return trip;
  }
  const id = "otm:" + place.xid;
  if (trip.days.some((day) => attractionIdsOnDay(day).includes(id))) return trip;
  const existing = trip.externalPlaces?.find((item) => item.id === id);
  if (!existing && (trip.externalPlaces?.length ?? 0) >= 30) return trip;
  const checkedOn = place.retrievedAt.slice(0, 10);
  const stepFree = unknownEvidence(
    "No verified step-free entrance or circulation information supplied by OpenTripMap.",
    checkedOn,
  );
  const toilets = unknownEvidence(
    "No verified accessible-toilet information supplied by OpenTripMap.",
    checkedOn,
  );
  const external: TourismPlace = {
    id,
    sourceType: "opentripmap",
    sourceId: place.xid,
    name: place.name,
    category: "Other",
    neighbourhood: "Sydney · OpenTripMap",
    address: "Exact accessible entrance and address not verified",
    description:
      "Tourism point of interest from OpenTripMap. Check opening hours, entry, facilities and transport independently.",
    coords: { latitude: place.latitude, longitude: place.longitude },
    latitude: place.latitude,
    longitude: place.longitude,
    photos: [],
    features: { stepFree, toilets, extras: [] },
    caveats: [
      "Step-free access, toilets, operating status and the whole transport route all require confirmation.",
    ],
    experienceMinutes: 0,
    recommendedDay: 0,
    stepFree: { status: evidenceToLegacy(stepFree.status), detail: stepFree.summary },
    accessibleToilet: { status: evidenceToLegacy(toilets.status), detail: toilets.summary },
    caution:
      "Step-free access, toilets, operating status and the whole transport route all require confirmation.",
    sourceName: stepFree.sourceName,
    sourceUrl: stepFree.sourceUrl,
    checkedOn,
  };
  return {
    ...trip,
    externalPlaces: existing ? trip.externalPlaces : [...(trip.externalPlaces ?? []), external],
    days: withSyncedStopIds(
      trip.days.map((day) =>
        day.day === dayNumber
          ? { ...day, stops: [...day.stops, { kind: "attraction", id, placeId: id }] }
          : day,
      ),
    ),
  };
}

export function placesForDay(trip: TourismTrip, day: TripDay): TourismPlace[] {
  return attractionIdsOnDay(day)
    .map((id) => getTourismPlaceInTrip(trip, id))
    .filter((place): place is TourismPlace => Boolean(place));
}
