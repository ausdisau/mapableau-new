import {
  formatSydneyTime,
  isValidDateOnly,
  sydneyDateKey,
} from "@/lib/care/scheduler/ui-model";
import type { AppointmentDraft } from "./passenger-appointment";

export const places = [
  "Parramatta Park — entry near Pitt Street, Parramatta",
  "PHIVE — 5 Parramatta Square, Parramatta",
] as const;
export const accessOptions = [
  "Step-free vehicle access needed",
  "Space for a mobility aid",
  "Extra time to get in and settled",
  "Please meet me at the entrance",
] as const;
export const communications = [
  "No preference",
  "Please speak clearly and allow time to respond",
  "Please use short, direct instructions",
  "Please show the pickup point in writing",
] as const;

export const stages = {
  requested: "Request sent",
  quoted: "Quote to review",
  accepted: "Quote accepted",
  declined: "Offer declined",
  assigned: "Practice driver assigned",
  approaching: "On the way",
  onboard: "Picked up",
  arrived: "Arrived",
  complete: "Journey complete",
  cancelled: "Cancelled",
} as const;

export type Stage = keyof typeof stages;
export type TripDraft = AppointmentDraft & {
  pickup: string;
  destination: string;
  supporter: boolean;
  access: string[];
  communication: string;
};
export type PracticeTrip = TripDraft & {
  id: string;
  stage: Stage;
  shared: boolean;
};

export function newDraft(): TripDraft {
  return {
    date: "",
    time: "10:30",
    pickup: places[0],
    destination: places[1],
    supporter: false,
    access: [],
    communication: communications[0],
  };
}

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
export function validateDraft(draft: TripDraft, now = new Date()) {
  if (draft.pickup === draft.destination)
    return "Choose a destination different from your pickup.";
  if (!isValidDateOnly(draft.date) || !timePattern.test(draft.time))
    return "Choose a travel date and pickup time.";
  const today = sydneyDateKey(now);
  if (
    draft.date < today ||
    (draft.date === today && draft.time <= formatSydneyTime(now.toISOString()))
  ) {
    return "Choose a future pickup date and time in Sydney.";
  }
  return "";
}

export function sampleQuote(time: string) {
  const hour = Number(time.slice(0, 2));
  const peak = (hour >= 7 && hour < 9) || (hour >= 15 && hour < 18);
  const end = String((hour + 1) % 24).padStart(2, "0") + time.slice(2);
  return {
    fare: peak ? "$34–$48 AUD" : "$29–$42 AUD",
    window: time + "–" + end + (hour === 23 ? " next day" : ""),
  };
}

const allowed: Record<Stage, Stage[]> = {
  requested: ["quoted", "cancelled"],
  quoted: ["accepted", "declined", "cancelled"],
  accepted: ["assigned", "cancelled"],
  assigned: ["approaching", "cancelled"],
  approaching: ["onboard", "cancelled"],
  onboard: ["arrived"],
  arrived: ["complete"],
  complete: [],
  declined: [],
  cancelled: [],
};
export function canTransition(from: Stage, to: Stage) {
  return allowed[from].includes(to);
}
export function hasAssignedDriver(stage: Stage) {
  return (
    stage === "assigned" ||
    stage === "approaching" ||
    stage === "onboard" ||
    stage === "arrived"
  );
}
export function changeStage(trip: PracticeTrip, stage: Stage): PracticeTrip {
  if (!canTransition(trip.stage, stage)) return trip;
  return { ...trip, stage, shared: trip.shared && hasAssignedDriver(stage) };
}

// Persist only the fields offered by this practice screen. Never rehydrate a booking
// ID, free text or an unknown consent value from an earlier local record.
export const PRACTICE_TRIPS_KEY = "mapable.transport.passenger.practice.v1";
export function restoreTrips(raw: string | null): PracticeTrip[] {
  try {
    const records: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(records)) return [];
    return records.flatMap((r): PracticeTrip[] => {
      if (
        !r ||
        typeof r.id !== "string" ||
        !/^[a-zA-Z0-9-]{1,80}$/.test(r.id) ||
        !Object.hasOwn(stages, r.stage) ||
        !places.includes(r.pickup) ||
        !places.includes(r.destination) ||
        r.pickup === r.destination ||
        typeof r.date !== "string" ||
        !isValidDateOnly(r.date) ||
        typeof r.time !== "string" ||
        !timePattern.test(r.time) ||
        !Array.isArray(r.access) ||
        !communications.includes(r.communication) ||
        typeof r.supporter !== "boolean"
      )
        return [];
      const access = accessOptions.filter((a) => r.access.includes(a));
      return [
        {
          id: r.id,
          stage: r.stage,
          pickup: r.pickup,
          destination: r.destination,
          date: r.date,
          time: r.time,
          supporter: r.supporter,
          access,
          communication: r.communication,
          shared:
            r.shared === true &&
            hasAssignedDriver(r.stage) &&
            (access.length > 0 || r.communication !== communications[0]),
        },
      ];
    });
  } catch {
    return [];
  }
}
