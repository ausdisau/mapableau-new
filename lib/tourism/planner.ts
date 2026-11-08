import { SYDNEY_DAY_OUTLINES, SYDNEY_TOURISM_PLACES } from "@/lib/tourism/sydney-dataset";
import {
  attractionIdsOnDay,
  defaultPlannerInput,
  type TourismPlannerInput,
  type TourismTrip,
  type TripDay,
  type TripStop,
} from "@/lib/tourism/types";

function clampDays(dayCount: number): number {
  return Math.max(1, Math.min(5, Math.trunc(dayCount) || 3));
}

function dayStops(
  outline: (typeof SYDNEY_DAY_OUTLINES)[number],
  dayNumber: number,
  restBreakPreference: TourismPlannerInput["restBreakPreference"],
): TripStop[] {
  const [first, second] = outline.attractionIds;
  const rest: TripStop = {
    kind: "rest",
    id: `rest-day-${dayNumber}`,
    title: outline.rest.title,
    note:
      restBreakPreference === "frequent"
        ? `${outline.rest.note} Frequent rest was requested in this browser only.`
        : outline.rest.note,
  };
  const transport: TripStop = {
    kind: "transport",
    id: `transport-day-${dayNumber}`,
    mode: outline.transport.mode,
    note: outline.transport.note,
    evidenceStatus: "unknown",
  };
  const includeRest = restBreakPreference !== "minimal";
  const stops: TripStop[] = [{ kind: "attraction", id: first, placeId: first }];
  if (includeRest) stops.push(rest);
  stops.push(transport);
  stops.push({ kind: "attraction", id: second, placeId: second });
  return stops;
}

export function planSydneyTrip(input: TourismPlannerInput): TourismTrip {
  const durationDays = clampDays(input.durationDays);
  const days: TripDay[] = Array.from({ length: durationDays }, (_, index) => {
    const outline = SYDNEY_DAY_OUTLINES[index];
    if (!outline) {
      return {
        day: index + 1,
        title: "Your choice",
        stops: [],
        stopIds: [],
      };
    }
    const stops = dayStops(outline, index + 1, input.restBreakPreference);
    const day: TripDay = {
      day: index + 1,
      title: outline.title,
      stops,
      stopIds: [],
    };
    return { ...day, stopIds: attractionIdsOnDay(day) };
  });

  return {
    id: "sydney-demo",
    destination: "Sydney",
    createdFrom: "planner",
    plannerPrefs: {
      ...input,
      destination: "Sydney",
      durationDays,
    },
    externalPlaces: [],
    days,
  };
}

export function makeSydneyDemoTrip(dayCount = 3): TourismTrip {
  return planSydneyTrip({
    ...defaultPlannerInput(),
    durationDays: dayCount,
  });
}

export function sydneyPlaceCount(): number {
  return SYDNEY_TOURISM_PLACES.length;
}
